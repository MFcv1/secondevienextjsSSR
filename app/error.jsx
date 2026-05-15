'use client';

import { useEffect } from 'react';

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f3ee] px-5 text-center text-stone-950">
      <div className="max-w-xl space-y-5">
        <p className="text-[11px] font-black uppercase tracking-[0.28em] text-stone-500">Erreur</p>
        <h1 className="font-serif text-5xl leading-none">La page n'a pas pu etre chargee.</h1>
        <p className="text-sm leading-7 text-stone-600">
          Vous pouvez reessayer ou revenir a la galerie si le probleme persiste.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-bold text-white"
            type="button"
            onClick={reset}
          >
            Reessayer
          </button>
          <a className="rounded-full border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800" href="/">
            Retour a la galerie
          </a>
        </div>
      </div>
    </main>
  );
}
