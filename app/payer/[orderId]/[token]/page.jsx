import PaymentLinkPageIsland from './PaymentLinkPageIsland';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Paiement sécurisé',
  referrer: 'no-referrer',
  robots: { index: false, follow: false, nocache: true },
};

export default async function PaymentLinkPage({ params }) {
  const { orderId, token } = await params;
  return <PaymentLinkPageIsland orderId={orderId} token={token} />;
}
