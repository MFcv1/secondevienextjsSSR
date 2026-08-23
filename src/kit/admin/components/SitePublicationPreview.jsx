'use client';

import Image from 'next/image';
import { Heart, Image as ImageIcon, Lock, Plus } from 'lucide-react';
import { getProductUrl, slugify } from '../../../utils/slug';
import { ScaledStage } from './PublicationPhoneShell';

const STAGE_WIDTH = 400;
// Hauteur exacte de la fenetre : chrome 42 + entete 55 + media 3/4 (467)
// + gouttiere 24 + bloc titre 57 + respirations 24.
const STAGE_HEIGHT = 669;

/**
 * Fenetre macOS contenant la carte produit telle qu'elle apparait dans la
 * galerie du site : memes classes, memes tailles et memes espacements que
 * GalleryProductCardServer, pour que l'apercu ne mente pas sur le rendu public.
 */
export default function SitePublicationPreview({
  darkMode = false,
  galleryItems = [],
  name = '',
  material = '',
  price = 0,
  priceOnRequest = false,
  stock = '',
  productId = null,
  expanded = false,
}) {
  const cover = galleryItems[0];
  const title = String(name || '').trim() || 'Nom de l’ouvrage';
  const stockValue = stock === '' ? 1 : Number(stock);
  const priceLabel = priceOnRequest
    ? 'Sur demande'
    : Number(price) > 0
      ? `${Number(price).toLocaleString('fr-FR')} EUR`
      : '';
  const productPath = productId
    ? getProductUrl({ id: productId, title })
    : `/produit/${slugify(title)}-id-apres-publication`;
  const url = `secondevie.fr${productPath}`;

  return (
    <ScaledStage
      width={STAGE_WIDTH}
      height={STAGE_HEIGHT}
      label="Aperçu de la fiche sur le site"
      maxScale={expanded ? 1.7 : 1}
      minScale={0.45}
      maxWidth={expanded ? '640px' : '430px'}
    >
      <div className={`w-full overflow-hidden rounded-[18px] shadow-[0_34px_70px_rgba(28,25,23,0.24),0_10px_24px_rgba(28,25,23,0.14)] ring-1 ${darkMode ? 'bg-[#171716] ring-white/12' : 'bg-white ring-black/[0.08]'}`}>
        <div className={`flex h-[42px] shrink-0 items-center gap-3 px-3.5 ${darkMode ? 'bg-[#232320]' : 'bg-[#efeeea]'}`}>
          <div className="flex shrink-0 items-center gap-1.5" aria-hidden="true">
            <span className="h-[11px] w-[11px] rounded-full bg-[#ff5f57]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#febc2e]" />
            <span className="h-[11px] w-[11px] rounded-full bg-[#28c840]" />
          </div>
          <div className={`flex min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[7px] px-3 py-1 text-[10px] font-semibold ${darkMode ? 'bg-black/35 text-stone-400' : 'bg-white/85 text-stone-500'}`}>
            <Lock size={9} strokeWidth={2.2} className="shrink-0" />
            <span className="truncate">{url}</span>
          </div>
          <span className="w-[46px] shrink-0" aria-hidden="true" />
        </div>

        <div className={`px-5 pb-6 pt-5 ${darkMode ? 'bg-[#101010] text-white' : 'bg-[#FAF9F5] text-stone-900'}`}>
          <div className="mb-4 flex items-baseline justify-between">
            <span className="font-serif text-[19px] leading-none tracking-[-0.01em]">Galerie</span>
            <span className={`text-[8px] font-black uppercase tracking-[0.22em] ${darkMode ? 'text-stone-500' : 'text-stone-400'}`}>Nouveauté</span>
          </div>

          {/* Reprise fidele de GalleryProductCardServer : gap-6, media 3/4, pt-4. */}
          <div className="group relative flex w-full touch-manipulation flex-col gap-6">
            <div className="product-card-media relative aspect-[3/4] w-full overflow-hidden rounded-[12px]">
              {cover?.preview ? (
                <Image
                  unoptimized
                  fill
                  sizes="400px"
                  src={cover.preview}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:scale-[1.03]"
                />
              ) : (
                <div className={`flex h-full w-full flex-col items-center justify-center gap-3 ${darkMode ? 'bg-white/[0.04] text-stone-600' : 'bg-stone-200/60 text-stone-400'}`}>
                  <ImageIcon size={26} strokeWidth={1.3} />
                  <span className="text-[10px] font-bold">Aucune photo</span>
                </div>
              )}

              <div className="absolute right-3 top-3 z-20 flex flex-col gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#8B5C42] text-white shadow-md">
                  <Plus className="h-4 w-4" strokeWidth={2.5} />
                </span>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-stone-700 shadow-md">
                  <Heart className="h-[15px] w-[15px]" strokeWidth={2} fill="none" />
                </span>
              </div>
            </div>

            <div className="flex items-start justify-between gap-4 pt-4">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="truncate text-[9px] font-black uppercase tracking-widest opacity-50">
                  {material || 'Matiere inconnue'}
                </div>
                <h3 className="font-serif text-xl leading-tight">{title}</h3>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1 text-right">
                <div className="whitespace-nowrap text-[9px] font-black uppercase tracking-widest opacity-50">
                  Stock: {Number.isFinite(stockValue) ? stockValue : 0}
                </div>
                <p className="whitespace-nowrap text-sm font-bold tabular-nums">{priceLabel}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScaledStage>
  );
}
