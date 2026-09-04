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
 * Vrai quand la piece n'est plus disponible a la vente : soit le champ `sold`
 * est renseigne, soit le stock est retombe a zero. C'est l'etat affiche
 * (badge + libelle de prix), distinct de `isPurchasable` qui gouverne le panier.
 */
export const isSoldOut = (item) => (
  Boolean(item?.sold)
  || ((!item?.status || item.status === 'published') && getProductStockAmount(item) <= 0)
);

export const getPurchaseUnavailableLabel = (item) => {
  if (item?.status && item.status !== 'published') return 'Indisponible';
  if (item?.sold) return 'Vendu';
  if (getProductStockAmount(item) <= 0) return 'Deja reserve';
  if (item?.priceOnRequest || getProductPriceAmount(item) <= 0) return 'Demander un devis';
  return 'Indisponible';
};

export const shouldRequestQuote = (item) => (
  (!item?.status || item.status === 'published')
  && !item?.sold
  && getProductStockAmount(item) > 0
  && (item?.priceOnRequest || getProductPriceAmount(item) <= 0)
);
