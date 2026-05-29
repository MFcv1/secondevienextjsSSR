import { publicEnv } from '../../src/lib/server/env';
import QuoteRequestView from '../../src/kit/marketplace/QuoteRequestView';

const siteRoot = publicEnv.siteUrl.replace(/\/$/, '');
const quoteUrl = `${siteRoot}/devis`;
const quoteTitle = 'Devis restauration de meuble ancien';
const quoteDescription = 'Demander un devis a Seconde Vie pour restaurer, adapter ou reserver un meuble ancien avec une reponse personnalisee.';

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

export const metadata = {
  title: quoteTitle,
  description: quoteDescription,
  alternates: { canonical: '/devis' },
  openGraph: {
    type: 'website',
    title: `${quoteTitle} | ${publicEnv.siteName}`,
    description: quoteDescription,
    url: quoteUrl,
    siteName: publicEnv.siteName
  },
  twitter: {
    card: 'summary',
    title: `${quoteTitle} | ${publicEnv.siteName}`,
    description: quoteDescription
  }
};

const quoteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Devis restauration de meuble ancien',
  description: quoteDescription,
  url: quoteUrl,
  provider: {
    '@type': 'LocalBusiness',
    name: publicEnv.siteName,
    url: siteRoot
  },
  areaServed: 'Marseille et France selon les pieces'
};

export default function QuotePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(quoteJsonLd) }}
      />
      <QuoteRequestView />
    </>
  );
}
