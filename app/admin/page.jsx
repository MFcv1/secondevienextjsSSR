import ClientApp from '../ClientApp';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Administration',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return <ClientApp />;
}
