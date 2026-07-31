export const SHIPPING_CARRIERS = Object.freeze([
  Object.freeze({ code: 'colissimo', label: 'Colissimo / La Poste' }),
  Object.freeze({ code: 'chronopost', label: 'Chronopost' }),
  Object.freeze({ code: 'mondial_relay', label: 'Mondial Relay' }),
  Object.freeze({ code: 'other', label: 'Autre transporteur' }),
]);

export const DEFAULT_SHIPPING_CARRIER = SHIPPING_CARRIERS[0].code;

export const getShippingCarrierLabel = (code, customName = '') => {
  const carrier = SHIPPING_CARRIERS.find((item) => item.code === code);
  if (code === 'other' && customName.trim()) return customName.trim();
  return carrier?.label || 'Transporteur';
};
