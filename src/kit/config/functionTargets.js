const FUNCTION_TARGETS = Object.freeze({
  clearAllAffiliateClicks: 'clearAllAffiliateClicks',
  clearAllSessions: 'clearAllSessions',
  deleteSession: 'deleteSession',
  ensureAdminAccessRegistry: 'ensureAdminAccessRegistryGen2',
  getUserStats: 'getUserStatsGen2',
  generatePasskeyAuthenticationOptions: 'generatePasskeyAuthenticationOptionsGen2',
  initLiveSession: 'initLiveSessionGen2',
  logUserConnection: 'logUserConnectionGen2',
  sendGuestCheckoutOtp: 'sendGuestCheckoutOtpGen2',
  sendCustomerLoginOtp: 'sendCustomerLoginOtpGen2',
  verifyGuestCheckoutOtp: 'verifyGuestCheckoutOtpGen2',
  verifyCustomerLoginOtp: 'verifyCustomerLoginOtpGen2',
  verifyPasskeyAuthentication: 'verifyPasskeyAuthenticationGen2',
  syncSession: 'syncSessionGen2',
  syncSessionBeacon: 'syncSessionBeaconGen2',
  trackAdminIP: 'trackAdminIPGen2',
  updateUserSessions: 'updateUserSessionsGen2',
});

export const getFunctionTarget = (logicalName) => FUNCTION_TARGETS[logicalName] || logicalName;

export const getFunctionsMigrationRegistry = () => ({ ...FUNCTION_TARGETS });
