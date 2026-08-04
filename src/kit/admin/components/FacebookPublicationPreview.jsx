'use client';

import Image from 'next/image';
import { Image as ImageIcon } from 'lucide-react';
import { HomeIndicator, PhoneChrome, PhoneScreen, ScaledPhone, StatusBar } from './PublicationPhoneShell';
import { FACEBOOK_MEDIA_LIMIT, storyToPlainText } from './publicationContent';

const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  strokeWidth: 1.9,
};

function FbIcon({ name, className = 'h-6 w-6' }) {
  if (name === 'like') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M7 10v10H4a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1h3Zm0 0 4.2-7.1a1 1 0 0 1 1.8.5V8h5.3a2 2 0 0 1 2 2.4l-1.5 7.2a2 2 0 0 1-2 1.6H7" /></svg>;
  }
  if (name === 'comment') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.6 9.6 0 0 1-3.8-.8L3 21l1.8-4.7A8.5 8.5 0 1 1 21 11.5Z" /></svg>;
  }
  if (name === 'share') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M4 12v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6M12 3v13M8 7l4-4 4 4" /></svg>;
  }
  if (name === 'home') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" /></svg>;
  }
  if (name === 'video') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><rect {...iconProps} x="3" y="6" width="13" height="12" rx="3" /><path {...iconProps} d="m16 11 5-3v8l-5-3" /></svg>;
  }
  if (name === 'market') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9Zm0 0 2-5h12l2 5M9 13h6" /></svg>;
  }
  if (name === 'bell') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M18 15V10a6 6 0 1 0-12 0v5l-1.5 2.5h15L18 15ZM10 20a2 2 0 0 0 4 0" /></svg>;
  }
  if (name === 'menu') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><path {...iconProps} d="M4 7h16M4 12h16M4 17h16" /></svg>;
  }
  if (name === 'search') {
    return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><circle {...iconProps} cx="11" cy="11" r="7.5" /><path {...iconProps} d="m16.5 16.5 4.5 4.5" /></svg>;
  }
  return <svg aria-hidden="true" className={className} viewBox="0 0 24 24"><circle {...iconProps} cx="12" cy="12" r="9" /></svg>;
}

/** Grille de medias facon Facebook : 1, 2, 3 ou 4+ visuels. */
function FacebookMediaGrid({ items }) {
  const count = items.length;
  const shown = items.slice(0, 4);
  const overflow = Math.max(0, count - 4);

  if (count === 0) {
    return (
      <div className="flex h-[300px] w-full flex-col items-center justify-center bg-[#e9ebef] text-center text-black/40">
        <div className="grid h-[60px] w-[60px] place-items-center rounded-full border border-black/10 bg-white/80">
          <ImageIcon size={24} strokeWidth={1.35} />
        </div>
        <p className="mt-[14px] text-[13px] font-semibold text-black/55">Le premier visuel apparaîtra ici</p>
      </div>
    );
  }

  const Tile = ({ item, className, badge }) => (
    <div className={`relative overflow-hidden bg-[#e9ebef] ${className}`}>
      <Image unoptimized fill sizes="402px" src={item.preview} alt="" className="object-cover" />
      {badge ? (
        <div className="absolute inset-0 grid place-items-center bg-black/45 text-[26px] font-semibold text-white">+{badge}</div>
      ) : null}
    </div>
  );

  if (count === 1) return <Tile item={shown[0]} className="h-[402px] w-full" />;

  if (count === 2) {
    return (
      <div className="grid h-[300px] w-full grid-cols-2 gap-[2px]">
        {shown.map((item, index) => <Tile key={item.id || index} item={item} className="h-full w-full" />)}
      </div>
    );
  }

  if (count === 3) {
    return (
      <div className="grid h-[300px] w-full grid-cols-2 grid-rows-2 gap-[2px]">
        <Tile item={shown[0]} className="row-span-2 h-full w-full" />
        <Tile item={shown[1]} className="h-full w-full" />
        <Tile item={shown[2]} className="h-full w-full" />
      </div>
    );
  }

  return (
    <div className="grid h-[330px] w-full grid-cols-2 grid-rows-2 gap-[2px]">
      {shown.map((item, index) => (
        <Tile
          key={item.id || index}
          item={item}
          className="h-full w-full"
          badge={index === 3 && overflow ? overflow : 0}
        />
      ))}
    </div>
  );
}

function FacebookScreen({ galleryItems, name, description, hashtags }) {
  const availableItems = galleryItems.slice(0, FACEBOOK_MEDIA_LIMIT);
  const story = storyToPlainText(description);
  const title = String(name || '').trim() || 'Nom de l’ouvrage';
  const cleanedHashtags = String(hashtags || '').trim();

  return (
    <PhoneScreen background="bg-[#f0f2f5]">
      <StatusBar />

      <div className="flex h-[50px] items-center justify-between bg-white px-[14px]">
        <span className="text-[26px] font-extrabold tracking-[-0.04em] text-[#0866FF]">facebook</span>
        <div className="flex items-center gap-[10px] text-black/80">
          <span className="grid h-[32px] w-[32px] place-items-center rounded-full bg-[#eff1f4]"><FbIcon name="search" className="h-[19px] w-[19px]" /></span>
          <span className="grid h-[32px] w-[32px] place-items-center rounded-full bg-[#eff1f4]"><FbIcon name="menu" className="h-[19px] w-[19px]" /></span>
        </div>
      </div>

      <div className="mt-[8px] bg-white pb-[6px]">
        <div className="flex h-[58px] items-center justify-between px-[13px]">
          <div className="flex min-w-0 items-center gap-[10px]">
            <div className="grid h-[40px] w-[40px] shrink-0 place-items-center overflow-hidden rounded-full border border-black/10 bg-[#f5efe8]">
              <Image src="/images/logoanais-320.webp" alt="" width={30} height={30} className="h-[30px] w-[30px] object-contain" />
            </div>
            <div className="min-w-0 leading-[1.15]">
              <p className="truncate text-[14px] font-semibold tracking-[-0.01em]">Seconde Vie</p>
              <p className="mt-[2px] flex items-center gap-[5px] text-[11.5px] text-black/55">
                À l’instant
                <span aria-hidden="true">·</span>
                <svg className="h-[11px] w-[11px]" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
              </p>
            </div>
          </div>
          <span className="pb-[8px] text-[22px] font-medium tracking-[1.5px]" aria-hidden="true">•••</span>
        </div>

        <div className="px-[13px] pb-[10px] text-[14px] leading-[1.36] tracking-[-0.005em]">
          <p className="line-clamp-4">
            <span className="font-semibold">{title}</span>
            {story ? <span> — {story}</span> : <span className="text-black/44"> — L’histoire de l’objet apparaîtra ici.</span>}
            {cleanedHashtags && <span className="text-[#0866FF]"> {cleanedHashtags}</span>}
          </p>
        </div>

        <FacebookMediaGrid items={availableItems} />

        <div className="flex h-[38px] items-center justify-between px-[13px] text-[12.5px] text-black/55">
          <span className="flex items-center gap-[5px]">
            <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-[#0866FF] text-white">
              <svg className="h-[10px] w-[10px]" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M7 10v10H4V10h3Zm4.2-7.1L7 10v10h10.8a2 2 0 0 0 2-1.6l1.5-7.2A2 2 0 0 0 19.3 8H13V3.4a1 1 0 0 0-1.8-.5Z" /></svg>
            </span>
            Vous et 34 autres personnes
          </span>
          <span>6 commentaires</span>
        </div>

        <div className="mx-[13px] flex h-[42px] items-center justify-between border-t border-black/[0.08] text-[13px] font-medium text-black/60">
          <span className="flex flex-1 items-center justify-center gap-[7px]"><FbIcon name="like" className="h-[19px] w-[19px]" />J’aime</span>
          <span className="flex flex-1 items-center justify-center gap-[7px]"><FbIcon name="comment" className="h-[19px] w-[19px]" />Commenter</span>
          <span className="flex flex-1 items-center justify-center gap-[7px]"><FbIcon name="share" className="h-[19px] w-[19px]" />Partager</span>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 border-t border-black/[0.08] bg-white">
        <div className="relative flex h-[56px] items-start justify-between px-[24px] pt-[9px] text-black/55">
          <FbIcon name="home" className="h-[23px] w-[23px] text-[#0866FF]" />
          <FbIcon name="video" className="h-[23px] w-[23px]" />
          <FbIcon name="market" className="h-[23px] w-[23px]" />
          <FbIcon name="bell" className="h-[23px] w-[23px]" />
          <div className="grid h-[24px] w-[24px] place-items-center overflow-hidden rounded-full border border-black/20 bg-[#f5efe8]">
            <Image src="/images/logoanais-320.webp" alt="" width={17} height={17} className="h-[17px] w-[17px] object-contain" />
          </div>
          <HomeIndicator />
        </div>
      </div>
    </PhoneScreen>
  );
}

/** Rendu iPhone du post Facebook, alimente en direct par le formulaire. */
export default function FacebookPublicationPreview({
  galleryItems = [],
  name = '',
  description = '',
  hashtags = '',
  expanded = false,
}) {
  return (
    <ScaledPhone label="Aperçu Facebook sur iPhone 17 Pro" expanded={expanded}>
      <PhoneChrome />
      <FacebookScreen galleryItems={galleryItems} name={name} description={description} hashtags={hashtags} />
    </ScaledPhone>
  );
}
