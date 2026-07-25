import React from 'react';
import Link from 'next/link';
import HeroVideoSliderIsland from '../../../app/HeroVideoSliderIsland';

const HERO_DESCRIPTION = "Nous chinons, restaurons et sublimons des pièces de caractère. Un artisanat d'art en Provence, pour un intérieur qui a du sens.";

function SplitText({ text, startIndex = 0 }) {
  const words = text.split(' ');
  return (
    <>
      {words.map((word, i) => (
        <span className="sv4-split-word" key={`${word}-${startIndex + i}`}>
          <span style={{ '--i': startIndex + i }}>{word}</span>
        </span>
      ))}
    </>
  );
}

function InkRevealText({ text }) {
  let letterIndex = 0;
  const words = text.trim().split(/\s+/);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span className="sv4-ink-copy" aria-hidden="true">
        {words.map((word, wordIndex) => {
          const letters = Array.from(word).map((letter) => {
            const index = letterIndex;
            const tilt = ((index % 5) - 2) * 0.35;
            const rise = 0.08 + (index % 3) * 0.025;
            letterIndex += 1;

            return (
              <span
                className="sv4-ink-char"
                data-char={letter}
                key={`${wordIndex}-${index}`}
                style={{
                  '--ink-i': index,
                  '--ink-rise': `${rise}em`,
                  '--ink-tilt': `${tilt}deg`,
                }}
              >
                {letter}
              </span>
            );
          });

          letterIndex += 1;

          return (
            <React.Fragment key={`${word}-${wordIndex}`}>
              <span className="sv4-ink-word">{letters}</span>
              {wordIndex < words.length - 1 ? ' ' : null}
            </React.Fragment>
          );
        })}
      </span>
    </>
  );
}

/**
 * Cinematic home V4 hero — shared between / and /a-propos.
 */
export default function Sv4HomeHero({ withAboutShell = false }) {
  const hero = (
    <header className="sv4-hero" data-nav-theme="dark">
      <HeroVideoSliderIsland />

      <div className="sv4-hero__content">
        <h1 className="sv4-hero__title" aria-label="Donner une nouvelle âme au mobilier d'hier">
          <span className="sv4-hero__title-row">
            <SplitText text="Donner une nouvelle âme" />
          </span>
          <span className="sv4-hero__title-row">
            <SplitText text="au mobilier d'hier" startIndex={4} />
          </span>
        </h1>
        <p className="sv4-hero__sub sv4-hero__sub--ink">
          <InkRevealText text={HERO_DESCRIPTION} />
        </p>
        <div className="sv4-hero__actions sv4-reveal">
          <Link href="/" className="sv4-hero__btn-primary sv4-btn-reveal">
            <span className="sv4-btn-text-mask">
              <span className="sv4-btn-text-inner" data-text="Découvrir la collection">
                Découvrir la collection
              </span>
            </span>
            <svg className="sv4-btn-icon-flat" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link href="/devis" className="sv4-hero__btn-ghost sv4-btn-reveal">
            <span className="sv4-btn-text-mask">
              <span className="sv4-btn-text-inner" data-text="Confier un meuble">
                Confier un meuble
              </span>
            </span>
          </Link>
        </div>
      </div>

      <div className="sv4-hero__scroll-hint">
        <span>Découvrir</span>
        <div className="sv4-hero__scroll-line" />
      </div>
    </header>
  );

  if (!withAboutShell) {
    return hero;
  }

  return (
    <div className="about-sv4-hero-shell" data-about-sv4-hero>
      {hero}
    </div>
  );
}
