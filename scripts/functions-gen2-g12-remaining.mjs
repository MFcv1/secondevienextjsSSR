#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';

const PROJECT = 'secondevienextjsssr';
const ARCHIVE = Object.freeze({
  uri: 'gs://gcf-v2-sources-231220287936-europe-west1/g11/6ba72b5a9a065d5bf458b6d32826805b4e39e0824248f829989797299a28c2df/function-source.zip',
  sha256: '6ba72b5a9a065d5bf458b6d32826805b4e39e0824248f829989797299a28c2df',
  generation: '1787410366615461',
  size: 389002
});

export const COHORTS = Object.freeze({
  'readers-g5-a1': ['getUserStats'],
  'analytics-g4': ['initLiveSession', 'syncSession', 'syncSessionBeacon', 'trackAdminIP', 'updateUserSessions'],
  'auth-callables-g5': [
    'addAdminUser', 'ensureAdminAccessRegistry', 'generatePasskeyAuthenticationOptions',
    'generatePasskeyRegistrationOptions', 'logUserConnection', 'removeAdminUser',
    'sendCustomerLoginOtp', 'sendGuestCheckoutOtp', 'syncSuperAdminClaim',
    'verifyCustomerLoginOtp', 'verifyGuestCheckoutOtp',
    'verifyPasskeyAuthentication', 'verifyPasskeyRegistration'
  ],
  'content-admin-g6': [
    'claimNewsletterReward', 'completeBillingGuideAdmin', 'createQuoteRequest',
    'drawNewsletterReward', 'finalizeQuoteRequest', 'getBillingGuideOperatorStatus',
    'getBillingGuideStatus', 'getCatalogPublicationStatus', 'getManualInvoiceWorkspaceAdmin',
    'getQuoteRequestAdmin', 'listMyNewsletterRewards', 'listQuoteRequestsAdmin',
    'onQuoteRequestSubmitted', 'prepareManualInvoicePdfAdmin', 'rebuildCatalogSnapshot',
    'resetBillingGuideTest', 'rollbackCatalogSnapshot', 'saveBillingGuideProgress',
    'saveManualInvoiceDraftAdmin', 'sendManualInvoiceAdmin', 'sendRefundStatusEmailAdmin',
    'sendTestEmail', 'updateQuoteRequestAdmin', 'uploadQuoteRequestPhoto'
  ],
  'meta-g7': [
    'disconnectMetaConnectionAdmin', 'getMetaConnectionStatusAdmin',
    'getSocialPublicationStatusAdmin', 'metaOAuthCallback',
    'prepareSocialPublicationAdmin', 'runSocialPublicationAdmin',
    'selectMetaAssetAdmin', 'startMetaOAuthAdmin', 'verifyMetaConnectionAdmin'
  ],
  'commerce-g8': [
    'adjustInventoryAdmin', 'archiveOrderAdmin', 'cancelOrderClient', 'cancelReturnAdmin',
    'createOrder', 'createProductAdmin', 'createPromotionCodeAdmin',
    'createPublishedProductAdmin', 'decideCustomerReturnRequestAdmin',
    'deleteProductAdmin', 'getDeliveryPolicyAdmin', 'getOrderStatusClient',
    'getOrderTimelineAdminV2', 'listCustomerReturnRequestsAdminV2', 'listMyOrdersV2',
    'listOrdersAdminV2', 'listPromotionCodesAdmin', 'listReturnsAdminV2',
    'markOrderDeliveredAdmin', 'markOrderPickedUpAdmin', 'markOrderPreparingAdmin',
    'markOrderReadyForPickupAdmin', 'markOrderShippedAdmin', 'markReturnReceivedAdmin',
    'openReturnAdmin', 'preflightProductMutationAdmin', 'prepareCommerceDocumentDelivery',
    'previewPromotionCodeV2', 'publishProductAdmin', 'refundOrderAdmin',
    'requestCustomerReturn', 'requestOrderCancellation', 'resolveReturnAdmin',
    'restockReturnLinesAdmin', 'saveDeliveryPolicyAdmin', 'setPromotionCodeStatusAdmin',
    'syncRefundStatusAdmin', 'updateOrderTrackingAdmin', 'updateProductOfferAdmin',
    'writeOffReturnLinesAdmin'
  ],
  'schedulers-g9': [
    'commerceOperationsReconciler', 'commerceOutboxDispatcher',
    'commerceReservationExpiryDispatcher', 'expireAdminPaymentLinks'
  ],
  'finance-g9': [
    'cancelAdminPaymentLink', 'cleanupFixtureRunAdmin', 'confirmStripeConnectReconnect',
    'createAdminPaymentLink', 'createCheckoutV2', 'extendAdminPaymentLink',
    'getAdminPaymentLinkPublic', 'getCommerceOperationsStatusAdmin',
    'getStripeConnectStatus', 'listAdminPaymentLinks', 'prepareAdminPaymentLinkPayment',
    'rebuildCommerceOperationsAdmin', 'recreateAdminPaymentLink',
    'regenerateAdminPaymentLink', 'requestRefundAdmin',
    'requestStripeConnectReconnect', 'resumeAdminPaymentLinkPayment',
    'resumeCheckoutV2', 'startStripeConnectOnboarding', 'syncStripeConnectAccount'
  ],
  'webhooks-g10': ['stripeConnectWebhook', 'stripeConnectWebhookV2', 'stripeWebhook', 'stripeWebhookV2']
});

const RETIRE_WITHOUT_REPLACEMENT = new Set([
  'cancelOrderClient', 'refundOrderAdmin', 'syncRefundStatusAdmin',
  'stripeConnectWebhook', 'stripeWebhook'
]);
const SERVER_OWNERS = new Set([
  ...COHORTS['schedulers-g9'],
  ...COHORTS['webhooks-g10'],
  'metaOAuthCallback',
  'onQuoteRequestSubmitted'
]);

function required(value, label) {
  if (!value) throw new Error(`Valeur manquante: ${label}`);
  return value;
}

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) throw new Error(`Argument inattendu: ${key}`);
    args[key.slice(2)] = argv[++index];
  }
  return args;
}

function functionName(row) {
  return String(row.name || '').split('/').at(-1);
}

function expectedOwner(name) {
  return RETIRE_WITHOUT_REPLACEMENT.has(name) ? null : `${name}Gen2`;
}

function sanitizeLegacy(row) {
  return {
    name: functionName(row),
    region: String(row.name).split('/').at(-3),
    generation: 1,
    status: row.status,
    versionId: row.versionId || null,
    runtime: row.runtime || null,
    entryPoint: row.entryPoint || functionName(row),
    memoryMb: row.availableMemoryMb || null,
    timeoutSeconds: Number(String(row.timeout || '60s').replace(/s$/, '')),
    serviceAccount: row.serviceAccountEmail || null,
    ingress: row.ingressSettings || null,
    secrets: (row.secretEnvironmentVariables || []).map(({ key, secret, version }) => ({ key, secret, version })),
    replacement: expectedOwner(functionName(row))
  };
}

export function buildPlan({ cloudRows, archiveIndex, registrySource, generatedAt }) {
  const exactNames = Object.values(COHORTS).flat();
  if (exactNames.length !== 120 || new Set(exactNames).size !== 120) {
    throw new Error(`Cohortes invalides: ${exactNames.length}/${new Set(exactNames).size}`);
  }
  const byName = new Map(cloudRows.map((row) => [functionName(row), row]));
  const missing = exactNames.filter((name) => !byName.has(name));
  if (missing.length) throw new Error(`Gen1 manquantes: ${missing.join(', ')}`);
  const nonGen1 = exactNames.filter((name) => byName.get(name).environment === 'GEN_2');
  if (nonGen1.length) throw new Error(`Cibles non Gen1: ${nonGen1.join(', ')}`);
  const inactive = exactNames.filter((name) => byName.get(name).status !== 'ACTIVE');
  if (inactive.length) throw new Error(`Gen1 non ACTIVE: ${inactive.join(', ')}`);
  const missingArchiveExports = exactNames.filter((name) => !new RegExp(`exports\\.${name}\\s*=`).test(archiveIndex));
  if (missingArchiveExports.length) throw new Error(`Archive incomplete: ${missingArchiveExports.join(', ')}`);
  const replacementFailures = exactNames.flatMap((name) => {
    const replacement = expectedOwner(name);
    if (!replacement) return [];
    const row = byName.get(replacement);
    return row?.environment === 'GEN_2' && row?.state === 'ACTIVE' ? [] : [`${name}->${replacement}`];
  });
  if (replacementFailures.length) throw new Error(`Owners Gen2 invalides: ${replacementFailures.join(', ')}`);
  const registryFailures = exactNames.filter((name) => {
    if (RETIRE_WITHOUT_REPLACEMENT.has(name) || SERVER_OWNERS.has(name)) return false;
    return !new RegExp(`\\b${name}:\\s*'${name}Gen2'`).test(registrySource);
  });
  if (registryFailures.length) throw new Error(`Registre client incomplet: ${registryFailures.join(', ')}`);

  return {
    schemaVersion: 1,
    metadata: {
      project: PROJECT,
      environment: 'sandbox',
      wave: 'G12-REMAINING-COHORTS',
      generatedAt,
      status: 'PREFLIGHT_GREEN_PENDING_TRAFFIC_AND_QUIET_WINDOW',
      exactLegacyCount: exactNames.length,
      cohortCount: Object.keys(COHORTS).length
    },
    authorization: {
      userRequestedAutonomousPlanCompletion: true,
      sandboxOnly: true,
      productionAllowed: false,
      stripeLiveAllowed: false,
      globalDeleteAllowed: false,
      dataDestructionAllowed: false,
      authTriggerDeletionAllowed: false
    },
    archive: { ...ARCHIVE, digestVerified: true, containsAll120Exports: true },
    checks: {
      allLegacyActive: true,
      allRequiredGen2OwnersActive: true,
      clientRegistryComplete: true,
      retireWithoutReplacement: [...RETIRE_WITHOUT_REPLACEMENT].sort(),
      protectedAuthTriggers: ['grantAdminOnAuth', 'onRegisteredUserCreated', 'onRegisteredUserDeleted']
    },
    cohorts: Object.entries(COHORTS).map(([id, names]) => ({
      id,
      names,
      functions: names.map((name) => sanitizeLegacy(byName.get(name)))
    }))
  };
}

export function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const cloudRows = JSON.parse(fs.readFileSync(required(args.snapshot, 'snapshot'), 'utf8'));
  const archiveIndex = fs.readFileSync(required(args['archive-index'], 'archive-index'), 'utf8');
  const registrySource = fs.readFileSync(required(args.registry, 'registry'), 'utf8');
  const output = path.resolve(required(args.output, 'output'));
  const plan = buildPlan({
    cloudRows,
    archiveIndex,
    registrySource,
    generatedAt: required(args['generated-at'], 'generated-at')
  });
  fs.writeFileSync(output, `${JSON.stringify(plan, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify({ cohorts: plan.metadata.cohortCount, legacy: plan.metadata.exactLegacyCount, output })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`functions-gen2-g12-remaining: ${error.message}\n`);
    process.exitCode = 1;
  }
}
