// Closed migration registry. Old Functions remain available for existing clients.
export const PASSKEY_OPERATIONS = Object.freeze({
  generatePasskeyAuthenticationOptions: 'generatePasskeyAuthenticationOptionsHandler',
  verifyPasskeyAuthentication: 'verifyPasskeyAuthenticationHandler',
  generatePasskeyRegistrationOptions: 'generatePasskeyRegistrationOptionsHandler',
  verifyPasskeyRegistration: 'verifyPasskeyRegistrationHandler',
});

export const getPasskeyHandlerName = (operation) => (
  Object.hasOwn(PASSKEY_OPERATIONS, operation) ? PASSKEY_OPERATIONS[operation] : null
);

export const getPasskeyEndpoint = (operation, transport) => (
  transport === 'apphosting' && getPasskeyHandlerName(operation)
    ? `/api/auth/passkeys/${operation}` : null
);
