const normalizeCheckoutLine = (item) => ({
  cartLineId: item.cartLineId || item.id,
  cartRevision: Number.isSafeInteger(item.cartRevision) ? item.cartRevision : 0,
  productId: item.originalId || item.productId,
  collectionName: item.collectionName || 'furniture',
  variantId: item.variantId || null,
  quantity: Number(item.quantity || 1)
});

export const buildCheckoutV2Input = ({
  clientOrderId,
  cartItems,
  deliveryModeId,
  shippingAddress
}) => {
  const deliveryAliases = {
    retrait: 'delivery-pickup',
    idf: 'delivery-local',
    transporteur: 'delivery-carrier'
  };
  const countryValue = String(shippingAddress.country || 'FR').trim();
  return {
    clientOrderId,
    items: cartItems.map(normalizeCheckoutLine),
    deliveryModeId: deliveryAliases[deliveryModeId] || deliveryModeId,
    shippingAddress: {
      fullName: shippingAddress.fullName || shippingAddress.name,
      line1: shippingAddress.line1 || shippingAddress.address || shippingAddress.street,
      line2: shippingAddress.line2 || shippingAddress.address2 || '',
      postalCode: shippingAddress.postalCode || shippingAddress.zip,
      city: shippingAddress.city,
      country: countryValue.toLowerCase() === 'france'
        ? 'FR'
        : countryValue.toUpperCase()
    }
  };
};
