/**
 * Archived: former À propos hero (HeroSection from AboutServerView).
 * Replaced on 2026-06-26 by the home V4 cinematic hero (Sv4HomeHero).
 *
 * GSAP hooks lived in AboutMotionIsland.animateHero (.about-hero, .hero-text, blobs…).
 */

function HeroSection({ hero }) {
  const textureStyle = {
    backgroundImage:
      'radial-gradient(circle at 16% 18%, rgba(255,255,255,0.55) 0 1px, transparent 1px), radial-gradient(circle at 70% 54%, rgba(255,255,255,0.32) 0 1px, transparent 1px)',
    backgroundSize: '17px 17px, 29px 29px',
  };

  return (
    <section className="about-hero relative flex min-h-[100svh] w-full flex-col bg-[#F9F6F0] p-3 md:p-5 lg:p-7">
      <div className="relative z-20 flex w-full flex-grow items-center overflow-hidden rounded-2xl bg-[#1A1A1A] shadow-[0_30px_60px_rgba(0,0,0,0.3)] md:rounded-3xl">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <div className="hero-bg-parallax absolute -top-[10%] h-[120%] w-full">
            <img
              src={hero.image}
              sizes="100vw"
              alt="Atelier Seconde Vie par Anais"
              className="hero-bg-scale absolute inset-0 h-full w-full origin-center object-cover object-[75%_center] opacity-100 brightness-[1.1] contrast-[1.05] saturate-[1.1] md:object-center"
              fetchPriority="high"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#171614]/90 via-[#171614]/60 to-transparent lg:via-[#171614]/40" />
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#1A1A1A] to-transparent md:h-32" />
          </div>
          <div className="absolute inset-0 z-10 opacity-10 mix-blend-overlay" style={textureStyle} />
          <div className="arch-line absolute bottom-0 left-[10%] top-0 z-10 hidden w-px origin-top bg-[#F9F6F0]/10 md:block" />
          <div className="arch-line absolute left-0 right-0 top-[20%] z-10 hidden h-px origin-left bg-[#F9F6F0]/10 md:block" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden mix-blend-normal xl:overflow-visible">
          <div
            className="floating-blob blob-fast absolute right-[-5%] top-[5%] z-40 aspect-[3/4] w-[30vw] overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.6)] will-change-transform md:right-[2%] md:top-[10%] md:w-[20vw] xl:w-[18vw]"
            style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
          >
            <img src="/images/hero/hero-blob-1.webp" alt="Commode restauree" className="absolute -left-[10%] -top-[10%] h-[120%] w-[120%] object-cover brightness-110" />
            <div className="absolute inset-0 bg-[#A68A64]/10 mix-blend-color-burn" />
          </div>
          <div
            className="floating-blob blob-fast absolute bottom-[-2%] left-[-5%] z-20 h-[30vw] w-[22vw] overflow-hidden drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)] will-change-transform md:-left-[2%] md:bottom-[2%] md:h-[16vw] md:w-[12vw] xl:left-[2%] xl:h-[18vw] xl:w-[14vw]"
            style={{ borderRadius: '50% / 20% 80% 20% 80%' }}
          >
            <img src="/images/hero/hero-blob-2.webp" alt="Detail de meuble restaure" className="relative -left-[10%] h-[120%] w-[120%] object-cover" />
          </div>
          <div
            className="floating-blob blob-slow absolute right-[-5%] top-[72%] z-40 h-[28vw] w-[35vw] overflow-hidden shadow-2xl will-change-transform md:right-[15%] md:top-[65%] md:h-[16vw] md:w-[22vw] xl:right-[18%]"
            style={{ borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%' }}
          >
            <img src="/images/hero/hero-blob-3.webp" alt="Buffet restaure terracotta" className="h-full w-full scale-110 object-cover" />
          </div>
        </div>

        <div className="relative z-40 mx-auto w-full max-w-[1600px] px-6 pt-24 md:px-12 md:pt-0 lg:px-20">
          <div className="z-50 flex max-w-[700px] flex-col justify-center">
            <div className="hero-text mb-8 flex w-full gap-4 md:mb-10 md:items-center">
              <div className="mt-[10px] h-[2px] w-8 shrink-0 bg-[#C17767] md:mt-0 md:w-12" />
              <span className="font-sans text-[10px] font-bold uppercase leading-relaxed tracking-[0.2em] text-[#C17767] md:text-sm md:tracking-[0.3em]">
                {hero.eyebrow}
              </span>
            </div>
            <h1 className="hero-text mb-8 ml-[-5px] font-serif text-5xl leading-[0.95] tracking-tighter text-[#F9F6F0] md:text-7xl lg:text-[7.5rem]">
              {hero.title} <br />
              <span className="font-light italic text-[#A68A64]">{hero.highlight}</span>.
            </h1>
            <p className="hero-text mb-10 max-w-[50ch] border-l border-[#A68A64]/30 pl-4 font-sans text-base font-light leading-relaxed text-[#B3AEA3] text-pretty md:mb-12 md:pl-6 md:text-xl">
              {hero.description}
            </p>
            <div className="hero-text pt-4">
              <a href="/galerie" className="group relative flex w-fit cursor-pointer items-center justify-center overflow-hidden rounded-full border border-[#F9F6F0]/20 bg-[#1A1A1A]/50 px-8 py-4 outline-none backdrop-blur-sm transition-all hover:border-[#F9F6F0] md:px-10 md:py-5">
                <span className="relative z-10 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-[#F9F6F0] transition-colors duration-500 group-hover:text-[#1A1A1A] md:text-sm">
                  {hero.cta}
                </span>
                <span className="absolute inset-0 -translate-y-[101%] bg-[#F9F6F0] transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:translate-y-0" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;