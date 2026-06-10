import AboutServerView from '../../src/kit/vitrine/AboutServerView';
import { getFaqItems } from '../../src/kit/vitrine/aboutContent';
import { getAboutPersonalization } from '../../src/lib/server/about';
import { publicEnv } from '../../src/lib/server/env';

const siteRoot = publicEnv.siteUrl.replace(/\/$/, '');
const aboutUrl = `${siteRoot}/a-propos`;
const aboutTitle = 'A propos - Seconde Vie par Anais';
const aboutDescription = "L'histoire de l'atelier Seconde Vie par Anais, entre mobilier restaure, pieces uniques et savoir-faire artisanal.";
const faqItems = getFaqItems();

export const revalidate = 300;

export const metadata = {
  title: aboutTitle,
  description: aboutDescription,
  alternates: { canonical: '/a-propos' },
  openGraph: {
    type: 'website',
    title: `${aboutTitle} | ${publicEnv.siteName}`,
    description: aboutDescription,
    url: aboutUrl,
    siteName: publicEnv.siteName,
    images: ['https://images.unsplash.com/photo-1765288115711-25db755b8e31?auto=format&fit=crop&q=80&w=2560'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${aboutTitle} | ${publicEnv.siteName}`,
    description: aboutDescription,
    images: ['https://images.unsplash.com/photo-1765288115711-25db755b8e31?auto=format&fit=crop&q=80&w=2560'],
  },
};

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'LocalBusiness',
      '@id': `${siteRoot}/#localbusiness`,
      name: publicEnv.siteName,
      url: siteRoot,
      areaServed: 'Marseille et France selon les pieces',
      image: 'https://images.unsplash.com/photo-1765288115711-25db755b8e31?auto=format&fit=crop&q=80&w=2560',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Marseille',
        addressCountry: 'FR',
      },
    },
    {
      '@type': 'AboutPage',
      '@id': `${aboutUrl}#webpage`,
      name: aboutTitle,
      description: aboutDescription,
      url: aboutUrl,
      isPartOf: { '@id': `${siteRoot}/#website` },
      about: { '@id': `${siteRoot}/#localbusiness` },
    },
    {
      '@type': 'FAQPage',
      '@id': `${aboutUrl}#faq`,
      mainEntity: faqItems.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
  ],
};

export default async function AboutPage() {
  const personalization = await getAboutPersonalization();

  return (
    <>
      <main data-public-ssr-fallback data-ssr-about>
        <nav className="sr-only" aria-label="Liens directs A propos">
          <a href="/galerie">Galerie</a>
          <a href="/devis">Devis</a>
        </nav>
        <AboutServerView personalization={personalization} />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />
    </>
  );
}
