import { getCallableFunction } from '../config/firebaseLazy';

// The server control plane remains authoritative. AdminAppIsland only exposes
// these commands when sys_commerce_control/current.adminMutationMode is `v2`.
export const COMMERCE_V2_ADMIN_COMMANDS_ENABLED = true;

export const createProductCommandId = (action) => {
  const suffix = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${action}-${suffix}`;
};

export const createProductCommandSession = (existingProductId = null) => ({
  productId: existingProductId || createProductCommandId('product'),
  createCommandId: createProductCommandId('create-product'),
  createPublishedCommandId: createProductCommandId('create-published-product'),
  offerCommandId: createProductCommandId('offer-product'),
  inventoryCommandId: createProductCommandId('inventory-product'),
  publishCommandId: createProductCommandId('publish-product'),
  socialCommandId: createProductCommandId('publish-social')
});

const assertEnabled = () => {
  if (!COMMERCE_V2_ADMIN_COMMANDS_ENABLED) {
    throw new Error('COMMERCE_V2_ADMIN_COMMANDS_OFF');
  }
};

const execute = async (functionName, action, input) => {
  assertEnabled();
  const callable = await getCallableFunction(functionName);
  const result = await callable({
    ...input,
    commandId: input.commandId || createProductCommandId(action)
  });
  return result.data;
};

export const createProductDraftAdmin = ({
  collectionName,
  productId,
  editorial,
  media,
  commandId: stableCommandId
}) => execute(
  'createProductAdmin',
  'create-product',
  {
    collectionName,
    productId,
    expectedVersion: 0,
    editorial,
    media,
    reason: 'Creation brouillon depuis le back-office',
    commandId: stableCommandId
  }
);

export const createPublishedProductAdmin = ({
  collectionName,
  productId,
  editorial,
  media,
  offer,
  initialStock,
  commandId: stableCommandId
}) => execute(
  'createPublishedProductAdmin',
  'create-published-product',
  {
    collectionName,
    productId,
    expectedVersion: 0,
    editorial,
    media,
    offer,
    initialStock,
    reason: 'Creation et publication atomiques depuis le back-office',
    commandId: stableCommandId
  }
);

export const preflightProductMutationAdmin = async () => {
  assertEnabled();
  const callable = await getCallableFunction('preflightProductMutationAdmin');
  const result = await callable({});
  return result.data;
};

export const updateProductOfferAdmin = (
  item,
  collectionName,
  offer,
  stableCommandId
) => execute(
  'updateProductOfferAdmin',
  'offer-product',
  {
    collectionName,
    productId: item.id,
    expectedVersion: Number(item.commerceVersion || 0),
    offer,
    reason: 'Mise a jour offre depuis le back-office',
    commandId: stableCommandId
  }
);

export const publishProductAdmin = (
  item,
  collectionName,
  published,
  stableCommandId
) => execute(
  'publishProductAdmin',
  'publish-product',
  {
    collectionName,
    productId: item.id,
    expectedVersion: Number(item.commerceVersion || 0),
    published,
    reason: published ? 'Publication depuis le back-office' : 'Retrait de publication depuis le back-office',
    commandId: stableCommandId
  }
);

export const deleteProductAdmin = (item, collectionName, stableCommandId) => execute(
  'deleteProductAdmin',
  'delete-product',
  {
    collectionName,
    productId: item.id,
    expectedVersion: Number(item.commerceVersion || 0),
    reason: 'Archivage controle depuis le back-office',
    commandId: stableCommandId
  }
);

export const adjustInventoryAdmin = (
  item,
  collectionName,
  delta,
  reason,
  stableCommandId
) => execute(
  'adjustInventoryAdmin',
  'adjust-inventory',
  {
    collectionName,
    productId: item.id,
    expectedVersion: Number(item.commerceVersion || 0),
    expectedInventoryVersion: Number(item.inventoryVersion || 0),
    delta,
    reason,
    commandId: stableCommandId
  }
);
