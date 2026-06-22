export const getShippingPostalCode = (shipping = {}) => (
    String(shipping?.postalCode || shipping?.zip || '').trim()
);

export const normalizeShippingAddress = (shipping = {}) => {
    const postalCode = getShippingPostalCode(shipping);
    return {
        ...shipping,
        postalCode,
        zip: postalCode,
    };
};

export const formatShippingCityLine = (shipping = {}) => (
    [getShippingPostalCode(shipping), shipping?.city].filter(Boolean).join(' ')
);

export const formatShippingAddress = (shipping = {}) => (
    [shipping?.address || shipping?.street, formatShippingCityLine(shipping)].filter(Boolean).join(', ')
);
