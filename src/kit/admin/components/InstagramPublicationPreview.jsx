'use client';

import React from 'react';
import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { HomeIndicator, PhoneChrome, PhoneScreen, ScaledPhone, StatusBar } from './PublicationPhoneShell';
import { INSTAGRAM_MEDIA_LIMIT, storyToPlainText } from './publicationContent';

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
    <PhoneScreen>
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
        <HomeIndicator />
      </div>
    </PhoneScreen>
  );
}

/** Rendu iPhone du post Instagram, alimente en direct par le formulaire. */
export default function InstagramPublicationPreview({
  galleryItems = [],
  name = '',
  description = '',
  hashtags = '',
  expanded = false,
}) {
  return (
    <ScaledPhone label="Aperçu Instagram sur iPhone 17 Pro" expanded={expanded}>
      <PhoneChrome />
      <InstagramScreen galleryItems={galleryItems} name={name} description={description} hashtags={hashtags} />
    </ScaledPhone>
  );
}
