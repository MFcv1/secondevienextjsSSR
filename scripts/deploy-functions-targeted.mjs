#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const EXPECTED_PROJECT = 'secondevienextjsssr';
export const EXPECTED_CODEBASE = 'main';
export const MAX_BATCH_SIZE = 10;
const FIREBASE_DNS_NODE_OPTION = '--dns-result-order=ipv4first';
const G6_BUILD_SERVICE_ACCOUNT = 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com';
const G6_EMAIL_SECRETS = Object.freeze([
  'GMAIL_EMAIL=GMAIL_EMAIL:2',
  'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
  'RESEND_API_KEY=RESEND_API_KEY:1'
]);
const G6_FIREBASE_CONFIG = 'FIREBASE_CONFIG={"storageBucket":"secondevienextjsssr.firebasestorage.app"}';
const G7_RUNTIME_SERVICE_ACCOUNT = 'meta-runtime@secondevienextjsssr.iam.gserviceaccount.com';
const G7_META_SECRETS = Object.freeze([
  'META_APP_ID=META_APP_ID:1',
  'META_APP_SECRET=META_APP_SECRET:1',
  'META_OAUTH_REDIRECT_URI=META_OAUTH_REDIRECT_URI:2',
  'META_TOKEN_ENCRYPTION_KEY=META_TOKEN_ENCRYPTION_KEY:1'
]);
const G7_INSTAGRAM_SECRETS = Object.freeze([
  'INSTAGRAM_APP_ID=INSTAGRAM_APP_ID:1',
  'INSTAGRAM_APP_SECRET=INSTAGRAM_APP_SECRET:1',
  'INSTAGRAM_OAUTH_REDIRECT_URI=INSTAGRAM_OAUTH_REDIRECT_URI:2',
  'META_TOKEN_ENCRYPTION_KEY=META_TOKEN_ENCRYPTION_KEY:1'
]);
const G7_PUBLICATION_SECRETS = Object.freeze([
  'META_TOKEN_ENCRYPTION_KEY=META_TOKEN_ENCRYPTION_KEY:1'
]);
const G8_BUILD_SERVICE_ACCOUNT = G6_BUILD_SERVICE_ACCOUNT;
const G8_RUNTIME_SERVICE_ACCOUNT = 'secondevienextjsssr@appspot.gserviceaccount.com';
const G8_STRIPE_SECRET = Object.freeze(['STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4']);
const G8_CREATE_ORDER_SECRETS = Object.freeze([
  'GMAIL_EMAIL=GMAIL_EMAIL:2',
  'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
  'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4'
]);
const g8Callable = ({ name, memory = '256Mi', secrets = [] }) => Object.freeze({
  create: true,
  g8: true,
  triggerType: 'http-callable',
  region: 'europe-west1',
  runtime: 'nodejs22',
  entryPoint: name,
  runtimeServiceAccount: G8_RUNTIME_SERVICE_ACCOUNT,
  buildServiceAccount: G8_BUILD_SERVICE_ACCOUNT,
  memory,
  cpu: '167m',
  timeout: '60s',
  concurrency: '1',
  minInstances: '0',
  maxInstances: '1',
  ingressSettings: 'all',
  secrets
});
const G8_LOGICAL_NAMES = Object.freeze([
  'adjustInventoryAdmin', 'archiveOrderAdmin', 'cancelReturnAdmin', 'createOrder',
  'createProductAdmin', 'createPromotionCodeAdmin', 'createPublishedProductAdmin',
  'decideCustomerReturnRequestAdmin', 'deleteProductAdmin', 'getDeliveryPolicyAdmin',
  'getOrderStatusClient', 'getOrderTimelineAdminV2', 'listCustomerReturnRequestsAdminV2',
  'listMyOrdersV2', 'listOrdersAdminV2', 'listPromotionCodesAdmin', 'listReturnsAdminV2',
  'markOrderDeliveredAdmin', 'markOrderPickedUpAdmin', 'markOrderPreparingAdmin',
  'markOrderReadyForPickupAdmin', 'markOrderShippedAdmin', 'markReturnReceivedAdmin',
  'openReturnAdmin', 'preflightProductMutationAdmin', 'prepareCommerceDocumentDelivery',
  'previewPromotionCodeV2', 'publishProductAdmin', 'requestCustomerReturn',
  'requestOrderCancellation', 'resolveReturnAdmin', 'restockReturnLinesAdmin',
  'saveDeliveryPolicyAdmin', 'setPromotionCodeStatusAdmin', 'updateOrderTrackingAdmin',
  'updateProductOfferAdmin', 'writeOffReturnLinesAdmin'
]);
const G8_GEN2_TARGETS = Object.freeze(Object.fromEntries(G8_LOGICAL_NAMES.map((name) => {
  const targetName = `${name}Gen2`;
  const secrets = name === 'createOrder'
    ? G8_CREATE_ORDER_SECRETS
    : (['decideCustomerReturnRequestAdmin', 'requestOrderCancellation'].includes(name) ? G8_STRIPE_SECRET : []);
  return [targetName, g8Callable({
    name: targetName,
    memory: name === 'prepareCommerceDocumentDelivery' ? '512Mi' : '256Mi',
    secrets
  })];
})));
const G9_PAYMENT_LINK_SECRETS = Object.freeze([
  'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
  'PAYMENT_LINK_HMAC_SECRET=PAYMENT_LINK_HMAC_SECRET:1'
]);
const G9_CONNECT_ADMIN_SECRETS = Object.freeze([
  'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
  'SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3'
]);
const G9_OUTBOX_SECRETS = Object.freeze([
  'GMAIL_EMAIL=GMAIL_EMAIL:2',
  'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
  'RESEND_API_KEY=RESEND_API_KEY:1'
]);
const G10_WEBHOOK_SECRETS = Object.freeze([
  'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
  'STRIPE_WH_SECRET=STRIPE_WH_SECRET:3',
  'STRIPE_CONNECT_WH_SECRET=STRIPE_CONNECT_WH_SECRET:1',
  'STRIPE_WH_SECRET_G10=STRIPE_WH_SECRET_G10:1',
  'STRIPE_CONNECT_WH_SECRET_G10=STRIPE_CONNECT_WH_SECRET_G10:1'
]);
const g10Webhook = ({ name, entryPoint }) => Object.freeze({
  create: true,
  g10: true,
  triggerType: 'http-public',
  region: 'europe-west1',
  runtime: 'nodejs22',
  entryPoint,
  runtimeServiceAccount: G8_RUNTIME_SERVICE_ACCOUNT,
  buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
  memory: '256Mi',
  cpu: '167m',
  timeout: '60s',
  concurrency: '1',
  minInstances: '0',
  maxInstances: '1',
  ingressSettings: 'all',
  secrets: G10_WEBHOOK_SECRETS
});
const G10_GEN2_TARGETS = Object.freeze({
  stripeWebhookV2Gen2: g10Webhook({
    name: 'stripeWebhookV2Gen2',
    entryPoint: 'stripeWebhookV2'
  }),
  stripeConnectWebhookV2Gen2: g10Webhook({
    name: 'stripeConnectWebhookV2Gen2',
    entryPoint: 'stripeConnectWebhookV2'
  })
});
const G11_GEN2_TARGETS = Object.freeze({
  deleteSessionGen2: Object.freeze({
    create: true,
    g11: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'deleteSessionGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: G6_BUILD_SERVICE_ACCOUNT,
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: []
  })
});
const g9Http = ({
  name,
  triggerType = 'http-callable',
  runtimeServiceAccount = G8_RUNTIME_SERVICE_ACCOUNT,
  memory = '256Mi',
  timeout = '60s',
  secrets = [],
  schedule = null,
  expectedSchedulerAudience = null,
  schedulerUpdateRequired = true
}) => Object.freeze({
  create: true,
  g9: true,
  triggerType,
  region: 'europe-west1',
  runtime: 'nodejs22',
  entryPoint: name,
  runtimeServiceAccount,
  buildServiceAccount: G8_BUILD_SERVICE_ACCOUNT,
  memory,
  cpu: '167m',
  timeout,
  concurrency: '1',
  minInstances: '0',
  maxInstances: '1',
  ingressSettings: 'all',
  secrets,
  ...(schedule ? {
    functionUrl: `https://europe-west1-secondevienextjsssr.cloudfunctions.net/${name}`,
    schedulerJob: `firebase-schedule-${name}-europe-west1`,
    schedule,
    timeZone: 'UTC',
    schedulerServiceAccount: runtimeServiceAccount,
    schedulerAttemptDeadline: '300s'
  } : {}),
  ...(expectedSchedulerAudience ? { expectedSchedulerAudience } : {}),
  schedulerUpdateRequired
});
const G9_GEN2_TARGETS = Object.freeze({
  getStripeConnectStatusGen2: g9Http({ name: 'getStripeConnectStatusGen2', secrets: G8_STRIPE_SECRET }),
  startStripeConnectOnboardingGen2: g9Http({ name: 'startStripeConnectOnboardingGen2', secrets: G9_CONNECT_ADMIN_SECRETS }),
  syncStripeConnectAccountGen2: g9Http({ name: 'syncStripeConnectAccountGen2', secrets: G8_STRIPE_SECRET }),
  requestStripeConnectReconnectGen2: g9Http({ name: 'requestStripeConnectReconnectGen2', secrets: G9_CONNECT_ADMIN_SECRETS }),
  confirmStripeConnectReconnectGen2: g9Http({ name: 'confirmStripeConnectReconnectGen2', secrets: G9_CONNECT_ADMIN_SECRETS }),
  getCommerceOperationsStatusAdminGen2: g9Http({ name: 'getCommerceOperationsStatusAdminGen2' }),
  rebuildCommerceOperationsAdminGen2: g9Http({ name: 'rebuildCommerceOperationsAdminGen2', memory: '512Mi', timeout: '300s' }),
  cleanupFixtureRunAdminGen2: g9Http({ name: 'cleanupFixtureRunAdminGen2', memory: '512Mi', timeout: '180s' }),
  createAdminPaymentLinkGen2: g9Http({ name: 'createAdminPaymentLinkGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  listAdminPaymentLinksGen2: g9Http({ name: 'listAdminPaymentLinksGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  extendAdminPaymentLinkGen2: g9Http({ name: 'extendAdminPaymentLinkGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  regenerateAdminPaymentLinkGen2: g9Http({ name: 'regenerateAdminPaymentLinkGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  recreateAdminPaymentLinkGen2: g9Http({ name: 'recreateAdminPaymentLinkGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  cancelAdminPaymentLinkGen2: g9Http({ name: 'cancelAdminPaymentLinkGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  getAdminPaymentLinkPublicGen2: g9Http({ name: 'getAdminPaymentLinkPublicGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  prepareAdminPaymentLinkPaymentGen2: g9Http({ name: 'prepareAdminPaymentLinkPaymentGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  resumeAdminPaymentLinkPaymentGen2: g9Http({ name: 'resumeAdminPaymentLinkPaymentGen2', secrets: G9_PAYMENT_LINK_SECRETS }),
  createCheckoutV2Gen2: g9Http({ name: 'createCheckoutV2Gen2', secrets: G8_STRIPE_SECRET }),
  resumeCheckoutV2Gen2: g9Http({ name: 'resumeCheckoutV2Gen2', secrets: G8_STRIPE_SECRET }),
  requestRefundAdminGen2: g9Http({ name: 'requestRefundAdminGen2', secrets: G8_STRIPE_SECRET }),
  commerceOperationsReconcilerGen2: g9Http({
    name: 'commerceOperationsReconcilerGen2', triggerType: 'http-scheduler',
    runtimeServiceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi', timeout: '300s', schedule: 'every 60 minutes'
  }),
  commerceOutboxDispatcherGen2: g9Http({
    name: 'commerceOutboxDispatcherGen2', triggerType: 'http-scheduler',
    runtimeServiceAccount: 'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi', timeout: '300s', schedule: 'every 2 minutes', secrets: G9_OUTBOX_SECRETS,
    expectedSchedulerAudience: 'https://commerceoutboxdispatchergen2-evkkvyaaga-ew.a.run.app',
    schedulerUpdateRequired: false
  }),
  commerceReservationExpiryDispatcherGen2: g9Http({
    name: 'commerceReservationExpiryDispatcherGen2', triggerType: 'http-scheduler',
    runtimeServiceAccount: 'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi', timeout: '300s', schedule: 'every 2 minutes', secrets: G8_STRIPE_SECRET
  }),
  expireAdminPaymentLinksGen2: g9Http({
    name: 'expireAdminPaymentLinksGen2', triggerType: 'http-scheduler',
    runtimeServiceAccount: 'admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi', timeout: '300s', schedule: 'every 5 minutes', secrets: G9_PAYMENT_LINK_SECRETS
  })
});
const g7Http = ({ name, triggerType = 'http-callable', memory = '256Mi', timeout = '60s', secrets = [] }) => Object.freeze({
  create: true,
  g7: true,
  triggerType,
  region: 'europe-west1',
  runtime: 'nodejs22',
  entryPoint: name,
  runtimeServiceAccount: G7_RUNTIME_SERVICE_ACCOUNT,
  buildServiceAccount: G6_BUILD_SERVICE_ACCOUNT,
  memory,
  cpu: '167m',
  timeout,
  concurrency: '1',
  minInstances: '0',
  maxInstances: '1',
  ingressSettings: 'all',
  secrets
});
const G7_GEN2_TARGETS = Object.freeze({
  disconnectInstagramConnectionAdminGen2: g7Http({ name: 'disconnectInstagramConnectionAdminGen2', secrets: G7_PUBLICATION_SECRETS }),
  disconnectMetaConnectionAdminGen2: g7Http({ name: 'disconnectMetaConnectionAdminGen2', secrets: G7_PUBLICATION_SECRETS }),
  getInstagramConnectionStatusAdminGen2: g7Http({ name: 'getInstagramConnectionStatusAdminGen2', secrets: G7_PUBLICATION_SECRETS }),
  getMetaConnectionStatusAdminGen2: g7Http({ name: 'getMetaConnectionStatusAdminGen2', secrets: G7_PUBLICATION_SECRETS }),
  getSocialPublicationStatusAdminGen2: g7Http({ name: 'getSocialPublicationStatusAdminGen2' }),
  instagramOAuthCallbackGen2: g7Http({ name: 'instagramOAuthCallbackGen2', triggerType: 'http-public', secrets: G7_INSTAGRAM_SECRETS }),
  metaOAuthCallbackGen2: g7Http({ name: 'metaOAuthCallbackGen2', triggerType: 'http-public', secrets: G7_META_SECRETS }),
  prepareSocialPublicationAdminGen2: g7Http({ name: 'prepareSocialPublicationAdminGen2', memory: '512Mi', timeout: '300s', secrets: G7_PUBLICATION_SECRETS }),
  runSocialPublicationAdminGen2: g7Http({ name: 'runSocialPublicationAdminGen2', memory: '512Mi', timeout: '300s', secrets: G7_PUBLICATION_SECRETS }),
  selectMetaAssetAdminGen2: g7Http({ name: 'selectMetaAssetAdminGen2', secrets: G7_PUBLICATION_SECRETS }),
  startInstagramOAuthAdminGen2: g7Http({ name: 'startInstagramOAuthAdminGen2', secrets: G7_INSTAGRAM_SECRETS }),
  startMetaOAuthAdminGen2: g7Http({ name: 'startMetaOAuthAdminGen2', secrets: G7_META_SECRETS }),
  verifyInstagramConnectionAdminGen2: g7Http({ name: 'verifyInstagramConnectionAdminGen2', secrets: G7_PUBLICATION_SECRETS }),
  verifyMetaConnectionAdminGen2: g7Http({ name: 'verifyMetaConnectionAdminGen2', secrets: G7_PUBLICATION_SECRETS })
});
const g6Callable = ({ name, serviceAccount, memory = '256Mi', timeout = '60s', maxInstances = '1', secrets = [], environmentVariables = [], environmentVariableNames = [] }) => Object.freeze({
  create: true,
  g6: true,
  triggerType: 'http-callable',
  region: 'europe-west1',
  runtime: 'nodejs22',
  entryPoint: name,
  runtimeServiceAccount: `${serviceAccount}@secondevienextjsssr.iam.gserviceaccount.com`,
  buildServiceAccount: G6_BUILD_SERVICE_ACCOUNT,
  memory,
  cpu: '167m',
  timeout,
  concurrency: '1',
  minInstances: '0',
  maxInstances,
  ingressSettings: 'all',
  secrets,
  environmentVariables,
  environmentVariableNames
});
const G6_GEN2_TARGETS = Object.freeze({
  getCatalogPublicationStatusGen2: g6Callable({ name: 'getCatalogPublicationStatusGen2', serviceAccount: 'catalog-builder', memory: '512Mi', maxInstances: '2' }),
  rebuildCatalogSnapshotGen2: g6Callable({ name: 'rebuildCatalogSnapshotGen2', serviceAccount: 'catalog-builder', memory: '512Mi' }),
  rollbackCatalogSnapshotGen2: g6Callable({ name: 'rollbackCatalogSnapshotGen2', serviceAccount: 'catalog-builder', memory: '512Mi', timeout: '120s' }),
  sendRefundStatusEmailAdminGen2: g6Callable({ name: 'sendRefundStatusEmailAdminGen2', serviceAccount: 'email-manual-runtime', secrets: G6_EMAIL_SECRETS, environmentVariableNames: ['TRANSACTIONAL_EMAIL_PROVIDER'] }),
  sendTestEmailGen2: g6Callable({ name: 'sendTestEmailGen2', serviceAccount: 'email-manual-runtime', secrets: G6_EMAIL_SECRETS, environmentVariableNames: ['TRANSACTIONAL_EMAIL_PROVIDER'] }),
  completeBillingGuideAdminGen2: g6Callable({ name: 'completeBillingGuideAdminGen2', serviceAccount: 'billing-guide-runtime', secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3'], environmentVariableNames: ['BILLING_GUIDE_MODE', 'BILLING_GUIDE_TEST_UID', 'BILLING_GUIDE_LIVE_UID', 'BILLING_GUIDE_TECHNICAL_EMAIL'] }),
  getBillingGuideOperatorStatusGen2: g6Callable({ name: 'getBillingGuideOperatorStatusGen2', serviceAccount: 'billing-guide-runtime', secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3'], environmentVariableNames: ['BILLING_GUIDE_MODE', 'BILLING_GUIDE_TEST_UID', 'BILLING_GUIDE_LIVE_UID', 'BILLING_GUIDE_TECHNICAL_EMAIL'] }),
  getBillingGuideStatusGen2: g6Callable({ name: 'getBillingGuideStatusGen2', serviceAccount: 'billing-guide-runtime', secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3'], environmentVariableNames: ['BILLING_GUIDE_MODE', 'BILLING_GUIDE_TEST_UID', 'BILLING_GUIDE_LIVE_UID', 'BILLING_GUIDE_TECHNICAL_EMAIL'] }),
  resetBillingGuideTestGen2: g6Callable({ name: 'resetBillingGuideTestGen2', serviceAccount: 'billing-guide-runtime', secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3'], environmentVariableNames: ['BILLING_GUIDE_MODE', 'BILLING_GUIDE_TEST_UID', 'BILLING_GUIDE_LIVE_UID', 'BILLING_GUIDE_TECHNICAL_EMAIL'] }),
  saveBillingGuideProgressGen2: g6Callable({ name: 'saveBillingGuideProgressGen2', serviceAccount: 'billing-guide-runtime', secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3'], environmentVariableNames: ['BILLING_GUIDE_MODE', 'BILLING_GUIDE_TEST_UID', 'BILLING_GUIDE_LIVE_UID', 'BILLING_GUIDE_TECHNICAL_EMAIL'] }),
  getManualInvoiceWorkspaceAdminGen2: g6Callable({ name: 'getManualInvoiceWorkspaceAdminGen2', serviceAccount: 'manual-invoice-runtime', memory: '512Mi', timeout: '30s' }),
  prepareManualInvoicePdfAdminGen2: g6Callable({ name: 'prepareManualInvoicePdfAdminGen2', serviceAccount: 'manual-invoice-runtime', memory: '512Mi' }),
  saveManualInvoiceDraftAdminGen2: g6Callable({ name: 'saveManualInvoiceDraftAdminGen2', serviceAccount: 'manual-invoice-runtime', memory: '512Mi', timeout: '30s' }),
  sendManualInvoiceAdminGen2: g6Callable({ name: 'sendManualInvoiceAdminGen2', serviceAccount: 'manual-invoice-runtime', memory: '512Mi', secrets: G6_EMAIL_SECRETS, environmentVariables: [G6_FIREBASE_CONFIG], environmentVariableNames: ['TRANSACTIONAL_EMAIL_PROVIDER'] }),
  createQuoteRequestGen2: g6Callable({ name: 'createQuoteRequestGen2', serviceAccount: 'quote-request-runtime', memory: '512Mi' }),
  finalizeQuoteRequestGen2: g6Callable({ name: 'finalizeQuoteRequestGen2', serviceAccount: 'quote-request-runtime', memory: '512Mi' }),
  getQuoteRequestAdminGen2: g6Callable({ name: 'getQuoteRequestAdminGen2', serviceAccount: 'quote-request-runtime', memory: '512Mi', timeout: '30s', environmentVariables: [G6_FIREBASE_CONFIG] }),
  listQuoteRequestsAdminGen2: g6Callable({ name: 'listQuoteRequestsAdminGen2', serviceAccount: 'quote-request-runtime', memory: '512Mi', timeout: '30s' }),
  updateQuoteRequestAdminGen2: g6Callable({ name: 'updateQuoteRequestAdminGen2', serviceAccount: 'quote-request-runtime', memory: '512Mi', timeout: '30s' }),
  uploadQuoteRequestPhotoGen2: g6Callable({ name: 'uploadQuoteRequestPhotoGen2', serviceAccount: 'quote-request-runtime', memory: '512Mi', environmentVariables: [G6_FIREBASE_CONFIG] }),
  onQuoteRequestSubmittedGen2: Object.freeze({
    create: true,
    g6: true,
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onQuoteRequestSubmittedGen2',
    eventType: 'google.cloud.firestore.document.v1.updated',
    eventFilters: 'type=google.cloud.firestore.document.v1.updated,database=(default),namespace=(default)',
    documentPathPattern: 'quote_requests/{quoteId}',
    eventPathPattern: 'document=quote_requests/{quoteId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'quote-request-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: G6_BUILD_SERVICE_ACCOUNT,
    memory: '512Mi', cpu: '167m', timeout: '60s', concurrency: '1', minInstances: '0', maxInstances: '1', ingressSettings: 'all',
    secrets: G6_EMAIL_SECRETS,
    environmentVariables: [
      G6_FIREBASE_CONFIG,
      'FUNCTION_SIGNATURE_TYPE=cloudevent',
      'FUNCTION_TARGET=onQuoteRequestSubmittedGen2',
      'GCLOUD_PROJECT=secondevienextjsssr',
      'EVENTARC_CLOUD_EVENT_SOURCE=projects/secondevienextjsssr/locations/europe-west1/services/onQuoteRequestSubmittedGen2'
    ],
    environmentVariableNames: ['TRANSACTIONAL_EMAIL_PROVIDER']
  }),
  claimNewsletterRewardGen2: g6Callable({ name: 'claimNewsletterRewardGen2', serviceAccount: 'newsletter-runtime', secrets: G6_EMAIL_SECRETS, environmentVariableNames: ['TRANSACTIONAL_EMAIL_PROVIDER'] }),
  drawNewsletterRewardGen2: g6Callable({ name: 'drawNewsletterRewardGen2', serviceAccount: 'newsletter-runtime' }),
  listMyNewsletterRewardsGen2: g6Callable({ name: 'listMyNewsletterRewardsGen2', serviceAccount: 'newsletter-runtime', timeout: '30s' })
});
const GCLOUD_GEN1_TARGETS = Object.freeze({
  commerceOperationsReconciler: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'commerceOperationsReconciler',
    triggerTopic: 'firebase-schedule-commerceOperationsReconciler-europe-west1',
    serviceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '12',
    expectedServiceAccount: 'commerce-operations-reconciler@secondevienextjsssr.iam.gserviceaccount.com',
    secrets: []
  }),
  commerceReservationExpiryDispatcher: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'commerceReservationExpiryDispatcher',
    triggerTopic: 'firebase-schedule-commerceReservationExpiryDispatcher-europe-west1',
    serviceAccount: 'commerce-reservation-expiry@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '2',
    expectedServiceAccount: 'secondevienextjsssr@appspot.gserviceaccount.com',
    secrets: ['STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4']
  }),
  commerceOutboxDispatcher: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'commerceOutboxDispatcher',
    triggerTopic: 'firebase-schedule-commerceOutboxDispatcher-europe-west1',
    serviceAccount: 'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '12',
    expectedServiceAccount: 'commerce-outbox-dispatcher@secondevienextjsssr.iam.gserviceaccount.com',
    secrets: [
      'GMAIL_EMAIL=GMAIL_EMAIL:2',
      'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
      'RESEND_API_KEY=RESEND_API_KEY:1'
    ]
  }),
  expireAdminPaymentLinks: Object.freeze({
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'expireAdminPaymentLinks',
    triggerTopic: 'firebase-schedule-expireAdminPaymentLinks-europe-west1',
    serviceAccount: 'admin-payment-link-expiry@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/231220287936-compute@developer.gserviceaccount.com',
    memory: '512MB',
    timeout: '300s',
    maxInstances: '1',
    ingressSettings: 'all',
    expectedVersion: '4',
    expectedServiceAccount: 'secondevienextjsssr@appspot.gserviceaccount.com',
    secrets: [
      'STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:4',
      'PAYMENT_LINK_HMAC_SECRET=PAYMENT_LINK_HMAC_SECRET:1'
    ]
  })
});
export const GCLOUD_GEN2_TARGETS = Object.freeze({
  ...G6_GEN2_TARGETS,
  ...G7_GEN2_TARGETS,
  ...G8_GEN2_TARGETS,
  ...G9_GEN2_TARGETS,
  ...G10_GEN2_TARGETS,
  ...G11_GEN2_TARGETS,
  removeAdminUserGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'removeAdminUserGen2',
    runtimeServiceAccount: 'auth-admin-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3']
  }),
  addAdminUserGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'addAdminUserGen2',
    runtimeServiceAccount: 'auth-admin-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3']
  }),
  syncSuperAdminClaimGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'syncSuperAdminClaimGen2',
    runtimeServiceAccount: 'auth-admin-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3']
  }),
  verifyPasskeyRegistrationGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'verifyPasskeyRegistrationGen2',
    runtimeServiceAccount: 'auth-passkey-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  generatePasskeyRegistrationOptionsGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'generatePasskeyRegistrationOptionsGen2',
    runtimeServiceAccount: 'auth-passkey-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    environmentVariables: [
      'SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
    ]
  }),
  verifyPasskeyAuthenticationGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'verifyPasskeyAuthenticationGen2',
    runtimeServiceAccount: 'auth-login-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  generatePasskeyAuthenticationOptionsGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'generatePasskeyAuthenticationOptionsGen2',
    runtimeServiceAccount: 'auth-login-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    environmentVariables: [
      'SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
    ]
  }),
  verifyCustomerLoginOtpGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'verifyCustomerLoginOtpGen2',
    runtimeServiceAccount: 'auth-login-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: ['OTP_HMAC_SECRET=OTP_HMAC_SECRET:1']
  }),
  sendCustomerLoginOtpGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'sendCustomerLoginOtpGen2',
    runtimeServiceAccount: 'auth-otp-email-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: [
      'GMAIL_EMAIL=GMAIL_EMAIL:2',
      'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
      'RESEND_API_KEY=RESEND_API_KEY:1',
      'OTP_HMAC_SECRET=OTP_HMAC_SECRET:1'
    ],
    environmentVariables: [
      'TRANSACTIONAL_EMAIL_PROVIDER=gmail',
      'SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
    ]
  }),
  verifyGuestCheckoutOtpGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'verifyGuestCheckoutOtpGen2',
    runtimeServiceAccount: 'auth-otp-verify-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: ['OTP_HMAC_SECRET=OTP_HMAC_SECRET:1']
  }),
  sendGuestCheckoutOtpGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'sendGuestCheckoutOtpGen2',
    runtimeServiceAccount: 'auth-otp-email-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: [
      'GMAIL_EMAIL=GMAIL_EMAIL:2',
      'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
      'RESEND_API_KEY=RESEND_API_KEY:1',
      'OTP_HMAC_SECRET=OTP_HMAC_SECRET:1'
    ],
    environmentVariables: [
      'TRANSACTIONAL_EMAIL_PROVIDER=gmail',
      'SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
    ]
  }),
  ensureAdminAccessRegistryGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'ensureAdminAccessRegistryGen2',
    runtimeServiceAccount: 'auth-registry-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    secrets: ['SUPER_ADMIN_EMAIL=SUPER_ADMIN_EMAIL:3']
  }),
  logUserConnectionGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'logUserConnectionGen2',
    runtimeServiceAccount: 'auth-session-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  getUserStatsGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'getUserStatsGen2',
    runtimeServiceAccount: 'auth-reader-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '167m',
    timeout: '300s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  syncSessionBeaconGen2: Object.freeze({
    create: true,
    triggerType: 'http-public',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'syncSessionBeaconGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all',
    environmentVariables: [
      'SITE_URL=https://secondevie-next-sandbox--secondevienextjsssr.europe-west4.hosted.app'
    ]
  }),
  syncSessionGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'syncSessionGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  initLiveSessionGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'initLiveSessionGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  trackAdminIPGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'trackAdminIPGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  updateUserSessionsGen2: Object.freeze({
    create: true,
    triggerType: 'http-callable',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'updateUserSessionsGen2',
    runtimeServiceAccount: 'analytics-runtime@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '167m',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onOrderStatsWrite: Object.freeze({
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onOrderStatsWrite',
    eventType: 'google.cloud.firestore.document.v1.written',
    eventFilters: 'type=google.cloud.firestore.document.v1.written,database=(default),namespace=(default)',
    documentPathPattern: 'orders/{orderId}',
    eventPathPattern: 'document=orders/{orderId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'order-stats-projector@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '1',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onCatalogSourceWrite: Object.freeze({
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onCatalogSourceWrite',
    eventType: 'google.cloud.firestore.document.v1.written',
    eventFilters: 'type=google.cloud.firestore.document.v1.written,database=(default),namespace=(default)',
    documentPathPattern: 'artifacts/{appId}/public/data/furniture/{productId}',
    eventPathPattern: 'document=artifacts/{appId}/public/data/furniture/{productId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '1',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  catalogReconciler: Object.freeze({
    triggerType: 'http-scheduler',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'catalogReconciler',
    functionUrl: 'https://europe-west1-secondevienextjsssr.cloudfunctions.net/catalogReconciler',
    schedulerJob: 'firebase-schedule-catalogReconciler-europe-west1',
    schedule: 'every 5 minutes',
    timeZone: 'UTC',
    schedulerServiceAccount: 'catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    schedulerAttemptDeadline: '540s',
    expectedSchedulerAttemptDeadline: '180s',
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '1',
    timeout: '540s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  catalogMediaGarbageCollector: Object.freeze({
    triggerType: 'http-scheduler',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'catalogMediaGarbageCollector',
    functionUrl: 'https://europe-west1-secondevienextjsssr.cloudfunctions.net/catalogMediaGarbageCollector',
    schedulerJob: 'firebase-schedule-catalogMediaGarbageCollector-europe-west1',
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    schedulerServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    schedulerAttemptDeadline: '540s',
    expectedSchedulerAttemptDeadline: '540s',
    schedulerUpdateRequired: false,
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '1',
    timeout: '540s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onArtifactUpdated: Object.freeze({
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onArtifactUpdated',
    eventType: 'google.cloud.firestore.document.v1.updated',
    eventFilters: 'type=google.cloud.firestore.document.v1.updated,database=(default),namespace=(default)',
    documentPathPattern: 'artifacts/{appId}/public/data/{collection}/{docId}',
    eventPathPattern: 'document=artifacts/{appId}/public/data/{collection}/{docId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '1',
    timeout: '300s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onArtifactDeleted: Object.freeze({
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onArtifactDeleted',
    eventType: 'google.cloud.firestore.document.v1.deleted',
    eventFilters: 'type=google.cloud.firestore.document.v1.deleted,database=(default),namespace=(default)',
    documentPathPattern: 'artifacts/{appId}/public/data/{collection}/{docId}',
    eventPathPattern: 'document=artifacts/{appId}/public/data/{collection}/{docId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'catalog-media-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    cpu: '1',
    timeout: '300s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  processProductPublicationImage: Object.freeze({
    triggerType: 'event',
    region: 'us-central1',
    runtime: 'nodejs22',
    entryPoint: 'processProductPublicationImage',
    eventType: 'google.cloud.storage.object.v1.finalized',
    eventFilters: 'type=google.cloud.storage.object.v1.finalized,bucket=secondevienextjsssr.firebasestorage.app',
    expectedEventFilters: Object.freeze({
      bucket: 'secondevienextjsssr.firebasestorage.app'
    }),
    triggerLocation: 'us-central1',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '1024Mi',
    cpu: '1',
    timeout: '540s',
    concurrency: '4',
    minInstances: '0',
    maxInstances: '4',
    ingressSettings: 'all'
  }),
  cleanupProductPublicationSessions: Object.freeze({
    triggerType: 'http-scheduler',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'cleanupProductPublicationSessions',
    functionUrl: 'https://europe-west1-secondevienextjsssr.cloudfunctions.net/cleanupProductPublicationSessions',
    schedulerJob: 'firebase-schedule-cleanupProductPublicationSessions-europe-west1',
    schedule: 'every 24 hours',
    timeZone: 'UTC',
    expectedSchedulerServiceAccount: '231220287936-compute@developer.gserviceaccount.com',
    schedulerServiceAccount: 'product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    schedulerAttemptDeadline: '540s',
    expectedSchedulerAttemptDeadline: '540s',
    runtimeServiceAccount: 'product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '1',
    timeout: '540s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  reconcileProductPublicationSessions: Object.freeze({
    triggerType: 'http-scheduler',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'reconcileProductPublicationSessions',
    functionUrl: 'https://europe-west1-secondevienextjsssr.cloudfunctions.net/reconcileProductPublicationSessions',
    schedulerJob: 'firebase-schedule-reconcileProductPublicationSessions-europe-west1',
    schedule: 'every 15 minutes',
    timeZone: 'UTC',
    expectedSchedulerServiceAccount: '231220287936-compute@developer.gserviceaccount.com',
    schedulerServiceAccount: 'product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    schedulerAttemptDeadline: '540s',
    expectedSchedulerAttemptDeadline: '540s',
    runtimeServiceAccount: 'product-publication-worker@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '1',
    timeout: '540s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onOrderCreated: Object.freeze({
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onOrderCreated',
    eventType: 'google.cloud.firestore.document.v1.created',
    eventFilters: 'type=google.cloud.firestore.document.v1.created,database=(default),namespace=(default)',
    documentPathPattern: 'orders/{orderId}',
    eventPathPattern: 'document=orders/{orderId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'legacy-order-email-worker@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    secrets: Object.freeze([
      'GMAIL_EMAIL=GMAIL_EMAIL:2',
      'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
      'RESEND_API_KEY=RESEND_API_KEY:1'
    ]),
    memory: '256Mi',
    cpu: '1',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  onOrderUpdated: Object.freeze({
    triggerType: 'event',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'onOrderUpdated',
    eventType: 'google.cloud.firestore.document.v1.updated',
    eventFilters: 'type=google.cloud.firestore.document.v1.updated,database=(default),namespace=(default)',
    documentPathPattern: 'orders/{orderId}',
    eventPathPattern: 'document=orders/{orderId}',
    triggerLocation: 'eur3',
    triggerServiceAccount: 'functions-eventarc-invoker@secondevienextjsssr.iam.gserviceaccount.com',
    runtimeServiceAccount: 'legacy-order-email-worker@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    secrets: Object.freeze([
      'GMAIL_EMAIL=GMAIL_EMAIL:2',
      'GMAIL_PASSWORD=GMAIL_PASSWORD:5',
      'RESEND_API_KEY=RESEND_API_KEY:1'
    ]),
    memory: '256Mi',
    cpu: '1',
    timeout: '60s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  dispatchCatalogBuild: Object.freeze({
    triggerType: 'http-task',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'dispatchCatalogBuild',
    functionUrl: 'https://europe-west1-secondevienextjsssr.cloudfunctions.net/dispatchCatalogBuild',
    queueName: 'dispatchCatalogBuild',
    queueLocation: 'europe-west1',
    queueMaxConcurrentDispatches: 1,
    queueMaxDispatchesPerSecond: 1,
    queueMaxBurstSize: 10,
    queueMaxAttempts: 10,
    queueMinBackoff: '5s',
    queueMaxBackoff: '300s',
    queueMaxDoublings: 5,
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    cpu: '1',
    timeout: '300s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  }),
  dispatchCatalogRevalidation: Object.freeze({
    triggerType: 'http-task',
    region: 'europe-west1',
    runtime: 'nodejs22',
    entryPoint: 'dispatchCatalogRevalidation',
    functionUrl: 'https://europe-west1-secondevienextjsssr.cloudfunctions.net/dispatchCatalogRevalidation',
    queueName: 'dispatchCatalogRevalidation',
    queueLocation: 'europe-west1',
    queueMaxConcurrentDispatches: 1,
    queueMaxDispatchesPerSecond: 1,
    queueMaxBurstSize: 10,
    queueMaxAttempts: 10,
    queueMinBackoff: '5s',
    queueMaxBackoff: '300s',
    queueMaxDoublings: 5,
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    buildServiceAccount: 'projects/secondevienextjsssr/serviceAccounts/functions-gen2-builder@secondevienextjsssr.iam.gserviceaccount.com',
    secrets: Object.freeze([
      'CATALOG_REVALIDATION_HMAC_SECRET=CATALOG_REVALIDATION_HMAC_SECRET:3'
    ]),
    memory: '256Mi',
    cpu: '1',
    timeout: '300s',
    concurrency: '1',
    minInstances: '0',
    maxInstances: '1',
    ingressSettings: 'all'
  })
});
const G2B_ROLLBACKS = Object.freeze({
  onOrderStatsWrite: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_ORDER_STATS_WRITE',
    sourceRevision: 'onorderstatswrite-00025-nac',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderStatsWrite/onorderstatswrite-00025-nac-function-source.zip',
    sourceGeneration: '1786883731057943',
    sourceSize: '345983',
    sourceSha256: 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  onCatalogSourceWrite: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_CATALOG_SOURCE_WRITE',
    sourceRevision: 'oncatalogsourcewrite-00010-gis',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onCatalogSourceWrite/oncatalogsourcewrite-00010-gis-function-source.zip',
    sourceGeneration: '1786885189999864',
    sourceSize: '372482',
    sourceSha256: '3c9a44606a3098c774be1d80be6f0af82e54c0bbe3b63534e4a28fb81e8674b4',
    concurrency: '80',
    maxInstances: '20',
    retry: true
  }),
  catalogReconciler: Object.freeze({
    approval: 'G2B_ROLLBACK_CATALOG_RECONCILER',
    sourceRevision: 'catalogreconciler-00009-luf',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/catalogReconciler/catalogreconciler-00009-luf-function-source.zip',
    sourceGeneration: '1786888563692570',
    sourceSize: '345983',
    sourceSha256: 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92',
    runtimeServiceAccount: 'catalog-enqueuer@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    timeout: '120s',
    concurrency: '80',
    maxInstances: '20',
    schedulerAttemptDeadline: '180s',
    retry: false
  }),
  catalogMediaGarbageCollector: Object.freeze({
    approval: 'G2B_ROLLBACK_CATALOG_MEDIA_GC',
    sourceRevision: 'catalogmediagarbagecollector-00009-geb',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/catalogMediaGarbageCollector/catalogmediagarbagecollector-00009-geb-function-source.zip',
    sourceGeneration: '1786890156516126',
    sourceSize: '345983',
    sourceSha256: 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92',
    concurrency: '80',
    maxInstances: '20',
    schedulerAttemptDeadline: '540s',
    retry: false
  }),
  onArtifactUpdated: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_ARTIFACT_UPDATED',
    sourceRevision: 'onartifactupdated-00023-riw',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onArtifactUpdated/onartifactupdated-00023-riw-function-source.zip',
    sourceGeneration: '1786890722830853',
    sourceSize: '345983',
    sourceSha256: 'fd96218906ece6f8f97be3ca31ca69388bac38ac510494eb0e0e368465971d92',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  onArtifactDeleted: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_ARTIFACT_DELETED_SAFE_INFRA_ONLY',
    sourceRevision: 'safe-baseline-d385c3c',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onArtifactDeleted/safe-baseline-d385c3c-function-source.zip',
    sourceGeneration: '1786891730471054',
    sourceSize: '373502',
    sourceSha256: '15f6b946217a9b90a967abc9214bff741e8b8b6cd5b5be5601080ed525afc1bf',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  processProductPublicationImage: Object.freeze({
    approval: 'G2B_ROLLBACK_PROCESS_PRODUCT_PUBLICATION_IMAGE',
    sourceRevision: 'processproductpublicationimage-00003-por',
    source: 'gs://gcf-v2-sources-231220287936-us-central1/g2b-rollback/processProductPublicationImage/processproductpublicationimage-00003-por-function-source.zip',
    sourceGeneration: '1786892844065661',
    sourceSize: '397275',
    sourceSha256: 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880',
    concurrency: '4',
    maxInstances: '20',
    retry: true
  }),
  cleanupProductPublicationSessions: Object.freeze({
    approval: 'G2B_ROLLBACK_CLEANUP_PRODUCT_PUBLICATION_SESSIONS',
    sourceRevision: 'cleanupproductpublicationsessions-00002-qih',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/cleanupProductPublicationSessions/cleanupproductpublicationsessions-00002-qih-function-source.zip',
    sourceGeneration: '1786897745771107',
    sourceSize: '397275',
    sourceSha256: 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880',
    runtimeServiceAccount: '231220287936-compute@developer.gserviceaccount.com',
    memory: '512Mi',
    timeout: '540s',
    concurrency: '80',
    maxInstances: '20',
    schedulerAttemptDeadline: '540s',
    retry: false
  }),
  reconcileProductPublicationSessions: Object.freeze({
    approval: 'G2B_ROLLBACK_RECONCILE_PRODUCT_PUBLICATION_SESSIONS',
    sourceRevision: 'reconcileproductpublicationsessions-00003-bit',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/reconcileProductPublicationSessions/reconcileproductpublicationsessions-00003-bit-function-source.zip',
    sourceGeneration: '1786898581695277',
    sourceSize: '397275',
    sourceSha256: 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880',
    runtimeServiceAccount: '231220287936-compute@developer.gserviceaccount.com',
    memory: '512Mi',
    timeout: '540s',
    concurrency: '80',
    maxInstances: '20',
    schedulerAttemptDeadline: '540s',
    retry: false
  }),
  onOrderCreated: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_ORDER_CREATED',
    sourceRevision: 'onordercreated-00028-dov',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderCreated/onordercreated-00028-dov-function-source.zip',
    sourceGeneration: '1786899705938033',
    sourceSize: '397275',
    sourceSha256: 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880',
    runtimeServiceAccount: '231220287936-compute@developer.gserviceaccount.com',
    memory: '256Mi',
    timeout: '60s',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  onOrderUpdated: Object.freeze({
    approval: 'G2B_ROLLBACK_ON_ORDER_UPDATED',
    sourceRevision: 'onorderupdated-00028-hoc',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/onOrderUpdated/onorderupdated-00028-hoc-function-source.zip',
    sourceGeneration: '1786900674512452',
    sourceSize: '397275',
    sourceSha256: 'bce7ff79ecfc2308ae744ee61cb889cd02fba781b466d16a383fa610b7d91880',
    runtimeServiceAccount: '231220287936-compute@developer.gserviceaccount.com',
    memory: '256Mi',
    timeout: '60s',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  dispatchCatalogBuild: Object.freeze({
    approval: 'G2B_ROLLBACK_DISPATCH_CATALOG_BUILD',
    sourceRevision: 'dispatchcatalogbuild-00012-coh',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/dispatchCatalogBuild/dispatchcatalogbuild-00012-coh-function-source.zip',
    sourceGeneration: '1786901457941111',
    sourceSize: '372482',
    sourceSha256: '3c9a44606a3098c774be1d80be6f0af82e54c0bbe3b63534e4a28fb81e8674b4',
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    timeout: '60s',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  }),
  dispatchCatalogRevalidation: Object.freeze({
    approval: 'G2B_ROLLBACK_DISPATCH_CATALOG_REVALIDATION',
    sourceRevision: 'dispatchcatalogrevalidation-00011-her',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g2b-rollback/dispatchCatalogRevalidation/dispatchcatalogrevalidation-00011-her-function-source.zip',
    sourceGeneration: '1786902244545236',
    sourceSize: '402090',
    sourceSha256: '309254de3352ec0c6395b3e125adf41072bf85be9d9facaaf56bedffbfc995bd',
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '256Mi',
    timeout: '60s',
    concurrency: '80',
    maxInstances: '20',
    retry: false
  })
});
export const G13_ROLLBACKS = Object.freeze({
  getCatalogPublicationStatusGen2: Object.freeze({
    approval: 'G13_ROLLBACK_GET_CATALOG_PUBLICATION_STATUS',
    expectedRevision: 'getcatalogpublicationstatusgen2-00002-yoq',
    sourceRevision: 'getcatalogpublicationstatusgen2-00001-qix',
    source: 'gs://gcf-v2-sources-231220287936-europe-west1/g13-rollback/dacf4c1eb1257fdd18c94a03889822dfa042642d0835b0dd68b3be8f9b8f46da/function-source.zip#1787449114510784',
    sourceGeneration: '1787449114510784',
    sourceSize: '381285',
    sourceSha256: 'dacf4c1eb1257fdd18c94a03889822dfa042642d0835b0dd68b3be8f9b8f46da',
    runtimeServiceAccount: 'catalog-builder@secondevienextjsssr.iam.gserviceaccount.com',
    memory: '512Mi',
    timeout: '60s',
    concurrency: '1',
    maxInstances: '1',
    retry: false,
    temporaryHoldRequired: true
  })
});
export const G13_REACTIVATION = Object.freeze({
  target: 'getCatalogPublicationStatusGen2',
  gate: 'FINALISATION:F5_REACTIVATION',
  source: 'gs://gcf-v2-sources-231220287936-europe-west1/g13/3ba9c8d5890e7fc678d12117099653f00f33ea48982f20b27097434f1df2dd81/function-source.zip',
  sourceGeneration: '1787442998284455',
  sourceSize: '370918',
  sourceSha256: '3ba9c8d5890e7fc678d12117099653f00f33ea48982f20b27097434f1df2dd81',
  temporaryHoldRequired: true
});
const GEN2_ROLLBACKS = Object.freeze({
  ...G2B_ROLLBACKS,
  ...G13_ROLLBACKS
});

function fail(message) {
  throw new Error(message);
}

export function buildFirebaseCliEnv(baseEnv = process.env) {
  const nodeOptions = String(baseEnv.NODE_OPTIONS || '')
    .split(/\s+/)
    .filter(Boolean);
  if (!nodeOptions.includes(FIREBASE_DNS_NODE_OPTION)) nodeOptions.push(FIREBASE_DNS_NODE_OPTION);
  return {
    ...baseEnv,
    FIREBASE_CLI_DISABLE_UPDATE_CHECK: 'true',
    NODE_OPTIONS: nodeOptions.join(' ')
  };
}

export function parseDeployArgs(argv) {
  const args = { execute: false };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--execute') {
      args.execute = true;
      continue;
    }
    if (!token.startsWith('--')) fail(`Argument inattendu: ${token}`);
    const key = token.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) fail(`Valeur manquante pour --${key}`);
    if (Object.hasOwn(args, key)) fail(`Argument duplique: --${key}`);
    args[key] = value;
    index += 1;
  }
  return args;
}

function required(args, key) {
  if (!args[key]) fail(`Argument obligatoire manquant: --${key}`);
  return args[key];
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    encoding: 'utf8',
    env: buildFirebaseCliEnv(process.env),
    stdio: options.stdio || ['ignore', 'pipe', 'pipe']
  });
  if (result.error) fail(`${command}: ${result.error.message}`);
  if (result.status !== 0) fail(`${command} ${args.join(' ')} a echoue: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout || '';
}

function sha256File(filePath) {
  return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function parseAllowlist(raw) {
  const names = raw.split(',').map((name) => name.trim()).filter(Boolean);
  if (!names.length) fail('Allowlist vide interdite');
  if (names.length > MAX_BATCH_SIZE) fail(`Allowlist limitee a ${MAX_BATCH_SIZE} cibles`);
  if (new Set(names).size !== names.length) fail('Allowlist dupliquee interdite');
  for (const name of names) if (!/^[A-Za-z][A-Za-z0-9_-]{0,62}$/.test(name)) fail(`Nom de cible invalide: ${name}`);
  return names;
}

function assertManifestDigest(rootDir, manifestPath, digestPath) {
  const digest = JSON.parse(fs.readFileSync(digestPath, 'utf8'));
  const relativeManifest = path.relative(rootDir, manifestPath).split(path.sep).join('/');
  const expected = digest.files?.[relativeManifest];
  if (!expected) fail(`Digest absent pour ${relativeManifest}`);
  const actual = sha256File(manifestPath);
  if (actual !== expected) fail(`Digest manifeste invalide pour ${relativeManifest}`);
}

function readFirebaseProject(rootDir) {
  const firebaserc = JSON.parse(fs.readFileSync(path.join(rootDir, '.firebaserc'), 'utf8'));
  return firebaserc.projects?.default || null;
}

function assertCodebase(rootDir, expectedCodebase) {
  const firebase = JSON.parse(fs.readFileSync(path.join(rootDir, 'firebase.json'), 'utf8'));
  const rows = Array.isArray(firebase.functions) ? firebase.functions : [firebase.functions].filter(Boolean);
  const match = rows.find((row) => row.codebase === expectedCodebase);
  if (!match || match.source !== 'functions') fail(`Codebase ${expectedCodebase} absent ou source inattendue`);
}

function assertCleanDeploymentInputs(rootDir) {
  const result = spawnSync('git', ['status', '--porcelain', '--untracked-files=all', '--', 'functions', 'firebase.json', 'scripts/deploy-functions-targeted.mjs', 'apphostingaudit/manifests'], {
    cwd: rootDir,
    encoding: 'utf8'
  });
  if (result.status !== 0) fail('Impossible de verifier le worktree Git');
  if (result.stdout.trim()) fail('Deploiement refuse: inputs Functions/manifeste non committes');
}

export function validateDeploymentRequest({
  args,
  manifest,
  rootDir,
  manifestPath,
  digestPath,
  currentCommit,
  activeFirebaseProject,
  baselineIsAncestor = manifest.metadata?.baselineCommit === currentCommit
}) {
  const project = required(args, 'project');
  const codebase = required(args, 'codebase');
  const commit = required(args, 'commit');
  const allowlist = parseAllowlist(required(args, 'allowlist'));
  const transport = args.transport || 'firebase';
  let sourceTemporaryHoldRequired = false;
  if (project !== EXPECTED_PROJECT) fail(`Projet interdit: ${project}`);
  if (codebase !== EXPECTED_CODEBASE) fail(`Codebase interdite: ${codebase}`);
  if (!['firebase', 'gcloud-gen1', 'gcloud-gen2', 'gcloud-gen2-create', 'gcloud-gen2-update', 'gcloud-gen2-rollback'].includes(transport)) fail(`Transport interdit: ${transport}`);
  if (activeFirebaseProject !== EXPECTED_PROJECT) fail(`Projet Firebase effectif different: ${activeFirebaseProject || 'absent'}`);
  if (readFirebaseProject(rootDir) !== EXPECTED_PROJECT) fail('Alias Firebase local different du sandbox attendu');
  if (manifest.metadata?.project !== EXPECTED_PROJECT || manifest.metadata?.codebase !== EXPECTED_CODEBASE) fail('Manifeste projet/codebase invalide');
  if (currentCommit !== commit) fail(`HEAD ${currentCommit} different du commit demande ${commit}`);
  if (!/^[0-9a-f]{40}$/.test(manifest.metadata?.baselineCommit || '')) fail('Baseline du manifeste invalide');
  if (!baselineIsAncestor) fail('Baseline du manifeste absente de l historique du commit demande');
  assertManifestDigest(rootDir, manifestPath, digestPath);
  assertCodebase(rootDir, codebase);
  const byName = new Map((manifest.functions || []).map((entry) => [entry.name, entry]));
  const entries = allowlist.map((name) => {
    const entry = byName.get(name);
    if (!entry) fail(`Cible absente du manifeste: ${name}`);
    if (entry.decision?.classification === 'HOLD_META_RECONCILIATION') fail(`Cible sous HOLD_META_RECONCILIATION: ${name}`);
    if (manifest.deploymentPolicy?.forbiddenTargets?.includes(name)) fail(`Cible interdite par le manifeste: ${name}`);
    return entry;
  });
  if (entries.some((entry) => entry.decision?.deploymentMaxBatchSize === 1) && entries.length !== 1) {
    fail('Finance, webhook ou scheduler: une seule cible autorisee');
  }
  const selectors = allowlist.map((name) => `functions:${codebase}:${name}`);
  if (selectors.some((selector) => selector === `functions:${codebase}` || selector === 'functions')) fail('Selecteur Functions global interdit');
  if (transport === 'gcloud-gen1') {
    if (allowlist.length !== 1 || !GCLOUD_GEN1_TARGETS[allowlist[0]]) {
      fail('Fallback gcloud Gen1 limite aux schedulers G1 approuves');
    }
  }
  if (transport === 'gcloud-gen2') {
    if (allowlist.length !== 1 || !GCLOUD_GEN2_TARGETS[allowlist[0]]) {
      fail('Transport gcloud Gen2 limite a la cible G2-B approuvee');
    }
    if (entries[0].cloud?.generation !== 2 || entries[0].decision?.classification !== 'KEEP_GEN2') {
      fail('Transport gcloud Gen2 exige une cible Gen2 existante KEEP_GEN2');
    }
  }
  if (transport === 'gcloud-gen2-create') {
    const target = allowlist.length === 1 ? GCLOUD_GEN2_TARGETS[allowlist[0]] : null;
    if (!target?.create) fail('Creation gcloud Gen2 limitee a la cible parallele approuvee');
    if (manifest.gates?.deploymentAllowed !== true) fail('Creation gcloud Gen2 bloquee par la gate du manifeste');
    if (entries[0].cloud?.present !== false || entries[0].decision?.classification !== 'MIGRATION_PARALLEL') {
      fail('Creation gcloud Gen2 exige une cible parallele absente du cloud');
    }
    if (target.g6 || target.g7 || target.g8 || target.g9 || target.g10 || target.g11) {
      const sourceUri = required(args, 'source-uri');
      const sourceSha256 = required(args, 'source-sha256');
      const sourceGeneration = required(args, 'source-generation');
      const sourceSize = String(manifest.deploymentPolicy?.archiveSize || '');
      const wave = target.g11 ? 'g11' : (target.g10 ? 'g10' : (target.g9 ? 'g9' : (target.g8 ? 'g8' : (target.g7 ? 'g7' : 'g6'))));
      if (!new RegExp(`^gs://gcf-v2-sources-231220287936-europe-west1/${wave}/[0-9a-f]{64}/function-source\\.zip$`).test(sourceUri)) {
        fail(`Archive source ${wave.toUpperCase()} immutable invalide`);
      }
      if (!/^[0-9a-f]{64}$/.test(sourceSha256)) fail(`SHA-256 source ${wave.toUpperCase()} invalide`);
      if (!/^[1-9][0-9]+$/.test(sourceGeneration)) fail(`Generation source ${wave.toUpperCase()} invalide`);
      if (!sourceUri.includes(`/${wave}/${sourceSha256}/`)) fail(`URI et SHA-256 source ${wave.toUpperCase()} divergents`);
      if (
        manifest.deploymentPolicy?.archiveUri !== sourceUri ||
        manifest.deploymentPolicy?.archiveSha256 !== sourceSha256 ||
        String(manifest.deploymentPolicy?.archiveGeneration || '') !== sourceGeneration ||
        !/^[1-9][0-9]*$/.test(sourceSize)
      ) fail(`Archive source ${wave.toUpperCase()} differente du manifeste approuve`);
    }
  }
  if (transport === 'gcloud-gen2-update') {
    const target = allowlist.length === 1 ? GCLOUD_GEN2_TARGETS[allowlist[0]] : null;
    if (!target?.create) fail('Mise a jour gcloud Gen2 limitee a une cible parallele approuvee');
    if (target.g10) {
      if (manifest.gates?.deploymentAllowed !== true) fail('Deploiement G10 bloque par la gate du manifeste');
      if (entries[0].cloud?.present !== true || entries[0].decision?.classification !== 'KEEP_GEN2') {
        fail('G10 exige un webhook Gen2 existant et conserve');
      }
      const sourceUri = required(args, 'source-uri');
      const sourceSha256 = required(args, 'source-sha256');
      const sourceGeneration = required(args, 'source-generation');
      if (!/^gs:\/\/gcf-v2-sources-231220287936-europe-west1\/g10\/[0-9a-f]{64}\/function-source\.zip$/.test(sourceUri)) {
        fail('Archive source G10 immutable invalide');
      }
      if (!/^[0-9a-f]{64}$/.test(sourceSha256) || !/^[1-9][0-9]+$/.test(sourceGeneration)) {
        fail('Preuve archive source G10 invalide');
      }
      if (
        !sourceUri.includes(`/g10/${sourceSha256}/`) ||
        manifest.deploymentPolicy?.archiveUri !== sourceUri ||
        manifest.deploymentPolicy?.archiveSha256 !== sourceSha256 ||
        String(manifest.deploymentPolicy?.archiveGeneration || '') !== sourceGeneration ||
        !/^[1-9][0-9]*$/.test(String(manifest.deploymentPolicy?.archiveSize || ''))
      ) fail('Archive source G10 differente du manifeste approuve');
    } else {
      if (manifest.gates?.remediationDeploymentAllowed !== true) fail('Remediation Gen2 bloquee par la gate du manifeste');
      if (entries[0].cloud?.present !== true || entries[0].decision?.classification !== 'MIGRATION_PARALLEL') {
        fail('Remediation Gen2 exige une cible parallele active dans le cloud');
      }
      if (manifest.metadata?.gate === G13_REACTIVATION.gate) {
        const sourceUri = required(args, 'source-uri');
        const sourceSha256 = required(args, 'source-sha256');
        const sourceGeneration = required(args, 'source-generation');
        if (allowlist[0] !== G13_REACTIVATION.target) fail('Reactivation G13 limitee a la cible approuvee');
        if (
          sourceUri !== G13_REACTIVATION.source ||
          sourceSha256 !== G13_REACTIVATION.sourceSha256 ||
          sourceGeneration !== G13_REACTIVATION.sourceGeneration ||
          manifest.deploymentPolicy?.archiveUri !== sourceUri ||
          manifest.deploymentPolicy?.archiveSha256 !== sourceSha256 ||
          String(manifest.deploymentPolicy?.archiveGeneration || '') !== sourceGeneration ||
          String(manifest.deploymentPolicy?.archiveSize || '') !== G13_REACTIVATION.sourceSize
        ) fail('Archive source de reactivation G13 differente du registre approuve');
        sourceTemporaryHoldRequired = G13_REACTIVATION.temporaryHoldRequired;
      }
    }
  }
  if (transport === 'gcloud-gen2-rollback') {
    const rollback = allowlist.length === 1 ? GEN2_ROLLBACKS[allowlist[0]] : null;
    if (!rollback) fail('Rollback gcloud Gen2 limite aux cibles approuvees');
    if (args.approval !== rollback.approval) fail('Approbation rollback Gen2 invalide');
    const revisionPrefix = allowlist[0].toLowerCase();
    if (rollback.expectedRevision && args['expected-revision'] !== rollback.expectedRevision) {
      fail('Revision Gen2 courante differente de la revision rollback approuvee');
    }
    if (!new RegExp(`^${revisionPrefix}-[0-9]{5}-[a-z0-9]{3}$`).test(args['expected-revision'] || '')) {
      fail('Revision Gen2 courante obligatoire pour rollback');
    }
    if (args['rollback-source-sha256'] !== rollback.sourceSha256) {
      fail('Digest source rollback Gen2 invalide');
    }
  }
  return {
    project,
    codebase,
    commit,
    allowlist,
    selectors,
    entries,
    transport,
    sourceUri: args['source-uri'] || null,
    sourceSha256: args['source-sha256'] || null,
    sourceGeneration: args['source-generation'] || null,
    sourceSize: manifest.deploymentPolicy?.archiveSize || null,
    sourceTemporaryHoldRequired
  };
}

export function buildFirebaseDeployArgs(validation) {
  return [
    'deploy',
    '--project', validation.project,
    '--only', validation.selectors.join(',')
  ];
}

export function buildGcloudGen1DeployArgs(validation) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN1_TARGETS[name];
  if (validation.transport !== 'gcloud-gen1' || validation.allowlist.length !== 1 || !target) {
    fail('Fallback gcloud Gen1 non autorise');
  }
  const deployArgs = [
    'functions', 'deploy', name,
    `--project=${validation.project}`,
    `--region=${target.region}`,
    '--no-gen2',
    `--runtime=${target.runtime}`,
    '--source=functions',
    `--entry-point=${target.entryPoint}`,
    `--trigger-topic=${target.triggerTopic}`,
    `--service-account=${target.serviceAccount}`,
    `--build-service-account=${target.buildServiceAccount}`,
    `--memory=${target.memory}`,
    `--timeout=${target.timeout}`,
    `--max-instances=${target.maxInstances}`,
    '--no-retry',
    `--ingress-settings=${target.ingressSettings}`,
    '--quiet'
  ];
  if (target.secrets.length) deployArgs.push(`--set-secrets=${target.secrets.join(',')}`);
  return deployArgs;
}

export function buildGcloudGen2DeployArgs(validation, options = {}) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN2_TARGETS[name];
  if (!['gcloud-gen2', 'gcloud-gen2-create', 'gcloud-gen2-update'].includes(validation.transport) || validation.allowlist.length !== 1 || !target) {
    fail('Transport gcloud Gen2 non autorise');
  }
  const httpTrigger = ['http-callable', 'http-public', 'http-scheduler', 'http-task'].includes(target.triggerType);
  const triggerArgs = httpTrigger
    ? ['--trigger-http']
    : [
        `--trigger-event-filters=${target.eventFilters}`,
        ...(target.eventPathPattern ? [`--trigger-event-filters-path-pattern=${target.eventPathPattern}`] : []),
        `--trigger-location=${target.triggerLocation}`,
        `--trigger-service-account=${target.triggerServiceAccount}`
      ];
  const retryArgs = httpTrigger ? [] : ['--retry'];
  const args = [
    'functions', 'deploy', name,
    `--project=${validation.project}`,
    `--region=${target.region}`,
    '--gen2',
    `--runtime=${target.runtime}`,
    `--source=${options.sourceDir || validation.sourceUri || 'functions'}`,
    `--entry-point=${target.entryPoint}`,
    ...triggerArgs,
    `--run-service-account=${target.runtimeServiceAccount}`,
    `--build-service-account=${target.buildServiceAccount}`,
    `--memory=${target.memory}`,
    `--cpu=${target.cpu}`,
    `--timeout=${target.timeout}`,
    `--concurrency=${target.concurrency}`,
    `--min-instances=${target.minInstances}`,
    `--max-instances=${target.maxInstances}`,
    ...retryArgs,
    `--ingress-settings=${target.ingressSettings}`,
    ['http-callable', 'http-public'].includes(target.triggerType) ? '--allow-unauthenticated' : '--no-allow-unauthenticated',
    `--update-labels=deployment-tool=codex-targeted,migration-source-commit=${validation.commit}${target.triggerType === 'http-task' ? ',deployment-taskqueue=true' : ''}`,
    '--quiet'
  ];
  if (target.secrets?.length) args.push(`--set-secrets=${target.secrets.join(',')}`);
  const environmentVariables = [
    ...(target.environmentVariables || []),
    ...(target.environmentVariableNames || []).map((name) => `${name}=${process.env[name] || ''}`)
  ];
  if (environmentVariables.length) args.push(`--set-env-vars=${environmentVariables.join(',')}`);
  return args;
}

export function buildGcloudSchedulerUpdateArgs(validation, options = {}) {
  const target = GCLOUD_GEN2_TARGETS[validation.allowlist[0]];
  const expectedTransport = options.rollback ? 'gcloud-gen2-rollback' : 'gcloud-gen2';
  if (validation.transport !== expectedTransport || target?.triggerType !== 'http-scheduler') {
    fail('Mise a jour Scheduler Gen2 non autorisee');
  }
  const rollback = options.rollback ? GEN2_ROLLBACKS[validation.allowlist[0]] : null;
  return [
    'scheduler', 'jobs', 'update', 'http', target.schedulerJob,
    `--project=${validation.project}`,
    `--location=${target.region}`,
    `--schedule=${target.schedule}`,
    `--time-zone=${target.timeZone}`,
    '--http-method=POST',
    `--uri=${target.functionUrl}`,
    `--oidc-service-account-email=${target.schedulerServiceAccount}`,
    `--oidc-token-audience=${target.functionUrl}`,
    `--attempt-deadline=${rollback?.schedulerAttemptDeadline || target.schedulerAttemptDeadline}`,
    '--max-retry-attempts=0',
    '--quiet'
  ];
}

export function buildGcloudGen2RollbackArgs(validation, options = {}) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN2_TARGETS[name];
  const rollback = GEN2_ROLLBACKS[name];
  if (validation.transport !== 'gcloud-gen2-rollback' || !target || !rollback) {
    fail('Rollback gcloud Gen2 non autorise');
  }
  const httpTrigger = ['http-callable', 'http-public', 'http-scheduler', 'http-task'].includes(target.triggerType);
  const triggerArgs = httpTrigger
    ? ['--trigger-http']
    : [
        `--trigger-event-filters=${target.eventFilters}`,
        ...(target.eventPathPattern ? [`--trigger-event-filters-path-pattern=${target.eventPathPattern}`] : []),
        `--trigger-location=${target.triggerLocation}`,
        `--trigger-service-account=${target.triggerServiceAccount}`
      ];
  const args = [
    'functions', 'deploy', name,
    `--project=${validation.project}`,
    `--region=${target.region}`,
    '--gen2',
    `--runtime=${target.runtime}`,
    `--source=${options.sourceDir || rollback.source}`,
    `--entry-point=${target.entryPoint}`,
    ...triggerArgs,
    `--run-service-account=${rollback.runtimeServiceAccount || target.runtimeServiceAccount}`,
    `--build-service-account=${target.buildServiceAccount}`,
    `--memory=${rollback.memory || target.memory}`, `--cpu=${target.cpu}`, `--timeout=${rollback.timeout || target.timeout}`,
    `--concurrency=${rollback.concurrency}`, '--min-instances=0',
    `--max-instances=${rollback.maxInstances}`,
    `--ingress-settings=${target.ingressSettings}`,
    ['http-callable', 'http-public'].includes(target.triggerType) ? '--allow-unauthenticated' : '--no-allow-unauthenticated',
    `--update-labels=deployment-tool=codex-targeted,migration-rollback-source=${rollback.sourceRevision}${target.triggerType === 'http-task' ? ',deployment-taskqueue=true' : ''}`,
    '--quiet'
  ];
  if (!httpTrigger) {
    args.splice(args.indexOf(`--ingress-settings=${target.ingressSettings}`), 0, rollback.retry ? '--retry' : '--no-retry');
  }
  if (target.secrets?.length) args.push(`--set-secrets=${target.secrets.join(',')}`);
  return args;
}

export function assertGen2RollbackObject({ metadata, rollback, actualSha256 }) {
  if (
    String(metadata?.generation || '') !== rollback.sourceGeneration ||
    String(metadata?.size || '') !== rollback.sourceSize ||
    (rollback.temporaryHoldRequired !== false && metadata?.temporary_hold !== true)
  ) fail('Objet source rollback Gen2 inattendu');
  if (actualSha256 !== rollback.sourceSha256) {
    fail('SHA-256 archive source rollback Gen2 different du registre');
  }
}

function extractVerifiedGen2Source(archiveBytes, functionName) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), `secondevie-${functionName}-source-`));
  const archivePath = path.join(tempRoot, 'function-source.zip');
  const sourceDir = path.join(tempRoot, 'source');
  fs.mkdirSync(sourceDir);
  fs.writeFileSync(archivePath, archiveBytes, { mode: 0o600 });
  const extracted = spawnSync('unzip', ['-q', archivePath, '-d', sourceDir], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
  if (extracted.error || extracted.status !== 0 || !fs.existsSync(path.join(sourceDir, 'package.json'))) {
    fs.rmSync(tempRoot, { recursive: true, force: true });
    fail(`Extraction archive source rollback Gen2 impossible: ${String(extracted.stderr || extracted.error?.message || '').trim()}`);
  }
  return { sourceDir, tempRoot };
}

function assertGcloudGen2Preconditions(before, validation) {
  const name = validation.allowlist[0];
  const target = GCLOUD_GEN2_TARGETS[name];
  const manifestEntry = validation.entries[0];
  const expectedName = `projects/${validation.project}/locations/${target.region}/functions/${name}`;
  if (
    before.name !== expectedName || before.state !== 'ACTIVE' ||
    before.buildConfig?.runtime !== target.runtime ||
    before.buildConfig?.entryPoint !== target.entryPoint ||
    before.buildConfig?.serviceAccount !== manifestEntry.identities?.buildServiceAccount ||
    before.serviceConfig?.revision !== manifestEntry.cloud?.revision ||
    before.serviceConfig?.serviceAccountEmail !== manifestEntry.identities?.runtimeServiceAccount
  ) fail('Etat cloud Gen2 inattendu avant deploiement');
  if (['http-scheduler', 'http-task'].includes(target.triggerType)) {
    if (before.eventTrigger || before.url !== target.functionUrl) fail('Transport HTTP Scheduler Gen2 inattendu avant deploiement');
    return;
  }
  if (['http-callable', 'http-public'].includes(target.triggerType)) {
    if (before.eventTrigger || !before.url) fail('Transport HTTP Gen2 inattendu avant deploiement');
    return;
  }
  const filters = new Map((before.eventTrigger?.eventFilters || []).map((entry) =>
    [entry.attribute, `${entry.operator || 'exact'}:${entry.value}`]));
  const expectedFilters = target.expectedEventFilters || {
    database: '(default)',
    namespace: '(default)',
    document: target.documentPathPattern
  };
  const filtersMatch = Object.entries(expectedFilters).every(([attribute, value]) =>
    filters.get(attribute) === `${attribute === 'document' ? 'match-path-pattern' : 'exact'}:${value}`);
  if (
    before.eventTrigger?.eventType !== target.eventType ||
    before.eventTrigger?.triggerRegion !== target.triggerLocation ||
    before.eventTrigger?.serviceAccountEmail !== manifestEntry.trigger?.transportServiceAccount ||
    !filtersMatch
  ) fail('Trigger cloud Gen2 inattendu avant deploiement');
}

export function assertTaskQueuePreconditions(queue, target, tasks) {
  if (
    queue.name?.split('/').at(-1) !== target.queueName || queue.state !== 'RUNNING' ||
    Number(queue.rateLimits?.maxConcurrentDispatches) !== target.queueMaxConcurrentDispatches ||
    Number(queue.rateLimits?.maxDispatchesPerSecond) !== target.queueMaxDispatchesPerSecond ||
    Number(queue.rateLimits?.maxBurstSize) !== target.queueMaxBurstSize ||
    Number(queue.retryConfig?.maxAttempts) !== target.queueMaxAttempts ||
    queue.retryConfig?.minBackoff !== target.queueMinBackoff ||
    queue.retryConfig?.maxBackoff !== target.queueMaxBackoff ||
    Number(queue.retryConfig?.maxDoublings) !== target.queueMaxDoublings
  ) fail('Configuration Cloud Tasks inattendue avant deploiement');
  if (!Array.isArray(tasks) || tasks.length !== 0) fail('Cloud Tasks en vol avant deploiement');
}

function assertSchedulerPreconditions(
  job,
  target,
  expectedAttemptDeadline,
  expectedServiceAccount = target.schedulerServiceAccount,
  expectedAudience = target.expectedSchedulerAudience || target.functionUrl
) {
  if (
    job.name?.split('/').at(-1) !== target.schedulerJob || job.state !== 'ENABLED' ||
    job.schedule !== target.schedule || job.timeZone !== target.timeZone ||
    job.httpTarget?.httpMethod !== 'POST' || job.httpTarget?.uri !== target.functionUrl ||
    job.httpTarget?.oidcToken?.audience !== expectedAudience ||
    job.httpTarget?.oidcToken?.serviceAccountEmail !== expectedServiceAccount ||
    job.attemptDeadline !== expectedAttemptDeadline
  ) fail('Etat Cloud Scheduler inattendu avant deploiement');
}

export function main(argv = process.argv.slice(2), dependencies = {}) {
  const rootDir = dependencies.rootDir || resolveRoot();
  const args = parseDeployArgs(argv);
  const manifestPath = path.resolve(rootDir, required(args, 'manifest'));
  const digestPath = path.resolve(rootDir, required(args, 'digest'));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const currentCommit = dependencies.currentCommit || run('git', ['rev-parse', 'HEAD'], { cwd: rootDir }).trim();
  const activeFirebaseProject = dependencies.activeFirebaseProject || readFirebaseProject(rootDir);
  const baselineCheck = spawnSync('git', [
    'merge-base', '--is-ancestor', manifest.metadata?.baselineCommit || '', currentCommit
  ], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  const validation = validateDeploymentRequest({
    args,
    manifest,
    rootDir,
    manifestPath,
    digestPath,
    currentCommit,
    activeFirebaseProject,
    baselineIsAncestor: baselineCheck.status === 0
  });
  if (!args.execute) fail('Validation reussie mais deploiement refuse sans --execute explicite');
  assertCleanDeploymentInputs(rootDir);
  if (validation.transport === 'gcloud-gen1') {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN1_TARGETS[name];
    const before = JSON.parse(run('gcloud', [
      'functions', 'describe', name,
      `--region=${target.region}`,
      `--project=${validation.project}`,
      '--format=json'
    ], { cwd: rootDir }));
    const expectedName = `projects/${validation.project}/locations/${target.region}/functions/${name}`;
    const expectedTopic = `projects/${validation.project}/topics/${target.triggerTopic}`;
    if (
      before.name !== expectedName || before.status !== 'ACTIVE' ||
      before.entryPoint !== target.entryPoint || before.versionId !== target.expectedVersion ||
      before.serviceAccountEmail !== target.expectedServiceAccount
    ) {
      fail('Etat cloud Gen1 inattendu avant fallback gcloud');
    }
    if (before.eventTrigger?.resource !== expectedTopic || before.eventTrigger?.eventType !== 'google.pubsub.topic.publish') {
      fail('Trigger cloud Gen1 inattendu avant fallback gcloud');
    }
    process.stdout.write(`Projet: ${validation.project}\nCibles: ${validation.selectors.join(',')}\nCommit: ${validation.commit}\nTransport: gcloud-gen1\n`);
    const result = spawnSync('gcloud', buildGcloudGen1DeployArgs(validation), {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) process.exitCode = result.status || 1;
    return;
  }
  if (['gcloud-gen2', 'gcloud-gen2-update'].includes(validation.transport)) {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN2_TARGETS[name];
    const before = JSON.parse(run('gcloud', [
      'functions', 'describe', name,
      '--gen2',
      `--region=${target.region}`,
      `--project=${validation.project}`,
      '--format=json'
    ], { cwd: rootDir }));
    assertGcloudGen2Preconditions(before, validation);
    let verifiedSourceBytes = null;
    if (validation.sourceUri) {
      const sourceObject = JSON.parse(run('gcloud', [
        'storage', 'objects', 'describe', validation.sourceUri,
        `--project=${validation.project}`, '--format=json'
      ], { cwd: rootDir }));
      if (
        String(sourceObject.generation || '') !== validation.sourceGeneration ||
        Number(sourceObject.size) !== Number(validation.sourceSize) ||
        (validation.sourceTemporaryHoldRequired && sourceObject.temporary_hold !== true)
      ) fail('Objet source Gen2 different du manifeste approuve');
      const sourceBytes = spawnSync('gcloud', [
        'storage', 'cat', validation.sourceUri,
        `--project=${validation.project}`
      ], { cwd: rootDir, env: process.env, encoding: null, maxBuffer: 25 * 1024 * 1024 });
      if (sourceBytes.error || sourceBytes.status !== 0) fail('Lecture archive source Gen2 impossible');
      const actualSourceSha256 = crypto.createHash('sha256').update(sourceBytes.stdout || Buffer.alloc(0)).digest('hex');
      if (actualSourceSha256 !== validation.sourceSha256) fail('SHA-256 archive source Gen2 different du manifeste approuve');
      verifiedSourceBytes = sourceBytes.stdout || Buffer.alloc(0);
    }
    if (target.triggerType === 'http-task') {
      const queueBefore = JSON.parse(run('gcloud', [
        'tasks', 'queues', 'describe', target.queueName,
        `--location=${target.queueLocation}`, `--project=${validation.project}`, '--format=json'
      ], { cwd: rootDir }));
      const tasksBefore = JSON.parse(run('gcloud', [
        'tasks', 'list', `--queue=${target.queueName}`,
        `--location=${target.queueLocation}`, `--project=${validation.project}`, '--format=json'
      ], { cwd: rootDir }));
      assertTaskQueuePreconditions(queueBefore, target, tasksBefore);
    }
    if (target.triggerType === 'http-scheduler') {
      const schedulerBefore = JSON.parse(run('gcloud', [
        'scheduler', 'jobs', 'describe', target.schedulerJob,
        `--location=${target.region}`, `--project=${validation.project}`, '--format=json'
      ], { cwd: rootDir }));
      assertSchedulerPreconditions(
        schedulerBefore,
        target,
        target.expectedSchedulerAttemptDeadline || target.schedulerAttemptDeadline,
        target.expectedSchedulerServiceAccount || target.schedulerServiceAccount,
        target.expectedSchedulerAudience || target.functionUrl
      );
    }
    process.stdout.write(`Projet: ${validation.project}\nCibles: ${validation.selectors.join(',')}\nCommit: ${validation.commit}\nTransport: ${validation.transport}\n`);
    const extractedSource = verifiedSourceBytes ? extractVerifiedGen2Source(verifiedSourceBytes, name) : null;
    let result;
    try {
      result = spawnSync('gcloud', buildGcloudGen2DeployArgs(validation, {
        sourceDir: extractedSource?.sourceDir
      }), {
        cwd: rootDir,
        env: process.env,
        stdio: 'inherit'
      });
    } finally {
      if (extractedSource) fs.rmSync(extractedSource.tempRoot, { recursive: true, force: true });
    }
    if (result.error) fail(result.error.message);
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
    if (target.triggerType === 'http-scheduler' && target.schedulerUpdateRequired !== false) {
      const schedulerResult = spawnSync('gcloud', buildGcloudSchedulerUpdateArgs(validation), {
        cwd: rootDir,
        env: process.env,
        stdio: 'inherit'
      });
      if (schedulerResult.error) fail(schedulerResult.error.message);
      if (schedulerResult.status !== 0) process.exitCode = schedulerResult.status || 1;
    }
    return;
  }
  if (validation.transport === 'gcloud-gen2-create') {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN2_TARGETS[name];
    const before = spawnSync('gcloud', [
      'functions', 'describe', name, '--gen2',
      `--region=${target.region}`, `--project=${validation.project}`, '--format=json'
    ], { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    if (before.status === 0 || !/NOT_FOUND|not found/i.test(`${before.stderr || ''}${before.stdout || ''}`)) {
      fail('Creation Gen2 refusee: la cible existe deja ou son absence ne peut pas etre prouvee');
    }
    const sourceObject = JSON.parse(run('gcloud', [
      'storage', 'objects', 'describe', validation.sourceUri,
      `--project=${validation.project}`, '--format=json'
    ], { cwd: rootDir }));
    if (
      String(sourceObject.generation || '') !== validation.sourceGeneration ||
      Number(sourceObject.size) !== Number(validation.sourceSize)
    ) fail('Objet source Gen2 different du manifeste approuve');
    const sourceBytes = spawnSync('gcloud', [
      'storage', 'cat', validation.sourceUri,
      `--project=${validation.project}`
    ], { cwd: rootDir, env: process.env, encoding: null, maxBuffer: 25 * 1024 * 1024 });
    if (sourceBytes.error || sourceBytes.status !== 0) fail('Lecture archive source Gen2 impossible');
    const actualSourceSha256 = crypto.createHash('sha256').update(sourceBytes.stdout || Buffer.alloc(0)).digest('hex');
    if (actualSourceSha256 !== validation.sourceSha256) fail('SHA-256 archive source Gen2 different du manifeste approuve');
    process.stdout.write(`Projet: ${validation.project}\nCible: functions:main:${name}\nCommit: ${validation.commit}\nTransport: gcloud-gen2-create\n`);
    const result = spawnSync('gcloud', buildGcloudGen2DeployArgs(validation), {
      cwd: rootDir,
      env: process.env,
      stdio: 'inherit'
    });
    if (result.error) fail(result.error.message);
    if (result.status !== 0) process.exitCode = result.status || 1;
    return;
  }
  if (validation.transport === 'gcloud-gen2-rollback') {
    const name = validation.allowlist[0];
    const target = GCLOUD_GEN2_TARGETS[name];
    const rollback = GEN2_ROLLBACKS[name];
    const before = JSON.parse(run('gcloud', [
      'functions', 'describe', name, '--gen2',
      `--region=${target.region}`, `--project=${validation.project}`, '--format=json'
    ], { cwd: rootDir }));
    if (
      before.state !== 'ACTIVE' || before.serviceConfig?.revision !== args['expected-revision'] ||
      before.serviceConfig?.serviceAccountEmail !== target.runtimeServiceAccount ||
      before.buildConfig?.serviceAccount !== target.buildServiceAccount
    ) fail('Etat cloud Gen2 inattendu avant rollback');
    const httpTrigger = ['http-callable', 'http-public', 'http-scheduler', 'http-task'].includes(target.triggerType);
    if (target.triggerType === 'http-scheduler') {
      const schedulerBefore = JSON.parse(run('gcloud', [
        'scheduler', 'jobs', 'describe', target.schedulerJob,
        `--location=${target.region}`, `--project=${validation.project}`, '--format=json'
      ], { cwd: rootDir }));
      assertSchedulerPreconditions(schedulerBefore, target, target.schedulerAttemptDeadline);
    } else if (!httpTrigger && (
      before.eventTrigger?.serviceAccountEmail !== target.triggerServiceAccount ||
      before.eventTrigger?.retryPolicy !== 'RETRY_POLICY_RETRY'
    )) fail('Trigger cloud Gen2 inattendu avant rollback');
    const rollbackObject = JSON.parse(run('gcloud', [
      'storage', 'objects', 'describe', rollback.source,
      `--project=${validation.project}`, '--format=json'
    ], { cwd: rootDir }));
    const rollbackSourceBytes = spawnSync('gcloud', [
      'storage', 'cat', rollback.source, `--project=${validation.project}`
    ], { cwd: rootDir, env: process.env, encoding: null, maxBuffer: 25 * 1024 * 1024 });
    if (rollbackSourceBytes.error || rollbackSourceBytes.status !== 0) fail('Lecture archive source rollback Gen2 impossible');
    const rollbackSourceSha256 = crypto.createHash('sha256').update(rollbackSourceBytes.stdout || Buffer.alloc(0)).digest('hex');
    assertGen2RollbackObject({
      metadata: rollbackObject,
      rollback,
      actualSha256: rollbackSourceSha256
    });
    process.stdout.write(`Projet: ${validation.project}\nCible: functions:main:${name}\nCommit wrapper: ${validation.commit}\nRevision remplacee: ${args['expected-revision']}\nTransport: gcloud-gen2-rollback\n`);
    const extractedSource = extractVerifiedGen2Source(rollbackSourceBytes.stdout || Buffer.alloc(0), name);
    let result;
    try {
      result = spawnSync('gcloud', buildGcloudGen2RollbackArgs(validation, {
        sourceDir: extractedSource.sourceDir
      }), {
        cwd: rootDir,
        env: process.env,
        stdio: 'inherit'
      });
    } finally {
      fs.rmSync(extractedSource.tempRoot, { recursive: true, force: true });
    }
    if (result.error) fail(result.error.message);
    if (result.status !== 0) {
      process.exitCode = result.status || 1;
      return;
    }
    if (target.triggerType === 'http-scheduler' && target.schedulerUpdateRequired !== false) {
      const schedulerResult = spawnSync('gcloud', buildGcloudSchedulerUpdateArgs(validation, { rollback: true }), {
        cwd: rootDir,
        env: process.env,
        stdio: 'inherit'
      });
      if (schedulerResult.error) fail(schedulerResult.error.message);
      if (schedulerResult.status !== 0) process.exitCode = schedulerResult.status || 1;
    }
    return;
  }
  const firebaseCli = path.join(rootDir, 'node_modules/.bin/firebase');
  if (!fs.existsSync(firebaseCli)) fail('Firebase CLI locale epinglee introuvable');
  const effective = JSON.parse(run(firebaseCli, ['use', '--json'], { cwd: rootDir }));
  if (effective.status !== 'success' || effective.result !== EXPECTED_PROJECT) fail(`Projet Firebase effectif different: ${effective.result || 'inconnu'}`);
  const deployArgs = buildFirebaseDeployArgs(validation);
  process.stdout.write(`Projet: ${validation.project}\nCibles: ${validation.selectors.join(',')}\nCommit: ${validation.commit}\n`);
  const result = spawnSync(firebaseCli, deployArgs, {
    cwd: rootDir,
    env: buildFirebaseCliEnv(process.env),
    stdio: 'inherit'
  });
  if (result.error) fail(result.error.message);
  if (result.status !== 0) process.exitCode = result.status || 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`deploy-functions-targeted: ${error.message}\n`);
    process.exitCode = 1;
  }
}
