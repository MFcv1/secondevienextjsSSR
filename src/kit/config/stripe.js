import { loadStripe } from '@stripe/stripe-js';

const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '';

export const isStripeConfigured = Boolean(stripePublicKey);
export const stripePromise = isStripeConfigured ? loadStripe(stripePublicKey) : null;
