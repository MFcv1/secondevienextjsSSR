import { getCallableFunction } from '../config/firebaseLazy';

const execute = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const createAdminPaymentLink = (payload) => execute('createAdminPaymentLink', payload);

export const listAdminPaymentLinks = ({ pageSize = 50 } = {}) => (
  execute('listAdminPaymentLinks', { pageSize })
);

export const extendAdminPaymentLink = (orderId, expiryMinutes) => (
  execute('extendAdminPaymentLink', { orderId, expiryMinutes })
);

export const regenerateAdminPaymentLink = (orderId) => (
  execute('regenerateAdminPaymentLink', { orderId })
);

export const recreateAdminPaymentLink = (orderId, expiryMinutes = 120) => (
  execute('recreateAdminPaymentLink', { orderId, expiryMinutes })
);

export const cancelAdminPaymentLink = (orderId) => (
  execute('cancelAdminPaymentLink', { orderId })
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
