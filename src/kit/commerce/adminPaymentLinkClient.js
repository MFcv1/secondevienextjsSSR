import { getCallableFunction } from '../config/firebaseLazy';
import { invalidateAdminCachedData, loadAdminCachedData } from '../admin/adminDataCache';

export const ADMIN_PAYMENT_LINKS_CACHE_KEY = 'admin-payment-links:first-page';

const execute = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

const mutate = async (name, payload) => {
  invalidateAdminCachedData(ADMIN_PAYMENT_LINKS_CACHE_KEY);
  try { return await execute(name, payload); }
  finally { invalidateAdminCachedData(ADMIN_PAYMENT_LINKS_CACHE_KEY); }
};

export const createAdminPaymentLink = (payload) => mutate('createAdminPaymentLink', payload);

export const listAdminPaymentLinks = ({ pageSize = 50, cursor = null, reference = null, force = false } = {}) => {
  const read = () => execute('listAdminPaymentLinks', { pageSize, cursor, reference });
  return pageSize === 50 && !cursor && !reference
    ? loadAdminCachedData(ADMIN_PAYMENT_LINKS_CACHE_KEY, read, { force }) : read();
};

export const extendAdminPaymentLink = (orderId, expiryMinutes) => (
  mutate('extendAdminPaymentLink', { orderId, expiryMinutes })
);

export const regenerateAdminPaymentLink = (orderId) => (
  mutate('regenerateAdminPaymentLink', { orderId })
);

export const recreateAdminPaymentLink = (orderId, expiryMinutes = 120) => (
  mutate('recreateAdminPaymentLink', { orderId, expiryMinutes })
);

export const cancelAdminPaymentLink = (orderId) => (
  mutate('cancelAdminPaymentLink', { orderId })
);

export const getAdminPaymentLinkPublic = (orderId, token) => (
  execute('getAdminPaymentLinkPublic', { orderId, token })
);

export const prepareAdminPaymentLinkPayment = ({
  orderId,
  token,
  email,
  shippingAddress,
}) => execute('prepareAdminPaymentLinkPayment', {
  orderId,
  token,
  email,
  shippingAddress,
});

export const resumeAdminPaymentLinkPayment = (orderId, token) => (
  execute('resumeAdminPaymentLinkPayment', { orderId, token })
);
