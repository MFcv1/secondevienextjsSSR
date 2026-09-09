import { useEffect } from 'react';
export const COMMERCE_V2_CONSUMERS_ENABLED = true;
export const isStripeConfigured = true;
export const getStripePromise = () => null;
export const getFunctionTarget = (name) => name;
export const db = {};
export const functions = {};
export const doc = () => ({});
export const httpsCallable = () => { throw new Error('Hosted callable forbidden in local harness'); };
export const getCallableFunction = async () => { throw new Error('Hosted callable forbidden in local harness'); };
export const onSnapshot = (_ref, callback) => {
    window.orderListener = callback;
    return () => { window.orderListener = null; };
};
const stripe = { confirmPayment: () => {
    window.calls += 1;
    return new Promise((resolve, reject) => { window.resolveStripe = resolve; window.rejectStripe = reject; });
} };
export const useStripe = () => stripe;
export const useElements = () => ({});
export function Elements({ children }) {
    useEffect(() => { window.mounts += 1; return () => { window.unmounts += 1; }; }, []);
    return <div data-testid="elements">{children}</div>;
}
export const PaymentElement = () => <div>Carte simulée</div>;
export const ExpressCheckoutElement = ({ onConfirm }) => <button onClick={onConfirm}>Wallet simulé</button>;
