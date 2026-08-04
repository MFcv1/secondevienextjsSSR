import { getCallableFunction } from '../config/firebaseLazy';

export const getDeliveryPolicyAdmin = async () => {
  const callable = await getCallableFunction('getDeliveryPolicyAdmin');
  const result = await callable({});
  return result.data;
};

export const saveDeliveryPolicyAdmin = async ({
  settings,
  sourcePolicyVersion,
  expectedControlRevision,
}) => {
  const callable = await getCallableFunction('saveDeliveryPolicyAdmin');
  const result = await callable({
    settings,
    sourcePolicyVersion,
    expectedControlRevision,
  });
  return result.data;
};
