import { ArrowUpRight } from 'lucide-react';
import { PRODUCT_CARD_IMAGE_SIZES } from '../../utils/imageUtils';

const getDimensions = (metadata) => {
  const width = Math.max(1, Number(metadata?.width) || 768);
  const ratio = Number(metadata?.ratio) || (
    Number(metadata?.width) && Number(metadata?.height)
      ? Number(metadata.width) / Number(metadata.height)
      : 0.75
  );
  return { width, height: Math.max(1, Math.round(width / ratio)) };
};

export function ProductCardHoverOverlay() {
  return (
    <span className="product-card-hover-overlay" aria-hidden="true">
      <span className="product-card-hover-veil" />
      <span className="product-card-hover-cta">
        <span className="product-card-hover-label">Découvrir</span>
        <span className="product-card-hover-dot">
          <ArrowUpRight size={12} strokeWidth={1.9} />
        </span>
      </span>
    </span>
  );
}

export function ProductSoldBadge() {
  return (
    <span className="product-card-sold-badge">Vendu</span>
  );
}

export default function ProductCardMediaServer({
  cardImage,
  alt,
  priority = false,
  sizes = PRODUCT_CARD_IMAGE_SIZES,
  imageClassName = 'product-card-image h-full w-full object-cover',
  pictureClassName = 'block h-full w-full',
  warmupSrc = '',
  draggable = false,
} = {}) {
  if (!cardImage?.src) return null;
  const metadata = cardImage.metadata || null;
  const dimensions = getDimensions(metadata);

  return (
    <span
      className="product-card-media-surface block h-full w-full"
      data-product-media-warmup={warmupSrc || undefined}
      data-product-media-state="loading"
    >
      <picture className={pictureClassName}>
        {cardImage.desktopSrcSet ? (
          <source media="(min-width: 1024px)" srcSet={cardImage.desktopSrcSet} sizes={sizes} />
        ) : null}
        <img
          src={cardImage.src}
          srcSet={cardImage.srcSet || undefined}
          sizes={sizes}
          alt={alt}
          width={dimensions.width}
          height={dimensions.height}
          draggable={draggable}
          data-real-image="true"
          data-product-image-state="loading"
          className={imageClassName}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </picture>
    </span>
  );
}
