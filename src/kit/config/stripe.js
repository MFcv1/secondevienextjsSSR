import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';
const stripePromiseCache = new Map();

export const isStripeConfigured = Boolean(stripePublicKey);
export const getStripePromise = (stripeConnectedAccountId = '') => {
    if (!isStripeConfigured) return null;
    const cacheKey = stripeConnectedAccountId || '__platform__';
    if (!stripePromiseCache.has(cacheKey)) {
        stripePromiseCache.set(
            cacheKey,
            loadStripe(
                stripePublicKey,
                stripeConnectedAccountId ? { stripeAccount: stripeConnectedAccountId } : undefined
            )
        );
    }
    return stripePromiseCache.get(cacheKey);
};

export const stripePromise = getStripePromise();
