import Link from 'next/link';

export const metadata = {
  title: 'Page introuvable',
  robots: {
    index: false,
    follow: true,
  },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ee] px-5 text-center text-stone-950">
      <div className="max-w-xl space-y-5">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Page introuvable</p>
        <h1 className="font-serif text-5xl leading-none">Cette page n'existe pas.</h1>
        <p className="text-sm leading-7 text-stone-600">
          Le lien a peut-etre change. La galerie reste le meilleur point de depart pour consulter les pieces publiees.
        </p>
        <Link className="inline-flex rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white" href="/">
          Retour a la galerie
        </Link>
      </div>
    </main>
  );
}
