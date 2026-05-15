import Image from 'next/image';
import Link from 'next/link';
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
      <article
        className="min-h-screen bg-[#f7f3ee] text-stone-950"
        data-public-ssr-fallback
        data-ssr-about
      >
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
          <div className="flex flex-col justify-center px-5 py-12 md:px-10 lg:px-14">
            <div className="max-w-3xl space-y-8">
              <nav className="flex gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-stone-500">
                <Link href="/">Galerie</Link>
                <span aria-hidden="true">/</span>
                <span>A propos</span>
              </nav>
              <div className="space-y-5">
                <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Atelier Seconde Vie</p>
                <h1 className="font-serif text-5xl leading-none md:text-7xl">
                  Redonner une place aux meubles deja vecus
                </h1>
                <p className="text-base leading-8 text-stone-700">
                  Seconde Vie par Anais selectionne et restaure du mobilier ancien, avec une attention portee aux lignes, aux matieres et a la possibilite de reintegrer chaque piece dans un interieur actuel.
                </p>
                <p className="text-sm leading-7 text-stone-600">
                  Le projet reste volontairement humain et lisible : des pieces documentees, une disponibilite claire, et une livraison etudiee selon le meuble, la distance et la fragilite.
                </p>
              </div>
              <dl className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Selection', 'Mobilier ancien et pieces uniques'],
                  ['Atelier', 'Restauration et mise en valeur'],
                  ['Zone', 'Marseille puis France selon les pieces']
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
                <Link className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800" href="/devis">
                  Demander un devis
                </Link>
              </div>
            </div>
          </div>
          <div className="relative min-h-[50vh] overflow-hidden bg-stone-900 lg:min-h-screen">
            <Image
              src="/images/about/about-1.webp"
              alt="Meuble restaure par Seconde Vie"
              fill
              priority
              sizes="(max-width: 1023px) 100vw, 48vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/35 via-transparent to-transparent" />
          </div>
        </div>
      </article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonLd(aboutJsonLd) }}
      />
    </>
  );
}
