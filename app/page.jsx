import { permanentRedirect } from 'next/navigation';

export const dynamic = 'force-static';

export const metadata = {
  alternates: { canonical: '/galerie' },
  robots: { index: false, follow: true },
};

export default function HomePage() {
  permanentRedirect('/galerie');
}
