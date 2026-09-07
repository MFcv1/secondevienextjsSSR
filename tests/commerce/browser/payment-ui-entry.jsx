import { createRoot } from 'react-dom/client';
import CheckoutStripeModal from '../../../src/kit/commerce/CheckoutStripeModal';
import { getCheckoutRequestIdentity } from '../../../src/kit/commerce/checkoutRequestIdentity';
import { useCancellationConfirmation } from '../../../src/kit/commerce/CancellationConfirmation';
window.calls = 0;
window.mounts = 0;
window.unmounts = 0;
window.closedCount = 0;
window.successes = 0;
window.requestIdentity = () => getCheckoutRequestIdentity('owner-local-0001', { cart: ['line-local-0001'] });
window.paid = () => window.orderListener?.({
    exists: () => true, id: 'order-local-0001',
    data: () => ({ schemaVersion: 2, payment: { status: 'succeeded' }, orderNumber: 42 }),
});
function CancellationHarness() {
    const { confirmCancellation, confirmation } = useCancellationConfirmation();
    return <>{confirmation}<button onClick={async () => { window.cancelConfirmed = await confirmCancellation(); }}>Sortir de la réservation</button></>;
}
createRoot(document.getElementById('root')).render(window.location.search.includes('confirmation') ? <CancellationHarness /> : <CheckoutStripeModal
    finalTotal={100} orderTotal={100} createdOrderId="order-local-0001" createdOrderNumber={42}
    formData={{}} stripeElementsOptions={{ clientSecret: 'simulated-only' }} purchasedCartLines={[]}
    expiresAt={new Date(Date.now() + 900000).toISOString()}
    onClose={() => { window.closedCount += 1; }}
    onPlaceOrder={() => { window.successes += 1; }}
/>);
