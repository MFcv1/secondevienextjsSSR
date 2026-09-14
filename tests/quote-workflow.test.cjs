'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { createQuoteWorkflow } = require('../functions/src/quotes/quoteWorkflow.cjs');
const { normalizeProposal, proposalsEqual } = require('../functions/src/quotes/quoteProposalDomain.cjs');
const { quoteProposalEmail } = require('../functions/src/quotes/quoteEmailTemplates');

const proposal = () => normalizeProposal({ lines: [{ label: 'Ponçage', minCents: 4500, maxCents: 12000 }], validDays: 30, message: 'Transport à convenir.' });
function harness({ sendError, configError, loseClaim, loseCompletion } = {}) {
  let now = 1000000;
  let record = { version: 1, intakeStatus: 'submitted', status: 'in_review', proposal: proposal(), customer: { firstName: 'Client', email: 'client@example.test' }, project: { furnitureLabel: 'Buffet' }, requestNumber: 'DEV-LOCAL', internalNotes: 'NEVER SEND' };
  let sends = 0;
  let pending = Promise.resolve();
  const audits = [];
  class HttpsError extends Error { constructor(code, message) { super(message); this.code = code; } }
  const db = {
    collection: name => ({ doc: () => ({ name }) }),
    runTransaction(run) {
      const result = pending.then(async () => {
        let patch;
        const result = await run({ get: async () => ({ exists: true, data: () => record }), update: (_, data) => { patch = data; }, create: (_, data) => audits.push(data) });
        if (patch) record = { ...record, ...patch };
        if ((loseClaim && patch?.proposalEmail?.status === 'sending') || (loseCompletion && patch?.proposalEmail?.status === 'sent')) throw new Error('Lost database response');
        return result;
      });
      pending = result.catch(() => {});
      return result;
    }
  };
  const run = createQuoteWorkflow({ db, admin: { firestore: { Timestamp: { now: () => { const value = now; return { toMillis: () => value }; } } } }, HttpsError, auditExpiry: () => 'expiry', runtime: () => {
    if (configError) throw new Error('Config');
    return { fromAddress: 'atelier@example.test', sender: { async send(message) {
      sends++;
      assert.doesNotMatch(message.text, /NEVER SEND/);
      if (sendError) throw new Error('Ambiguous SMTP response');
      return { id: 'fake-id' };
    } } };
  } });
  return { record: () => record, sends: () => sends, audits, advance: () => { now += 121000; }, invoke: (action, expectedVersion = record.version) => run({ action, expectedVersion, quoteId: 'quote-local' }, { auth: { uid: 'admin-local' } }) };
}

test('proposal validates authoritative integer totals, bounds and escaped customer content', () => {
  assert.equal(proposal().maxCents, 12000);
  assert.ok(proposalsEqual(proposal(), Object.fromEntries(Object.entries(proposal()).reverse())));
  for (const bad of [null, { ...proposal(), validDays: 0 }, { ...proposal(), lines: [{ label: 'x', minCents: -1, maxCents: 5 }] }, { ...proposal(), lines: [{ label: 'x', minCents: 9, maxCents: 5 }] }]) assert.throws(() => normalizeProposal(bad));
  const message = quoteProposalEmail({ customer: { email: 'a@example.test' }, project: {}, requestNumber: 'DEV', proposal: { ...proposal(), message: '<script>private()</script>' } }, 'sender@example.test');
  assert.doesNotMatch(message.html, /<script>/);
  assert.match(message.html, /&lt;script&gt;/);
  assert.equal(message.to, 'a@example.test');
});

test('concurrent send and lost response replay produce one email and retain the sent snapshot', async () => {
  const h = harness();
  await Promise.all([h.invoke('send', 1), h.invoke('send', 1)]);
  await h.invoke('send', 1);
  assert.equal(h.sends(), 1);
  assert.equal(h.record().status, 'proposal_sent');
  assert.deepEqual(h.record().proposalEmail.proposal, proposal());
  assert.deepEqual(h.audits[0].proposal, proposal());
  await assert.rejects(h.invoke('send'), /déjà été envoyée/);
});

test('ambiguous delivery freezes resend and deletion until explicit operator reconciliation', async () => {
  const h = harness({ sendError: true });
  await h.invoke('send');
  assert.equal(h.record().proposalEmail.status, 'delivery_unknown');
  await assert.rejects(h.invoke('send'), /Vérifiez/);
  await assert.rejects(h.invoke('trash'), /Vérifiez/);
  await h.invoke('confirm_sent');
  assert.equal(h.record().status, 'proposal_sent');
  assert.equal(h.sends(), 1);
});

test('crash after claim is recoverable after lease, with no automatic send', async () => {
  const h = harness({ loseClaim: true });
  await assert.rejects(h.invoke('send', 1));
  await h.invoke('send', 1);
  assert.equal(h.sends(), 0);
  await assert.rejects(h.invoke('confirm_not_sent'), /deux minutes/);
  h.advance();
  await h.invoke('confirm_not_sent');
  assert.equal(h.record().proposalEmail.status, 'failed');
});

test('lost completion response preserves durable success without a second email', async () => {
  const h = harness({ loseCompletion: true });
  await assert.rejects(h.invoke('send', 1));
  await h.invoke('send', 1);
  assert.equal(h.sends(), 1);
  assert.equal(h.record().proposalEmail.status, 'sent');
});

test('configuration failure is visible and trash is reversible with version protection', async () => {
  const h = harness({ configError: true });
  await h.invoke('send');
  assert.equal(h.record().proposalEmail.status, 'failed');
  assert.equal(h.sends(), 0);
  await assert.rejects(h.invoke('trash', 1), { code: 'aborted' });
  await h.invoke('trash');
  assert.ok(h.record().deletedAt);
  assert.deepEqual(h.record().proposal, proposal());
  await assert.rejects(h.invoke('send'), /Restaurez/);
  await h.invoke('restore');
  assert.equal(h.record().deletedAt, null);
});
