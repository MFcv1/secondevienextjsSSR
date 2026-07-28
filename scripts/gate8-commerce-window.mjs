import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore';

const PROJECT_ID = 'secondevienextjsssr';
const ENVIRONMENT = 'sandbox';
const SCOPE_VERSION = 'fixture_gate6_20260728';
const TARGET_STOCKS = new Map([
  ['fixture_gate6_stock1_01', 1],
  ['fixture_gate6_stock2_02', 2],
  ['fixture_gate6_stock10_03', 10]
]);
const require = createRequire(import.meta.url);
const {
  createInventoryKey
} = require('../functions/src/commerce/domain/inventoryKey');

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

function safeRunId(value) {
  invariant(/^run_gate8_[A-Za-z0-9_-]{8,120}$/.test(String(value || '')), 'GATE8_RUN_ID_INVALID');
  return value;
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

function maskedAlias(baseEmail, runId) {
  const at = baseEmail.lastIndexOf('@');
  invariant(at > 0, 'GATE8_GMAIL_EMAIL_INVALID');
  const local = baseEmail.slice(0, at).split('+')[0];
  const domain = baseEmail.slice(at + 1);
  const tag = crypto.createHash('sha256').update(runId).digest('hex').slice(0, 10);
  return `${local}+gate8-${tag}@${domain}`;
}

async function writeReport(runId, action, value) {
  const reportPath = path.resolve(`logs/commerce/gate8/${runId}-${action}.json`);
  await mkdir(path.dirname(reportPath), { recursive: true });
  await writeFile(reportPath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  return path.relative(process.cwd(), reportPath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const projectId = args.get('project');
  const environment = args.get('env') || ENVIRONMENT;
  const action = args.get('action') || 'preflight';
  const runId = safeRunId(args.get('run-id'));
  invariant(projectId === PROJECT_ID && environment === ENVIRONMENT, 'GATE8_TARGET_INVALID');
  invariant(['preflight', 'open', 'close'].includes(action), 'GATE8_ACTION_INVALID');
  invariant(process.env.FIREBASE_SERVICE_ACCOUNT_JSON, 'GATE8_SERVICE_ACCOUNT_MISSING');

  const app = getApps().find((entry) => entry.name === 'gate8-window') || initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)),
    projectId
  }, 'gate8-window');
  const db = getFirestore(app);
  const auth = getAuth(app);
  const refs = {
    control: db.doc('sys_commerce_control/current'),
    operations: db.doc('sys_commerce_operations/current'),
    scope: db.doc(`commerce_fixture_scopes/${SCOPE_VERSION}`),
    run: db.doc(`commerce_gate_runs/${runId}`)
  };
  const [controlSnap, operationsSnap, scopeSnap, runSnap] = await Promise.all([
    refs.control.get(),
    refs.operations.get(),
    refs.scope.get(),
    refs.run.get()
  ]);
  invariant(controlSnap.exists && operationsSnap.exists && scopeSnap.exists, 'GATE8_PREFLIGHT_EVIDENCE_MISSING');
  const control = controlSnap.data();
  const operations = operationsSnap.data();
  const scope = scopeSnap.data();
  invariant(
    control.newCheckoutMode === 'v2_fixture' &&
      control.offlinePaymentMode === 'off' &&
      control.fixtureScopeVersion === SCOPE_VERSION &&
      typeof control.releaseManifestId === 'string' &&
      scope.active === true &&
      scope.projectId === PROJECT_ID &&
      scope.environment === ENVIRONMENT &&
      operations.status === 'healthy' &&
      healthCountersAreZero(operations.counters),
    'GATE8_PREFLIGHT_INVARIANT_FAILED'
  );

  if (action === 'preflight') {
    const reportPath = await writeReport(runId, action, {
      status: 'ready',
      projectId,
      environment,
      runId,
      releaseManifestId: control.releaseManifestId,
      controlRevision: control.controlRevision,
      adminMutationMode: control.adminMutationMode,
      operationsStatus: operations.status,
      counters: operations.counters
    });
    console.log(JSON.stringify({
      ok: true,
      status: 'READY',
      runId,
      releaseManifestId: control.releaseManifestId,
      controlRevision: control.controlRevision,
      adminMutationMode: control.adminMutationMode,
      reportPath
    }));
    return;
  }

  const confirmation = args.get('confirm');
  invariant(
    confirmation === `${action.toUpperCase()}_GATE8_${runId}_${PROJECT_ID}`,
    'GATE8_CONFIRMATION_INVALID'
  );

  if (action === 'open') {
    invariant(control.adminMutationMode === 'read_only', 'GATE8_ADMIN_ALREADY_OPEN');
    invariant(!runSnap.exists, 'GATE8_RUN_ALREADY_EXISTS');
    const fixtureUid = scope.uids?.[0];
    invariant(typeof fixtureUid === 'string', 'GATE8_FIXTURE_UID_MISSING');
    const productEntries = [...TARGET_STOCKS.entries()];
    const productRefs = productEntries.map(([productId]) => db.doc(
      `artifacts/secondevie/public/data/furniture/${productId}`
    ));
    const openedAt = Timestamp.now();
    const stockChanges = await db.runTransaction(async (transaction) => {
      const [freshControl, freshOperations, ...products] = await Promise.all([
        transaction.get(refs.control),
        transaction.get(refs.operations),
        ...productRefs.map((reference) => transaction.get(reference))
      ]);
      const currentControl = freshControl.data();
      const currentOperations = freshOperations.data();
      invariant(
        currentControl.controlRevision === control.controlRevision &&
          currentControl.adminMutationMode === 'read_only' &&
          currentOperations.status === 'healthy' &&
          healthCountersAreZero(currentOperations.counters),
        'GATE8_OPEN_PRECONDITION_CHANGED'
      );
      const changes = [];
      products.forEach((snapshot, index) => {
        const [productId, targetStock] = productEntries[index];
        invariant(snapshot.exists, `GATE8_FIXTURE_PRODUCT_MISSING:${productId}`);
        const product = snapshot.data();
        invariant(
          product.e2eOnly === true &&
            product.fixtureScopeVersion === SCOPE_VERSION &&
            Number.isSafeInteger(product.stock) &&
            Number.isSafeInteger(product.inventoryVersion),
          `GATE8_FIXTURE_PRODUCT_INVALID:${productId}`
        );
        const delta = targetStock - product.stock;
        const nextInventoryVersion = product.inventoryVersion + (delta === 0 ? 0 : 1);
        if (delta !== 0) {
          const effectId = `gate8_seed_${runId}_${productId}`;
          const movementRef = db.doc(`inventory_movements/${effectId}`);
          transaction.update(productRefs[index], {
            stock: targetStock,
            inventoryVersion: nextInventoryVersion,
            updatedAt: openedAt
          });
          transaction.create(movementRef, {
            schemaVersion: 2,
            effectId,
            orderId: null,
            inventoryKey: createInventoryKey({
              collectionName: 'furniture',
              productId,
              variantId: null
            }),
            type: 'adjustment',
            quantity: Math.abs(delta),
            availableDelta: delta,
            inventoryVersionBefore: product.inventoryVersion,
            inventoryVersionAfter: nextInventoryVersion,
            commandId: effectId,
            actor: 'gate8-window',
            reason: 'gate8_fixture_stock_seed',
            testContext: {
              runId,
              fixtureScopeVersion: SCOPE_VERSION
            },
            createdAt: openedAt
          });
        }
        changes.push({
          productId,
          stockBefore: product.stock,
          stockAfter: targetStock,
          inventoryVersionBefore: product.inventoryVersion,
          inventoryVersionAfter: nextInventoryVersion
        });
      });
      transaction.update(refs.control, {
        adminMutationMode: 'v2',
        controlRevision: currentControl.controlRevision + 1,
        gate8RunId: runId,
        updatedAt: openedAt,
        updatedBy: 'gate8-window-open'
      });
      transaction.create(refs.run, {
        schemaVersion: 1,
        runId,
        status: 'open',
        environment,
        projectId,
        releaseManifestId: currentControl.releaseManifestId,
        fixtureScopeVersion: SCOPE_VERSION,
        controlRevisionOpened: currentControl.controlRevision + 1,
        stockChanges: changes,
        openedAt
      });
      return changes;
    });
    const fixtureEmail = maskedAlias(process.env.GMAIL_EMAIL || '', runId);
    await auth.updateUser(fixtureUid, {
      email: fixtureEmail,
      emailVerified: true,
      disabled: false
    });
    await refs.run.update({
      fixtureIdentityReady: true,
      fixtureEmailHash: crypto.createHash('sha256').update(fixtureEmail).digest('hex'),
      updatedAt: FieldValue.serverTimestamp()
    });
    const report = {
      status: 'open',
      projectId,
      environment,
      runId,
      releaseManifestId: control.releaseManifestId,
      controlRevisionBefore: control.controlRevision,
      controlRevisionAfter: control.controlRevision + 1,
      adminMutationMode: 'v2',
      fixtureIdentityReady: true,
      stockChanges
    };
    const reportPath = await writeReport(runId, action, report);
    console.log(JSON.stringify({ ok: true, ...report, reportPath }));
    return;
  }

  invariant(control.adminMutationMode === 'v2', 'GATE8_ADMIN_NOT_OPEN');
  invariant(runSnap.exists && runSnap.data()?.status === 'open', 'GATE8_RUN_NOT_OPEN');
  const closedAt = Timestamp.now();
  await db.runTransaction(async (transaction) => {
    const [freshControl, freshRun] = await Promise.all([
      transaction.get(refs.control),
      transaction.get(refs.run)
    ]);
    invariant(
      freshControl.data()?.controlRevision === control.controlRevision &&
        freshControl.data()?.adminMutationMode === 'v2' &&
        freshControl.data()?.gate8RunId === runId &&
        freshRun.data()?.status === 'open',
      'GATE8_CLOSE_PRECONDITION_CHANGED'
    );
    transaction.update(refs.control, {
      adminMutationMode: 'read_only',
      controlRevision: control.controlRevision + 1,
      gate8RunId: FieldValue.delete(),
      updatedAt: closedAt,
      updatedBy: 'gate8-window-close'
    });
    transaction.update(refs.run, {
      status: 'closed',
      controlRevisionClosed: control.controlRevision + 1,
      closedAt
    });
  });
  const report = {
    status: 'closed',
    projectId,
    environment,
    runId,
    releaseManifestId: control.releaseManifestId,
    controlRevisionBefore: control.controlRevision,
    controlRevisionAfter: control.controlRevision + 1,
    adminMutationMode: 'read_only'
  };
  const reportPath = await writeReport(runId, action, report);
  console.log(JSON.stringify({ ok: true, ...report, reportPath }));
}

main().catch((error) => {
  console.error(JSON.stringify({
    ok: false,
    error: String(error?.message || error)
  }));
  process.exitCode = 1;
});
