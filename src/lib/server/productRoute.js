export const extractProductId = (slugOrId = '', products = []) => {
  const raw = String(slugOrId);
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch { /* The raw value cannot match a valid encoded route. */ }
  const direct = products.find((product) => String(product.id) === raw || String(product.id) === decoded);
  if (direct) return String(direct.id);
  const suffixMatch = [...products]
    .sort((left, right) => String(right.id).length - String(left.id).length)
    .find((product) => (
      raw.endsWith(`-${encodeURIComponent(String(product.id))}`)
      || decoded.endsWith(`-${String(product.id)}`)
    ));
  return suffixMatch ? String(suffixMatch.id) : decoded;
};
