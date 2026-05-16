import Link from 'next/link';
import ClientApp from '../ClientApp';
import { publicEnv } from '../../src/lib/server/env';

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
      <main
        className="min-h-screen bg-[#f7f3ee] text-stone-950"
        data-public-ssr-fallback
        data-ssr-quote
      >
        <section className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 py-12 md:px-10">
          <div className="max-w-3xl space-y-8">
            <nav className="flex gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-stone-500" aria-label="Fil d'Ariane">
              <Link href="/">Galerie</Link>
              <span aria-hidden="true">/</span>
              <span>Devis</span>
            </nav>

            <div className="space-y-5">
              <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Projet sur mesure</p>
              <h1 className="font-serif text-5xl leading-none md:text-7xl">
                Demander un devis pour restaurer ou adapter un meuble ancien
              </h1>
              <p className="text-base leading-8 text-stone-700">
                Seconde Vie par Anais etudie les demandes de restauration, de reservation et de livraison selon l'etat du meuble, ses dimensions, les finitions attendues et la distance a parcourir.
              </p>
              <p className="text-sm leading-7 text-stone-600">
                Pour recevoir une estimation utile, preparez quelques photos, les mesures principales, votre ville et les contraintes importantes : usage prevu, teinte souhaitee, delai ou acces de livraison.
              </p>
            </div>

            <dl id="pieces-a-preparer" className="grid gap-3 sm:grid-cols-3">
              {[
                ['Photos', 'Faces, details, defauts visibles'],
                ['Mesures', 'Hauteur, largeur, profondeur'],
                ['Lieu', 'Ville, etage, acces livraison']
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-stone-300 p-4">
                  <dt className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{label}</dt>
                  <dd className="mt-2 text-sm font-semibold text-stone-800">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap gap-3">
              <Link className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white" href="/">
                Voir la galerie
              </Link>
              <Link className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800" href="/a-propos">
                Decouvrir l'atelier
              </Link>
            </div>
          </div>
        </section>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(quoteJsonLd) }}
      />
      <ClientApp defer />
    </>
  );
}
