'use client';

/** Affichage statique ; l'animation casino est pilotée par AboutMotionIsland (DOM). */
export default function AboutInstagramCounterIsland({ target }) {
  const verifiedTarget = Number(target);
  if (!Number.isFinite(verifiedTarget) || verifiedTarget <= 0) return null;

  return (
    <div
      className="about-ig-counter relative -top-4 flex items-end font-serif text-6xl leading-none tracking-tighter text-[#F9F6F0] md:text-[6.5rem]"
      aria-label={`${verifiedTarget} milliers d'abonnés Instagram`}
      data-ig-counter
      data-ig-counter-target={verifiedTarget}
    >
      <span className="about-ig-counter__value tabular-nums">{verifiedTarget.toFixed(1)}</span>
      <span className="mb-1 ml-1 font-serif text-3xl lowercase italic tracking-normal text-[#A68A64] md:mb-2 md:text-5xl">
        k
      </span>
    </div>
  );
}
