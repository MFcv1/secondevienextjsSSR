const assert = require('node:assert/strict');
const { after, before, beforeEach, test } = require('node:test');
const { initializeTestEnvironment } = require('@firebase/rules-unit-testing');
const { collection, doc, getDoc, getDocs, setDoc, updateDoc } = require('firebase/firestore');
const { PROJECT_ID, assertEmulatorEnvironment } = require('./emulator-guard.cjs');

let environment;

before(async () => {
  assertEmulatorEnvironment({ storage: false });
  environment = await initializeTestEnvironment({ projectId: PROJECT_ID });
});

beforeEach(async () => environment.clearFirestore());
after(async () => environment?.cleanup());

async function waitFor(check, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  let latest;
  while (Date.now() < deadline) {
    latest = await check();
    if (latest) return latest;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for catalog trigger; latest=${JSON.stringify(latest)}`);
}

test('a real Firestore mutation creates one ledger and one monotone desired revision', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const product = doc(db, 'artifacts/secondevie/public/data/furniture/emulator-product');
    await setDoc(product, {
      status: 'published', name: 'Emulator', description: 'Fixture isolated demo project',
      category: 'tables', currentPrice: 100, stock: 2, sold: false, images: [],
    });
    await updateDoc(product, { stock: 1 });
  });

  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const control = await waitFor(async () => {
      const snap = await getDoc(doc(db, 'sys_catalog_publication/secondevie'));
      if (!snap.exists() || Number(snap.data().desiredRevision) < 1) return null;
      const ledgerSnapshot = await getDocs(collection(db, 'sys_catalog_publication_events'));
      const ledgerValues = ledgerSnapshot.docs.map((ledger) => ledger.data());
      return ledgerValues.length >= 1 && ledgerValues.every((ledger) => ledger.dispatchState === 'scheduled')
        ? { control: snap.data(), ledgerValues }
        : null;
    });
    assert.ok(control.control.desiredRevision >= 1);
    assert.ok(control.ledgerValues.length >= 1);
    control.ledgerValues.forEach((value) => {
      assert.equal(value.before, undefined);
      assert.equal(value.after, undefined);
      assert.equal(value.product, undefined);
    });
  });
});
