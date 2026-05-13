import ClientApp from '../ClientApp';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false }
};

export default function CheckoutPage() {
  return <ClientApp />;
}
