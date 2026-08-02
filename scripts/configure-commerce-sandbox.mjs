import process from 'node:process';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const POLICY_VERSION = 'sandbox_transactional_policy_20260802';
const CONFIRM_ENABLE = `ENABLE_SANDBOX_COMMERCE_${PROJECT_ID}`;
const CONFIRM_DISABLE = `DISABLE_SANDBOX_COMMERCE_${PROJECT_ID}`;

function parseArgs(argv) {
  return new Map(argv.map((argument) => {
    if (!argument.startsWith('--')) throw new Error(`Argument inconnu: ${argument}`);
    const [key, ...parts] = argument.slice(2).split('=');
    return [key, parts.length ? parts.join('=') : 'true'];
  }));
}

function invariant(condition, code) {
  if (!condition) throw new Error(code);
}

function healthCountersAreZero(counters = {}) {
  return [
    'dueInbox',
    'expiredInboxLeases',
    'deadLetterOutbox',
    'deliveryUnknown',
    'expiredHolds',
    'orphanPayments',
    'refundStockDivergences',
    'connectDrift',
    'projectionDivergences'
  ].every((key) => counters[key] === 0);
}

function buildTransactionalPolicy(source) {
  return {
    schemaVersion: 2,
    version: POLICY_VERSION,
    currency: 'EUR',
    offlinePaymentEnabled: false,
    stripeConnectedAccountId: source.stripeConnectedAccountId,
    holdDurationSeconds: source.holdDurationSeconds,
    deliveryModes: [
      {
        id: 'delivery-pickup',
        active: true,
        shippingCents: 0,
        countries: ['FR']
      },
      {
        id: 'delivery-local',
        active: true,
        shippingCents: 4900,
        countries: ['FR'],
        postalPrefixes: ['13']
      },
      {
        id: 'delivery-carrier',
        active: true,
        shippingCents: 9000,
        countries: ['FR']
      }
    ],
    active: true
  };
}

function policyMatches(actual, expected) {
  return [
    'schemaVersion',
    'version',
    'currency',
    'offlinePaymentEnabled',
    'stripeConnectedAccountId',
    'holdDurationSeconds',
    'active'
  ].every((field) => actual?.[field] === expected[field]) &&
    JSON.stringify(actual?.deliveryModes) === JSON.stringify(expected.deliveryModes);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || ENVIRONMENT;
  const action = args.get('action') || 'status';

  invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'SANDBOX_COMMERCE_TARGET_INVALID');
  invariant(['status', 'enable', 'disable'].includes(action), 'SANDBOX_COMMERCE_ACTION_INVALID');

  const app = getApps().find((entry) => entry.name === 'configure-commerce-sandbox') || initializeApp({
    credential: process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
      : applicationDefault(),
    projectId
  }, 'configure-commerce-sandbox');
  const db = getFirestore(app);
  const controlRef = db.doc('sys_commerce_control/current');
  const operationsRef = db.doc('sys_commerce_operations/current');
  const policyRef = db.doc(`commerce_policy_versions/${POLICY_VERSION}`);
  const [controlSnap, operationsSnap] = await Promise.all([
    controlRef.get(),
    operationsRef.get()
  ]);
  invariant(controlSnap.exists && operationsSnap.exists, 'SANDBOX_COMMERCE_STATE_MISSING');
  const control = controlSnap.data();
  const operations = operationsSnap.data();

  if (action === 'status') {
    console.log(JSON.stringify({
      ok: true,
      projectId,
      environment,
      checkoutMode: control.newCheckoutMode,
      adminMutationMode: control.adminMutationMode,
      offlinePaymentMode: control.offlinePaymentMode,
      activePolicyVersion: control.activePolicyVersion,
      controlRevision: control.controlRevision,
      operationsStatus: operations.status,
      countersHealthy: healthCountersAreZero(operations.counters)
    }));
    return;
  }

  if (action === 'disable') {
    invariant(args.get('confirm') === CONFIRM_DISABLE, 'SANDBOX_COMMERCE_CONFIRMATION_INVALID');
    await db.runTransaction(async (transaction) => {
      const freshControl = await transaction.get(controlRef);
      invariant(freshControl.exists, 'SANDBOX_COMMERCE_CONTROL_MISSING');
      const value = freshControl.data();
      transaction.update(controlRef, {
        newCheckoutMode: 'v2_fixture',
        adminMutationMode: 'read_only',
        offlinePaymentMode: 'off',
        controlRevision: value.controlRevision + 1,
        updatedAt: Timestamp.now(),
        updatedBy: 'configure-commerce-sandbox-disable'
      });
    });
    console.log(JSON.stringify({ ok: true, status: 'DISABLED', projectId, environment }));
    return;
  }

  invariant(args.get('confirm') === CONFIRM_ENABLE, 'SANDBOX_COMMERCE_CONFIRMATION_INVALID');
  invariant(
    operations.status === 'healthy' && healthCountersAreZero(operations.counters),
    'SANDBOX_COMMERCE_OPERATIONS_UNHEALTHY'
  );
  invariant(typeof control.activePolicyVersion === 'string', 'SANDBOX_COMMERCE_SOURCE_POLICY_MISSING');
  const sourcePolicyRef = db.doc(`commerce_policy_versions/${control.activePolicyVersion}`);
  const [sourcePolicySnap, targetPolicySnap] = await Promise.all([
    sourcePolicyRef.get(),
    policyRef.get()
  ]);
  invariant(sourcePolicySnap.exists, 'SANDBOX_COMMERCE_SOURCE_POLICY_MISSING');
  const targetPolicy = buildTransactionalPolicy(sourcePolicySnap.data());
  invariant(
    /^acct_[A-Za-z0-9]{8,}$/.test(targetPolicy.stripeConnectedAccountId || '') &&
      Number.isSafeInteger(targetPolicy.holdDurationSeconds) &&
      targetPolicy.holdDurationSeconds > 0 &&
      (!targetPolicySnap.exists || policyMatches(targetPolicySnap.data(), targetPolicy)),
    'SANDBOX_COMMERCE_POLICY_INVALID'
  );

  if (
    control.newCheckoutMode === 'v2_all' &&
    control.adminMutationMode === 'v2' &&
    control.offlinePaymentMode === 'off' &&
    control.activePolicyVersion === POLICY_VERSION
  ) {
    console.log(JSON.stringify({ ok: true, status: 'ALREADY_ENABLED', projectId, environment }));
    return;
  }

  await db.runTransaction(async (transaction) => {
    const [freshControl, freshOperations, freshPolicy] = await Promise.all([
      transaction.get(controlRef),
      transaction.get(operationsRef),
      transaction.get(policyRef)
    ]);
    invariant(
      freshControl.exists &&
        freshControl.data()?.controlRevision === control.controlRevision &&
        freshOperations.data()?.status === 'healthy' &&
        healthCountersAreZero(freshOperations.data()?.counters) &&
        (!freshPolicy.exists || policyMatches(freshPolicy.data(), targetPolicy)),
      'SANDBOX_COMMERCE_PRECONDITION_CHANGED'
    );
    const updatedAt = Timestamp.now();
    if (!freshPolicy.exists) {
      transaction.create(policyRef, { ...targetPolicy, createdAt: updatedAt, updatedAt });
    }
    transaction.update(controlRef, {
      newCheckoutMode: 'v2_all',
      adminMutationMode: 'v2',
      offlinePaymentMode: 'off',
      activePolicyVersion: POLICY_VERSION,
      controlRevision: control.controlRevision + 1,
      fixtureScopeVersion: FieldValue.delete(),
      fixtureScopeRef: FieldValue.delete(),
      v2AllRunId: FieldValue.delete(),
      v2AllExpiresAt: FieldValue.delete(),
      updatedAt,
      updatedBy: 'configure-commerce-sandbox-enable'
    });
  });
  console.log(JSON.stringify({
    ok: true,
    status: 'ENABLED',
    projectId,
    environment,
    checkoutMode: 'v2_all',
    adminMutationMode: 'v2',
    offlinePaymentMode: 'off',
    activePolicyVersion: POLICY_VERSION,
    controlRevision: control.controlRevision + 1
  }));
}

try {
  await main();
} catch (error) {
  console.error(JSON.stringify({ ok: false, error: String(error?.message || error) }));
  process.exitCode = 1;
}
