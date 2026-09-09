import 'server-only';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getPublicOperation } from '../../../shared/publicOperationTransport.mjs';
import { getAdminAuth, getAdminDb, getAdminAppCheck } from './firebaseAdmin';
import { publicEnv } from './env';
import { readBoundedJsonBody } from './requestBody';
import { createPasskeyPost, PasskeyHttpError } from './passkeyHttp.mjs';
import { resolvePublicAuthClientIp } from './publicAuthClientIp.mjs';
import { reportPublicRuntimePerformance } from './publicRuntimeMetrics.mjs';

const modules = new Map();
let emailPromise;
const getEmailRuntime = () => {
  emailPromise ||= import('../../../functions/src/email/transactionalEmail.js').then(({ default: email }) => {
    const provider = process.env.TRANSACTIONAL_EMAIL_PROVIDER || 'gmail';
    const fromAddress = provider === 'gmail' ? process.env.GMAIL_EMAIL : process.env.RESEND_FROM_EMAIL;
    if (!fromAddress) throw new PasskeyHttpError('failed-precondition', 'Configuration email incomplete.');
    return { fromAddress, sender: email.createTransactionalEmailSender({
      provider,
      gmail: { user: process.env.GMAIL_EMAIL, password: process.env.GMAIL_PASSWORD },
      resend: { apiKey: process.env.RESEND_API_KEY },
    }) };
  }).catch(error => { emailPromise = undefined; throw error; });
  return emailPromise;
};

const dependencies = () => ({
  admin: { firestore: Object.assign(() => getAdminDb(), { FieldValue, Timestamp }), auth: getAdminAuth },
  HttpsError: PasskeyHttpError,
  normalizeFirestoreId: (value, label = 'Identifiant') => {
    if (typeof value !== 'string' || value.length < 1 || value.length > 160 || value.includes('/')) {
      throw new PasskeyHttpError('invalid-argument', `${label} invalide.`);
    }
    return value;
  },
  getRateLimitClientIp: context => context.rawRequest.ip,
  OTP_HMAC_SECRET: { value: () => process.env.OTP_HMAC_SECRET },
  getSiteUrl: () => publicEnv.siteUrl,
  timestampFromNow: days => Timestamp.fromMillis(Date.now() + days * 86400000),
  SYSTEM_DOC_RETENTION_DAYS: 30,
  getTransactionalEmailRuntime: getEmailRuntime,
  logFunctionPerf: (operation, startedAt) => console.info('public_operation_perf', {
    operation, elapsedMs: Math.max(0, Date.now() - startedAt),
  }),
  structuredLog: (_level, event) => console.error(event),
});

async function loadHandlers(key) {
  const deps = dependencies();
  if (key === 'promotions') {
    const { default: core } = await import('../../../functions/src/commerce/publicPromotionHandlers.cjs');
    return { previewPromotionCodeV2: core.createPublicPromotionHandlers({ ...deps, APP_ID: 'secondevie' })
      .createPreviewPromotionHandler({ db: getAdminDb() }) };
  }
  if (key === 'order-status') {
    const [{ default: core }, guest] = await Promise.all([
      import('../../../functions/src/commerce/orderStatusHandler.cjs'), getPublicHandlers('verifyGuestCheckoutOtp'),
    ]);
    return { getOrderStatusClientHandler: core.createOrderStatusHandler({ ...deps, ...guest }) };
  }
  if (key === 'newsletter') {
    const { default: core } = await import('../../../functions/src/newsletter/newsletterHandlers.cjs');
    return core.createNewsletterHandlers({ ...deps, getEmailRuntime });
  }
  if (key === 'quotes') {
    const { default: core } = await import('../../../functions/src/quotes/publicQuoteHandlers.cjs');
    return core.createPublicQuoteHandlers({ ...deps, AUDIT_RETENTION_DAYS: 366,
      timestampAfterDays: (days, now = Date.now()) => Timestamp.fromMillis(now + Math.floor(days) * 86400000),
    });
  }
  if (key === 'payment-links') {
    const [{ default: core }, { default: runtime }] = await Promise.all([
      import('../../../functions/src/commerce/publicPaymentLinkHandlers.cjs'),
      import('../../../functions/src/commerce/publicCheckoutRuntime.cjs'),
    ]);
    return core.createPublicPaymentLinkHandlers({ ...deps, db: getAdminDb(),
      runtime: () => runtime.getPublicPaymentLinkRuntime({ db: getAdminDb(), secret: process.env.STRIPE_SECRET_KEY,
        tokenSecret: process.env.PAYMENT_LINK_HMAC_SECRET, siteUrl: publicEnv.siteUrl, increment: FieldValue.increment }),
    });
  }
  if (key === 'orders') {
    const { default: core } = await import('../../../functions/src/commerce/customerOrderQueries.cjs');
    return { listMyOrdersV2: core.createCustomerOrderQueries(deps).createListMyOrdersHandler() };
  }
  if (key === 'checkout') {
    const [{ default: core }, { default: identity }, { default: runtime }] = await Promise.all([
      import('../../../functions/src/commerce/checkoutHandlers.cjs'),
      import('../../../functions/src/commerce/checkoutEmailIdentityCore.cjs'),
      import('../../../functions/src/commerce/publicCheckoutRuntime.cjs'),
    ]);
    const handlers = core.createCheckoutHandlers({
      ...deps,
      resolveCheckoutEmail: identity.createCheckoutEmailResolver({
        HttpsError: PasskeyHttpError,
        verifyOtp: async (...args) => (await getPublicHandlers('verifyGuestCheckoutOtp')).assertGuestCheckoutOtpVerified(...args),
      }),
      checkoutRuntime: () => runtime.getPublicCheckoutRuntime({ db: getAdminDb(), secret: process.env.STRIPE_SECRET_KEY, increment: FieldValue.increment }),
    });
    return { createCheckoutV2: handlers.createCheckoutHandler(), resumeCheckoutV2: handlers.createResumeCheckoutHandler() };
  }
  if (key === 'customer') {
    const { default: core } = await import('../../../functions/src/auth/customerLoginOtpHandlers.cjs');
    return core.createCustomerLoginOtpHandlers(deps);
  }
  if (key === 'guest') {
    const { default: core } = await import('../../../functions/src/auth/guestCheckoutOtpHandlers.cjs');
    return core.createGuestCheckoutOtpHandlers(deps);
  }
  const { default: core } = await import('../../../functions/src/analytics/updateUserSessionsHandler.cjs');
  return { updateUserSessionsHandler: core.createUpdateUserSessionsHandler(deps) };
}

export const getPublicHandlers = (operation) => {
  const group = getPublicOperation(operation)?.group;
  const key = ['checkout', 'orders', 'order-status', 'payment-links', 'promotions', 'newsletter', 'quotes'].includes(group) ? group
    : operation.includes('CustomerLogin') ? 'customer' : operation.includes('GuestCheckout') ? 'guest' : 'sessions';
  if (!modules.has(key)) modules.set(key, loadHandlers(key).catch(error => { modules.delete(key); throw error; }));
  return modules.get(key);
};

export const handlePublicOperation = createPasskeyPost({
  resolveOperation: getPublicOperation,
  enabled: operation => String(process.env.PUBLIC_SHARED_RUNTIME_GROUPS || '').split(',')
    .map(value => value.trim()).includes(getPublicOperation(operation)?.group),
  origin: () => new URL(publicEnv.siteUrl).origin,
  verifyAppCheck: token => getAdminAppCheck().verifyToken(token),
  verifyIdToken: token => getAdminAuth().verifyIdToken(token, true),
  resolveClientIp: request => resolvePublicAuthClientIp(request, process.env.PUBLIC_AUTH_PROXY_HOPS),
  readBody: readBoundedJsonBody,
  getHandlers: getPublicHandlers,
  reportPerformance: reportPublicRuntimePerformance,
});
