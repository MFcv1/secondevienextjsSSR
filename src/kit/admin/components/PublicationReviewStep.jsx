'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Check, Facebook, Globe, Info, Instagram, Maximize2, Sparkles, X } from 'lucide-react';
import FacebookPublicationPreview from './FacebookPublicationPreview';
import InstagramPublicationPreview from './InstagramPublicationPreview';
import PublicationDestinations from './PublicationDestinations';
import SitePublicationPreview from './SitePublicationPreview';
import { INSTAGRAM_MEDIA_LIMIT } from './publicationContent';

const CHANNEL_TABS = [
  { id: 'site', label: 'Site', Icon: Globe, accent: '#8B5C42' },
  { id: 'instagram', label: 'Instagram', Icon: Instagram, accent: '#C13584' },
  { id: 'facebook', label: 'Facebook', Icon: Facebook, accent: '#0866FF' },
];

/**
 * Apercu en grand. Il se cale sur le module de publication — donc a droite
 * du menu d'administration, jamais par-dessus — et bascule en plein ecran
 * sous 640px. Rendu dans <body> : les volets portent un `will-change` qui
 * ferait d'eux le referentiel d'un `position: fixed`.
 */
function PreviewZoomOverlay({ darkMode, tabs, channel, onSelect, onClose, anchorRef, children }) {
  const [mounted, setMounted] = React.useState(false);
  const [frame, setFrame] = React.useState(null);

  React.useEffect(() => { setMounted(true); }, []);

  // La fenetre epouse la carte de publication, et la suit si l'ecran bouge.
  React.useEffect(() => {
    const measure = () => {
      const host = anchorRef?.current?.closest('.pub-surface');
      if (!host || window.innerWidth < 640) {
        setFrame(null);
        return;
      }
      const box = host.getBoundingClientRect();
      setFrame({ left: box.left, top: box.top, width: box.width, height: box.height });
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [anchorRef]);

  React.useEffect(() => {
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className={`pub-zoom-backdrop fixed z-[260] flex items-stretch justify-center bg-stone-950/45 backdrop-blur-md ${frame ? 'rounded-[26px] p-3' : 'inset-0 p-0'}`}
      style={frame ? { left: frame.left, top: frame.top, width: frame.width, height: frame.height } : undefined}
      role="dialog"
      aria-modal="true"
      aria-label="Aperçu agrandi de la publication"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer l’aperçu agrandi"
        className="absolute inset-0 cursor-default"
      />

      <div className={`pub-zoom-panel relative flex h-full w-full flex-col overflow-hidden sm:rounded-[22px] sm:ring-1 ${darkMode ? 'bg-[#11110f] sm:ring-white/12' : 'bg-white sm:ring-black/[0.08]'}`}>
        <div className="flex shrink-0 items-center justify-between gap-3 px-3 pb-2 pt-3 sm:px-4 sm:pt-4">
          <ChannelTabs tabs={tabs} active={channel} onSelect={onSelect} darkMode={darkMode} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer l’aperçu agrandi"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-[transform,background-color] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.95] ${darkMode ? 'text-stone-400 hover:bg-white/[0.08] hover:text-white' : 'text-stone-500 hover:bg-stone-100 hover:text-stone-950'}`}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <div className={`m-3 mt-1 flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[18px] p-3 sm:m-4 sm:mt-2 sm:p-5 ${darkMode ? 'bg-black/30' : 'bg-[#f3f1ed]'}`}>
          <div key={channel} className="pub-channel-enter flex h-full w-full items-center justify-center">
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Un canal, un rendu : la scene est identique dans le panneau et en grand. */
function ChannelPreview({ channel, formData, galleryItems, hashtags, darkMode, expanded = false }) {
  if (channel === 'instagram') {
    return (
      <InstagramPublicationPreview
        galleryItems={galleryItems}
        name={formData.name}
        description={formData.description}
        hashtags={hashtags}
        expanded={expanded}
      />
    );
  }
  if (channel === 'facebook') {
    return (
      <FacebookPublicationPreview
        galleryItems={galleryItems}
        name={formData.name}
        description={formData.description}
        hashtags={hashtags}
        expanded={expanded}
      />
    );
  }
  return (
    <SitePublicationPreview
      darkMode={darkMode}
      galleryItems={galleryItems}
      name={formData.name}
      material={formData.material}
      price={formData.startingPrice}
      priceOnRequest={formData.priceOnRequest}
      stock={formData.stock}
      expanded={expanded}
    />
  );
}

/** Onglets d'apercu : un canal, un rendu, aucune ambiguite. */
function ChannelTabs({ tabs, active, onSelect, darkMode }) {
  return (
    <div className={`inline-flex rounded-[16px] p-1 ${darkMode ? 'bg-white/[0.055]' : 'bg-stone-200/70'}`}>
      {tabs.map(({ id, label, Icon, selected }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-pressed={isActive}
            className={`relative flex min-h-9 items-center gap-1.5 rounded-[12px] px-3 text-[10px] font-extrabold transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] ${
              isActive
                ? (darkMode ? 'bg-white text-stone-950 shadow-[0_4px_14px_rgba(0,0,0,0.35)]' : 'bg-white text-stone-950 shadow-[0_4px_14px_rgba(28,25,23,0.12)]')
                : (darkMode ? 'text-stone-500 hover:text-stone-200' : 'text-stone-500 hover:text-stone-900')
            }`}
          >
            <Icon size={13} strokeWidth={1.9} />
            {label}
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${selected ? 'bg-emerald-500' : (darkMode ? 'bg-white/15' : 'bg-stone-950/12')}`}
            />
          </button>
        );
      })}
    </div>
  );
}

/**
 * Deuxieme temps de la publication : on ne saisit plus, on verifie
 * et on choisit la portee. Un apercu par canal a gauche, les
 * destinations a droite.
 */
export default function PublicationReviewStep({
  darkMode = false,
  formData,
  galleryItems,
  targets,
  onTargetsChange,
  connection,
  onConnectRequest,
  hashtags,
  onHashtagsChange,
  socialPublication,
  uploading = false,
}) {
  const [channel, setChannel] = React.useState('site');
  const [zoomed, setZoomed] = React.useState(false);
  const rootRef = React.useRef(null);
  const previousTargetsRef = React.useRef(targets);

  const connected = Boolean(connection?.connected);
  const instagramAvailable = connected && connection?.instagramAvailable !== false;
  const instagramSelected = Boolean(targets.instagram) && instagramAvailable;
  const facebookSelected = Boolean(targets.facebook) && connected;

  // L'apercu suit la derniere destination activee : le choix se voit tout de suite.
  React.useEffect(() => {
    const previous = previousTargetsRef.current;
    if (targets.instagram && !previous.instagram) setChannel('instagram');
    else if (targets.facebook && !previous.facebook) setChannel('facebook');
    else if (!targets.instagram && previous.instagram && channel === 'instagram') setChannel('site');
    else if (!targets.facebook && previous.facebook && channel === 'facebook') setChannel('site');
    previousTargetsRef.current = targets;
  }, [targets, channel]);

  // Les trois canaux restent consultables : l'apercu ne depend pas de la connexion Meta.
  const tabs = React.useMemo(() => CHANNEL_TABS.map((tab) => ({
    ...tab,
    selected: tab.id === 'site' ? true : tab.id === 'instagram' ? instagramSelected : facebookSelected,
  })), [facebookSelected, instagramSelected]);

  const metaSelected = instagramSelected || facebookSelected;
  const omittedMediaCount = Math.max(0, galleryItems.length - INSTAGRAM_MEDIA_LIMIT);
  const activeChannelSelected = tabs.find((tab) => tab.id === channel)?.selected;

  return (
    <>
    <div ref={rootRef} className="pub-stagger grid min-h-0 gap-5 xl:h-full xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.75fr)] xl:gap-6">
      <section className="flex min-h-0 flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <ChannelTabs tabs={tabs} active={channel} onSelect={setChannel} darkMode={darkMode} />
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.1em] ${activeChannelSelected ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : (darkMode ? 'bg-white/[0.05] text-stone-500' : 'bg-stone-100 text-stone-400')}`}>
              {activeChannelSelected ? <><Check size={11} strokeWidth={3} />Sera publié</> : 'Aperçu seul'}
            </span>
            <button
              type="button"
              onClick={() => setZoomed(true)}
              title="Voir l’aperçu en grand"
              aria-label="Voir l’aperçu en grand"
              className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-400 ease-[cubic-bezier(0.32,0.72,0,1)] hover:scale-[1.06] active:scale-[0.95] ${darkMode ? 'text-stone-400 ring-1 ring-white/12 hover:bg-white/[0.08] hover:text-white' : 'text-stone-500 ring-1 ring-black/[0.07] hover:bg-white hover:text-stone-950'}`}
            >
              <Maximize2 size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div
          data-native-scroll-region="true"
          className={`mt-3 flex min-h-[420px] flex-1 items-center justify-center overflow-hidden rounded-[22px] px-3 py-4 ring-1 sm:px-5 sm:py-5 xl:min-h-[340px] ${darkMode ? 'bg-black/25 ring-white/10' : 'bg-[#f3f1ed] ring-black/[0.05]'}`}
        >
          <div key={channel} className="pub-channel-enter flex h-full w-full items-center justify-center">
            <ChannelPreview channel={channel} formData={formData} galleryItems={galleryItems} hashtags={hashtags} darkMode={darkMode} />
          </div>
        </div>
      </section>

      <section data-native-scroll-region="true" className="flex min-h-0 flex-col gap-5 xl:overflow-y-auto xl:pr-1">
        <div>
          <div className="flex items-center justify-between gap-3">
            <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Où publier</p>
            <span className={`text-[9px] font-bold ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{1 + (instagramSelected ? 1 : 0) + (facebookSelected ? 1 : 0)} destination{instagramSelected || facebookSelected ? 's' : ''}</span>
          </div>
          <div className="mt-3">
            <PublicationDestinations
              darkMode={darkMode}
              targets={targets}
              onTargetsChange={onTargetsChange}
              connection={connection}
              onConnectRequest={onConnectRequest}
              disabled={uploading}
            />
          </div>
        </div>

        <div
          className={`grid transition-[grid-template-rows,opacity] duration-[600ms] ease-[cubic-bezier(0.32,0.72,0,1)] motion-reduce:transition-none ${metaSelected ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
          aria-hidden={!metaSelected}
        >
          <div className="min-h-0 overflow-hidden">
            <label className={`flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`} htmlFor="instagram-publication-hashtags">
              <Sparkles size={11} strokeWidth={1.9} />Hashtags Meta
            </label>
            <textarea
              id="instagram-publication-hashtags"
              value={hashtags}
              onChange={(event) => onHashtagsChange?.(event.target.value.slice(0, 500))}
              rows={2}
              disabled={!metaSelected}
              placeholder="#secondevie #mobilierancien #artisanat"
              className={`mt-2 w-full resize-none rounded-[16px] border-none px-4 py-3 text-[11px] font-semibold leading-5 outline-none ring-1 transition-colors duration-300 focus:ring-2 ${darkMode ? 'bg-black/25 text-white ring-white/10 placeholder:text-stone-700 focus:ring-white/25' : 'bg-[#f7f6f3] text-stone-950 ring-black/[0.055] placeholder:text-stone-400 focus:bg-white focus:ring-stone-300'}`}
            />
            <div className="mt-1 flex items-center justify-between">
              <span className={`text-[9px] ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>Ajoutés à la légende Instagram et Facebook.</span>
              <span className={`text-[8px] font-bold tabular-nums ${darkMode ? 'text-stone-600' : 'text-stone-400'}`}>{hashtags.length}/500</span>
            </div>
            {omittedMediaCount > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-[14px] bg-amber-500/10 px-3 py-2.5 text-[9px] font-bold leading-4 text-amber-700 dark:text-amber-400">
                <Info size={12} className="mt-0.5 shrink-0" />
                {omittedMediaCount} image{omittedMediaCount > 1 ? 's' : ''} reste{omittedMediaCount > 1 ? 'nt' : ''} sur le site : les réseaux acceptent {INSTAGRAM_MEDIA_LIMIT} visuels au maximum.
              </p>
            )}
          </div>
        </div>

        {socialPublication && (
          <div className={`rounded-[20px] p-4 ring-1 ${darkMode ? 'bg-white/[0.025] ring-white/10' : 'bg-white ring-black/[0.06]'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className={`text-[9px] font-extrabold uppercase tracking-[0.14em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Publication simultanée</p>
              <span className={`text-[9px] font-extrabold ${socialPublication.overallStatus === 'published' ? 'text-emerald-600' : String(socialPublication.overallStatus).includes('failure') || socialPublication.overallStatus === 'failed' ? 'text-red-600' : 'text-stone-400'}`}>
                {socialPublication.overallStatus === 'published' ? 'Terminée' : socialPublication.overallStatus === 'partial_failure' ? 'À reprendre' : 'En cours'}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-1.5 text-[8.5px] font-bold">
              <span className="rounded-full bg-emerald-500/10 px-2 py-1.5 text-center text-emerald-700 dark:text-emerald-400">Site publié</span>
              {['instagram', 'facebook'].map((destination) => {
                const stage = socialPublication.destinations?.[destination];
                const name = destination === 'instagram' ? 'Instagram' : 'Facebook';
                if (!stage?.requested) return <span key={destination} className="rounded-full bg-stone-500/10 px-2 py-1.5 text-center text-stone-400">{name} ignoré</span>;
                const success = stage.status === 'published';
                const failed = stage.status === 'failed';
                return (
                  <span key={destination} className={`rounded-full px-2 py-1.5 text-center ${success ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' : failed ? 'bg-red-500/10 text-red-700 dark:text-red-400' : 'bg-stone-500/10 text-stone-500'}`}>
                    {name} {success ? 'publié' : failed ? 'échoué' : 'envoi'}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </div>

    {zoomed && (
      <PreviewZoomOverlay
        anchorRef={rootRef}
        darkMode={darkMode}
        tabs={tabs}
        channel={channel}
        onSelect={setChannel}
        onClose={() => setZoomed(false)}
      >
        <ChannelPreview expanded channel={channel} formData={formData} galleryItems={galleryItems} hashtags={hashtags} darkMode={darkMode} />
      </PreviewZoomOverlay>
    )}
    </>
  );
}
