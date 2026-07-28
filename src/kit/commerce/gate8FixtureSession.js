export const COMMERCE_GATE8_FIXTURE_UI_ENABLED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_UI === 'true';

export const COMMERCE_GATE8_FIXTURE_SCOPE_VERSION =
  typeof process !== 'undefined'
    ? process.env.NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_SCOPE_VERSION || ''
    : '';

export const COMMERCE_GATE8_FIXTURE_SESSION_KEY =
  'secondevie:commerce-gate8-fixture:v1';

const RUN_ID_PATTERN = /^run_gate8_[A-Za-z0-9_-]{8,120}$/;
const SCOPE_PATTERN = /^fixture_[A-Za-z0-9_-]{8,72}$/;
const FIXTURE_PRODUCTS = Object.freeze({
  fixture_gate6_stock1_01: Object.freeze({
    name: 'Fixture Gate 8 stock 1',
    price: 10,
    stock: 1
  }),
  fixture_gate6_stock2_02: Object.freeze({
    name: 'Fixture Gate 8 stock 2',
    price: 11,
    stock: 2
  }),
  fixture_gate6_stock10_03: Object.freeze({
    name: 'Fixture Gate 8 stock 10',
    price: 12,
    stock: 10
  })
});

export function normalizeGate8FixtureContext(value) {
  if (!COMMERCE_GATE8_FIXTURE_UI_ENABLED || !value) return null;
  const runId = String(value.runId || '').trim();
  const fixtureScopeVersion = String(value.fixtureScopeVersion || '').trim();
  if (
    !RUN_ID_PATTERN.test(runId) ||
    !SCOPE_PATTERN.test(fixtureScopeVersion) ||
    fixtureScopeVersion !== COMMERCE_GATE8_FIXTURE_SCOPE_VERSION
  ) {
    return null;
  }
  return Object.freeze({ runId, fixtureScopeVersion });
}

export function readGate8FixtureContext(search = '') {
  if (!COMMERCE_GATE8_FIXTURE_UI_ENABLED) return null;
  const params = new URLSearchParams(search);
  return normalizeGate8FixtureContext({
    runId: params.get('gate8_run'),
    fixtureScopeVersion: params.get('gate8_scope')
  });
}

export function readGate8FixtureCart(search = '', context = null) {
  const normalizedContext = normalizeGate8FixtureContext(context);
  if (!normalizedContext) return [];
  const productId = new URLSearchParams(search).get('gate8_product');
  const product = FIXTURE_PRODUCTS[productId];
  if (!product) return [];
  return [Object.freeze({
    id: `cart_furniture_${productId}`,
    originalId: productId,
    collectionName: 'furniture',
    name: product.name,
    price: product.price,
    stock: product.stock,
    sold: false,
    priceOnRequest: false,
    image: '',
    material: 'Bois',
    quantity: 1,
    cartLineId: `cart-line-${normalizedContext.runId}-${productId}`,
    cartRevision: 1
  })];
}

export function persistGate8FixtureContext(context) {
  if (typeof window === 'undefined') return null;
  const normalized = normalizeGate8FixtureContext(context);
  if (!normalized) return null;
  window.sessionStorage.setItem(
    COMMERCE_GATE8_FIXTURE_SESSION_KEY,
    JSON.stringify(normalized)
  );
  return normalized;
}

export function restoreGate8FixtureContext() {
  if (typeof window === 'undefined') return null;
  try {
    return normalizeGate8FixtureContext(JSON.parse(
      window.sessionStorage.getItem(COMMERCE_GATE8_FIXTURE_SESSION_KEY) || 'null'
    ));
  } catch {
    return null;
  }
}

export function clearGate8FixtureContext() {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(COMMERCE_GATE8_FIXTURE_SESSION_KEY);
}
