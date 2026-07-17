import RouteClientProviders from '../RouteClientProviders';
import AdminAppIsland from './AdminAppIsland';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Administration',
  robots: {
    index: false,
    follow: false
  }
};

export default function AdminPage() {
  return (
    <RouteClientProviders>
      <AdminAppIsland />
    </RouteClientProviders>
  );
}
