const normalizeText = (value) => String(value || '')
  .trim()
  .toLowerCase()
  .replace(/\s+/g, ' ');

const hasProductImage = (product) => Boolean(
  product?.imageUrl
  || product?.thumbnailUrl
  || product?.images?.length
  || product?.thumbnails?.length
  || product?.imageVariants?.length
);

const toSlug = (value) => String(value || 'produit')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '') || 'produit';

export const getProductSeoDecision = (product) => {
  const title = normalizeText(product?.seoTitle || product?.name || product?.title);
  const description = normalizeText(product?.seoDescription || product?.description);
  const reasons = [];
  const publicVisible = Boolean(
    product?.status === 'published'
    && product?.e2eOnly !== true
    && !normalizeText(product?.e2ePurpose)
  );

  if (!product?.id) reasons.push('missing-id');
  if (product?.status !== 'published') reasons.push('not-published');
  if (product?.e2eOnly === true || normalizeText(product?.e2ePurpose)) reasons.push('test-fixture');
  if (product?.seoIndexable === false) reasons.push('explicit-noindex');
  if (title.length < 4) reasons.push('weak-title');
  if (description.length < 48) reasons.push('weak-description');
  if (!hasProductImage(product)) reasons.push('missing-image');

  return {
    publicVisible,
    indexable: reasons.length === 0,
    reasons,
    title,
    description,
    canonicalSlug: product?.id
      ? `${toSlug(product?.name || product?.title)}-${encodeURIComponent(product.id)}`
      : ''
  };
};

export const isProductPublicVisible = (product) => getProductSeoDecision(product).publicVisible;
export const isProductSeoIndexable = (product) => getProductSeoDecision(product).indexable;
