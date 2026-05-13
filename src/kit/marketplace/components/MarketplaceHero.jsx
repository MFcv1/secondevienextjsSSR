import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const HERO_CTA_PARTICLE_FALL = 8;

const HERO_CTA_PARTICLES = [
    { x0: '8%', y0: '-34%', xm: '22%', ym: '21%', x1: '41%', y1: '84%', s: '0.62px', o: 0.82, d: '-980ms', t: '1620ms' },
    { x0: '18%', y0: '-46%', xm: '32%', ym: '18%', x1: '47%', y1: '92%', s: '1.45px', o: 0.72, d: '-240ms', t: '1840ms' },
    { x0: '31%', y0: '-30%', xm: '42%', ym: '26%', x1: '50%', y1: '79%', s: '3.15px', o: 0.38, d: '-1320ms', t: '2120ms', g: '10px', gw: '22px', b: '0.15px' },
    { x0: '46%', y0: '-42%', xm: '49%', ym: '24%', x1: '51%', y1: '88%', s: '1px', o: 0.82, d: '-610ms', t: '1320ms' },
    { x0: '61%', y0: '-36%', xm: '58%', ym: '22%', x1: '54%', y1: '82%', s: '2.25px', o: 0.52, d: '-1680ms', t: '1960ms', g: '8px', gw: '17px' },
    { x0: '78%', y0: '-44%', xm: '66%', ym: '26%', x1: '58%', y1: '93%', s: '0.52px', o: 0.96, d: '-420ms', t: '1360ms' },
    { x0: '92%', y0: '-28%', xm: '75%', ym: '31%', x1: '62%', y1: '86%', s: '1.35px', o: 0.76, d: '-1180ms', t: '1720ms' },
    { x0: '-28%', y0: '10%', xm: '8%', ym: '36%', x1: '38%', y1: '78%', s: '2.55px', o: 0.44, d: '-730ms', t: '1920ms', g: '9px', gw: '18px' },
    { x0: '-34%', y0: '28%', xm: '12%', ym: '48%', x1: '43%', y1: '90%', s: '0.9px', o: 0.84, d: '-150ms', t: '1280ms' },
    { x0: '-24%', y0: '47%', xm: '18%', ym: '58%', x1: '46%', y1: '99%', s: '1.3px', o: 0.68, d: '-1440ms', t: '1600ms' },
    { x0: '-18%', y0: '68%', xm: '24%', ym: '68%', x1: '49%', y1: '103%', s: '0.65px', o: 0.92, d: '-530ms', t: '1180ms' },
    { x0: '-40%', y0: '42%', xm: '5%', ym: '60%', x1: '42%', y1: '96%', s: '3.5px', o: 0.34, d: '-1880ms', t: '2260ms', g: '12px', gw: '24px', b: '0.2px' },
    { x0: '128%', y0: '8%', xm: '92%', ym: '34%', x1: '64%', y1: '79%', s: '2.35px', o: 0.48, d: '-890ms', t: '1880ms', g: '8px', gw: '17px' },
    { x0: '134%', y0: '25%', xm: '88%', ym: '45%', x1: '59%', y1: '91%', s: '0.82px', o: 0.9, d: '-310ms', t: '1240ms' },
    { x0: '122%', y0: '45%', xm: '82%', ym: '57%', x1: '55%', y1: '98%', s: '1.25px', o: 0.72, d: '-1560ms', t: '1580ms' },
    { x0: '142%', y0: '64%', xm: '86%', ym: '67%', x1: '52%', y1: '105%', s: '0.7px', o: 0.94, d: '-650ms', t: '1160ms' },
    { x0: '116%', y0: '36%', xm: '74%', ym: '58%', x1: '63%', y1: '96%', s: '3.65px', o: 0.32, d: '-2050ms', t: '2340ms', g: '13px', gw: '26px', b: '0.2px' },
    { x0: '26%', y0: '-18%', xm: '34%', ym: '40%', x1: '44%', y1: '86%', s: '0.46px', o: 1, d: '-760ms', t: '1260ms' },
    { x0: '68%', y0: '-18%', xm: '62%', ym: '42%', x1: '57%', y1: '88%', s: '0.46px', o: 1, d: '-1260ms', t: '1220ms' },
    { x0: '4%', y0: '-8%', xm: '28%', ym: '52%', x1: '45%', y1: '94%', s: '1.45px', o: 0.6, d: '-1720ms', t: '1840ms' },
    { x0: '101%', y0: '-7%', xm: '76%', ym: '52%', x1: '58%', y1: '94%', s: '1.45px', o: 0.6, d: '-430ms', t: '1810ms' },
    { x0: '50%', y0: '-52%', xm: '50%', ym: '32%', x1: '50%', y1: '78%', s: '4.5px', o: 0.24, d: '-950ms', t: '2460ms', g: '16px', gw: '32px', b: '0.28px' },
    { x0: '-32%', y0: '4%', xm: '16%', ym: '32%', x1: '40%', y1: '88%', s: '0.5px', o: 1, d: '-360ms', t: '1180ms' },
    { x0: '132%', y0: '4%', xm: '84%', ym: '32%', x1: '61%', y1: '88%', s: '0.5px', o: 1, d: '-1090ms', t: '1200ms' },
    { x0: '14%', y0: '-20%', xm: '28%', ym: '38%', x1: '43%', y1: '87%', s: '0.38px', o: 1, d: '-90ms', t: '980ms' },
    { x0: '36%', y0: '-16%', xm: '43%', ym: '36%', x1: '48%', y1: '83%', s: '0.42px', o: 1, d: '-1370ms', t: '1010ms' },
    { x0: '64%', y0: '-14%', xm: '60%', ym: '38%', x1: '55%', y1: '85%', s: '0.4px', o: 1, d: '-560ms', t: '990ms' },
    { x0: '88%', y0: '-20%', xm: '72%', ym: '38%', x1: '60%', y1: '89%', s: '0.36px', o: 1, d: '-1720ms', t: '1040ms' },
    { x0: '-16%', y0: '16%', xm: '14%', ym: '42%', x1: '41%', y1: '82%', s: '0.44px', o: 0.96, d: '-810ms', t: '1080ms' },
    { x0: '-22%', y0: '38%', xm: '18%', ym: '54%', x1: '45%', y1: '93%', s: '0.35px', o: 1, d: '-1510ms', t: '960ms' },
    { x0: '118%', y0: '16%', xm: '84%', ym: '42%', x1: '61%', y1: '82%', s: '0.44px', o: 0.96, d: '-260ms', t: '1080ms' },
    { x0: '124%', y0: '39%', xm: '82%', ym: '55%', x1: '57%', y1: '94%', s: '0.35px', o: 1, d: '-1210ms', t: '960ms' },
    { x0: '22%', y0: '-62%', xm: '36%', ym: '24%', x1: '46%', y1: '76%', s: '5.2px', o: 0.18, d: '-1820ms', t: '2660ms', g: '18px', gw: '36px', b: '0.36px' },
    { x0: '82%', y0: '-58%', xm: '68%', ym: '25%', x1: '58%', y1: '78%', s: '4.9px', o: 0.2, d: '-680ms', t: '2600ms', g: '17px', gw: '34px', b: '0.34px' },
    { x0: '-48%', y0: '24%', xm: '0%', ym: '48%', x1: '39%', y1: '88%', s: '4.25px', o: 0.24, d: '-2140ms', t: '2740ms', g: '15px', gw: '30px', b: '0.3px' },
    { x0: '148%', y0: '24%', xm: '98%', ym: '49%', x1: '64%', y1: '88%', s: '4.15px', o: 0.26, d: '-1540ms', t: '2700ms', g: '15px', gw: '30px', b: '0.3px' },
    { x0: '7%', y0: '-48%', xm: '24%', ym: '28%', x1: '42%', y1: '92%', s: '0.62px', o: 0.9, d: '-430ms', t: '1220ms' },
    { x0: '96%', y0: '-48%', xm: '76%', ym: '28%', x1: '60%', y1: '92%', s: '0.62px', o: 0.9, d: '-1640ms', t: '1220ms' },
    { x0: '-30%', y0: '72%', xm: '18%', ym: '72%', x1: '47%', y1: '106%', s: '1.05px', o: 0.62, d: '-1020ms', t: '1420ms' },
    { x0: '132%', y0: '72%', xm: '84%', ym: '72%', x1: '54%', y1: '106%', s: '1.05px', o: 0.62, d: '-520ms', t: '1420ms' },
];

const MarketplaceHero = React.memo(function MarketplaceHero({
    darkMode,
    dynamicHeroImages,
    heroIndex,
    heroImageIndexesToLoad,
    heroBannerText,
    isDefaultGalleryHeroTitle,
    heroTitle,
    heroSubtitle,
    heroButtonLabel,
    onScrollToPieces,
    onOpenQuote,
    heroProgressSteps,
    activeHeroProgressIndex,
    slideVersion,
    onGoToSlide,
    heroDuration,
}) {
    return (
        <section className="relative flex h-[430px] w-full flex-col items-center justify-center overflow-hidden md:h-[65vh] md:min-h-[500px]">
            <div className="absolute inset-0 z-0 parallax-container">
                {dynamicHeroImages.map((img, idx) => {
                    const isActiveHeroImage = idx === heroIndex;
                    const shouldLoadHeroImage = heroImageIndexesToLoad.has(idx);

                    return (
                        <div
                            key={img.src}
                            className="absolute inset-0 h-full w-full transition-opacity duration-[1200ms] ease-in-out"
                            style={{ opacity: isActiveHeroImage ? 1 : 0 }}
                        >
                            <img
                                src={shouldLoadHeroImage ? img.src : undefined}
                                sizes="100vw"
                                alt=""
                                decoding="async"
                                fetchpriority={isActiveHeroImage ? 'high' : 'low'}
                                loading={isActiveHeroImage ? 'eager' : 'lazy'}
                                className="parallax-bg marketplace-hero-image h-full w-full object-cover md:h-[120%]"
                                style={{
                                    '--hero-object-position': img.objectPosition || 'center center',
                                    '--hero-mobile-object-position': img.mobileObjectPosition || img.objectPosition || 'center center',
                                    willChange: isActiveHeroImage ? 'transform' : 'auto',
                                }}
                            />
                        </div>
                    );
                })}
                <div className={`absolute inset-0 ${darkMode ? 'bg-black/50' : 'bg-black/25'}`} />
            </div>

            <div className="relative z-10 flex w-full max-w-4xl translate-y-5 flex-col items-center px-4 text-center md:-translate-y-12">
                {heroBannerText && (
                    <div className="mb-3.5 inline-flex max-w-[calc(100vw-2.5rem)] items-center justify-center rounded-full border border-white/30 bg-white/20 px-3.5 py-1.5 text-center text-[9px] font-bold uppercase leading-none tracking-widest text-white shadow-lg backdrop-blur-md md:mb-6 md:px-4 md:text-[10px]">
                        {heroBannerText}
                    </div>
                )}
                <div className="relative">
                    <h1 className="relative left-1/2 mb-3 w-[min(94vw,390px)] -translate-x-1/2 font-serif text-[26px] leading-[1.08] tracking-normal text-white drop-shadow-md min-[380px]:text-[28px] md:mb-5 md:w-auto md:max-w-[900px] md:text-5xl md:leading-tight lg:text-[56px]">
                        {isDefaultGalleryHeroTitle ? (
                            <>
                                <span className="block md:hidden">Mobilier ancien restauré</span>
                                <span className="hidden md:block">Mobilier ancien restauré autour</span>
                                <span className="block md:hidden">autour de Marseille</span>
                                <span className="hidden md:block">de Marseille</span>
                            </>
                        ) : (
                            heroTitle
                        )}
                    </h1>
                    <p className="mb-4 font-serif text-[14px] text-white opacity-90 drop-shadow-md min-[380px]:text-[15px] md:mb-10 md:text-2xl">
                        {heroSubtitle}
                    </p>
                    <div className="relative mx-auto flex w-full max-w-[280px] flex-col items-stretch justify-center gap-2 min-[380px]:max-w-none min-[380px]:flex-row min-[380px]:items-center md:top-[8px] md:gap-3">
                        <button
                            type="button"
                            onClick={onScrollToPieces}
                            className="hero-cta-particles hero-cta-particles--light hero-cta-particles--static group/heroCta inline-flex h-[36px] w-full items-center justify-between gap-2 rounded-full border pl-4 pr-1 text-[#1A1A1A] shadow-[0_10px_24px_rgba(0,0,0,0.14)] transition-[border-color,box-shadow,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] min-[380px]:w-auto md:h-[46px] md:gap-3 md:pl-7 md:pr-1.5 md:shadow-[0_14px_34px_rgba(0,0,0,0.16)]"
                        >
                            <span className="whitespace-nowrap font-sans text-[7.5px] font-black uppercase tracking-[0.16em] md:text-[10px] md:tracking-[0.21em]">
                                {heroButtonLabel}
                            </span>
                            <span className="hero-cta-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#1A1A1A]/12 bg-[#F6F2EC] text-[#1A1A1A] md:h-9 md:w-9">
                                <ArrowUpRight className="hero-cta-arrow" size={14} strokeWidth={1.7} />
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={onOpenQuote}
                            className="hero-cta-particles hero-cta-particles--glass group/heroCta inline-flex h-[36px] w-full items-center justify-between gap-2 rounded-full border pl-4 pr-1 text-white shadow-[0_10px_24px_rgba(0,0,0,0.10)] backdrop-blur-sm transition-[border-color,box-shadow,background-color] duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] min-[380px]:w-auto md:h-[46px] md:gap-3 md:pl-7 md:pr-1.5 md:shadow-[0_14px_34px_rgba(0,0,0,0.10)]"
                        >
                            <span className="hero-cta-particle-field" aria-hidden="true">
                                {HERO_CTA_PARTICLES.map((particle, particleIndex) => (
                                    <span
                                        key={particleIndex}
                                        className="hero-cta-particle"
                                        style={{
                                            '--particle-x0': particle.x0,
                                            '--particle-y0': particle.y0,
                                            '--particle-xm': particle.xm,
                                            '--particle-ym': particle.ym,
                                            '--particle-x1': particle.x1,
                                            '--particle-y1': `${parseFloat(particle.y1) + HERO_CTA_PARTICLE_FALL}%`,
                                            '--particle-size': particle.s,
                                            '--particle-opacity': particle.o,
                                            '--particle-delay': particle.d,
                                            '--particle-duration': particle.t,
                                            '--particle-glow': particle.g || '5px',
                                            '--particle-glow-wide': particle.gw || '12px',
                                            '--particle-blur': particle.b || '0px',
                                        }}
                                    />
                                ))}
                            </span>
                            <span className="whitespace-nowrap font-sans text-[7.5px] font-black uppercase tracking-[0.16em] md:text-[10px] md:tracking-[0.21em]">
                                Faire un devis
                            </span>
                            <span className="hero-cta-icon flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/35 bg-white/10 text-white md:h-9 md:w-9">
                                <ArrowUpRight className="hero-cta-arrow" size={14} strokeWidth={1.7} />
                            </span>
                        </button>
                    </div>
                </div>

                <div className="mt-7 flex items-center gap-2 md:mt-10 md:gap-3">
                    {heroProgressSteps.map((step) => {
                        const isActive = step.index === activeHeroProgressIndex;
                        const isComplete = step.end <= heroIndex;
                        const progressFrom = Math.max(0, Math.min(1, (heroIndex - step.start) / step.span));
                        const progressTo = Math.max(0, Math.min(1, (heroIndex - step.start + 1) / step.span));

                        return (
                            <button
                                key={step.index}
                                onClick={() => onGoToSlide(step.start)}
                                className="relative h-[2px] overflow-hidden rounded-full bg-white/30 transition-all duration-500 md:h-[3px]"
                                style={{ width: isActive ? '34px' : '18px' }}
                                aria-label={`Slides ${step.start + 1} à ${step.end}`}
                            >
                                <div
                                    key={isActive ? `active-${step.index}-${heroIndex}-${slideVersion}` : step.index}
                                    className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-white"
                                    style={isActive
                                        ? {
                                            '--hero-progress-from': progressFrom,
                                            '--hero-progress-to': progressTo,
                                            animation: `hero-segment-progress ${heroDuration}ms linear forwards`,
                                        }
                                        : { transform: isComplete ? 'scaleX(1)' : 'scaleX(0)' }
                                    }
                                />
                            </button>
                        );
                    })}
                </div>
            </div>
        </section>
    );
});

export default MarketplaceHero;
