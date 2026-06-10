import { getProductUrl } from '../../utils/slug';
import { PRODUCT_CARD_IMAGE_SIZES, getProductCardImage, getProductImageItems } from '../../utils/imageUtils';
import GalleryCardActionsIsland from './GalleryCardActionsIsland';

const formatPrice = (item) => {
  if (item?.sold) return 'VENDU';
  if (item?.priceOnRequest) return '';
  const price = item?.currentPrice || item?.startingPrice || item?.price;
  return price ? `${Number(price).toLocaleString('fr-FR')} EUR` : '';
};

const getCartItemPayload = (item, cardImage, title) => ({
  originalId: item?.id || '',
  id: item?.id || '',
  collectionName: item?.collectionName || 'furniture',
  name: title,
  title,
  price: Number(item?.currentPrice || item?.startingPrice || item?.price || 0),
  image: cardImage?.src || item?.imageUrl || item?.thumbnailUrl || '',
  imageUrl: cardImage?.src || item?.imageUrl || item?.thumbnailUrl || '',
  material: item?.material || 'Bois',
  quantity: 1,
});

export default function GalleryProductCardServer({
  item,
  layoutMode = 'grid',
  isBig = false,
  compact = false,
  priority = false,
} = {}) {
  const cardImage = getProductCardImage(item);
  const [primaryDetailImage] = getProductImageItems(item);
  const title = item?.name || item?.title || 'Piece restauree';
  const cartItem = getCartItemPayload(item, cardImage, title);
  const warmupImage = primaryDetailImage ? {
    medium: primaryDetailImage.medium || '',
    card: primaryDetailImage.card || '',
    thumb: primaryDetailImage.thumb || '',
    src: primaryDetailImage.src || '',
  } : null;

  const productUrl = getProductUrl(item);

  return (
    <div
      className={`group relative flex touch-manipulation flex-col ${compact ? 'gap-3 md:gap-6' : 'gap-6'} w-full text-inherit ${layoutMode === 'list' ? 'flex-row items-center gap-12 border-b border-stone-200 pb-12' : ''}`}
    >
      <div
        className={`product-card-media relative overflow-hidden rounded-[12px] bg-[#fbfaf8] ${layoutMode === 'list' ? 'w-1/3 aspect-[4/3]' : 'w-full aspect-[3/4]'} ${isBig ? 'md:aspect-[16/10]' : ''}`}
        data-image-reveal="visible"
        data-image-loaded={cardImage.src ? 'true' : 'false'}
      >
        <a href={productUrl} draggable={false} className="block h-full w-full cursor-pointer text-inherit no-underline" aria-label={`Découvrir ${title}`}>
          {cardImage.src ? (
            <picture className="block h-full w-full">
              <img
                src={cardImage.src}
                srcSet={cardImage.srcSet || undefined}
                sizes={PRODUCT_CARD_IMAGE_SIZES}
                alt={title}
                draggable={false}
                data-real-image="true"
                className="product-card-image h-full w-full object-cover transition-transform duration-[800ms] ease-[cubic-bezier(0.23,1,0.32,1)] lg:group-hover:scale-[1.03]"
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                fetchPriority={priority ? 'high' : 'auto'}
              />
            </picture>
          ) : null}

          <div className="absolute inset-0 hidden items-center justify-center bg-black/0 transition-colors duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-black/50 lg:flex">
            <div className="relative flex flex-col items-center gap-3 px-10 py-7 opacity-0 transition-opacity duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100">
              <div className="absolute left-0 top-0 h-3 w-3 translate-x-2 translate-y-2 border-l border-t border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
              <div className="absolute right-0 top-0 h-3 w-3 -translate-x-2 translate-y-2 border-r border-t border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
              <div className="absolute bottom-0 left-0 h-3 w-3 translate-x-2 -translate-y-2 border-b border-l border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
              <div className="absolute bottom-0 right-0 h-3 w-3 -translate-x-2 -translate-y-2 border-b border-r border-white/40 transition-all duration-[600ms] group-hover:translate-x-0 group-hover:translate-y-0" />
              <span className="translate-y-2 text-[9px] font-black uppercase tracking-[0.4em] text-white transition-transform duration-[600ms] group-hover:translate-y-0">
                Decouvrir
              </span>
              <div className="h-[1.5px] w-8 origin-center scale-x-0 bg-white/30 transition-transform duration-[800ms] group-hover:scale-x-100" />
            </div>
          </div>
        </a>

        <GalleryCardActionsIsland item={cartItem} productUrl={productUrl} warmupImage={warmupImage} />
      </div>

      <a href={productUrl} draggable={false} className={`flex cursor-pointer text-inherit no-underline ${compact ? 'flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4' : 'items-start justify-between gap-2 md:gap-4'} ${layoutMode === 'list' ? 'flex-1 pt-6' : compact ? 'pt-1 md:pt-4' : 'pt-4'}`}>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:gap-1">
          <div className={`truncate font-black uppercase tracking-widest opacity-50 ${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px]'}`}>
            {item?.material || 'Matiere inconnue'}
          </div>
          <h3 className={`font-serif leading-tight ${compact ? 'text-[13px] md:text-lg lg:text-xl' : 'text-[15px] md:text-lg lg:text-xl'} ${layoutMode === 'list' ? 'text-4xl' : ''}`}>
            {title}
          </h3>
        </div>

        <div className={`flex shrink-0 ${compact ? 'flex-row items-center justify-between md:flex-col md:items-end' : 'flex-col items-end'} gap-0.5 text-right md:gap-1`}>
          <div className={`whitespace-nowrap font-black uppercase tracking-widest opacity-50 ${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px]'}`}>
            {item?.sold ? 'Stock: 0' : `Stock: ${item?.stock !== undefined ? item.stock : 1}`}
          </div>
          <p className={`whitespace-nowrap font-bold tabular-nums ${compact ? 'text-[10px] md:text-xs lg:text-sm' : 'text-[11px] md:text-xs lg:text-sm'} ${item?.sold ? 'text-red-500' : ''}`}>
            {formatPrice(item)}
          </p>
        </div>
      </a>
    </div>
  );
}
