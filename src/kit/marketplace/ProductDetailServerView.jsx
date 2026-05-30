import React from 'react';
import { getProductImageItems } from '../../utils/imageUtils';
import ProductDetailActionsIsland from './ProductDetailActionsIsland';
import ProductDetailShellIsland from './ProductDetailShellIsland';

const normalizeText = (value, fallback = '') => String(value || fallback).replace(/\s+/g, ' ').trim();

const formatPrice = (product) => {
  if (product?.priceOnRequest) return 'Sur demande';
  const amount = Number(product?.currentPrice || product?.startingPrice || product?.price || 0);
  if (!Number.isFinite(amount) || amount <= 0) return '';
  return `${Math.round(amount).toLocaleString('fr-FR')} €`;
};

const getDimensions = (product) => {
  if (product?.dimensions) return product.dimensions;
  const width = product?.width;
  const depth = product?.depth;
  const height = product?.height;
  if (!width && !depth && !height) return '';
  return [width, depth, height].filter(Boolean).join('x') + 'cm';
};

const getFacts = (product) => [
  { label: 'Matériau', value: product?.material || '' },
  { label: 'Dimension', value: getDimensions(product) },
  { label: 'Poids', value: product?.weight ? `${product.weight} kg` : '' },
  { label: 'Disponibilité', value: product?.sold || Number(product?.stock) === 0 ? 'Vendu' : 'Disponible' },
].filter((fact) => fact.value);

function ProductDetailDesktopInfo({ product, title, description, priceLabel, facts }) {
  return (
    <div className="hidden lg:flex w-[450px] xl:w-[500px] flex-shrink-0 flex-col z-20 transition-colors duration-1000 h-[100dvh] pt-36 pb-8 bg-[#FAFAFA] border-l border-black/5 shadow-2xl">
      <div className="flex-shrink-0 px-10">
        <header className="mb-10 detail-stagger flex flex-col">
          <p className="font-label text-[10px] tracking-[0.4em] uppercase text-[#757575] mb-3">
            {product?.id ? `Pièce N°${String(product.id).substring(0, 4).toUpperCase()}` : 'Pièce Unique'}
          </p>
          <h1 className="split-detail-title font-serif text-4xl xl:text-5xl tracking-tighter leading-tight mb-5 transition-colors duration-1000 text-stone-900">
            {title}
          </h1>
          <div className="font-sans font-medium text-3xl transition-colors duration-1000 text-stone-900">
            {product?.priceOnRequest ? (
              <span className="text-xl text-[#ababab]">Sur demande</span>
            ) : (
              <div className="flex items-baseline gap-1">
                <span>{priceLabel.replace(/\s*€$/, '')}</span>
                <span className="text-xl font-light text-[#757575] ml-1">€</span>
              </div>
            )}
          </div>
        </header>

        <ProductDetailActionsIsland
          productId={product?.id}
          productName={title}
          priceLabel={priceLabel}
        />
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-10">
        <section className="detail-stagger pt-6 border-t border-zinc-200/20 pb-6">
          <h2 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-4">La Pièce</h2>
          <p className="font-sans leading-[1.8] text-[13px] tracking-wide whitespace-pre-wrap transition-colors duration-1000 text-stone-600">
            {description}
          </p>
        </section>
      </div>

      <div className="flex-shrink-0 px-10 pt-2">
        <section className="detail-stagger pt-4 border-t border-zinc-200/20">
          <h2 className="font-label text-[10px] tracking-[0.3em] uppercase text-[#91a293] mb-4">Informations</h2>
          <dl className="space-y-3 font-label text-[9px] tracking-widest uppercase text-[#757575]">
            {facts.map((fact) => (
              <div key={fact.label} className="flex justify-between border-b border-black/5 pb-2">
                <dt>{fact.label}</dt>
                <dd className="max-w-[58%] text-right text-zinc-900 font-sans">{fact.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}

export default function ProductDetailServerView({ product }) {
  const images = getProductImageItems(product);
  const title = normalizeText(product?.name || product?.title, 'Produit Seconde Vie');
  const description = normalizeText(product?.description, 'Pièce restaurée par Seconde Vie.');
  const priceLabel = formatPrice(product);
  const facts = getFacts(product);

  return (
    <ProductDetailShellIsland
      product={product}
      images={images}
      facts={facts}
      priceLabel={priceLabel}
      desktopInfo={(
        <ProductDetailDesktopInfo
          product={product}
          title={title}
          description={description}
          priceLabel={priceLabel}
          facts={facts}
        />
      )}
    />
  );
}
