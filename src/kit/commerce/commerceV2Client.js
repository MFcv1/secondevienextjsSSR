import { getCallableFunction, getFirebaseAuth, loadAuthModule } from '../config/firebaseLazy';
import { COMMERCE_V2_UI_ENABLED } from './commerceUiFlags.js';
export { buildCheckoutV2Input } from './checkoutContract';

export const COMMERCE_V2_CONSUMERS_ENABLED = COMMERCE_V2_UI_ENABLED;
export const COMMERCE_V2_ORDER_READERS_ENABLED = true;
export const COMMERCE_V2_ADMIN_READERS_ENABLED = true;

const execute = async (functionName, payload = {}) => {
  const callable = await getCallableFunction(functionName);
  const result = await callable(payload);
  return result.data;
};

export const ensureCheckoutAnonymousIdentity = async () => {
  const auth = await getFirebaseAuth();
  if (typeof auth.authStateReady === 'function') await auth.authStateReady();
  if (auth.currentUser) return auth.currentUser;
  const { signInAnonymously } = await loadAuthModule();
  const result = await signInAnonymously(auth);
  return result.user;
};

const assertConsumersEnabled = () => {
  if (!COMMERCE_V2_CONSUMERS_ENABLED) {
    throw new Error('COMMERCE_V2_CONSUMERS_OFF');
  }
};

export const createCheckoutV2 = async (input, { fixture = null } = {}) => {
  assertConsumersEnabled();
  await ensureCheckoutAnonymousIdentity();
  return execute('createCheckoutV2', {
    input,
    ...(fixture ? { fixture } : {})
  });
};

export const resumeCheckoutV2 = async (orderId) => {
  assertConsumersEnabled();
  await ensureCheckoutAnonymousIdentity();
  return execute('resumeCheckoutV2', { orderId });
};

export const previewPromotionCodeV2 = async (code, cartItems) => {
  assertConsumersEnabled();
  await ensureCheckoutAnonymousIdentity();
  return execute('previewPromotionCodeV2', {
    code,
    items: cartItems.map((item) => ({
      productId: item.originalId || item.productId || item.id,
      collectionName: item.collectionName || 'furniture',
      quantity: Number(item.quantity || 1)
    }))
  });
};

export const listMyOrdersV2 = async ({ pageSize = 25, cursor = null } = {}) => {
  if (!COMMERCE_V2_ORDER_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ORDER_READERS_OFF');
  }
  return execute('listMyOrdersV2', { pageSize, cursor });
};

export const prepareCommerceDocumentDelivery = async (orderId, documentId) => {
  if (!COMMERCE_V2_ORDER_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ORDER_READERS_OFF');
  }
  return execute('prepareCommerceDocumentDelivery', { orderId, documentId });
};

export const listOrdersAdminV2 = async ({ pageSize = 50, cursor = null } = {}) => {
  if (!COMMERCE_V2_ADMIN_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_READERS_OFF');
  }
  return execute('listOrdersAdminV2', { pageSize, cursor });
};

export const getOrderTimelineAdminV2 = async (orderId) => {
  if (!COMMERCE_V2_ADMIN_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_READERS_OFF');
  }
  return execute('getOrderTimelineAdminV2', { orderId });
};

export const listReturnsAdminV2 = async ({ pageSize = 50, cursor = null } = {}) => {
  if (!COMMERCE_V2_ADMIN_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_READERS_OFF');
  }
  return execute('listReturnsAdminV2', { pageSize, cursor });
};

export const listCustomerReturnRequestsAdminV2 = async ({ pageSize = 50, cursor = null } = {}) => {
  if (!COMMERCE_V2_ADMIN_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_READERS_OFF');
  }
  return execute('listCustomerReturnRequestsAdminV2', { pageSize, cursor });
};

export const requestCustomerReturn = async ({
  orderId,
  requestId,
  lines,
  reason,
  note = ''
}) => execute('requestCustomerReturn', {
  orderId,
  requestId,
  lines,
  reason,
  note,
});
