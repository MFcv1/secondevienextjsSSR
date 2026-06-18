export const getProductPriceAmount = (item) => {
  const amount = Number(item?.currentPrice ?? item?.startingPrice ?? item?.price ?? 0);
  return Number.isFinite(amount) ? amount : 0;
};

export const getProductStockAmount = (item) => {
  const stock = Number(item?.stock);
  return Number.isFinite(stock) ? stock : 0;
};

export const isPurchasable = (item) => (
  !item?.sold
  && getProductStockAmount(item) > 0
  && getProductPriceAmount(item) > 0
  && !item?.priceOnRequest
);

export const getPurchaseUnavailableLabel = (item) => {
  if (item?.sold) return 'Vendu';
  if (getProductStockAmount(item) <= 0) return 'Deja reserve';
  if (item?.priceOnRequest || getProductPriceAmount(item) <= 0) return 'Demander un devis';
  return 'Indisponible';
};

export const shouldRequestQuote = (item) => (
  !item?.sold
  && getProductStockAmount(item) > 0
  && (item?.priceOnRequest || getProductPriceAmount(item) <= 0)
);
