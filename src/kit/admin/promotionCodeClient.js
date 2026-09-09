import { getCallableFunction } from '../config/firebaseLazy';
import { invalidateAdminCachedData, loadAdminCachedData } from './adminDataCache';

export const ADMIN_PROMOTIONS_CACHE_KEY = 'admin-promotions:first-page';

const call = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const listPromotionCodesAdmin = ({ force = false } = {}) => loadAdminCachedData(
  ADMIN_PROMOTIONS_CACHE_KEY, () => call('listPromotionCodesAdmin'), { force }
);
const mutate = async (name, payload) => {
  invalidateAdminCachedData(ADMIN_PROMOTIONS_CACHE_KEY);
  try { return await call(name, payload); }
  finally { invalidateAdminCachedData(ADMIN_PROMOTIONS_CACHE_KEY); }
};
export const createPromotionCodeAdmin = (input) => mutate('createPromotionCodeAdmin', input);
export const setPromotionCodeStatusAdmin = (code, active) => mutate('setPromotionCodeStatusAdmin', { code, active });
