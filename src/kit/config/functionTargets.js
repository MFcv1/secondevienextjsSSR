const FUNCTION_TARGETS = Object.freeze({
  clearAllAffiliateClicks: 'clearAllAffiliateClicks',
  clearAllSessions: 'clearAllSessions',
  deleteSession: 'deleteSession',
  getUserStats: 'getUserStats',
  initLiveSession: 'initLiveSessionGen2',
  syncSession: 'syncSessionGen2',
  syncSessionBeacon: 'syncSessionBeaconGen2',
  trackAdminIP: 'trackAdminIPGen2',
  updateUserSessions: 'updateUserSessionsGen2',
});

export const getFunctionTarget = (logicalName) => FUNCTION_TARGETS[logicalName] || logicalName;

export const getFunctionsMigrationRegistry = () => ({ ...FUNCTION_TARGETS });
