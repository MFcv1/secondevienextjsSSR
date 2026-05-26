import ClientApp from '../ClientApp';
import { publicEnv } from '../../src/lib/server/env';

export const metadata = {
  title: 'A propos',
  description: 'Decouvrir Seconde Vie par Anais, atelier de restauration et selection de mobilier.',
  alternates: { canonical: '/a-propos' },
  openGraph: {
    type: 'website',
    title: 'A propos de Seconde Vie par Anais',
    description: 'Atelier de restauration et selection de mobilier ancien autour de Marseille.',
    url: `${publicEnv.siteUrl.replace(/\/$/, '')}/a-propos`,
    siteName: publicEnv.siteName,
    images: ['/images/about/about-1.webp']
  },
  twitter: {
    card: 'summary_large_image',
    title: 'A propos de Seconde Vie par Anais',
    description: 'Atelier de restauration et selection de mobilier ancien autour de Marseille.',
    images: ['/images/about/about-1.webp']
  }
};

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'A propos de Seconde Vie par Anais',
  description: 'Atelier de restauration et selection de mobilier ancien autour de Marseille.',
  url: `${publicEnv.siteUrl.replace(/\/$/, '')}/a-propos`,
  mainEntity: {
    '@type': 'LocalBusiness',
    name: publicEnv.siteName,
    areaServed: 'Marseille et France selon les pieces',
    image: `${publicEnv.siteUrl.replace(/\/$/, '')}/images/about/about-1.webp`
  }
};

export default function AboutPage() {
  return (
    <>
      <ClientApp />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />
    </>
  );
}
