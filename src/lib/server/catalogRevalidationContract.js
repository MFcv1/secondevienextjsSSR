import crypto from 'node:crypto';

export const CATALOG_REVALIDATION_SCHEMA_VERSION = 1;
export const CATALOG_FULL_REASONS = new Set([
  'rollback',
  'taxonomy_migration',
  'impact_limit_exceeded',
  'source_release_unavailable',
  'legacy_release_without_plan',
  'impact_plan_invalid',
  'manual_rebuild',
]);

const uniqueSorted = (values) => [...new Set(values.filter(Boolean).map(String))].sort();
const canonicalize = (value) => {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]));
};

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const timingSafeEqualHex = (left, right) => {
  if (!/^[a-f0-9]{64}$/i.test(left) || !/^[a-f0-9]{64}$/i.test(right)) return false;
  return crypto.timingSafeEqual(Buffer.from(left, 'hex'), Buffer.from(right, 'hex'));
};

export const verifyCatalogMachineSignature = ({
  secret,
  timestamp,
  signature,
  rawBody,
  nowSeconds = Math.floor(Date.now() / 1000),
  windowSeconds = 5 * 60,
}) => {
  if (!secret || !Number.isInteger(Number(timestamp))) return false;
  if (Math.abs(nowSeconds - Number(timestamp)) > windowSeconds) return false;
  const bodyHash = sha256(rawBody);
  const expected = crypto.createHmac('sha256', secret).update(`${timestamp}.${bodyHash}`).digest('hex');
  return timingSafeEqualHex(String(signature || ''), expected);
};

const planHash = (plan) => {
  const { planHash: _hash, generatedAt: _generatedAt, ...payload } = plan;
  return sha256(JSON.stringify(canonicalize(payload)));
};

const assertScopedPath = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/') || path.includes('\\') || path.includes('..')) {
    throw new Error('invalid_path');
  }
  if (path.includes('?') || path.includes('#') || /^\/\//.test(path)) throw new Error('invalid_path');
  if (['/', '/galerie', '/api/catalog', '/api/search', '/sitemap.xml'].includes(path)) return path;
  const productMatch = path.match(/^\/produit\/([^/]+)$/);
  const categoryMatch = path.match(/^\/categorie\/([^/]+)$/);
  if (!productMatch && !categoryMatch) throw new Error('invalid_path_scope');
  try { decodeURIComponent((productMatch || categoryMatch)[1]); } catch { throw new Error('invalid_path_encoding'); }
  return path;
};

const assertProductPath = (path, productId) => {
  if (!path) return null;
  assertScopedPath(path);
  if (!path.startsWith('/produit/')) throw new Error('invalid_product_path');
  const segment = decodeURIComponent(path.slice('/produit/'.length));
  const id = String(productId || '');
  if (!id || (segment !== id && !segment.endsWith(`-${id}`))) throw new Error('product_path_identity_mismatch');
  return path;
};

export const validateCatalogRevalidationBody = (body, { projectId, audience } = {}) => {
  if (!body || Number(body.schemaVersion) !== CATALOG_REVALIDATION_SCHEMA_VERSION) throw new Error('invalid_schema');
  if (!projectId || body.projectId !== projectId) throw new Error('invalid_project');
  if (!audience || body.audience !== audience) throw new Error('invalid_audience');
  const revision = Number(body.revision);
  if (!Number.isInteger(revision) || revision < 1) throw new Error('invalid_revision');
  for (const hash of [body.manifestSha256, body.aggregateSha256, body.planHash]) {
    if (!/^[a-f0-9]{64}$/i.test(String(hash || ''))) throw new Error('invalid_hash');
  }
  if (body.impactPlanSha256 && !/^[a-f0-9]{64}$/i.test(String(body.impactPlanSha256))) throw new Error('invalid_impact_object_hash');
  const plan = body.impactPlan;
  if (!plan || Number(plan.schemaVersion) !== 1 || Number(plan.revision) !== revision) throw new Error('invalid_plan_identity');
  if (plan.aggregateSha256 !== body.aggregateSha256 || plan.planHash !== body.planHash || planHash(plan) !== body.planHash) {
    throw new Error('invalid_plan_hash');
  }
  if (!['targeted', 'full'].includes(plan.mode) || body.mode !== plan.mode) throw new Error('invalid_plan_mode');
  if (!Array.isArray(plan.products) || plan.products.length > 120) throw new Error('invalid_plan_products');
  if (!Array.isArray(plan.paths) || plan.paths.length > 360) throw new Error('invalid_plan_paths');
  if (!Array.isArray(plan.changedProductIds) || plan.changedProductIds.length > 120) throw new Error('invalid_changed_products');
  if (!Array.isArray(plan.affectedCategoryIds) || plan.affectedCategoryIds.length > 30) throw new Error('invalid_affected_categories');
  if (plan.mode === 'full' && !CATALOG_FULL_REASONS.has(plan.fullReason)) throw new Error('invalid_full_reason');

  const products = plan.products.map((product) => {
    const id = String(product?.id || '');
    if (!id || id.length > 160) throw new Error('invalid_product_id');
    if (!Array.isArray(product.beforeCategories) || product.beforeCategories.length > 12
        || !Array.isArray(product.afterCategories) || product.afterCategories.length > 12) {
      throw new Error('invalid_product_categories');
    }
    return {
      ...product,
      id,
      beforePath: assertProductPath(product.beforePath, id),
      afterPath: assertProductPath(product.afterPath, id),
      beforeCategories: uniqueSorted(product.beforeCategories),
      afterCategories: uniqueSorted(product.afterCategories),
    };
  });
  const changedProductIds = uniqueSorted(plan.changedProductIds);
  const expectedProductIds = uniqueSorted(products.map((product) => product.id));
  if (plan.mode === 'targeted' && JSON.stringify(changedProductIds) !== JSON.stringify(expectedProductIds)) {
    throw new Error('changed_product_ids_mismatch');
  }
  const affectedCategoryIds = uniqueSorted(plan.affectedCategoryIds);
  const expectedCategoryIds = uniqueSorted(products.flatMap((product) => [
    ...product.beforeCategories,
    ...product.afterCategories,
  ]));
  if (plan.mode === 'targeted' && JSON.stringify(affectedCategoryIds) !== JSON.stringify(expectedCategoryIds)) {
    throw new Error('affected_category_ids_mismatch');
  }
  const expectedPaths = uniqueSorted(plan.mode === 'full'
    ? ['/', '/galerie', '/api/catalog', '/api/search', '/sitemap.xml']
    : [
      ...(plan.affectsGallery ? ['/', '/galerie', '/api/catalog'] : []),
      ...(plan.affectsSearch ? ['/api/search'] : []),
      ...(plan.affectsSitemap ? ['/sitemap.xml'] : []),
      ...products.flatMap((product) => [product.beforePath, product.afterPath]),
      ...affectedCategoryIds.map((id) => `/categorie/${encodeURIComponent(id)}`),
    ]);
  const suppliedPaths = uniqueSorted(plan.paths.map(assertScopedPath));
  if (JSON.stringify(expectedPaths) !== JSON.stringify(suppliedPaths)) throw new Error('plan_paths_mismatch');

  return {
    schemaVersion: 1,
    revision,
    manifestSha256: String(body.manifestSha256),
    aggregateSha256: String(body.aggregateSha256),
    impactPlanPath: body.impactPlanPath || null,
    impactPlanSha256: body.impactPlanSha256 || null,
    planHash: String(body.planHash),
    mode: plan.mode,
    plan: { ...plan, products, paths: suppliedPaths, changedProductIds, affectedCategoryIds },
  };
};

export const getCatalogRevalidationTargets = ({ mode, plan }) => {
  const tags = ['catalog:api-pointer'];
  const paths = mode === 'full'
    ? ['/', '/galerie', '/api/catalog', '/api/search', '/sitemap.xml']
    : plan.paths;
  const pathEntries = paths.map((path) => ({ path, type: null }));
  if (mode === 'full') {
    pathEntries.push({ path: '/categorie/[categoryId]', type: 'page' });
    pathEntries.push({ path: '/produit/[slugOrId]', type: 'page' });
  }
  return { tags, pathEntries };
};
