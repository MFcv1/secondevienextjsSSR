const ABOUT_CRITICAL_CSS = `
.sv4-about-shell {
  --c-bone: #FAF6EF;
  --c-espresso: #1A130C;
  --r-pill: 9999px;
  --f-display: var(--font-cormorant), 'Cormorant Garamond', Georgia, serif;
  --f-body: var(--font-plus-jakarta), 'Plus Jakarta Sans', system-ui, sans-serif;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --dur-reveal: 900ms;
  --content-px: clamp(20px, 4vw, 64px);
  background: #f9f6f0;
  color: #1a1a1a;
  font-family: var(--f-body);
  min-height: 100vh;
  overflow-x: clip;
  -webkit-font-smoothing: antialiased;
}
.sv4-about-shell a { color: inherit; text-decoration: none; }
.sv4-about-shell img { display: block; max-width: 100%; }
.sv4-about-shell h1,
.sv4-about-shell h2,
.sv4-about-shell h3,
.sv4-about-shell p { margin: 0; }
.sv4-about-shell .sv4-nav {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 48px);
  max-width: 1400px;
  z-index: 1000;
  color: var(--c-bone);
  border: 0;
  border-radius: var(--r-pill);
  background: radial-gradient(150% 100% at 50% 0%, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 100%), rgba(255,255,255,0.02);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  backdrop-filter: blur(40px) saturate(200%);
  box-shadow: 0 24px 64px -12px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 1px rgba(255,255,255,0.6), inset 0 -1px 2px rgba(0,0,0,0.2);
}
.sv4-about-shell .sv4-nav__inner {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px 0 20px;
}
.sv4-about-shell .sv4-nav__logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: var(--c-bone);
}
.sv4-about-shell .sv4-nav__logo img {
  height: 32px;
  width: auto;
  object-fit: contain;
  filter: brightness(0) invert(1);
}
.sv4-about-shell .sv4-nav__logo-text {
  font-family: var(--f-display);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: 0.02em;
  margin-top: 2px;
}
.sv4-about-shell .sv4-nav__center,
.sv4-about-shell .sv4-nav__right {
  display: flex;
  align-items: center;
}
.sv4-about-shell .sv4-nav__center { gap: 48px; }
.sv4-about-shell .sv4-nav__link {
  position: relative;
  padding: 4px 0;
  color: var(--c-bone);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.7;
}
.sv4-about-shell .sv4-nav__cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  color: var(--c-bone);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: var(--r-pill);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.15);
}
.sv4-about-shell .sv4-btn-text-mask {
  display: inline-block;
  position: relative;
  overflow: hidden;
  vertical-align: top;
}
.sv4-about-shell .sv4-btn-text-inner { display: inline-block; position: relative; }
.sv4-about-shell .sv4-nav__burger,
.sv4-about-shell .sv4-mobile-menu { display: none; }
.sv4-about-shell .sv4-hero {
  position: relative;
  display: flex;
  min-height: 100svh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 140px var(--content-px) 110px;
  text-align: center;
}
.sv4-about-shell .sv4-hero__bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  background: var(--c-espresso);
}
.sv4-about-shell .sv4-hero__video {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  filter: brightness(0.85) saturate(0.95);
  transform: scale(1.02);
  transition: opacity 1.2s ease-in-out, filter 1.2s ease;
}
.sv4-about-shell .sv4-hero__video.is-active { opacity: 1; }
.sv4-about-shell .sv4-hero__overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  mix-blend-mode: multiply;
  background: linear-gradient(to bottom, rgba(20,15,10,0.3) 0%, rgba(20,15,10,0.1) 40%, rgba(20,15,10,0.85) 100%), radial-gradient(circle at center, transparent 0%, rgba(10,5,0,0.45) 100%);
}
.sv4-about-shell .sv4-hero__content {
  position: relative;
  z-index: 2;
  display: flex;
  width: 100%;
  max-width: 900px;
  flex-direction: column;
  align-items: center;
}
.sv4-about-shell .sv4-hero__title {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1em;
  color: var(--c-bone);
  font-family: var(--f-display);
  font-size: clamp(3rem, 7vw, 7rem);
  font-weight: 400;
  line-height: 1.12;
  letter-spacing: -0.03em;
  text-wrap: balance;
}
.sv4-about-shell .sv4-hero__title-row {
  display: flex;
  width: 100%;
  max-width: 100%;
  align-items: center;
  justify-content: center;
  gap: 0 0.28em;
  padding-bottom: 0.06em;
}
.sv4-about-shell .sv4-split-word {
  display: inline-block;
  overflow: hidden;
  padding-bottom: 0.16em;
  margin-bottom: 0.02em;
  vertical-align: bottom;
}
.sv4-about-shell .sv4-split-word > span {
  display: inline-block;
  animation: sv4-critical-rise var(--dur-reveal) var(--ease) both;
  animation-delay: calc(var(--i, 0) * 80ms);
}
@keyframes sv4-critical-rise {
  from { opacity: 0; transform: translate3d(0, 115%, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
}
.sv4-about-shell .sv4-hero__sub {
  max-width: 68ch;
  margin: 48px auto 0;
  color: rgba(250,246,239,0.95);
  font-family: var(--f-display);
  font-size: clamp(18px, 1.5vw, 22px);
  font-style: italic;
  font-weight: 400;
  line-height: 1.6;
  letter-spacing: 0.02em;
  text-align: center;
  text-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.sv4-about-shell .sv4-hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 48px;
}
.sv4-about-shell .sv4-hero__btn-primary,
.sv4-about-shell .sv4-hero__btn-ghost {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 16px 36px;
  border-radius: var(--r-pill);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.sv4-about-shell .sv4-hero__btn-primary {
  color: var(--c-espresso) !important;
  background: radial-gradient(100% 100% at 20% 0%, rgba(250,246,239,0.95) 0%, rgba(220,215,205,0.7) 100%);
  box-shadow: 0 12px 32px -8px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.6), inset 0 1px 2px rgba(255,255,255,1), inset 0 -2px 4px rgba(0,0,0,0.1);
}
.sv4-about-shell .sv4-hero__btn-ghost {
  color: #fff !important;
  background: radial-gradient(120% 120% at 10% 0%, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%), rgba(255,255,255,0.01);
  -webkit-backdrop-filter: blur(40px) saturate(200%);
  backdrop-filter: blur(40px) saturate(200%);
  box-shadow: 0 16px 32px -10px rgba(0,0,0,0.3), inset 0 0 0 1px rgba(255,255,255,0.15), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 2px rgba(0,0,0,0.1);
}
.sv4-about-shell .sv4-hero__btn-ghost span { color: #fff !important; }
.sv4-about-shell .sv4-hero__scroll-hint {
  position: absolute;
  bottom: 36px;
  left: 50%;
  z-index: 2;
  display: flex;
  transform: translateX(-50%);
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(250,246,239,0.4);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}
.sv4-about-shell .sv4-hero__scroll-line {
  width: 1px;
  height: 48px;
  background: linear-gradient(to bottom, rgba(250,246,239,0.4), transparent);
}
@media (max-width: 767px) {
  .sv4-about-shell .sv4-nav__center,
  .sv4-about-shell .sv4-nav__right { display: none; }
  .sv4-about-shell .sv4-nav__inner { height: 56px; }
  .sv4-about-shell .sv4-nav__burger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    margin-right: -6px;
    padding: 0;
    border: none;
    background: transparent;
    color: var(--c-bone);
  }
  .sv4-about-shell .sv4-nav__burger-lines {
    position: relative;
    display: block;
    width: 20px;
    height: 13px;
  }
  .sv4-about-shell .sv4-nav__burger-lines span {
    position: absolute;
    left: 0;
    width: 100%;
    height: 1.5px;
    border-radius: 2px;
    background: currentColor;
  }
  .sv4-about-shell .sv4-nav__burger-lines span:nth-child(1) { top: 3px; }
  .sv4-about-shell .sv4-nav__burger-lines span:nth-child(2) { top: 9px; }
  .sv4-about-shell .sv4-hero {
    min-height: 100svh;
    padding: 110px 20px 112px;
  }
  .sv4-about-shell .sv4-hero__content {
    width: 100%;
    max-width: 100%;
  }
  .sv4-about-shell .sv4-hero__title {
    width: 100%;
    max-width: none;
    font-size: clamp(2.85rem, 10.5vw, 3.8rem);
    line-height: 1.14;
    gap: 0.12em;
  }
  .sv4-about-shell .sv4-hero__title-row {
    gap: 0 0.32em;
    padding-bottom: 0.08em;
  }
  .sv4-about-shell .sv4-hero__sub {
    width: 100%;
    max-width: min(20rem, 86vw);
    margin: 24px auto 32px;
    font-size: clamp(15px, 3.9vw, 17px);
    line-height: 1.55;
  }
  .sv4-about-shell .sv4-hero__actions { flex-direction: column; }
  .sv4-about-shell .sv4-hero__scroll-hint {
    bottom: max(20px, env(safe-area-inset-bottom, 20px));
    gap: 6px;
  }
  .sv4-about-shell .sv4-hero__scroll-line { height: 36px; }
}
`;

export default function AboutCriticalStyles() {
  return <style dangerouslySetInnerHTML={{ __html: ABOUT_CRITICAL_CSS }} />;
}
