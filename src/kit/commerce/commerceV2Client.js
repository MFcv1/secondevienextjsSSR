import { getCallableFunction, getFirebaseAuth, loadAuthModule } from '../config/firebaseLazy';
export { buildCheckoutV2Input } from './checkoutContract';

export const COMMERCE_V2_CONSUMERS_ENABLED = false;
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

export const createCheckoutV2 = async (input) => {
  assertConsumersEnabled();
  await ensureCheckoutAnonymousIdentity();
  return execute('createCheckoutV2', { input });
};

export const resumeCheckoutV2 = async (orderId) => {
  assertConsumersEnabled();
  await ensureCheckoutAnonymousIdentity();
  return execute('resumeCheckoutV2', { orderId });
};

export const listMyOrdersV2 = async ({ pageSize = 25, cursor = null } = {}) => {
  if (!COMMERCE_V2_ORDER_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ORDER_READERS_OFF');
  }
  return execute('listMyOrdersV2', { pageSize, cursor });
};

export const listOrdersAdminV2 = async ({ pageSize = 50, cursor = null } = {}) => {
  if (!COMMERCE_V2_ADMIN_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_READERS_OFF');
  }
  return execute('listOrdersAdminV2', { pageSize, cursor });
};

export const listReturnsAdminV2 = async ({ pageSize = 50, cursor = null } = {}) => {
  if (!COMMERCE_V2_ADMIN_READERS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_READERS_OFF');
  }
  return execute('listReturnsAdminV2', { pageSize, cursor });
};
