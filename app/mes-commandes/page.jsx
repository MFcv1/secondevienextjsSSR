import ClientApp from '../ClientApp';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Mes commandes',
  robots: { index: false, follow: false }
};

export default function OrdersPage() {
  return <ClientApp />;
}
