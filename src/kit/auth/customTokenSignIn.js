export const CUSTOM_TOKEN_NETWORK_RETRY_DELAYS_MS = [400, 1200];

const waitFor = (delayMs) => new Promise((resolve) => {
  globalThis.setTimeout(resolve, delayMs);
});

export const signInWithCustomTokenResilient = async ({
  authModule,
  auth,
  token,
  retryDelays = CUSTOM_TOKEN_NETWORK_RETRY_DELAYS_MS,
  wait = waitFor,
}) => {
  let lastError = null;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await authModule.signInWithCustomToken(auth, token);
    } catch (error) {
      lastError = error;
      const retryDelay = retryDelays[attempt];
      if (error?.code !== 'auth/network-request-failed' || retryDelay === undefined) {
        throw error;
      }
      await wait(retryDelay);
    }
  }

  throw lastError;
};
