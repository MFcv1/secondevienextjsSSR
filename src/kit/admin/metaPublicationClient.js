import { getCallableFunction } from '../config/firebaseLazy';

const call = async (name, payload = {}) => {
  const callable = await getCallableFunction(name);
  const result = await callable(payload);
  return result.data;
};

export const getMetaConnectionStatusAdmin = () => call('getMetaConnectionStatusAdmin');

export const startMetaOAuthAdmin = (origin) => call('startMetaOAuthAdmin', { origin });

export const selectMetaAssetAdmin = (sessionId, candidateId) => call('selectMetaAssetAdmin', {
  sessionId,
  candidateId
});

export const verifyMetaConnectionAdmin = () => call('verifyMetaConnectionAdmin');

export const disconnectMetaConnectionAdmin = (confirmText) => call('disconnectMetaConnectionAdmin', {
  confirmText
});

export const prepareSocialPublicationAdmin = ({
  collectionName,
  productId,
  commandId,
  targets,
  hashtags
}) => call('prepareSocialPublicationAdmin', {
  collectionName,
  productId,
  commandId,
  targets,
  hashtags
});

export const runSocialPublicationAdmin = (publicationId, destinations) => call(
  'runSocialPublicationAdmin',
  {
    publicationId,
    ...(Array.isArray(destinations) ? { destinations } : {})
  }
);

export const getSocialPublicationStatusAdmin = (publicationId) => call(
  'getSocialPublicationStatusAdmin',
  { publicationId }
);
