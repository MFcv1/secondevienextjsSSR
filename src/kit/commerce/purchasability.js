export const getProductPriceAmount = (item) => {
  const amount = Number(item?.currentPrice ?? item?.startingPrice ?? item?.price ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

export const getProductStockAmount = (item) => {
  const stock = Number(item?.stock);
  return Number.isFinite(stock) ? stock : 0;
};

export const isPurchasable = (item) => (
  (!item?.status || item.status === 'published')
  && !item?.sold
  && getProductStockAmount(item) > 0
  && getProductPriceAmount(item) > 0
  && !item?.priceOnRequest
);

/**
 * Une vente exige une preuve explicite ou la projection des réservations V2.
 * Le stock nul seul peut être un hold ou une indisponibilité indéterminée.
 */
export const isSoldOut = (item) => (
  Boolean(item?.sold)
  || item?.availability === 'sold'
);

export const getPurchaseUnavailableLabel = (item) => {
  if (item?.status && item.status !== 'published') return 'Indisponible';
  if (isSoldOut(item)) return 'Vendu';
  if (item?.availability === 'reserved') return 'Réservé';
  if (getProductStockAmount(item) <= 0) return 'Indisponible';
  if (item?.priceOnRequest || getProductPriceAmount(item) <= 0) return 'Demander un devis';
  return 'Indisponible';
};

export const shouldRequestQuote = (item) => (
  (!item?.status || item.status === 'published')
  && !item?.sold
  && getProductStockAmount(item) > 0
  && (item?.priceOnRequest || getProductPriceAmount(item) <= 0)
);
