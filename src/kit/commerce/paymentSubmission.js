// One gate shared by card and wallets, including the whole bank challenge.
export function createPaymentSubmission({ confirm, onState, onResult, onError, now = Date.now, expiresAt }) {
    let busy = false;
    return async () => {
        if (busy) return;
        busy = true;
        if (Date.parse(expiresAt) <= now()) {
            onState('verification');
            onResult(null);
            return;
        }
        onState('submitting');
        try {
            const { error, paymentIntent } = await confirm();
            if (error && ['card_error', 'validation_error'].includes(error.type)
                && (!error.payment_intent || error.payment_intent.status === 'requires_payment_method')) {
                busy = false;
                onState('idle');
                onError(error.message);
                return;
            }
            // Network errors and absent results cannot authorize another debit.
            onState('verification');
            onResult(paymentIntent || null);
        } catch {
            onState('verification');
            onResult(null);
        }
    };
}
