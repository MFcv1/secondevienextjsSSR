'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlignLeft,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Heart,
  Maximize2,
  ShoppingBag,
  X,
} from 'lucide-react';
import {
  PRODUCT_DIRECT_DETAIL_IMAGE_SIZES,
  getProductDisplayImageSrc,
  getProductZoomFullImageSrc,
  getProductZoomInitialImageSrc,
  preloadImage,
} from '../../utils/imageUtils';

const DEFAULT_RATIO = 0.75;
const TALL_IMAGE_RATIO = 0.72;

const getThumbSrc = (image) => (
  image?.thumb || image?.card || image?.medium || image?.src || image?.large || image?.full || ''
);

const getDirectDisplayFallbackSrc = (image) => (
  image?.medium || image?.large || image?.src || image?.card || image?.thumb || image?.full || ''
);

const scheduleIdle = (callback, delay = 140) => {
  if (typeof window === 'undefined') return () => {};

  let timeoutId = 0;
  let idleId = 0;
  let cancelled = false;

  const run = () => {
    if (cancelled) return;
    callback();
  };

  timeoutId = window.setTimeout(() => {
    timeoutId = 0;
    if (typeof window.requestIdleCallback === 'function') {
      idleId = window.requestIdleCallback(run, { timeout: 900 });
      return;
    }
    run();
  }, delay);

  return () => {
    cancelled = true;
    if (timeoutId) window.clearTimeout(timeoutId);
    if (idleId && typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(idleId);
    }
  };
};

const useLocalWishlist = (productId) => {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!productId || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('sv_public_product_wishlist');
      const ids = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
      setLiked(ids.includes(productId));
    } catch {
      setLiked(false);
    }
  }, [productId]);

  const toggle = useCallback(() => {
    if (!productId || typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem('sv_public_product_wishlist');
      const ids = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];
      const next = ids.includes(productId)
        ? ids.filter((id) => id !== productId)
        : [...ids, productId];
      window.localStorage.setItem('sv_public_product_wishlist', JSON.stringify(next));
      setLiked(next.includes(productId));
    } catch {
      setLiked((value) => !value);
    }
  }, [productId]);

  return [liked, toggle];
};

const ProductThumbRail = ({ images, activeIndex, onSelect, className = '', mobile = false }) => {
  const railRef = useRef(null);

  useEffect(() => {
    const active = railRef.current?.querySelector(`[data-thumb-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [activeIndex]);

  if (images.length <= 1) return null;

  return (
    <div ref={railRef} className={`no-scrollbar overflow-auto ${className}`}>
      <div className={mobile ? 'flex w-max gap-2 px-5 py-2' : 'flex lg:flex-col gap-3'}>
        {images.map((image, index) => {
          const thumb = getThumbSrc(image);
          return (
            <button
              key={`${thumb || image.src || index}-${index}`}
              type="button"
              data-thumb-index={index}
              aria-label={`Afficher l'image ${index + 1}`}
              onPointerEnter={() => preloadImage(getDirectDisplayFallbackSrc(image), {
                priority: 'high',
                srcSet: image?.srcSet || undefined,
                sizes: image?.srcSet ? PRODUCT_DIRECT_DETAIL_IMAGE_SIZES : undefined,
                decode: true,
              }).catch(() => null)}
              onFocus={() => preloadImage(getDirectDisplayFallbackSrc(image), {
                priority: 'high',
                srcSet: image?.srcSet || undefined,
                sizes: image?.srcSet ? PRODUCT_DIRECT_DETAIL_IMAGE_SIZES : undefined,
                decode: true,
              }).catch(() => null)}
              onClick={() => onSelect(index)}
              className={[
                'relative shrink-0 overflow-hidden border transition duration-200',
                mobile ? 'h-12 w-12 rounded-md' : 'h-16 w-16 rounded-lg',
                activeIndex === index
                  ? 'border-white bg-white shadow-[0_10px_30px_rgba(0,0,0,0.18)] ring-1 ring-stone-300'
                  : 'border-white/20 bg-white/40 opacity-70 hover:opacity-100',
              ].join(' ')}
              style={{ backgroundColor: image.metadata?.dominantColor || '#ded4c8' }}
            >
              {thumb ? (
                <img
                  src={thumb}
                  alt=""
                  loading={index < 8 ? 'eager' : 'lazy'}
                  decoding="async"
                  fetchPriority="low"
                  className="h-full w-full object-cover"
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default function ProductPageExperience({
  product,
  images,
  facts,
  categoryHref,
  priceLabel,
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isDesktopViewport, setIsDesktopViewport] = useState(false);
  const [visibleDisplaySrc, setVisibleDisplaySrc] = useState('');
  const [decodedDisplayKey, setDecodedDisplayKey] = useState('');
  const [lightboxBaseSrc, setLightboxBaseSrc] = useState('');
  const [lightboxFullSrc, setLightboxFullSrc] = useState('');
  const [liked, toggleLiked] = useLocalWishlist(product?.id);
  const mainImageRef = useRef(null);
  const swipeRef = useRef({ x: 0, y: 0 });
  const sheetDragRef = useRef({ y: 0 });

  const safeImages = images?.length ? images : [];
  const activeImage = safeImages[Math.min(activeIndex, Math.max(0, safeImages.length - 1))] || null;
  const activeRatio = activeImage?.metadata?.ratio || activeImage?.ratio || DEFAULT_RATIO;
  const activeFitMode = activeRatio < TALL_IMAGE_RATIO ? 'tall' : 'standard';
  const mobileMainSrc = getProductDisplayImageSrc(activeImage, { viewport: 'mobile' });
  const desktopMainSrc = getProductDisplayImageSrc(activeImage, { viewport: 'desktop' });
  const currentDisplaySrc = isDesktopViewport ? desktopMainSrc : mobileMainSrc;
  const displaySrcSet = activeImage?.srcSet || '';
  const mainSrc = getDirectDisplayFallbackSrc(activeImage) || mobileMainSrc;
  const thumbSrc = getThumbSrc(activeImage);
  const displayKey = [
    activeIndex,
    displaySrcSet,
    mobileMainSrc,
    desktopMainSrc,
    mainSrc,
  ].join('|');
  const isMainImageReady = decodedDisplayKey === displayKey;
  const lightboxInitialSrc = getProductZoomInitialImageSrc(activeImage, {
    displaySrc: lightboxBaseSrc || visibleDisplaySrc || currentDisplaySrc,
    viewport: isDesktopViewport ? 'desktop' : 'mobile',
  });
  const lightboxSrc = lightboxFullSrc || lightboxInitialSrc;
  const productTitle = product?.name || product?.title || 'Produit';

  const goToIndex = useCallback((index) => {
    setActiveIndex(Math.max(0, Math.min(index, safeImages.length - 1)));
  }, [safeImages.length]);

  const goPrevious = useCallback(() => {
    goToIndex(activeIndex <= 0 ? safeImages.length - 1 : activeIndex - 1);
  }, [activeIndex, goToIndex, safeImages.length]);

  const goNext = useCallback(() => {
    goToIndex(activeIndex >= safeImages.length - 1 ? 0 : activeIndex + 1);
  }, [activeIndex, goToIndex, safeImages.length]);

  useEffect(() => {
    setVisibleDisplaySrc('');
    setDecodedDisplayKey('');
    setLightboxBaseSrc('');
    setLightboxFullSrc('');
  }, [displayKey]);

  const markMainImageReady = useCallback(async (image) => {
    if (!image) return;

    const resolvedSrc = image.currentSrc || image.src || mainSrc;
    setVisibleDisplaySrc(resolvedSrc);

    if (!image.complete) return;

    try {
      if (typeof image.decode === 'function') {
        await image.decode();
      }
    } catch {
      // Loaded images can still reject decode; keep the UI usable.
    }

    if (mainImageRef.current !== image) return;

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (mainImageRef.current === image) {
          setDecodedDisplayKey(displayKey);
        }
      });
    });
  }, [displayKey, mainSrc]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const image = mainImageRef.current;
    if (!image) return undefined;

    let cancelled = false;

    const run = async () => {
      await markMainImageReady(image);
      if (!cancelled && mainImageRef.current === image && image.complete) {
        setDecodedDisplayKey(displayKey);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [displayKey, markMainImageReady]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsDesktopViewport(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    if (!safeImages.length) return undefined;
    return scheduleIdle(() => {
      const indexes = new Set([
        activeIndex - 2,
        activeIndex - 1,
        activeIndex + 1,
        activeIndex + 2,
      ]);
      indexes.forEach((index) => {
        const image = safeImages[index];
        const src = getDirectDisplayFallbackSrc(image);
        if (src) {
          preloadImage(src, {
            priority: 'low',
            srcSet: image?.srcSet || undefined,
            sizes: image?.srcSet ? PRODUCT_DIRECT_DETAIL_IMAGE_SIZES : undefined,
            decode: false,
          }).catch(() => null);
        }
      });
    }, 260);
  }, [activeIndex, safeImages]);

  useEffect(() => {
    if (!lightboxOpen || !lightboxInitialSrc) return undefined;
    document.body.classList.add('modal-open');
    preloadImage(lightboxInitialSrc, { priority: 'high', decode: true }).catch(() => null);

    let cancelled = false;
    const fullSrc = getProductZoomFullImageSrc(activeImage);
    if (fullSrc && fullSrc !== lightboxInitialSrc) {
      scheduleIdle(() => {
        preloadImage(fullSrc, { priority: 'auto', decode: true })
          .then(() => {
            if (!cancelled) setLightboxFullSrc(fullSrc);
          })
          .catch(() => null);
      }, 450);
    }

    return () => {
      cancelled = true;
      document.body.classList.remove('modal-open');
    };
  }, [activeImage, lightboxInitialSrc, lightboxOpen]);

  const openLightbox = useCallback((event) => {
    const visibleImage = event?.currentTarget?.querySelector?.('[data-product-main-image="true"]');
    const preferredDisplaySrc = isDesktopViewport ? desktopMainSrc : mobileMainSrc;
    const displaySrc = visibleImage?.currentSrc || visibleImage?.src || visibleDisplaySrc || preferredDisplaySrc || mainSrc;
    setLightboxFullSrc('');
    setLightboxBaseSrc(displaySrc);
    setLightboxOpen(true);
  }, [desktopMainSrc, isDesktopViewport, mainSrc, mobileMainSrc, visibleDisplaySrc]);

  const onPointerDown = (event) => {
    swipeRef.current = { x: event.clientX, y: event.clientY };
  };

  const onPointerUp = (event) => {
    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;
    if (Math.abs(dx) > 44 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) goNext();
      else goPrevious();
    } else if (Math.abs(dy) > 58 && Math.abs(dy) > Math.abs(dx) * 1.2) {
      if (dy < 0) setMobileSheetOpen(true);
    }
  };

  const onSheetPointerDown = (event) => {
    sheetDragRef.current = { y: event.clientY };
  };

  const onSheetPointerUp = (event) => {
    const dy = event.clientY - sheetDragRef.current.y;
    if (dy > 54) setMobileSheetOpen(false);
  };

  const statusLabel = product?.sold || Number(product?.stock) === 0 ? 'Vendu' : 'Disponible';
  const description = product?.description || 'Pièce restaurée par Seconde Vie, sélectionnée pour son caractère et sa présence.';

  const detailList = useMemo(() => facts?.filter((fact) => fact?.value) || [], [facts]);

  return (
    <article
      data-next-product-experience="true"
      data-ssr-product
      className="min-h-screen bg-[#0f0f11] text-stone-50 lg:bg-[#f4eee6] lg:text-stone-950"
    >
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4 py-4 safe-pt-header lg:absolute lg:px-8 lg:py-7">
        <Link
          href="/"
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-xl transition hover:bg-black/40 lg:border-stone-900/10 lg:bg-white/70 lg:text-stone-950"
          aria-label="Retour galerie"
        >
          <ArrowLeft size={19} strokeWidth={1.7} />
        </Link>
        <Link href="/" className="font-serif text-2xl leading-none tracking-wide text-white lg:text-stone-950">
          Seconde Vie
        </Link>
        <button
          type="button"
          onClick={toggleLiked}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-xl transition hover:bg-black/40 lg:border-stone-900/10 lg:bg-white/70 lg:text-stone-950"
          aria-label={liked ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Heart size={19} strokeWidth={1.7} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
        </button>
      </header>

      <main className="relative min-h-screen overflow-hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(390px,520px)]">
        <section
          className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-3 safe-product-image-stage lg:min-h-screen lg:px-20 lg:py-16"
          style={{ backgroundColor: activeImage?.metadata?.dominantColor || '#eee6dc' }}
        >
          {thumbSrc ? (
            <img
              src={thumbSrc}
              alt=""
              aria-hidden="true"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="pointer-events-none absolute inset-0 hidden h-full w-full scale-110 object-cover opacity-50 blur-[80px] saturate-150 lg:block"
            />
          ) : null}

          <ProductThumbRail
            images={safeImages}
            activeIndex={activeIndex}
            onSelect={goToIndex}
            className="absolute left-6 top-1/2 z-20 hidden max-h-[70vh] -translate-y-1/2 lg:block"
          />

          <button
            type="button"
            className="group relative z-10 flex cursor-zoom-in items-center justify-center"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onClick={openLightbox}
            aria-label="Agrandir l'image produit"
            style={{ touchAction: 'pan-y' }}
          >
            <span className="product-detail-mobile-image-shadow drop-shadow-[0_24px_60px_rgba(0,0,0,0.62)] lg:drop-shadow-[0_45px_110px_rgba(0,0,0,0.36)]">
              <span
                data-fit-mode={activeFitMode}
                className="product-detail-mobile-image-frame"
                style={{
                  aspectRatio: String(activeRatio || DEFAULT_RATIO),
                  backgroundColor: activeImage?.metadata?.dominantColor || '#e8ded2',
                }}
              >
                <span className="product-detail-mobile-image-clip block">
                  {mainSrc ? (
                    <picture>
                      {desktopMainSrc && desktopMainSrc !== mainSrc ? (
                        <source
                          media="(min-width: 1024px)"
                          srcSet={displaySrcSet || desktopMainSrc}
                          sizes={displaySrcSet ? PRODUCT_DIRECT_DETAIL_IMAGE_SIZES : undefined}
                        />
                      ) : null}
                      <img
                        key={`${mainSrc}-${desktopMainSrc}-${activeIndex}`}
                        ref={mainImageRef}
                        src={mainSrc}
                        srcSet={displaySrcSet || undefined}
                        sizes={displaySrcSet ? PRODUCT_DIRECT_DETAIL_IMAGE_SIZES : undefined}
                        alt={productTitle}
                        loading="eager"
                        decoding="async"
                        fetchPriority="high"
                        data-product-main-image="true"
                        data-display-mobile-src={mobileMainSrc}
                        data-display-desktop-src={desktopMainSrc}
                        data-image-ready={isMainImageReady ? 'true' : 'false'}
                        className={[
                          'product-detail-mobile-image product-detail-mobile-image-layer--current select-none object-contain transition-opacity duration-[120ms] ease-out',
                          isMainImageReady ? 'opacity-100' : 'opacity-0',
                        ].join(' ')}
                        onLoad={(event) => {
                          markMainImageReady(event.currentTarget);
                        }}
                        draggable={false}
                      />
                    </picture>
                  ) : null}
                </span>
              </span>
            </span>
            <span className="absolute bottom-3 right-3 hidden h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white opacity-0 backdrop-blur-md transition group-hover:opacity-100 lg:flex">
              <Maximize2 size={17} />
            </span>
          </button>

          {safeImages.length > 1 ? (
            <>
              <button
                type="button"
                onClick={goPrevious}
                className="absolute left-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 text-stone-950 shadow-lg backdrop-blur-md lg:flex"
                aria-label="Image precedente"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goNext}
                className="absolute right-5 top-1/2 z-20 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/75 text-stone-950 shadow-lg backdrop-blur-md lg:flex"
                aria-label="Image suivante"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}

          <ProductThumbRail
            images={safeImages}
            activeIndex={activeIndex}
            onSelect={goToIndex}
            mobile
            className="absolute left-0 right-0 top-16 z-30 lg:hidden"
          />

          <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-between px-5 safe-pb-product-summary lg:hidden">
            <div className="min-w-0 pr-4">
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.28em] text-white/45">{statusLabel}</p>
              <h1 className="line-clamp-1 font-serif text-[28px] leading-none text-white drop-shadow-lg">{productTitle}</h1>
              <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-white/70 drop-shadow-md">{description}</p>
            </div>
            <button
              type="button"
              onClick={() => setMobileSheetOpen(true)}
              className="mb-1 inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/12 text-white backdrop-blur-xl"
              aria-label="Ouvrir les details"
            >
              <AlignLeft size={22} strokeWidth={1.5} />
            </button>
          </div>
        </section>

        <aside className="relative z-20 hidden min-h-screen border-l border-stone-900/10 bg-[#fbf7f1]/90 px-9 py-28 shadow-[-30px_0_80px_rgba(70,50,30,0.08)] backdrop-blur-2xl lg:block">
          <ProductDetails
            product={product}
            title={productTitle}
            description={description}
            priceLabel={priceLabel}
            categoryHref={categoryHref}
            statusLabel={statusLabel}
            facts={detailList}
            liked={liked}
            onToggleLiked={toggleLiked}
          />
        </aside>
      </main>

      <div
        data-mobile-bottom-sheet
        className={[
          'fixed inset-x-0 bottom-0 z-50 flex max-h-[calc(100svh-5rem)] flex-col rounded-t-3xl border-t border-white/10 bg-[#111]/95 px-5 pt-4 text-white shadow-[0_-28px_90px_rgba(0,0,0,0.55)] backdrop-blur-3xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] safe-pb-product-sheet lg:hidden',
          mobileSheetOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        onPointerDown={onSheetPointerDown}
        onPointerUp={onSheetPointerUp}
      >
        <button
          type="button"
          onClick={() => setMobileSheetOpen(false)}
          className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/25"
          aria-label="Fermer les details"
        />
        <div className="min-h-0 overflow-y-auto pb-6">
          <ProductDetails
            product={product}
            title={productTitle}
            description={description}
            priceLabel={priceLabel}
            categoryHref={categoryHref}
            statusLabel={statusLabel}
            facts={detailList}
            liked={liked}
            onToggleLiked={toggleLiked}
            mobile
          />
        </div>
      </div>

      {lightboxOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/95 p-2 text-white">
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            className="absolute right-4 top-4 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 backdrop-blur-md"
            aria-label="Fermer l'image agrandie"
          >
            <X size={22} />
          </button>
          {lightboxSrc ? (
            <img
              src={lightboxSrc}
              data-lightbox-initial-src={lightboxInitialSrc}
              data-lightbox-full-src={lightboxFullSrc}
              alt={productTitle}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="product-detail-lightbox-image object-contain"
              draggable={false}
            />
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function ProductDetails({
  product,
  title,
  description,
  priceLabel,
  categoryHref,
  statusLabel,
  facts,
  liked,
  onToggleLiked,
  mobile = false,
}) {
  const textTone = mobile ? 'text-white' : 'text-stone-950';
  const mutedTone = mobile ? 'text-white/55' : 'text-stone-500';
  const borderTone = mobile ? 'border-white/10' : 'border-stone-200';
  const buttonTone = mobile
    ? 'bg-white text-stone-950 hover:bg-stone-100'
    : 'bg-stone-950 text-white hover:bg-black';

  return (
    <div className="space-y-8">
      <nav className={`flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.22em] ${mutedTone}`}>
        <Link href="/">Galerie</Link>
        {product?.category ? (
          <>
            <span aria-hidden="true">/</span>
            <Link href={categoryHref}>{product.category}</Link>
          </>
        ) : null}
      </nav>

      <div className="space-y-4">
        <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${mutedTone}`}>{statusLabel}</p>
        <h2 className={`font-serif text-5xl leading-[0.9] lg:text-7xl ${textTone}`}>{title}</h2>
        <p className={`text-xl font-semibold ${textTone}`}>{priceLabel}</p>
      </div>

      <p className={`max-w-xl text-sm leading-7 lg:text-base lg:leading-8 ${mobile ? 'text-white/70' : 'text-stone-600'}`}>
        {description}
      </p>

      {facts.length ? (
        <dl className={`grid gap-0 border-y ${borderTone}`}>
          {facts.map((fact) => (
            <div key={fact.label} className={`flex items-start justify-between gap-5 border-b py-3 last:border-b-0 ${borderTone}`}>
              <dt className={`text-[10px] font-black uppercase tracking-[0.22em] ${mutedTone}`}>{fact.label}</dt>
              <dd className={`max-w-[60%] text-right text-sm font-semibold ${textTone}`}>{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href={`/devis?produit=${encodeURIComponent(product?.id || '')}`}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${buttonTone}`}
        >
          <ShoppingBag size={16} />
          Réserver
        </Link>
        <button
          type="button"
          onClick={onToggleLiked}
          className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-full border px-5 py-3 text-sm font-black uppercase tracking-[0.14em] transition ${borderTone} ${mobile ? 'text-white' : 'text-stone-950'}`}
        >
          <Heart size={16} className={liked ? 'fill-rose-400 text-rose-400' : ''} />
          Favori
        </button>
      </div>

      <div className={`rounded-2xl border p-5 ${borderTone} ${mobile ? 'bg-white/5' : 'bg-white/50'}`}>
        <p className={`text-[10px] font-black uppercase tracking-[0.24em] ${mutedTone}`}>Piece unique</p>
        <p className={`mt-3 text-sm leading-6 ${mobile ? 'text-white/65' : 'text-stone-600'}`}>
          Chaque meuble est disponible en quantite limitee. Pour une question de livraison ou de reservation, la demande de devis garde le parcours complet sans charger la galerie.
        </p>
      </div>
    </div>
  );
}
