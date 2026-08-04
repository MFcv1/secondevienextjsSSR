'use client';

import React from 'react';
import Image from 'next/image';
import { ArrowLeft, Check, Image as ImageIcon, Info, Layers3 } from 'lucide-react';
import { parseStoryBlocks, tokenizeStoryInline } from '../../../lib/content/storyFormatting';

const INSTAGRAM_MEDIA_LIMIT = 10;
const PHONE_WIDTH = 430;
const PHONE_HEIGHT = 910;
const SCREEN_WIDTH = 402;
const SCREEN_HEIGHT = 874;

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 2,
};

function FeedIcon({ name, className = 'h-6 w-6' }) {
  if (name === 'heart') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78Z" /></svg>;
  }
  if (name === 'comment') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.6 9.6 0 0 1-3.8-.8L3 21l1.8-4.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>;
  }
  if (name === 'send') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="m22 2-7.4 20-4.2-8.4L2 9.4 22 2Z" /><path {...iconProps} d="M10.4 13.6 22 2" /></svg>;
  }
  if (name === 'bookmark') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M5 3.8c0-1 .8-1.8 1.8-1.8h10.4c1 0 1.8.8 1.8 1.8V22l-7-4.4L5 22V3.8Z" /></svg>;
  }
  if (name === 'home') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></svg>;
  }
  if (name === 'search') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><circle {...iconProps} cx="11" cy="11" r="7.5" /><path {...iconProps} d="m16.5 16.5 4.5 4.5" /></svg>;
  }
  if (name === 'reels') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><rect {...iconProps} x="3" y="3" width="18" height="18" rx="5" /><path {...iconProps} d="m8 3 4 5m3-5 4 5M3 8h18" /><path fill="currentColor" stroke="none" d="m10 12 6 3.5-6 3.5v-7Z" /></svg>;
  }
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><rect {...iconProps} x="3" y="3" width="18" height="18" rx="5" /><path {...iconProps} d="M12 8v8M8 12h8" /></svg>;
}

function storyToPlainText(value) {
  return parseStoryBlocks(value).map((block) => {
    if (Array.isArray(block.items)) {
      return block.items.map((item) => tokenizeStoryInline(item).map((token) => token.text).join('')).join(' · ');
    }
    return tokenizeStoryInline(block.text || '').map((token) => token.text).join('');
  }).filter(Boolean).join(' ');
}

function ScaledPhone({ children }) {
  const stageRef = React.useRef(null);
  const [scale, setScale] = React.useState(0.72);

  React.useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const updateScale = () => {
      const availableWidth = stage.getBoundingClientRect().width;
      setScale(Math.min(0.82, Math.max(0.55, availableWidth / PHONE_WIDTH)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={stageRef} className="mx-auto w-full max-w-[354px]" aria-label="Aperçu sur iPhone 17 Pro">
      <div className="relative mx-auto" style={{ width: PHONE_WIDTH * scale, height: PHONE_HEIGHT * scale }}>
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT, transform: `scale(${scale})` }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function StatusBar() {
  return (
    <div className="relative flex h-[54px] items-center justify-between px-[29px] pt-[3px] text-black">
      <span className="w-[80px] text-center text-[15px] font-semibold tracking-[-0.02em]">9:41</span>
      <div className="absolute left-1/2 top-[10px] h-[36px] w-[126px] -translate-x-1/2 rounded-full bg-black" aria-hidden="true">
        <span className="absolute right-[9px] top-1/2 h-[10px] w-[10px] -translate-y-1/2 rounded-full bg-[#15181d] ring-1 ring-[#262a31]" />
      </div>
      <div className="flex w-[80px] items-center justify-center gap-[6px]" aria-hidden="true">
        <svg className="h-[12px] w-[18px]" viewBox="0 0 18 12"><path fill="currentColor" d="M1 9h2v3H1V9Zm4-3h2v6H5V6Zm4-3h2v9H9V3Zm4-3h2v12h-2V0Z" /></svg>
        <svg className="h-[13px] w-[17px]" viewBox="0 0 17 13"><path d="M1 4.7a11.4 11.4 0 0 1 15 0M3.6 7.5a7.5 7.5 0 0 1 9.8 0M6.3 10.1a3.4 3.4 0 0 1 4.4 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /><circle cx="8.5" cy="12" r="1" fill="currentColor" /></svg>
        <span className="relative h-[12px] w-[25px] rounded-[3px] border-[1.5px] border-black"><span className="absolute inset-[2px] rounded-[1px] bg-black" /><span className="absolute -right-[3px] top-[3px] h-[5px] w-[2px] rounded-r bg-black/45" /></span>
      </div>
    </div>
  );
}

function InstagramScreen({ galleryItems, name, description, hashtags }) {
  const availableItems = galleryItems.slice(0, INSTAGRAM_MEDIA_LIMIT);
  const [activeImageIndex, setActiveImageIndex] = React.useState(0);
  const story = storyToPlainText(description);
  const title = String(name || '').trim() || 'Nom de l’ouvrage';
  const cleanedHashtags = String(hashtags || '').trim();
  const imageCount = availableItems.length;
  const currentImage = availableItems[Math.min(activeImageIndex, Math.max(0, imageCount - 1))];
  const firstVisibleDot = Math.min(Math.max(0, activeImageIndex - 3), Math.max(0, imageCount - 8));

  React.useEffect(() => {
    setActiveImageIndex((current) => Math.min(current, Math.max(0, imageCount - 1)));
  }, [imageCount]);

  const moveCarousel = (direction) => {
    if (imageCount < 2) return;
    setActiveImageIndex((current) => Math.min(imageCount - 1, Math.max(0, current + direction)));
  };

  return (
    <div className="absolute left-[14px] top-[18px] overflow-hidden rounded-[58px] bg-white text-[#0d0d0d]" style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT }}>
      <StatusBar />

      <div className="flex h-[48px] items-center justify-between border-b border-black/[0.08] px-[16px]">
        <span className="translate-y-[-1px] font-['Brush_Script_MT','Segoe_Script',cursive] text-[29px] leading-none tracking-[-0.045em]">Instagram</span>
        <div className="flex items-center gap-[18px]">
          <FeedIcon name="heart" className="h-[24px] w-[24px]" />
          <FeedIcon name="send" className="h-[24px] w-[24px]" />
        </div>
      </div>

      <div className="flex h-[56px] items-center justify-between px-[13px]">
        <div className="flex min-w-0 items-center gap-[10px]">
          <div className="grid h-[36px] w-[36px] shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-[#f5efe8]">
            <Image src="/images/logoanais-320.webp" alt="" width={27} height={27} className="h-[27px] w-[27px] object-contain" />
          </div>
          <div className="min-w-0 leading-[1.1]">
            <p className="truncate text-[13px] font-semibold tracking-[-0.01em]">seconde_vie_pour_nos_objets</p>
            <p className="mt-[3px] truncate text-[10.5px] text-black/62">La Cadière-d’Azur</p>
          </div>
        </div>
        <span className="pb-[8px] text-[22px] font-medium tracking-[1.5px]" aria-hidden="true">•••</span>
      </div>

      <div className="relative h-[536px] overflow-hidden bg-[#f3f2ef]">
        {currentImage?.preview ? (
          <Image unoptimized fill sizes="402px" src={currentImage.preview} alt={`Visuel ${activeImageIndex + 1} de la publication Instagram`} className="object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center text-black/40">
            <div className="grid h-[64px] w-[64px] place-items-center rounded-full border border-black/10 bg-white/70">
              <ImageIcon size={25} strokeWidth={1.35} />
            </div>
            <p className="mt-[16px] text-[13px] font-semibold text-black/55">Le premier visuel apparaîtra ici</p>
            <p className="mt-[5px] max-w-[230px] text-[11px] leading-[1.4]">Ajoutez une photo dans les informations de l’ouvrage.</p>
          </div>
        )}

        {imageCount > 1 && (
          <>
            <div className="absolute right-[12px] top-[12px] rounded-full bg-black/72 px-[9px] py-[5px] text-[11px] font-semibold text-white">{activeImageIndex + 1}/{imageCount}</div>
            {activeImageIndex > 0 && <button type="button" aria-label="Photo précédente" onClick={() => moveCarousel(-1)} className="absolute inset-y-0 left-0 w-[56px] cursor-w-resize" />}
            {activeImageIndex < imageCount - 1 && <button type="button" aria-label="Photo suivante" onClick={() => moveCarousel(1)} className="absolute inset-y-0 right-0 w-[56px] cursor-e-resize" />}
          </>
        )}
      </div>

      <div className="relative flex h-[46px] items-center justify-between px-[13px]">
        <div className="flex items-center gap-[17px]">
          <FeedIcon name="heart" className="h-[24px] w-[24px]" />
          <FeedIcon name="comment" className="h-[23px] w-[23px]" />
          <FeedIcon name="send" className="h-[24px] w-[24px]" />
        </div>
        {imageCount > 1 && (
          <div className="absolute left-1/2 flex max-w-[96px] -translate-x-1/2 items-center justify-center gap-[4px] overflow-hidden">
            {availableItems.slice(firstVisibleDot, firstVisibleDot + 8).map((item, index) => {
              const itemIndex = firstVisibleDot + index;
              return <span key={item.id || itemIndex} className={`h-[5px] w-[5px] shrink-0 rounded-full ${itemIndex === activeImageIndex ? 'bg-[#0095f6]' : 'bg-black/20'}`} />;
            })}
          </div>
        )}
        <FeedIcon name="bookmark" className="h-[24px] w-[24px]" />
      </div>

      <div className="h-[78px] overflow-hidden px-[13px] pb-[8px] text-[12.5px] leading-[1.32] tracking-[-0.005em]">
        <p className="line-clamp-3">
          <span className="mr-[5px] font-semibold">seconde_vie_pour_nos_objets</span>
          <span className="font-semibold">{title}</span>
          {story ? <span> — {story}</span> : <span className="text-black/44"> — L’histoire de l’objet apparaîtra ici.</span>}
          {cleanedHashtags && <span className="text-[#00376b]"> {cleanedHashtags}</span>}
        </p>
        {(story.length > 150 || cleanedHashtags.length > 35) && <span className="text-black/48">plus</span>}
      </div>

      <div className="relative flex h-[56px] items-start justify-between border-t border-black/[0.08] px-[24px] pt-[9px]">
        <FeedIcon name="home" className="h-[24px] w-[24px]" />
        <FeedIcon name="search" className="h-[24px] w-[24px]" />
        <FeedIcon name="plus" className="h-[24px] w-[24px]" />
        <FeedIcon name="reels" className="h-[24px] w-[24px]" />
        <div className="grid h-[25px] w-[25px] place-items-center overflow-hidden rounded-full border border-black/80 bg-[#f5efe8]">
          <Image src="/images/logoanais-320.webp" alt="" width={18} height={18} className="h-[18px] w-[18px] object-contain" />
        </div>
        <span className="absolute bottom-[6px] left-1/2 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-black" />
      </div>
    </div>
  );
}

export default function InstagramPublicationPreview({
  darkMode = false,
  galleryItems = [],
  name = '',
  description = '',
  hashtags = '',
  onHashtagsChange,
  onBack,
}) {
  const mediaCount = Math.min(galleryItems.length, INSTAGRAM_MEDIA_LIMIT);
  const omittedMediaCount = Math.max(0, galleryItems.length - INSTAGRAM_MEDIA_LIMIT);
  const story = storyToPlainText(description);

  return (
    <div className="grid min-h-0 gap-7 py-1 lg:grid-cols-[minmax(320px,1.08fr)_minmax(250px,0.92fr)] lg:items-start xl:h-full xl:gap-9">
      <div data-native-scroll-region="true" className={`flex min-h-[650px] items-start justify-center overflow-x-hidden overflow-y-auto rounded-[24px] border px-3 py-6 sm:px-6 xl:h-full xl:min-h-0 ${darkMode ? 'border-white/10 bg-black/20' : 'border-black/[0.055] bg-[#f3f1ed]'}`}>
        <ScaledPhone>
          <div className="absolute -left-[4px] top-[171px] h-[35px] w-[5px] rounded-l-[3px] bg-[#343330]" />
          <div className="absolute -left-[4px] top-[224px] h-[69px] w-[5px] rounded-l-[3px] bg-[#343330]" />
          <div className="absolute -left-[4px] top-[310px] h-[69px] w-[5px] rounded-l-[3px] bg-[#343330]" />
          <div className="absolute -right-[4px] top-[251px] h-[108px] w-[5px] rounded-r-[3px] bg-[#343330]" />
          <div className="absolute inset-0 rounded-[76px] bg-[#77736d] shadow-[0_34px_70px_rgba(28,25,23,0.28),0_10px_24px_rgba(28,25,23,0.18)]" />
          <div className="absolute inset-[3px] rounded-[73px] bg-[#1d1d1c] ring-1 ring-white/30" />
          <div className="absolute inset-[8px] rounded-[68px] bg-black ring-1 ring-black" />
          <InstagramScreen galleryItems={galleryItems} name={name} description={description} hashtags={hashtags} />
        </ScaledPhone>
      </div>

      <div className="flex min-h-0 flex-col lg:max-w-[390px]">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] text-emerald-700 dark:text-emerald-400">Aperçu privé</span>
          <span className={`rounded-full px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'bg-white/5 text-stone-400 ring-1 ring-white/10' : 'bg-stone-100 text-stone-500 ring-1 ring-black/[0.04]'}`}>iPhone 17 Pro</span>
        </div>
        <h4 className="mt-5 text-[24px] font-extrabold leading-[1.02] tracking-[-0.045em] sm:text-[28px]">Votre publication, telle qu’elle apparaîtra dans le fil.</h4>
        <p className={`mt-3 max-w-[38rem] text-[11px] leading-5 ${darkMode ? 'text-stone-400' : 'text-stone-500'}`}>Le titre, l’histoire et les images suivent le formulaire en direct. Les informations commerciales du site ne sont pas envoyées à Instagram.</p>

        <div className={`mt-5 rounded-[18px] border p-4 ${darkMode ? 'border-white/10 bg-white/[0.025]' : 'border-stone-200 bg-[#faf9f7]'}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[10px] font-extrabold"><Layers3 size={14} strokeWidth={1.7} />Contenu Instagram</span>
            <span className={`text-[9px] font-bold tabular-nums ${omittedMediaCount ? 'text-amber-600' : (darkMode ? 'text-stone-500' : 'text-stone-400')}`}>{mediaCount}/{INSTAGRAM_MEDIA_LIMIT} médias</span>
          </div>
          <div className={`mt-3 divide-y text-[10px] ${darkMode ? 'divide-white/10' : 'divide-black/[0.055]'}`}>
            <div className="flex items-start justify-between gap-4 py-2.5"><span className="text-stone-400">Titre</span><span className="max-w-[70%] text-right font-bold">{name.trim() || 'À compléter'}</span></div>
            <div className="flex items-start justify-between gap-4 py-2.5"><span className="text-stone-400">Histoire</span><span className="max-w-[70%] text-right font-bold">{story ? `${story.length} caractères` : 'À compléter'}</span></div>
            <div className="flex items-start justify-between gap-4 py-2.5"><span className="text-stone-400">Format</span><span className="max-w-[70%] text-right font-bold">Publication photo 3:4</span></div>
          </div>
        </div>

        <label className={`mt-5 text-[9px] font-extrabold uppercase tracking-[0.12em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} htmlFor="instagram-publication-hashtags">Hashtags Instagram</label>
        <textarea
          id="instagram-publication-hashtags"
          value={hashtags}
          onChange={(event) => onHashtagsChange?.(event.target.value.slice(0, 500))}
          rows={3}
          placeholder="#secondevie #mobilierancien #artisanat"
          className={`mt-2 w-full resize-none rounded-[16px] border-none px-4 py-3 text-[11px] font-semibold leading-5 outline-none ring-1 transition-colors focus:ring-2 ${darkMode ? 'bg-black/20 text-white ring-white/10 placeholder:text-stone-700 focus:ring-white/25' : 'bg-[#f7f6f3] text-stone-950 ring-black/[0.055] placeholder:text-stone-400 focus:bg-white focus:ring-stone-300'}`}
        />
        <p className={`mt-1 text-right text-[8px] font-bold tabular-nums ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{hashtags.length}/500</p>

        {omittedMediaCount > 0 && <p className="mt-3 flex items-start gap-2 rounded-[14px] bg-amber-500/10 px-3 py-2.5 text-[9px] font-bold leading-4 text-amber-700 dark:text-amber-400"><Info size={13} className="mt-0.5 shrink-0" />{omittedMediaCount} image{omittedMediaCount > 1 ? 's' : ''} restera{omittedMediaCount > 1 ? 'ont' : ''} sur le site et ne sera{omittedMediaCount > 1 ? 'ont' : ''} pas envoyée{omittedMediaCount > 1 ? 's' : ''} à Instagram.</p>}
        {!omittedMediaCount && mediaCount > 0 && <p className="mt-3 flex items-center gap-2 text-[9px] font-bold text-emerald-700 dark:text-emerald-400"><Check size={13} />Toutes les images sélectionnées tiennent dans la publication.</p>}

        <div className={`mt-5 rounded-[14px] px-3 py-2.5 text-[9px] font-bold leading-4 ${darkMode ? 'bg-white/5 text-stone-400' : 'bg-stone-100 text-stone-500'}`}>Cet aperçu reprend le contenu envoyé à Instagram. Le site reste prioritaire et confirme sa publication avant l’envoi Meta.</div>
        <button type="button" onClick={onBack} className={`mt-4 flex w-fit items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-extrabold ring-1 transition-colors ${darkMode ? 'text-stone-300 ring-white/10 hover:bg-white/5 hover:text-white' : 'text-stone-600 ring-black/[0.08] hover:bg-stone-50 hover:text-stone-950'}`}><ArrowLeft size={14} strokeWidth={1.7} />Revenir aux informations</button>
      </div>
    </div>
  );
}
