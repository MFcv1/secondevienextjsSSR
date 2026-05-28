import Link from 'next/link';
import ClientApp from '../ClientApp';
import { publicEnv } from '../../src/lib/server/env';

const siteRoot = publicEnv.siteUrl.replace(/\/$/, '');
const aboutUrl = `${siteRoot}/a-propos`;
const aboutTitle = 'Atelier de restauration de mobilier ancien';
const aboutDescription = 'Découvrir Seconde Vie par Anaïs, atelier de restauration, sélection de meubles anciens et livraison étudiée autour de Marseille.';

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
    images: ['/images/about/about-1.webp']
  },
  twitter: {
    card: 'summary_large_image',
    title: `${aboutTitle} | ${publicEnv.siteName}`,
    description: aboutDescription,
    images: ['/images/about/about-1.webp']
  }
};

const safeJsonLd = (data) => JSON.stringify(data).replace(/</g, '\\u003c');

const aboutJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: aboutTitle,
  description: aboutDescription,
  url: aboutUrl,
  mainEntity: {
    '@type': 'LocalBusiness',
    '@id': `${siteRoot}/#localbusiness`,
    name: publicEnv.siteName,
    url: siteRoot,
    areaServed: 'Marseille et France selon les pièces',
    image: `${siteRoot}/images/about/about-1.webp`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Marseille',
      addressCountry: 'FR'
    }
  }
};

export default function AboutPage() {
  return (
    <>
      <main
        className="min-h-screen bg-[#17110d] text-[#fff3e2]"
        data-public-ssr-fallback
        data-ssr-about
      >
        <section className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[0.92fr_1.08fr] md:px-10">
          <div className="space-y-7">
            <nav className="flex gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-[#bd9b76]" aria-label="Fil d'Ariane">
              <Link href="/">Accueil</Link>
              <span aria-hidden="true">/</span>
              <span>Atelier</span>
            </nav>

            <div className="space-y-5">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#bd9b76]">Seconde Vie par Anaïs</p>
              <h1 className="font-serif text-5xl leading-none md:text-7xl">
                Restaurer un meuble sans effacer son histoire
              </h1>
              <p className="max-w-2xl text-base leading-8 text-[#fff3e2]/75">
                L'atelier sélectionne des meubles anciens pour leur matière, leur ligne et leur potentiel d'usage, puis les remet en état avec des interventions mesurées.
              </p>
              <p className="max-w-2xl text-sm leading-7 text-[#fff3e2]/62">
                Chaque pièce est regardée avant d'être proposée : stabilité, finitions, dimensions, traces du temps et possibilité de livraison autour de Marseille ou plus loin selon le meuble.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-[#fff3e2] px-5 py-3 text-sm font-bold text-[#18130f]" href="/">
                Voir la galerie
              </Link>
              <Link className="rounded-full border border-[#fff3e2]/25 px-5 py-3 text-sm font-bold text-[#fff3e2]" href="/devis">
                Demander un devis
              </Link>
            </div>
          </div>

          <figure className="overflow-hidden rounded-[28px] border border-[#fff3e2]/15 bg-[#fff3e2]/5">
            <img
              src="/images/about/about-1.webp"
              alt="Meuble ancien restauré dans l'atelier Seconde Vie"
              width="900"
              height="1100"
              loading="eager"
              className="h-full w-full object-cover"
            />
            <figcaption className="border-t border-[#fff3e2]/12 px-5 py-4 text-[11px] font-black uppercase tracking-[0.18em] text-[#bd9b76]">
              Sélection, restauration et pièces uniques
            </figcaption>
          </figure>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />
      <ClientApp defer />
    </>
  );
}
