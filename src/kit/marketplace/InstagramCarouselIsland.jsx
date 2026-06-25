'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, AtSign, Bookmark, ChevronLeft, ChevronRight, Heart, Instagram, MessageCircle, Send, Sparkles } from 'lucide-react';

const INSTAGRAM_URL = 'https://www.instagram.com/secondevie_anais';
const INSTAGRAM_FOLLOWERS_TARGET = 38.9;
const MIN_INSTA_CARDS = 5;

const requestIdle = (callback, timeout = 1200) => {
  if (typeof window === 'undefined') return undefined;
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, { timeout });
  }
  return window.setTimeout(callback, Math.min(timeout, 900));
};

const cancelIdle = (handle) => {
  if (handle === undefined || typeof window === 'undefined') return;
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(handle);
    return;
  }
  window.clearTimeout(handle);
};

const MOBILE_INSTA_POSITIONS = {
  farLeft: { transform: 'translateX(-206%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
  left: { transform: 'translateX(-116%) scale(0.9)', opacity: 0.42, zIndex: 1, pointerEvents: 'none' },
  center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
  right: { transform: 'translateX(16%) scale(0.9)', opacity: 0.46, zIndex: 1, pointerEvents: 'none' },
  farRight: { transform: 'translateX(106%) scale(0.86)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
};

const DESKTOP_INSTA_POSITIONS = {
  farLeft: { transform: 'translateX(-248%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
  left: { transform: 'translateX(-145%) scale(0.92)', opacity: 0.52, zIndex: 1, pointerEvents: 'none' },
  center: { transform: 'translateX(-50%) scale(1)', opacity: 1, zIndex: 3, pointerEvents: 'auto' },
  right: { transform: 'translateX(45%) scale(0.92)', opacity: 0.58, zIndex: 1, pointerEvents: 'none' },
  farRight: { transform: 'translateX(148%) scale(0.88)', opacity: 0, zIndex: 0, pointerEvents: 'none' },
};

const FLOATING_INSTAGRAM_TOKENS = [
  {
    id: 'gram',
    label: 'Instagram',
    Icon: Instagram,
    className: 'instagram-floating-token--gram',
    style: {
      '--float-x': '6%',
      '--float-y': '19%',
      '--float-size': '140px',
      '--float-delay': '80ms',
      '--float-enter-duration': '680ms',
      '--float-arrive-x': '-10px',
      '--float-arrive-y': '54px',
      '--float-drift-x': '13px',
      '--float-drift-y': '-18px',
      '--float-rotate-start': '-12deg',
      '--float-rotate-end': '9deg',
      '--float-duration': '7.4s',
    },
  },
  {
    id: 'heart',
    label: 'Coeur',
    Icon: Heart,
    className: 'instagram-floating-token--heart',
    style: {
      '--float-x': '16%',
      '--float-y': '63%',
      '--float-size': '108px',
      '--float-delay': '760ms',
      '--float-enter-duration': '600ms',
      '--float-arrive-x': '-12px',
      '--float-arrive-y': '48px',
      '--float-drift-x': '-10px',
      '--float-drift-y': '-15px',
      '--float-rotate-start': '10deg',
      '--float-rotate-end': '-8deg',
      '--float-duration': '8.2s',
    },
  },
  {
    id: 'spark',
    label: 'Etincelle',
    Icon: Sparkles,
    className: 'instagram-floating-token--spark',
    style: {
      '--float-x': '27%',
      '--float-y': '24%',
      '--float-size': '64px',
      '--float-delay': '190ms',
      '--float-enter-duration': '540ms',
      '--float-arrive-x': '8px',
      '--float-arrive-y': '42px',
      '--float-drift-x': '8px',
      '--float-drift-y': '-13px',
      '--float-rotate-start': '-20deg',
      '--float-rotate-end': '14deg',
      '--float-duration': '6.9s',
    },
  },
  {
    id: 'message',
    label: 'Commentaire',
    Icon: MessageCircle,
    className: 'instagram-floating-token--message',
    style: {
      '--float-x': '75%',
      '--float-y': '28%',
      '--float-size': '132px',
      '--float-delay': '460ms',
      '--float-enter-duration': '660ms',
      '--float-arrive-x': '12px',
      '--float-arrive-y': '50px',
      '--float-drift-x': '-12px',
      '--float-drift-y': '-17px',
      '--float-rotate-start': '14deg',
      '--float-rotate-end': '-10deg',
      '--float-duration': '7.8s',
    },
  },
  {
    id: 'send',
    label: 'Partage',
    Icon: Send,
    className: 'instagram-floating-token--send',
    style: {
      '--float-x': '90%',
      '--float-y': '18%',
      '--float-size': '52px',
      '--float-delay': '310ms',
      '--float-enter-duration': '500ms',
      '--float-arrive-x': '8px',
      '--float-arrive-y': '34px',
      '--float-drift-x': '-7px',
      '--float-drift-y': '-11px',
      '--float-rotate-start': '-18deg',
      '--float-rotate-end': '11deg',
      '--float-duration': '6.4s',
    },
  },
  {
    id: 'save',
    label: 'Favori',
    Icon: Bookmark,
    className: 'instagram-floating-token--save',
    style: {
      '--float-x': '88%',
      '--float-y': '61%',
      '--float-size': '98px',
      '--float-delay': '940ms',
      '--float-enter-duration': '620ms',
      '--float-arrive-x': '14px',
      '--float-arrive-y': '52px',
      '--float-drift-x': '11px',
      '--float-drift-y': '-16px',
      '--float-rotate-start': '18deg',
      '--float-rotate-end': '-9deg',
      '--float-duration': '8.6s',
    },
  },
  {
    id: 'at',
    label: 'Mention',
    Icon: AtSign,
    className: 'instagram-floating-token--at',
    style: {
      '--float-x': '82%',
      '--float-y': '73%',
      '--float-size': '50px',
      '--float-delay': '1120ms',
      '--float-enter-duration': '520ms',
      '--float-arrive-x': '6px',
      '--float-arrive-y': '40px',
      '--float-drift-x': '-8px',
      '--float-drift-y': '-10px',
      '--float-rotate-start': '-8deg',
      '--float-rotate-end': '13deg',
      '--float-duration': '7.1s',
    },
  },
];

const normalizePosts = (posts) => {
  const source = Array.isArray(posts) ? posts.filter(Boolean) : [];
  if (!source.length) return [];
  const slotCount = Math.max(MIN_INSTA_CARDS, source.length);
  return Array.from({ length: slotCount }, (_, index) => ({
    ...source[index % source.length],
    carouselSlotId: `insta-slot-${index}`,
  }));
};

const wrapIndex = (index, count) => (index + count) % count;

const InstagramFollowerCount = ({ darkMode, compact = false, className = '' }) => (
  <div className={`flex flex-col ${compact ? 'items-center' : 'items-center md:items-end'} ${className}`}>
    <div className={`flex origin-bottom translate-y-[-5px] scale-[1.045] items-end font-serif leading-none tracking-normal ${compact ? 'text-[48px]' : 'text-[58px] md:text-[68px]'} ${darkMode ? 'text-[#F9F6F0]' : 'text-[#1A1A1A]'}`}>
      <span>{INSTAGRAM_FOLLOWERS_TARGET.toFixed(1)}</span>
      <span className={`${compact ? 'mb-1 ml-1 text-[25px]' : 'mb-1.5 ml-1 text-[30px] md:text-[38px]'} italic lowercase tracking-normal text-[#A68A64]`}>
        k
      </span>
    </div>
    <p className={`${compact ? 'mt-[15px]' : 'mt-[13px]'} font-sans text-[9px] font-black uppercase tracking-[0.24em] ${darkMode ? 'text-white/55' : 'text-[#8f8579]'}`}>
      abonnes Instagram
    </p>
  </div>
);

const InstagramFloatingTokens = ({ active = false, settled = false, darkMode = false } = {}) => (
  <div
    className={`instagram-floating-field ${darkMode ? 'instagram-floating-field--dark' : ''}`}
    data-floating-ready={active ? 'true' : 'false'}
    data-floating-settled={settled ? 'true' : 'false'}
    aria-hidden="true"
  >
    {FLOATING_INSTAGRAM_TOKENS.map(({ id, label, Icon, className, style }) => (
      <span key={id} className={`instagram-floating-token ${className}`} style={style}>
        <span className="instagram-floating-token__shell">
          <span className="instagram-floating-token__shine" />
          <Icon className="instagram-floating-token__icon" strokeWidth={1.8} aria-label={label} />
        </span>
      </span>
    ))}
  </div>
);

export default function InstagramCarouselIsland({ darkMode = false, posts = [] } = {}) {
  const dynamicInsta = useMemo(() => normalizePosts(posts), [posts]);
  const [activeInstaIndex, setActiveInstaIndex] = useState(1);
  const [floatingTokensReady, setFloatingTokensReady] = useState(false);
  const [floatingTokensSettled, setFloatingTokensSettled] = useState(false);
  const sectionRef = useRef(null);
  const dragStartRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || floatingTokensReady) return undefined;
    let disposed = false;
    let idleHandle;
    let delayHandle;
    let settleHandle;

    const activateTokens = () => {
      if (disposed) return;
      setFloatingTokensReady(true);
      settleHandle = window.setTimeout(() => {
        if (!disposed) setFloatingTokensSettled(true);
      }, 2200);
    };

    const scheduleTokenActivation = () => {
      window.clearTimeout(delayHandle);
      cancelIdle(idleHandle);
      delayHandle = window.setTimeout(() => {
        idleHandle = requestIdle(activateTokens, 1400);
      }, 90);
    };

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      scheduleTokenActivation();
      return () => {
        disposed = true;
        window.clearTimeout(delayHandle);
        window.clearTimeout(settleHandle);
        cancelIdle(idleHandle);
      };
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        scheduleTokenActivation();
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );

    observer.observe(section);

    return () => {
      disposed = true;
      observer.disconnect();
      window.clearTimeout(delayHandle);
      window.clearTimeout(settleHandle);
      cancelIdle(idleHandle);
    };
  }, [floatingTokensReady]);

  if (!dynamicInsta.length) return null;

  const goToInsta = (index) => setActiveInstaIndex((current) => wrapIndex(typeof index === 'function' ? index(current) : index, dynamicInsta.length));
  const handlePointerDown = (event) => {
    dragStartRef.current = event.clientX;
  };
  const handlePointerUp = (event) => {
    if (dragStartRef.current === null) return;
    const delta = event.clientX - dragStartRef.current;
    dragStartRef.current = null;
    if (delta < -42) goToInsta((current) => current + 1);
    if (delta > 42) goToInsta((current) => current - 1);
  };
  const getPositioned = (positions) => dynamicInsta.map((post, index) => {
    const offset = (index - activeInstaIndex + dynamicInsta.length) % dynamicInsta.length;
    let position = 'farRight';
    if (offset === 0) position = 'center';
    else if (offset === 1) position = 'right';
    else if (offset === dynamicInsta.length - 1) position = 'left';
    else if (offset > dynamicInsta.length / 2) position = 'farLeft';
    return { post, index, position, style: positions[position] };
  });

  const renderCard = ({ post, index, position, style }, desktop = false) => {
    const isCenter = position === 'center';
    return (
      <article
        key={`${desktop ? 'desktop' : 'mobile'}-${post.carouselSlotId}`}
        style={style}
        className={`absolute left-1/2 top-0 overflow-hidden shadow-[0_24px_60px_rgba(32,26,20,0.13)] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          desktop
            ? 'top-2 w-[min(26vw,312px)] rounded-[28px] xl:w-[min(25vw,340px)] xl:rounded-[34px]'
            : 'w-[62vw] max-w-[226px] rounded-[22px] md:max-w-[250px]'
        } ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}
        aria-hidden={!isCenter}
      >
        <div className="aspect-[4/5] overflow-hidden bg-stone-100">
          <img
            src={post.img}
            sizes={desktop ? '(min-width: 1280px) 340px, 26vw' : '(min-width: 768px) 250px, 62vw'}
            alt={post.title}
            loading="lazy"
            decoding="async"
            className={`h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${isCenter ? 'scale-100' : 'scale-[1.03]'}`}
          />
        </div>
        <div className={`relative min-h-[88px] px-4 pb-5 pt-4 text-left ${desktop ? 'xl:min-h-[96px] xl:px-6 xl:pb-6 xl:pt-5' : ''} ${darkMode ? 'bg-zinc-900' : 'bg-white'}`}>
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#A68A64] md:text-[9px] md:tracking-[0.2em]">
            {post.label}
          </p>
          <h3 className={`mt-1.5 pr-12 font-serif text-[20px] leading-tight tracking-normal md:mt-2 md:text-[23px] xl:pr-14 xl:text-[26px] ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
            {post.title}
          </h3>
          <button
            type="button"
            tabIndex={isCenter ? 0 : -1}
            className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full shadow-[0_14px_30px_rgba(32,26,20,0.12)] transition-transform duration-300 hover:-translate-y-0.5 active:scale-95 xl:right-5 xl:top-5 xl:h-12 xl:w-12 ${darkMode ? 'bg-white/10 text-white' : 'bg-white text-[#9A714C]'}`}
            aria-label="Ajouter aux favoris"
          >
            <Heart size={desktop ? 20 : 18} strokeWidth={1.8} />
          </button>
        </div>
      </article>
    );
  };

  return (
    <section ref={sectionRef} className="relative isolate overflow-hidden px-0 pb-[86px] pt-[48px] md:px-6 md:py-[72px] lg:px-[5vw] lg:py-[78px] xl:py-[86px]">
      <InstagramFloatingTokens active={floatingTokensReady} settled={floatingTokensSettled} darkMode={darkMode} />
      <div className="relative z-10 lg:hidden">
        <div className="mx-auto max-w-[430px] px-5 text-center">
          <div className="mb-8 flex items-center justify-center gap-3">
            <span className="h-px w-8 bg-[#A68A64]" />
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#A68A64]">Lifestyle & Atelier</span>
            <span className="h-px w-8 bg-[#A68A64]" />
          </div>
          <h2 className={`font-serif text-[38px] leading-[1.02] tracking-normal ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
            Nous aussi on vous aime
          </h2>
          <div className="mt-5 flex flex-col items-center gap-5">
            <InstagramFollowerCount darkMode={darkMode} compact />
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`mx-auto flex h-[48px] w-full max-w-[286px] items-center justify-between rounded-full border pl-4 pr-1.5 shadow-[0_14px_36px_rgba(32,26,20,0.08)] transition-colors ${darkMode ? 'border-white/10 bg-white/5 text-white' : 'border-stone-200 bg-white text-[#1A1A1A]'}`}>
              <Instagram size={16} strokeWidth={1.8} />
              <span className="text-[9px] font-black uppercase tracking-[0.2em]">Rejoindre Instagram</span>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${darkMode ? 'bg-white text-black' : 'bg-[#1A1A1A] text-white'}`}>
                <ArrowUpRight size={16} strokeWidth={2.1} />
              </span>
            </a>
          </div>
        </div>
        <div
          className="relative mx-auto mt-12 h-[432px] max-w-[430px] overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing md:h-[462px] md:max-w-[560px]"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {getPositioned(MOBILE_INSTA_POSITIONS).map((entry) => renderCard(entry))}
        </div>
        <div className="mx-auto mt-8 flex max-w-[220px] items-center justify-center gap-4 px-5">
          {dynamicInsta.map((_, index) => (
            <button key={index} type="button" onClick={() => goToInsta(index)} className={`relative h-[2px] flex-1 overflow-hidden rounded-full transition-colors ${darkMode ? 'bg-white/15' : 'bg-stone-200'}`} aria-label={`Voir la photo ${index + 1}`}>
              <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#A68A64] transition-transform duration-300" style={{ transform: index === activeInstaIndex ? 'scaleX(1)' : 'scaleX(0)' }} />
            </button>
          ))}
        </div>
        <div className="mt-12 px-6 pt-9 text-center">
          <Sparkles className="mx-auto mb-4 text-[#A68A64]" size={30} strokeWidth={1.6} />
          <p className="text-[12px] font-black uppercase tracking-[0.22em] text-[#A68A64]">Creations uniques</p>
          <p className={`mx-auto mt-4 max-w-[330px] text-[16px] leading-7 ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>
            Chaque meuble est chine, restaure et sublime a la main dans notre atelier.
          </p>
        </div>
      </div>
      <div className="relative z-10 mx-auto hidden max-w-[1280px] lg:block">
        <div className="mb-10 flex flex-col items-center text-center xl:mb-12">
          <div className="mb-6 flex items-center gap-3">
            <div className="h-px w-8 bg-[#A68A64]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68A64]">Lifestyle & Atelier</span>
            <div className="h-px w-8 bg-[#A68A64]" />
          </div>
          <h2 className={`font-serif text-4xl lg:text-5xl xl:text-6xl ${darkMode ? 'text-white' : 'text-[#1A1A1A]'}`}>
            Nous aussi on vous aime
          </h2>
          <div className="mt-6 flex items-center justify-center gap-7 xl:mt-8 xl:gap-8">
            <InstagramFollowerCount darkMode={darkMode} className="min-w-[168px]" />
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className={`group relative flex min-h-[54px] items-center gap-4 overflow-hidden rounded-full border py-2 pl-5 pr-2 transition-all duration-500 backdrop-blur-md ${darkMode ? 'border-white/10 bg-white/5 hover:border-white/40' : 'border-black/5 bg-stone-50 hover:border-black/20'}`}>
              <Instagram size={17} className={darkMode ? 'relative z-10 text-white' : 'relative z-10 text-black'} />
              <span className={`relative z-10 text-[11px] font-bold uppercase tracking-[0.2em] transition-colors duration-500 ${darkMode ? 'text-white group-hover:text-black' : 'text-black group-hover:text-white'}`}>Rejoindre la communaute</span>
              <span className={`absolute inset-0 translate-y-[101%] transition-transform duration-[600ms] group-hover:translate-y-0 ${darkMode ? 'bg-white' : 'bg-[#1A1A1A]'}`} />
              <span className={`relative z-10 flex h-10 w-10 items-center justify-center rounded-full transition-colors duration-500 ${darkMode ? 'bg-white text-black group-hover:bg-[#111] group-hover:text-white' : 'bg-[#1A1A1A] text-white group-hover:bg-white group-hover:text-[#1A1A1A]'}`}>
                <ArrowUpRight size={17} strokeWidth={2.2} />
              </span>
            </a>
          </div>
        </div>
        <div
          className="relative mx-auto h-[470px] w-full max-w-[1120px] overflow-visible touch-pan-y cursor-grab active:cursor-grabbing xl:h-[520px] xl:max-w-[1240px]"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          {getPositioned(DESKTOP_INSTA_POSITIONS).map((entry) => renderCard(entry, true))}
        </div>
        <div className="mx-auto mt-7 grid w-full max-w-[380px] grid-cols-[52px_1fr_52px] items-center gap-4 xl:mt-9 xl:max-w-[420px] xl:grid-cols-[58px_1fr_58px] xl:gap-5">
          <button type="button" onClick={() => goToInsta((current) => current - 1)} className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 xl:h-[58px] xl:w-[58px] ${darkMode ? 'border-white/10 bg-white/8 text-white hover:border-white/25' : 'border-[#efebe5] bg-white text-[#5f5b56] hover:border-[#e4ded5]'}`} aria-label="Photo Instagram precedente">
            <ChevronLeft size={24} strokeWidth={1.8} />
          </button>
          <div className="flex items-center justify-center gap-4">
            {dynamicInsta.map((_, index) => (
              <button key={index} type="button" onClick={() => goToInsta(index)} className={`relative h-[3px] flex-1 overflow-hidden rounded-full transition-colors ${darkMode ? 'bg-white/15' : 'bg-stone-200'}`} aria-label={`Voir la photo Instagram ${index + 1}`}>
                <span className="absolute inset-y-0 left-0 w-full origin-left rounded-full bg-[#A68A64] transition-transform duration-300" style={{ transform: index === activeInstaIndex ? 'scaleX(1)' : 'scaleX(0)' }} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => goToInsta((current) => current + 1)} className={`flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-[0_14px_34px_rgba(0,0,0,0.06)] transition-all duration-300 hover:-translate-y-0.5 active:scale-95 xl:h-[58px] xl:w-[58px] ${darkMode ? 'border-white/10 bg-white/8 text-white hover:border-white/25' : 'border-[#efebe5] bg-white text-[#5f5b56] hover:border-[#e4ded5]'}`} aria-label="Photo Instagram suivante">
            <ChevronRight size={24} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </section>
  );
}
