const ADMIN_TOKEN_NETWORK_RETRY_DELAYS_MS = Object.freeze([250, 750]);

const wait = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs));

export const isAdminTokenNetworkError = (error) => (
  error?.code === 'auth/network-request-failed'
  || String(error?.message || '').includes('auth/network-request-failed')
);

export async function getFreshAdminIdToken(
  user,
  { retryDelays = ADMIN_TOKEN_NETWORK_RETRY_DELAYS_MS, sleep = wait } = {}
) {
  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    try {
      return await user.getIdToken(true);
    } catch (error) {
      const retryDelay = retryDelays[attempt];
      if (!isAdminTokenNetworkError(error) || retryDelay === undefined) throw error;
      await sleep(retryDelay);
    }
  }
  throw new Error('Renouvellement du jeton administrateur interrompu.');
}
