import AboutVitrineIsland from './AboutVitrineIsland';
import { publicEnv } from '../../src/lib/server/env';

const siteRoot = publicEnv.siteUrl.replace(/\/$/, '');
const aboutUrl = `${siteRoot}/a-propos`;
const aboutTitle = 'À propos - Seconde Vie par Anaïs';
const aboutDescription = "L'histoire de l'atelier Seconde Vie par Anaïs, entre mobilier restauré, pièces uniques et savoir-faire artisanal.";

const faqItems = [
  {
    question: "Comment se passe la livraison d'un meuble volumineux ?",
    answer: "Nous travaillons avec un transporteur spécialisé dans le mobilier fragile. Votre meuble est soigneusement emballé et livré directement dans la pièce de votre choix, partout en France.",
  },
  {
    question: "Puis-je vous confier la restauration d'un meuble de famille ?",
    answer: "Absolument. C'est même le cœur de notre métier. Envoyez-nous des photos de votre meuble via le formulaire de devis, nous vous établirons un diagnostic personnalisé.",
  },
  {
    question: "Qu'est-ce que l'aérogommage exactement ?",
    answer: "C'est une technique de décapage à très basse pression. Elle retire vernis et peintures sans creuser ni abîmer les veines du bois.",
  },
  {
    question: 'Comment entretenir vos meubles patinés au quotidien ?',
    answer: "Nos finitions sont conçues pour être durables. Pour l'entretien courant, un chiffon doux légèrement humide suffit. Une fiche de conseils accompagne chaque pièce.",
  },
];

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
      areaServed: 'Marseille et France selon les pièces',
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

export default function AboutPage() {
  return (
    <>
      <main data-public-ssr-fallback data-ssr-about>
        <nav className="sr-only" aria-label="Liens directs A propos">
          <a href="/galerie">Galerie</a>
          <a href="/devis">Devis</a>
        </nav>
        <AboutVitrineIsland />
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />
    </>
  );
}
