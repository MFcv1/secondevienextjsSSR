import 'server-only';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import passkeyCore from '../../../functions/src/auth/passkeyHandlers.cjs';
import passkeyPerformance from '../../../functions/src/auth/passkeyPerformance';
import { getAdminAuth, getAdminDb, getAdminAppCheck } from './firebaseAdmin';
import { authorizeAdminRequest } from './adminAuthorization';
import { publicEnv } from './env';
import { readBoundedJsonBody } from './requestBody';
import { createPasskeyPost, PasskeyHttpError } from './passkeyHttp.mjs';
import { resolvePublicAuthClientIp } from './publicAuthClientIp.mjs';
import { reportPublicRuntimePerformance } from './publicRuntimeMetrics.mjs';

let handlersPromise;
const getHandlers = () => {
  handlersPromise ||= import('@simplewebauthn/server').then((webauthn) => {
    const firestore = Object.assign(() => getAdminDb(), { FieldValue, Timestamp });
    const authorizeRegistration = passkeyCore.createPasskeyRegistrationAuthorizer({
      HttpsError: PasskeyHttpError,
      readAccess: async (uid) => {
        const snapshot = await getAdminDb().doc(`sys_admin_access/${uid}`).get();
        return snapshot.exists ? snapshot.data() : null;
      },
      authorizeAdmin: async (context) => {
        const result = await authorizeAdminRequest(context.request);
        if (!result.ok) throw new PasskeyHttpError(
          result.status === 503 ? 'unavailable' : 'permission-denied',
          'Autorisation administrateur requise.'
        );
      },
    });
    return passkeyCore.createPasskeyHandlers({
      admin: { firestore, auth: getAdminAuth }, HttpsError: PasskeyHttpError, webauthn,
      getSiteUrl: () => publicEnv.siteUrl,
      getRateLimitClientIp: (context) => context.rawRequest.ip,
      authorizePasskeyRegistration: authorizeRegistration,
      createPasskeyTimer: passkeyPerformance.createPasskeyTimer,
      logFunctionPerf: (operation, startedAt) => console.info('public_passkey_perf', {
        operation, elapsedMs: Math.max(0, Date.now() - startedAt),
      }),
    });
  }).catch((error) => { handlersPromise = undefined; throw error; });
  return handlersPromise;
};

export const handlePublicPasskey = createPasskeyPost({
  enabled: () => process.env.PUBLIC_PASSKEY_ENABLED === 'true',
  origin: () => new URL(publicEnv.siteUrl).origin,
  verifyAppCheck: (token) => getAdminAppCheck().verifyToken(token),
  verifyIdToken: (token) => getAdminAuth().verifyIdToken(token, true),
  resolveClientIp: (request) => resolvePublicAuthClientIp(request, process.env.PUBLIC_AUTH_PROXY_HOPS),
  readBody: readBoundedJsonBody,
  getHandlers,
  reportPerformance: reportPublicRuntimePerformance,
});
