'use strict';

const { normalizeProposal, proposalsEqual } = require('./quoteProposalDomain.cjs');
const { quoteProposalEmail } = require('./quoteEmailTemplates');

// Synchronous operator command: no polling, scheduler or automatic resend.
function createQuoteWorkflow({ db, admin, HttpsError, runtime, auditExpiry }) {
    const fail = (message) => { throw new HttpsError('failed-precondition', message); };
    return async function execute({ quoteId, expectedVersion, action }, context) {
        if (!['send', 'trash', 'restore', 'confirm_sent', 'confirm_not_sent'].includes(action)) fail('Action inconnue.');
        const ref = db.collection('quote_requests').doc(quoteId);
        const claimed = await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            if (!snap.exists) throw new HttpsError('not-found', 'Demande introuvable.');
            const quote = snap.data();
            const delivery = quote.proposalEmail || {};
            // A lost response to the same send cannot create a second message.
            if (action === 'send' && delivery.requestVersion === expectedVersion) return null;
            if (Number(quote.version || 1) !== expectedVersion) {
                throw new HttpsError('aborted', 'La fiche a changé. Actualisez avant de recommencer.', { reason: 'quote-version-conflict' });
            }
            const now = admin.firestore.Timestamp.now();
            const unresolved = ['sending', 'delivery_unknown'].includes(delivery.status);
            const reconcile = action.startsWith('confirm_');
            if (unresolved && !reconcile) fail('Vérifiez le résultat de l’envoi avant de modifier ce dossier.');
            if (reconcile && (!unresolved || (delivery.status === 'sending' && now.toMillis() - delivery.startedAt.toMillis() < 120000))) {
                fail('Cet envoi ne peut pas encore être réconcilié. Actualisez après deux minutes.');
            }
            if (quote.deletedAt && action !== 'restore') fail('Restaurez cette demande avant de continuer.');
            const patch = { version: expectedVersion + 1, updatedAt: now, lastHandledBy: context.auth.uid };
            let proposal;
            if (action === 'trash') {
                if (quote.intakeStatus !== 'submitted') fail('Attendez la fin de la réception des photos.');
                patch.deletedAt = now;
            } else if (action === 'restore') {
                patch.deletedAt = null;
            } else if (reconcile) {
                patch.proposalEmail = { ...delivery, status: action === 'confirm_sent' ? 'sent' : 'failed', resolvedBy: context.auth.uid, completedAt: now };
                if (action === 'confirm_sent') patch.status = 'proposal_sent';
            } else {
                if (quote.intakeStatus !== 'submitted' || ['closed', 'declined', 'accepted'].includes(quote.status)) fail('Rouvrez le dossier avant de proposer un nouveau chiffrage.');
                try { proposal = normalizeProposal(quote.proposal); } catch (error) { fail(error.message); }
                if (delivery.status === 'sent' && proposalsEqual(delivery.proposal, proposal)) fail('Cette proposition a déjà été envoyée. Modifiez le chiffrage ou le message pour préparer une nouvelle version.');
                patch.proposalEmail = { status: 'sending', startedAt: now, requestVersion: expectedVersion, proposal };
            }
            if (patch.status) patch.statusChangedAt = now;
            tx.update(ref, patch);
            tx.create(db.collection('sys_audit_quotes').doc(), {
                quoteId, action, actorUid: context.auth.uid, previousVersion: expectedVersion,
                nextVersion: expectedVersion + 1, createdAt: now, expireAt: auditExpiry(now.toMillis()),
                ...(proposal ? { proposal, recipient: quote.customer.email } : {})
            });
            return action === 'send' ? { ...quote, proposal } : null;
        });
        if (!claimed) return;
        let invoked = false;
        let result;
        let status;
        try {
            const transport = runtime();
            const message = quoteProposalEmail(claimed, transport.fromAddress);
            invoked = true;
            result = await transport.sender.send(message, { idempotencyKey: `quote-proposal/${quoteId}/${expectedVersion}` });
            status = result?.id ? 'sent' : 'delivery_unknown';
        } catch {
            // SMTP failures can follow acceptance. Never retry them blindly.
            status = invoked ? 'delivery_unknown' : 'failed';
        }
        await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const quote = snap.data();
            if (quote?.proposalEmail?.requestVersion !== expectedVersion || quote.proposalEmail.status !== 'sending') return;
            const now = admin.firestore.Timestamp.now();
            tx.update(ref, {
                proposalEmail: { ...quote.proposalEmail, status, completedAt: now, providerMessageId: result?.id || null },
                ...(status === 'sent' ? { status: 'proposal_sent', statusChangedAt: now } : {}),
                version: Number(quote.version) + 1, updatedAt: now
            });
        });
    };
}

module.exports = { createQuoteWorkflow };
