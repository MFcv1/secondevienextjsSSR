import { getCallableFunction } from '../config/firebaseLazy';

const GATE8_FIXTURE_UI_ENABLED =
  typeof process !== 'undefined' &&
  process.env.NEXT_PUBLIC_COMMERCE_GATE8_FIXTURE_UI === 'true';

export const COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED = GATE8_FIXTURE_UI_ENABLED;
export const COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED = GATE8_FIXTURE_UI_ENABLED;
export const COMMERCE_V2_CLIENT_COMMANDS_ENABLED = GATE8_FIXTURE_UI_ENABLED;

export const createCommerceCommandId = (action) => {
  const suffix = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${action}-${suffix}`;
};

const assertEnabled = (enabled, code) => {
  if (!enabled) throw new Error(code);
};

const execute = async (enabled, disabledCode, functionName, payload) => {
  assertEnabled(enabled, disabledCode);
  const callable = await getCallableFunction(functionName);
  const result = await callable(payload);
  return result.data;
};

const orderCommand = (
  functionName,
  action,
  order,
  reason,
  payload = {},
  stableCommandId = null
) => execute(
  COMMERCE_V2_ADMIN_ORDER_COMMANDS_ENABLED,
  'COMMERCE_V2_ADMIN_ORDER_COMMANDS_OFF',
  functionName,
  {
    orderId: order.id,
    expectedVersion: order.stateVersion,
    commandId: stableCommandId || createCommerceCommandId(action),
    reason,
    ...payload
  }
);

export const markOrderPreparingAdmin = (order, stableCommandId) => orderCommand(
  'markOrderPreparingAdmin',
  'fulfillment-prepare',
  order,
  'Preparation confirmee depuis le back-office',
  {},
  stableCommandId
);

export const markOrderReadyForPickupAdmin = (order, stableCommandId) => orderCommand(
  'markOrderReadyForPickupAdmin',
  'fulfillment-ready',
  order,
  'Commande prete pour retrait',
  {},
  stableCommandId
);

export const markOrderShippedAdmin = (
  order,
  trackingNumber = null,
  stableCommandId = null
) => orderCommand(
  'markOrderShippedAdmin',
  'fulfillment-ship',
  order,
  'Expedition confirmee depuis le back-office',
  { trackingNumber },
  stableCommandId
);

export const markOrderPickedUpAdmin = (order, stableCommandId) => orderCommand(
  'markOrderPickedUpAdmin',
  'fulfillment-pickup',
  order,
  'Retrait physique confirme',
  {},
  stableCommandId
);

export const markOrderDeliveredAdmin = (order, stableCommandId) => orderCommand(
  'markOrderDeliveredAdmin',
  'fulfillment-deliver',
  order,
  'Livraison physique confirmee',
  {},
  stableCommandId
);

export const archiveOrderAdmin = (order, stableCommandId) => orderCommand(
  'archiveOrderAdmin',
  'archive-order',
  order,
  'Archive douce depuis le back-office',
  {},
  stableCommandId
);

export const requestRefundAdmin = (
  order,
  amountCents,
  reason,
  refundRequestId = null
) => execute(
  COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED,
  'COMMERCE_V2_ADMIN_RETURN_COMMANDS_OFF',
  'requestRefundAdmin',
  {
    orderId: order.id,
    refundRequestId: refundRequestId || createCommerceCommandId('refund'),
    amountCents,
    reason
  }
);

const returnCommand = (
  functionName,
  action,
  returnCase,
  reason,
  payload = {},
  stableCommandId = null
) => execute(
  COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED,
  'COMMERCE_V2_ADMIN_RETURN_COMMANDS_OFF',
  functionName,
  {
    orderId: returnCase.orderId,
    returnId: returnCase.returnId,
    expectedVersion: returnCase.stateVersion,
    commandId: stableCommandId || createCommerceCommandId(action),
    reason,
    ...payload
  }
);

export const openReturnAdmin = (
  order,
  requestedLines,
  reason,
  returnRequestId = null
) => execute(
  COMMERCE_V2_ADMIN_RETURN_COMMANDS_ENABLED,
  'COMMERCE_V2_ADMIN_RETURN_COMMANDS_OFF',
  'openReturnAdmin',
  {
    orderId: order.id,
    returnRequestId: returnRequestId || createCommerceCommandId('return'),
    requestedLines,
    reason
  }
);

export const cancelReturnAdmin = (returnCase, reason, stableCommandId) => returnCommand(
  'cancelReturnAdmin',
  'return-cancel',
  returnCase,
  reason,
  {},
  stableCommandId
);

export const markReturnReceivedAdmin = (
  returnCase,
  lines,
  reason,
  stableCommandId
) => returnCommand(
  'markReturnReceivedAdmin',
  'return-receive',
  returnCase,
  reason,
  { lines },
  stableCommandId
);

export const restockReturnLinesAdmin = (
  returnCase,
  lines,
  reason,
  stableCommandId
) => returnCommand(
  'restockReturnLinesAdmin',
  'return-restock',
  returnCase,
  reason,
  { lines },
  stableCommandId
);

export const writeOffReturnLinesAdmin = (
  returnCase,
  lines,
  reason,
  stableCommandId
) => returnCommand(
  'writeOffReturnLinesAdmin',
  'return-write-off',
  returnCase,
  reason,
  { lines },
  stableCommandId
);

export const resolveReturnAdmin = (returnCase, reason, stableCommandId) => returnCommand(
  'resolveReturnAdmin',
  'return-resolve',
  returnCase,
  reason,
  {},
  stableCommandId
);

export const requestOrderCancellation = (
  orderId,
  reason,
  cancellationRequestId = null
) => execute(
  COMMERCE_V2_CLIENT_COMMANDS_ENABLED,
  'COMMERCE_V2_CLIENT_COMMANDS_OFF',
  'requestOrderCancellation',
  {
    orderId,
    commandId: cancellationRequestId || createCommerceCommandId('cancel'),
    reason
  }
);
