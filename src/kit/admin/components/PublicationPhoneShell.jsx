'use client';

import React from 'react';

export const PHONE_WIDTH = 430;
export const PHONE_HEIGHT = 910;
export const SCREEN_WIDTH = 402;
export const SCREEN_HEIGHT = 874;

/**
 * Scene dessinee a taille reelle puis remise a l'echelle pour tenir dans
 * la place disponible : les proportions de l'apercu ne mentent jamais,
 * quelle que soit la hauteur d'ecran (13 pouces compris).
 */
export function ScaledStage({
  children,
  width,
  height,
  label,
  maxScale = 1,
  minScale = 0.4,
  maxWidth = '100%',
}) {
  const stageRef = React.useRef(null);
  const [scale, setScale] = React.useState(minScale);

  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const updateScale = () => {
      const box = stage.getBoundingClientRect();
      const widthScale = box.width > 0 ? box.width / width : maxScale;
      const heightScale = box.height > 0 ? box.height / height : widthScale;
      setScale(Math.min(maxScale, Math.max(minScale, Math.min(widthScale, heightScale))));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);
    return () => observer.disconnect();
  }, [height, maxScale, minScale, width]);

  return (
    <div ref={stageRef} className="mx-auto flex h-full w-full items-center justify-center" style={{ maxWidth }} aria-label={label}>
      <div className="relative" style={{ width: width * scale, height: height * scale }}>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width, height, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/** Maquette iPhone 17 Pro, mise a l'echelle de la place disponible. */
export function ScaledPhone({ children, label = 'Apercu sur iPhone 17 Pro', maxScale = 0.82, expanded = false }) {
  return (
    <ScaledStage
      width={PHONE_WIDTH}
      height={PHONE_HEIGHT}
      label={label}
      maxScale={expanded ? 1 : maxScale}
      minScale={0.36}
      maxWidth={expanded ? '540px' : '360px'}
    >
      {children}
    </ScaledStage>
  );
}

/** Boutons lateraux, coques et vitre : le decor commun a tous les ecrans. */
export function PhoneChrome() {
  return (
    <>
      <div className="absolute -left-[4px] top-[171px] h-[35px] w-[5px] rounded-l-[3px] bg-[#343330]" />
      <div className="absolute -left-[4px] top-[224px] h-[69px] w-[5px] rounded-l-[3px] bg-[#343330]" />
      <div className="absolute -left-[4px] top-[310px] h-[69px] w-[5px] rounded-l-[3px] bg-[#343330]" />
      <div className="absolute -right-[4px] top-[251px] h-[108px] w-[5px] rounded-r-[3px] bg-[#343330]" />
      <div className="absolute inset-0 rounded-[76px] bg-[#77736d] shadow-[0_34px_70px_rgba(28,25,23,0.28),0_10px_24px_rgba(28,25,23,0.18)]" />
      <div className="absolute inset-[3px] rounded-[73px] bg-[#1d1d1c] ring-1 ring-white/30" />
      <div className="absolute inset-[8px] rounded-[68px] bg-black ring-1 ring-black" />
    </>
  );
}

/** Barre d'etat iOS, calee sur la Dynamic Island. */
export function StatusBar({ tone = 'dark' }) {
  const isDark = tone === 'dark';
  const textClass = isDark ? 'text-black' : 'text-white';
  const barFill = isDark ? 'bg-black' : 'bg-white';
  const barBorder = isDark ? 'border-black' : 'border-white';
  const barTail = isDark ? 'bg-black/45' : 'bg-white/45';

  return (
    <div className={`relative flex h-[54px] items-center justify-between px-[29px] pt-[3px] ${textClass}`}>
      <span className="w-[80px] text-center text-[15px] font-semibold tracking-[-0.02em]">9:41</span>
      <div className="absolute left-1/2 top-[10px] h-[36px] w-[126px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true">
        <span className="absolute right-[9px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#15181d] ring-1 ring-[#262a31]" />
      </div>
      <div className="flex w-[80px] items-center justify-center gap-[6px]" aria-hidden="true">
        <svg className="h-[12px] w-[18px]" viewBox="0 0 18 12"><path fill="currentColor" d="M1 9h2v3H1V9Zm4-3h2v6H5V6Zm4-3h2v9H9V3Zm4-3h2v12h-2V0Z" /></svg>
        <svg className="h-[13px] w-[17px]" viewBox="0 0 17 13"><path d="M1 4.7a11.4 11.4 0 0 1 15 0M3.6 7.5a7.5 7.5 0 0 1 9.8 0M6.3 10.1a3.4 3.4 0 0 1 4.4 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="8.5" cy="12" r="1" fill="currentColor" /></svg>
        <span className={`relative h-[12px] w-[25px] rounded-[3px] border-[1.5px] ${barBorder}`}><span className={`absolute inset-[2px] rounded-[1px] ${barFill}`} /><span className={`absolute -right-[3px] top-[3px] h-[5px] w-[2px] rounded-r ${barTail}`} /></span>
      </div>
    </div>
  );
}

/** Ecran actif, positionne dans la vitre du chassis. */
export function PhoneScreen({ children, background = 'bg-white', text = 'text-[#0d0d0d]' }) {
  return (
    <div
      className={`absolute left-[14px] top-[18px] overflow-hidden rounded-[58px] ${background} ${text}`}
      style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}
    >
      {children}
    </div>
  );
}

/** Indicateur d'accueil iOS. */
export function HomeIndicator({ tone = 'dark' }) {
  return <span className={`absolute bottom-[6px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full ${tone === 'dark' ? 'bg-black' : 'bg-white'}`} />;
}
