import { getCallableFunction } from '../config/firebaseLazy';

const call = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const listPromotionCodesAdmin = () => call('listPromotionCodesAdmin');
export const createPromotionCodeAdmin = (input) => call('createPromotionCodeAdmin', input);
export const setPromotionCodeStatusAdmin = (code, active) => call(
  'setPromotionCodeStatusAdmin',
  { code, active }
);
