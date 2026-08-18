#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXPECTED_PROJECT = 'secondevienextjsssr';
export const EXPECTED_CODEBASE = 'main';
export const EXPECTED_SOURCE_COUNT = 157;
export const EXPECTED_CLOUD_COUNT = 152;

export const PARALLEL_MIGRATION_EXPORTS = new Set([
  'initLiveSessionGen2',
  'syncSessionGen2',
  'syncSessionBeaconGen2',
  'trackAdminIPGen2',
  'updateUserSessionsGen2',
  'getUserStatsGen2',
  'logUserConnectionGen2'
]);

export const KEEP_GEN2 = new Set([
  'catalogMediaGarbageCollector',
  'catalogReconciler',
  'cleanupProductPublicationSessions',
  'dispatchCatalogBuild',
  'dispatchCatalogRevalidation',
  'onArtifactDeleted',
  'onArtifactUpdated',
  'onCatalogSourceWrite',
  'onOrderCreated',
  'onOrderStatsWrite',
  'onOrderUpdated',
  'processProductPublicationImage',
  'reconcileProductPublicationSessions'
]);

export const KEEP_GEN1_AUTH = new Set([
  'grantAdminOnAuth',
  'onRegisteredUserCreated',
  'onRegisteredUserDeleted'
]);

export const HOLD_META_RECONCILIATION = new Set([
  'disconnectInstagramConnectionAdmin',
  'getInstagramConnectionStatusAdmin',
  'instagramOAuthCallback',
  'startInstagramOAuthAdmin',
  'verifyInstagramConnectionAdmin'
]);

export const MIGRATE_OR_RETIRE = new Set([
  'cancelOrderClient',
  'createOrder',
  'e2eCheckoutProof',
  'e2eStripeHardeningProof',
  'getOrderStatusClient',
  'getProductPublicationSessionAdmin',
  'getUploadUrl',
  'purgeAllProducts',
  'purgeAnonymousUsers',
  'refundOrderAdmin',
  'reportProductPublicationClientErrorAdmin',
  'resetAllOrders',
  'resetAllStats',
  'resetAllUsers',
  'retryProductPublicationFinalizationAdmin',
  'runGarbageCollector',
  'startProductPublicationAdmin',
  'stripeConnectWebhook',
  'stripeWebhook',
  'syncRefundStatusAdmin'
]);

const WAVE_GROUPS = [
  ['G2', KEEP_GEN2],
  ['G4', new Set(['clearAllAffiliateClicks', 'clearAllSessions', 'deleteSession', 'initLiveSession', 'syncSession', 'syncSessionBeacon', 'trackAdminIP', 'updateUserSessions'])],
  ['G5', new Set([
    'addAdminUser', 'ensureAdminAccessRegistry', 'generatePasskeyAuthenticationOptions',
    'generatePasskeyRegistrationOptions', 'getUserStats', 'logUserConnection',
    'removeAdminUser', 'sendCustomerLoginOtp', 'sendGuestCheckoutOtp',
    'syncSuperAdminClaim', 'verifyCustomerLoginOtp', 'verifyGuestCheckoutOtp',
    'verifyPasskeyAuthentication', 'verifyPasskeyRegistration'
  ])],
  ['G6', new Set([
    'claimNewsletterReward', 'completeBillingGuideAdmin', 'createQuoteRequest',
    'drawNewsletterReward', 'finalizeQuoteRequest', 'getBillingGuideOperatorStatus',
    'getBillingGuideStatus', 'getCatalogPublicationStatus', 'getManualInvoiceWorkspaceAdmin',
    'getQuoteRequestAdmin', 'listMyNewsletterRewards', 'listQuoteRequestsAdmin',
    'onQuoteRequestSubmitted', 'prepareManualInvoicePdfAdmin', 'rebuildCatalogSnapshot',
    'resetBillingGuideTest', 'rollbackCatalogSnapshot', 'saveBillingGuideProgress',
    'saveManualInvoiceDraftAdmin', 'sendManualInvoiceAdmin', 'sendRefundStatusEmailAdmin',
    'sendTestEmail', 'updateQuoteRequestAdmin', 'uploadQuoteRequestPhoto'
  ])],
  ['G7', new Set([
    'disconnectMetaConnectionAdmin', 'getMetaConnectionStatusAdmin',
    'getSocialPublicationStatusAdmin', 'metaOAuthCallback', 'prepareSocialPublicationAdmin',
    'runSocialPublicationAdmin', 'selectMetaAssetAdmin', 'startMetaOAuthAdmin',
    'verifyMetaConnectionAdmin', ...HOLD_META_RECONCILIATION
  ])],
  ['G8', new Set([
    'adjustInventoryAdmin', 'archiveOrderAdmin', 'cancelReturnAdmin',
    'createProductAdmin', 'createPromotionCodeAdmin', 'createPublishedProductAdmin',
    'decideCustomerReturnRequestAdmin', 'deleteProductAdmin', 'getDeliveryPolicyAdmin',
    'getOrderTimelineAdminV2', 'listCustomerReturnRequestsAdminV2', 'listMyOrdersV2',
    'listOrdersAdminV2', 'listPromotionCodesAdmin', 'listReturnsAdminV2',
    'markOrderDeliveredAdmin', 'markOrderPickedUpAdmin', 'markOrderPreparingAdmin',
    'markOrderReadyForPickupAdmin', 'markOrderShippedAdmin', 'markReturnReceivedAdmin',
    'openReturnAdmin', 'preflightProductMutationAdmin', 'prepareCommerceDocumentDelivery',
    'previewPromotionCodeV2', 'publishProductAdmin', 'requestCustomerReturn',
    'requestOrderCancellation', 'resolveReturnAdmin', 'restockReturnLinesAdmin',
    'saveDeliveryPolicyAdmin', 'setPromotionCodeStatusAdmin', 'updateOrderTrackingAdmin',
    'updateProductOfferAdmin', 'writeOffReturnLinesAdmin'
  ])],
  ['G9', new Set([
    'cancelAdminPaymentLink', 'cleanupFixtureRunAdmin', 'commerceOperationsReconciler',
    'commerceOutboxDispatcher', 'commerceReservationExpiryDispatcher',
    'confirmStripeConnectReconnect', 'createAdminPaymentLink', 'createCheckoutV2',
    'expireAdminPaymentLinks', 'extendAdminPaymentLink', 'getAdminPaymentLinkPublic',
    'getCommerceOperationsStatusAdmin', 'getStripeConnectStatus', 'listAdminPaymentLinks',
    'prepareAdminPaymentLinkPayment', 'rebuildCommerceOperationsAdmin',
    'recreateAdminPaymentLink', 'regenerateAdminPaymentLink', 'requestRefundAdmin',
    'requestStripeConnectReconnect', 'resumeAdminPaymentLinkPayment', 'resumeCheckoutV2',
    'startStripeConnectOnboarding', 'syncStripeConnectAccount'
  ])],
  ['G10', new Set(['stripeConnectWebhookV2', 'stripeWebhookV2'])],
  ['G11', new Set(['getUploadUrl', 'purgeAllProducts', 'purgeAnonymousUsers', 'resetAllOrders', 'resetAllStats', 'resetAllUsers', 'runGarbageCollector'])]
];

const FINANCE_TARGETS = new Set([
  'cancelAdminPaymentLink', 'cancelOrderClient', 'commerceOperationsReconciler',
  'commerceOutboxDispatcher', 'commerceReservationExpiryDispatcher',
  'confirmStripeConnectReconnect', 'createAdminPaymentLink', 'createCheckoutV2',
  'createOrder', 'expireAdminPaymentLinks', 'extendAdminPaymentLink',
  'getAdminPaymentLinkPublic', 'getCommerceOperationsStatusAdmin',
  'getOrderStatusClient', 'getStripeConnectStatus', 'listAdminPaymentLinks',
  'prepareAdminPaymentLinkPayment', 'rebuildCommerceOperationsAdmin',
  'recreateAdminPaymentLink', 'refundOrderAdmin', 'regenerateAdminPaymentLink',
  'requestRefundAdmin', 'requestStripeConnectReconnect', 'resumeAdminPaymentLinkPayment',
  'resumeCheckoutV2', 'startStripeConnectOnboarding', 'stripeConnectWebhook',
  'stripeConnectWebhookV2', 'stripeWebhook', 'stripeWebhookV2',
  'syncRefundStatusAdmin', 'syncStripeConnectAccount'
]);

const SCHEDULER_NAMES = new Set([
  'catalogMediaGarbageCollector', 'catalogReconciler',
  'cleanupProductPublicationSessions', 'commerceOperationsReconciler',
  'commerceOutboxDispatcher', 'commerceReservationExpiryDispatcher',
  'expireAdminPaymentLinks', 'reconcileProductPublicationSessions'
]);

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`Argument inattendu: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Valeur manquante pour --${key}`);
    if (args[key]) args[key] = Array.isArray(args[key]) ? [...args[key], value] : [args[key], value];
    else args[key] = value;
    index += 1;
  }
  return args;
}

function required(args, key) {
  if (!args[key]) throw new Error(`Argument obligatoire manquant: --${key}`);
  return args[key];
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function asArray(value) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stable(value[key])]));
  }
  return value;
}

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function writeJson(filePath, value) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const body = `${JSON.stringify(stable(value), null, 2)}\n`;
  fs.writeFileSync(filePath, body);
  return sha256(body);
}

function walkFiles(rootDir, relativeRoots) {
  const results = [];
  const visit = (absolutePath) => {
    if (!fs.existsSync(absolutePath)) return;
    const stat = fs.statSync(absolutePath);
    if (stat.isDirectory()) {
      for (const entry of fs.readdirSync(absolutePath)) visit(path.join(absolutePath, entry));
      return;
    }
    if (/\.(?:c?js|mjs|jsx)$/.test(absolutePath)) results.push(absolutePath);
  };
  for (const relativeRoot of relativeRoots) visit(path.join(rootDir, relativeRoot));
  return results.sort();
}

export function extractLocalExports(rootDir) {
  const indexPath = path.join(rootDir, 'functions/index.js');
  const source = fs.readFileSync(indexPath, 'utf8');
  const imports = new Map();
  const requirePattern = /const\s*\{([\s\S]*?)\}\s*=\s*require\(['"](\.\/[^'"]+)['"]\);/g;
  for (const match of source.matchAll(requirePattern)) {
    for (const rawPart of match[1].split(',')) {
      const part = rawPart.trim();
      if (!part || part.includes('\nconst ')) continue;
      const [imported, local = imported] = part.split(':').map((item) => item.trim());
      if (/^[A-Za-z_$][\w$]*$/.test(local)) imports.set(local, `${match[2]}.js`);
    }
  }
  const exports = [...source.matchAll(/^exports\.([A-Za-z0-9_]+)\s*=\s*([A-Za-z0-9_]+);/gm)]
    .map((match) => ({
      name: match[1],
      localName: match[2],
      sourceFile: imports.get(match[2]) ? path.posix.join('functions', imports.get(match[2]).replace(/^\.\//, '')) : null
    }));
  const names = new Set(exports.map(({ name }) => name));
  const expectedCurrentSourceCount = EXPECTED_SOURCE_COUNT + PARALLEL_MIGRATION_EXPORTS.size;
  if (exports.length !== expectedCurrentSourceCount || names.size !== expectedCurrentSourceCount) {
    throw new Error(`Inventaire source inattendu: ${exports.length} exports, ${names.size} uniques`);
  }
  if (exports.some(({ sourceFile }) => !sourceFile)) {
    throw new Error(`Source introuvable pour: ${exports.filter(({ sourceFile }) => !sourceFile).map(({ name }) => name).join(', ')}`);
  }
  return exports.sort((a, b) => a.name.localeCompare(b.name));
}

export function classificationFor(name) {
  if (PARALLEL_MIGRATION_EXPORTS.has(name)) return 'MIGRATION_PARALLEL';
  if (KEEP_GEN2.has(name)) return 'KEEP_GEN2';
  if (KEEP_GEN1_AUTH.has(name)) return 'KEEP_GEN1_AUTH';
  if (HOLD_META_RECONCILIATION.has(name)) return 'HOLD_META_RECONCILIATION';
  if (MIGRATE_OR_RETIRE.has(name)) return 'MIGRATE_OR_RETIRE';
  return 'MIGRATE';
}

export function waveFor(name, classification) {
  if (classification === 'MIGRATION_PARALLEL') return 'G4';
  if (classification === 'KEEP_GEN1_AUTH') return 'EXCEPTION_AUTH_GEN1';
  if (classification === 'MIGRATE_OR_RETIRE' && name.includes('ProductPublication')) return 'G3';
  if (classification === 'MIGRATE_OR_RETIRE' && ['e2eCheckoutProof', 'e2eStripeHardeningProof'].includes(name)) return 'G3';
  if (classification === 'MIGRATE_OR_RETIRE' && ['createOrder', 'cancelOrderClient', 'getOrderStatusClient', 'refundOrderAdmin', 'syncRefundStatusAdmin'].includes(name)) return 'G8_DECISION';
  if (classification === 'MIGRATE_OR_RETIRE' && ['stripeWebhook', 'stripeConnectWebhook'].includes(name)) return 'G10_DECISION';
  for (const [wave, names] of WAVE_GROUPS) if (names.has(name)) return wave;
  return 'G6';
}

function triggerFromCloud(firebaseFunction, gcloudFunction) {
  if (!firebaseFunction) return null;
  if (firebaseFunction.callableTrigger) return { type: 'callable', filter: null, retry: false };
  if (firebaseFunction.scheduleTrigger) return { type: 'scheduler', filter: firebaseFunction.scheduleTrigger, retry: null };
  if (firebaseFunction.taskQueueTrigger) return { type: 'cloud-task', filter: firebaseFunction.taskQueueTrigger, retry: null };
  if (firebaseFunction.eventTrigger || gcloudFunction?.eventTrigger) {
    const event = gcloudFunction?.eventTrigger || firebaseFunction.eventTrigger;
    return {
      type: 'event',
      eventType: event.eventType,
      filter: event.eventFilters || event.eventFiltersPathPatterns || firebaseFunction.eventTrigger?.eventFilters || null,
      retry: event.retryPolicy || firebaseFunction.eventTrigger?.retry || false,
      triggerRegion: event.triggerRegion || null,
      transportServiceAccount: event.serviceAccountEmail || null
    };
  }
  if (firebaseFunction.httpsTrigger) return { type: 'http', filter: null, retry: false };
  return { type: 'unknown', filter: null, retry: null };
}

function localTriggerFor(name) {
  if (name.endsWith('OAuthCallback')) return { type: 'http', filter: null, retry: false };
  return { type: 'callable', filter: null, retry: false };
}

function scanSourceMetadata(rootDir, sourceFile, name) {
  const absoluteSource = path.join(rootDir, sourceFile);
  const source = fs.readFileSync(absoluteSource, 'utf8');
  const collectionCandidates = new Set();
  const patterns = [
    /\.collection\(\s*['"`]([^'"`$]+)['"`]\s*\)/g,
    /\.doc\(\s*['"`]([^'"`$]+)['"`]\s*\)/g,
    /collectionGroup\(\s*['"`]([^'"`$]+)['"`]\s*\)/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) collectionCandidates.add(match[1].split('/')[0]);
  }
  const idempotenceTokens = ['idempot', 'commandId', 'event.id', 'eventId', 'lease', 'fenc', 'outbox', 'dedup', 'transaction']
    .filter((token) => source.toLowerCase().includes(token.toLowerCase()));
  const mutates = /\.(?:set|update|create|delete|add)\s*\(|runTransaction\s*\(|batch\s*\(/.test(source);
  const readOnlyByName = /^(?:get|list|preview|generate)/.test(name);
  const optionNames = ['cpu', 'concurrency', 'minInstances', 'maxInstances', 'timeoutSeconds', 'memory', 'retry'];
  const explicitOptions = Object.fromEntries(optionNames.map((option) => [option, new RegExp(`\\b${option}\\s*:`).test(source)]));
  const secretDefinitions = [...fs.readFileSync(path.join(rootDir, 'functions/helpers/secrets.js'), 'utf8').matchAll(/const\s+([A-Z][A-Z0-9_]+)\s*=\s*defineSecret\(['"]([^'"]+)['"]\)/g)];
  const secretMap = new Map(secretDefinitions.map((match) => [match[1], match[2]]));
  const sourceSecrets = [...secretMap.entries()].filter(([symbol]) => new RegExp(`\\b${symbol}\\b`).test(source)).map(([, secret]) => secret).sort();
  return {
    dataAccess: {
      confidence: 'module_static_overapproximation',
      reads: [...collectionCandidates].sort(),
      writes: mutates ? [...collectionCandidates].sort() : []
    },
    idempotence: {
      status: idempotenceTokens.length ? 'SOURCE_EVIDENCE' : (readOnlyByName ? 'READ_PATH_NOT_REQUIRED' : 'NOT_PROVEN_STATIC'),
      evidenceTokens: idempotenceTokens
    },
    explicitRuntimeOptions: explicitOptions,
    sourceSecrets
  };
}

function collectCallers(rootDir, localExports) {
  const files = walkFiles(rootDir, ['app', 'src', 'scripts', 'functions/src']);
  const sources = files.map((file) => ({
    file: path.relative(rootDir, file).split(path.sep).join('/'),
    source: fs.readFileSync(file, 'utf8')
  })).filter(({ file }) => !['scripts/functions-gen2-inventory.mjs', 'scripts/deploy-functions-targeted.mjs'].includes(file));
  const callers = new Map();
  for (const { name, sourceFile } of localExports) {
    const pattern = new RegExp(`\\b${name}\\b`);
    const matches = sources.filter(({ file, source }) => file !== sourceFile && pattern.test(source)).map(({ file }) => file);
    callers.set(name, [...new Set(matches)].sort());
  }
  return callers;
}

function localSecretsFor(name, sourceMetadata) {
  if (['startInstagramOAuthAdmin', 'instagramOAuthCallback'].includes(name)) {
    return ['INSTAGRAM_APP_ID', 'INSTAGRAM_APP_SECRET', 'INSTAGRAM_OAUTH_REDIRECT_URI', 'META_TOKEN_ENCRYPTION_KEY'];
  }
  if (['getInstagramConnectionStatusAdmin', 'verifyInstagramConnectionAdmin', 'disconnectInstagramConnectionAdmin'].includes(name)) {
    return ['META_TOKEN_ENCRYPTION_KEY'];
  }
  return sourceMetadata.sourceSecrets;
}

function sanitizeMember(member) {
  if (member === 'allUsers' || member === 'allAuthenticatedUsers' || member.startsWith('serviceAccount:')) return member;
  return `${member.split(':')[0]}:<redacted>`;
}

function loadIamPolicies(iamDir) {
  const policies = new Map();
  if (!iamDir || !fs.existsSync(iamDir)) return policies;
  for (const file of fs.readdirSync(iamDir).filter((name) => name.endsWith('.json'))) {
    const match = file.match(/^gen[12]-(.+)\.json$/);
    if (!match) continue;
    const policy = readJson(path.join(iamDir, file));
    policies.set(match[1], (policy.bindings || []).map((binding) => ({
      role: binding.role,
      members: (binding.members || []).map(sanitizeMember).sort()
    })).sort((a, b) => a.role.localeCompare(b.role)));
  }
  return policies;
}

function projectRolesFor(projectIam, serviceAccounts) {
  const wanted = new Set(serviceAccounts.filter(Boolean).map((account) => account.replace(/^projects\/[^/]+\/serviceAccounts\//, '')));
  const result = Object.fromEntries([...wanted].sort().map((account) => [account, []]));
  for (const binding of projectIam.bindings || []) {
    for (const member of binding.members || []) {
      if (!member.startsWith('serviceAccount:')) continue;
      const account = member.slice('serviceAccount:'.length);
      if (wanted.has(account)) result[account].push(binding.role);
    }
  }
  for (const roles of Object.values(result)) roles.sort();
  return result;
}

function rollbackFor(name, classification, trigger) {
  if (classification === 'HOLD_META_RECONCILIATION') return 'Aucun rollback cloud: cible non deployee et interdite d allowlist; conserver le code local sans publication.';
  if (classification === 'KEEP_GEN1_AUTH') return 'Conserver le nom Gen1 et redeployer exactement le commit/configuration du manifeste; ne jamais supprimer ni migrer cette cible.';
  if (classification === 'KEEP_GEN2') return 'Redeployer le commit et la configuration cloud du manifeste sur la meme cible; conserver job/queue/Eventarc, IAM et versions de secrets.';
  if (trigger.type === 'scheduler') return 'Desactiver le proprietaire Gen2, reactiver explicitement le job/proprietaire Gen1, rapprocher leases/backlog, puis redeployer le commit manifeste.';
  if (trigger.type === 'event') return 'Desactiver le nouveau trigger, garder Gen1 seul proprietaire, rapprocher ledger/claim/outbox puis redeployer le commit manifeste.';
  if (trigger.type === 'cloud-task') return 'Restaurer le producteur vers le worker precedent, conserver queue et ancien worker, puis rapprocher les taches en vol.';
  if (trigger.type === 'http' && /Webhook/.test(name)) return 'Remettre le fournisseur sur l URL Gen1 et son ancienne version de secret, conserver les deux endpoints pendant la reconciliation inbox.';
  if (trigger.type === 'http') return 'Restaurer l URL cliente/fournisseur Gen1 et le rollout App Hosting precedent; conserver le endpoint et ses secrets pendant la quiet-window.';
  return 'Restaurer le registre client vers le nom Gen1 et le rollout App Hosting precedent; conserver Gen1 actif et reconcilier toute mutation deja produite.';
}

function overlapFor(name, trigger) {
  if (trigger.type === 'scheduler') return name === 'expireAdminPaymentLinks'
    ? { owner: 'GEN1_CURRENT', overlap: 'BLOCKED_NO_SHARED_LEASE', required: 'owner generationnel ou fence transactionnel avant Gen2' }
    : { owner: 'GEN1_CURRENT', overlap: 'REQUIRES_LEASE_FENCE_PROOF', required: 'un seul proprietaire actif' };
  if (trigger.type === 'event') return { owner: 'CURRENT_TRIGGER', overlap: 'AT_LEAST_ONCE', required: 'cle metier/claim/outbox commune; event.id seul insuffisant entre generations' };
  if (trigger.type === 'cloud-task') return { owner: 'QUEUE_TARGET', overlap: 'QUEUE_BOUNDED', required: 'producteur unique et reconciliation des taches en vol' };
  if (trigger.type === 'http' && /Webhook/.test(name)) return { owner: 'PROVIDER_ENDPOINT', overlap: 'DOUBLE_DELIVERY_EXPECTED', required: 'inbox dedupliquee et secrets distincts' };
  return { owner: 'CLIENT_OR_CALLER_NAME', overlap: 'REGISTRY_CUTOVER', required: 'ancien onglet, rollback client et quiet-window' };
}

function schedulerFunctionName(job) {
  const labels = job.labels || {};
  if (labels['firebase-schedule']) return labels['firebase-schedule'];
  const jobId = job.name?.split('/').at(-1) || '';
  const firebaseJob = jobId.match(/^firebase-schedule-(.+)-(?:europe-west1|us-central1)$/);
  if (firebaseJob) return firebaseJob[1];
  const uri = job.httpTarget?.uri || '';
  const match = uri.match(/\/([^/?]+)$/);
  return match ? match[1] : null;
}

function sanitizeSchedulers(rows) {
  return rows.map((job) => ({
    name: job.name,
    functionName: schedulerFunctionName(job),
    schedule: job.schedule,
    timeZone: job.timeZone,
    state: job.state,
    attemptDeadline: job.attemptDeadline || null,
    retryConfig: job.retryConfig || null,
    targetUri: job.httpTarget?.uri || job.pubsubTarget?.topicName || null,
    oidcServiceAccount: job.httpTarget?.oidcToken?.serviceAccountEmail || null,
    lastAttemptTime: job.lastAttemptTime || null,
    scheduleTime: job.scheduleTime || null
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function sanitizeQueues(rows) {
  return rows.map((queue) => ({
    name: queue.name,
    state: queue.state,
    rateLimits: queue.rateLimits || null,
    retryConfig: queue.retryConfig || null,
    purgeTime: queue.purgeTime || null
  })).sort((a, b) => a.name.localeCompare(b.name));
}

function sanitizeEventarc(rows) {
  return rows.map((trigger) => ({
    name: trigger.name,
    eventFilters: trigger.eventFilters || null,
    eventDataContentType: trigger.eventDataContentType || null,
    serviceAccount: trigger.serviceAccount || null,
    transport: trigger.transport || null,
    destination: trigger.destination || null,
    conditions: trigger.conditions || null
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function buildInventory({ rootDir, firebaseRows, gcloudRows, iamPolicies, projectIam, commit, operator }) {
  const localExports = extractLocalExports(rootDir);
  const localNames = new Set(localExports.map(({ name }) => name));
  const cloudByName = new Map(firebaseRows.map((row) => [row.id, row]));
  const gcloudByName = new Map(gcloudRows.map((row) => [row.name.split('/').at(-1), row]));
  if (cloudByName.size !== EXPECTED_CLOUD_COUNT) throw new Error(`Inventaire cloud inattendu: ${cloudByName.size}`);
  const cloudOnly = [...cloudByName.keys()].filter((name) => !localNames.has(name));
  const localOnly = [...localNames].filter((name) => !cloudByName.has(name)).sort();
  if (cloudOnly.length) throw new Error(`Cibles cloud sans source: ${cloudOnly.join(', ')}`);
  if (JSON.stringify(localOnly) !== JSON.stringify([...HOLD_META_RECONCILIATION].sort())) {
    throw new Error(`Ecart local/cloud inattendu: ${localOnly.join(', ')}`);
  }
  const callers = collectCallers(rootDir, localExports);
  const serviceAccounts = [];
  const functions = localExports.map((local) => {
    const cloud = cloudByName.get(local.name) || null;
    const gcloud = gcloudByName.get(local.name) || null;
    const classification = classificationFor(local.name);
    const trigger = triggerFromCloud(cloud, gcloud) || localTriggerFor(local.name);
    const sourceMetadata = scanSourceMetadata(rootDir, local.sourceFile, local.name);
    const runtimeServiceAccount = gcloud?.serviceConfig?.serviceAccountEmail || cloud?.serviceAccount || null;
    const buildServiceAccount = gcloud?.buildConfig?.serviceAccount || null;
    const invokerServiceAccount = trigger.transportServiceAccount || null;
    serviceAccounts.push(runtimeServiceAccount, buildServiceAccount, invokerServiceAccount);
    const secrets = cloud
      ? (cloud.secretEnvironmentVariables || gcloud?.serviceConfig?.secretEnvironmentVariables || []).map((secret) => ({ name: secret.secret || secret.key, version: String(secret.version || 'unknown') })).sort((a, b) => a.name.localeCompare(b.name))
      : localSecretsFor(local.name, sourceMetadata).map((name) => ({ name, version: null }));
    const deploymentMax = FINANCE_TARGETS.has(local.name) || SCHEDULER_NAMES.has(local.name) || /Webhook/.test(local.name) ? 1 : 10;
    return {
      name: local.name,
      source: { file: local.sourceFile, export: local.localName },
      cloud: cloud ? {
        present: true,
        state: cloud.state,
        project: cloud.project,
        codebase: cloud.codebase,
        generation: cloud.platform === 'gcfv2' ? 2 : 1,
        region: cloud.region,
        runtime: cloud.runtime,
        revision: gcloud?.serviceConfig?.revision || null,
        updatedAt: gcloud?.updateTime || null,
        uri: cloud.uri || gcloud?.serviceConfig?.uri || null
      } : { present: false, state: null, project: EXPECTED_PROJECT, codebase: EXPECTED_CODEBASE, generation: null, region: 'europe-west1', runtime: 'nodejs22', revision: null, updatedAt: null, uri: null },
      trigger,
      identities: {
        runtimeServiceAccount,
        buildServiceAccount,
        invokerServiceAccount,
        resourceIam: iamPolicies.get(local.name) || []
      },
      secrets,
      runtime: {
        cpu: cloud?.cpu ?? gcloud?.serviceConfig?.availableCpu ?? null,
        memoryMiB: cloud?.availableMemoryMb ?? null,
        timeoutSeconds: cloud?.timeoutSeconds ?? null,
        concurrency: cloud?.concurrency ?? gcloud?.serviceConfig?.maxInstanceRequestConcurrency ?? (cloud?.platform === 'gcfv1' ? 1 : null),
        minInstances: gcloud?.serviceConfig?.minInstanceCount ?? 0,
        maxInstances: cloud?.maxInstances ?? gcloud?.serviceConfig?.maxInstanceCount ?? null,
        ingress: cloud?.ingressSettings ?? gcloud?.serviceConfig?.ingressSettings ?? null,
        retry: trigger.retry,
        sourceExplicitOptions: sourceMetadata.explicitRuntimeOptions
      },
      callers: callers.get(local.name) || [],
      dataAccess: sourceMetadata.dataAccess,
      idempotence: sourceMetadata.idempotence,
      ownership: overlapFor(local.name, trigger),
      decision: {
        classification,
        target: ['KEEP_GEN2', 'KEEP_GEN1_AUTH', 'MIGRATION_PARALLEL'].includes(classification)
          ? local.name
          : `${local.name}Gen2`,
        wave: waveFor(local.name, classification),
        deploymentMaxBatchSize: deploymentMax,
        rollback: rollbackFor(local.name, classification, trigger)
      }
    };
  });
  const projectIamByServiceAccount = projectRolesFor(projectIam, serviceAccounts);
  const counts = Object.fromEntries(['KEEP_GEN2', 'KEEP_GEN1_AUTH', 'MIGRATE', 'MIGRATE_OR_RETIRE', 'HOLD_META_RECONCILIATION', 'MIGRATION_PARALLEL']
    .map((classification) => [classification, functions.filter((entry) => entry.decision.classification === classification).length]));
  return {
    schemaVersion: 1,
    metadata: {
      project: EXPECTED_PROJECT,
      codebase: EXPECTED_CODEBASE,
      baselineCommit: commit,
      operator,
      generatedAt: new Date().toISOString(),
      sourceCount: functions.length,
      cloudCount: functions.filter((entry) => entry.cloud.present).length,
      cloudGen1Count: functions.filter((entry) => entry.cloud.generation === 1).length,
      cloudGen2Count: functions.filter((entry) => entry.cloud.generation === 2).length,
      localOnly: localOnly,
      classifications: counts
    },
    deploymentPolicy: {
      exactProject: EXPECTED_PROJECT,
      exactCodebase: EXPECTED_CODEBASE,
      maxBatchSize: 10,
      financeWebhookSchedulerMaxBatchSize: 1,
      forbiddenTargets: [...HOLD_META_RECONCILIATION].sort(),
      forbiddenGlobalSelector: 'functions'
    },
    projectIamByServiceAccount,
    functions
  };
}

function buildPlatformManifest({ inventory, schedulers, queues, eventarc }) {
  const gen2 = inventory.functions.filter((entry) => entry.decision.classification === 'KEEP_GEN2').map((entry) => {
    const implicit = Object.entries(entry.runtime.sourceExplicitOptions).filter(([, explicit]) => !explicit).map(([option]) => option);
    return {
      name: entry.name,
      source: entry.source,
      cloud: entry.cloud,
      trigger: entry.trigger,
      identities: entry.identities,
      secrets: entry.secrets,
      runtime: entry.runtime,
      sourceCloudDrifts: implicit.map((option) => `SOURCE_OPTION_IMPLICIT:${option}`)
    };
  });
  return {
    schemaVersion: 1,
    metadata: {
      project: inventory.metadata.project,
      baselineCommit: inventory.metadata.baselineCommit,
      generatedAt: inventory.metadata.generatedAt,
      gen2Count: gen2.length,
      schedulerCount: schedulers.length,
      queueCount: queues.length,
      eventarcCount: eventarc.length
    },
    gen2,
    schedulers,
    queues,
    eventarc
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const firebaseRaw = readJson(required(args, 'firebase'));
  const firebaseRows = Array.isArray(firebaseRaw.result) ? firebaseRaw.result : firebaseRaw.result?.functions;
  const gcloudRows = readJson(required(args, 'gcloud'));
  const iamDir = required(args, 'iam-dir');
  const iamPolicies = loadIamPolicies(iamDir);
  if (iamPolicies.size !== EXPECTED_CLOUD_COUNT) throw new Error(`IAM incomplet: ${iamPolicies.size}/${EXPECTED_CLOUD_COUNT}`);
  const schedulers = sanitizeSchedulers(asArray(args.scheduler).flatMap((file) => readJson(file)));
  const queues = sanitizeQueues(asArray(args.queue).flatMap((file) => readJson(file)));
  const eventarc = sanitizeEventarc(asArray(args.eventarc).flatMap((file) => readJson(file)));
  if (schedulers.length !== 8) throw new Error(`Schedulers inattendus: ${schedulers.length}/8`);
  if (queues.length !== 2) throw new Error(`Queues inattendues: ${queues.length}/2`);
  if (eventarc.length !== 7) throw new Error(`Eventarc inattendu: ${eventarc.length}/7`);
  const inventory = buildInventory({
    rootDir,
    firebaseRows,
    gcloudRows,
    iamPolicies,
    projectIam: readJson(required(args, 'project-iam')),
    commit: required(args, 'commit'),
    operator: required(args, 'operator')
  });
  const output = path.resolve(rootDir, required(args, 'output'));
  const platformOutput = path.resolve(rootDir, required(args, 'platform-output'));
  const inventorySha256 = writeJson(output, inventory);
  const platformSha256 = writeJson(platformOutput, buildPlatformManifest({ inventory, schedulers, queues, eventarc }));
  const digestOutput = path.resolve(rootDir, required(args, 'digest-output'));
  const digest = {
    schemaVersion: 1,
    project: EXPECTED_PROJECT,
    codebase: EXPECTED_CODEBASE,
    baselineCommit: inventory.metadata.baselineCommit,
    files: {
      [path.relative(rootDir, output).split(path.sep).join('/')]: inventorySha256,
      [path.relative(rootDir, platformOutput).split(path.sep).join('/')]: platformSha256
    }
  };
  writeJson(digestOutput, digest);
  process.stdout.write(`${JSON.stringify({
    source: inventory.metadata.sourceCount,
    cloud: inventory.metadata.cloudCount,
    gen1: inventory.metadata.cloudGen1Count,
    gen2: inventory.metadata.cloudGen2Count,
    classifications: inventory.metadata.classifications,
    schedulers: schedulers.length,
    queues: queues.length,
    eventarc: eventarc.length
  })}\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    process.stderr.write(`functions-gen2-inventory: ${error.message}\n`);
    process.exitCode = 1;
  });
}
