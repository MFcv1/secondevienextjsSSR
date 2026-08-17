const FUNCTION_TARGETS = Object.freeze({
  clearAllAffiliateClicks: 'clearAllAffiliateClicks',
  clearAllSessions: 'clearAllSessions',
  deleteSession: 'deleteSession',
  initLiveSession: 'initLiveSession',
  syncSession: 'syncSession',
  syncSessionBeacon: 'syncSessionBeacon',
  trackAdminIP: 'trackAdminIPGen2',
  updateUserSessions: 'updateUserSessionsGen2',
});

export const getFunctionTarget = (logicalName) => FUNCTION_TARGETS[logicalName] || logicalName;

export const getFunctionsMigrationRegistry = () => ({ ...FUNCTION_TARGETS });
