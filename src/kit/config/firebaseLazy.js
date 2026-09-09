import { app, functionsRegion } from './firebaseCore';
import { getFunctionTarget } from './functionTargets';
import { getPasskeyEndpoint } from '../../../shared/passkeyTransport.mjs';
import { getPublicOperationEndpoint } from '../../../shared/publicOperationTransport.mjs';
import { usesSharedAdminReader } from '../../../shared/adminReaderTransport.mjs';
import { createPrivateReadCoalescer } from '../auth/privateReadCoalescer.mjs';
import { getAdminCacheGeneration, setAdminCacheAuthorization } from '../admin/adminDataCache';

let firestoreModulePromise = null;
let functionsModulePromise = null;
let authModulePromise = null;
let storageModulePromise = null;
let dbInstance = null;
let functionsInstance = null;
let authInstance = null;
let storageInstance = null;
let googleProviderInstance = null;
let appCheckPromise = null;
const coalescePrivateRead = createPrivateReadCoalescer();
const COALESCED_CUSTOMER_READS = new Set(['listMyOrdersV2', 'listMyNewsletterRewards']);
export const ADMIN_STEP_UP_REQUIRED_EVENT = 'sv:admin-step-up-required';

const OBSERVED_CALLABLES = new Set([
  'adjustInventoryAdmin',
  'archiveOrderAdmin',
  'cancelReturnAdmin',
  'createOrder',
  'createCheckoutV2',
  'createProductAdmin',
  'createPublishedProductAdmin',
  'decideCustomerReturnRequestAdmin',
  'deleteProductAdmin',
  'getCommerceOperationsStatusAdmin',
  'getDiagnosticTimelineAdmin',
  'getSystemIncidentsAdmin',
  'getAnalyticsAdmin',
  'markOrderDeliveredAdmin',
  'markOrderPickedUpAdmin',
  'markOrderPreparingAdmin',
  'markOrderReadyForPickupAdmin',
  'markOrderShippedAdmin',
  'markReturnReceivedAdmin',
  'openReturnAdmin',
  'publishProductAdmin',
  'requestCustomerReturn',
  'requestOrderCancellation',
  'requestRefundAdmin',
  'resolveReturnAdmin',
  'restockReturnLinesAdmin',
  'resumeCheckoutV2',
  'updateOrderTrackingAdmin',
  'updateProductOfferAdmin',
  'writeOffReturnLinesAdmin',
]);

const getCallableReason = (error) => (
  error?.details?.reason
  || error?.customData?.details?.reason
  || error?.customData?._tokenResponse?.details?.reason
  || null
);

const emitAdminStepUpRequired = (error) => {
  if (
    typeof window === 'undefined'
    || getCallableReason(error) !== 'strong-auth-required'
  ) return;

  window.dispatchEvent(new CustomEvent(ADMIN_STEP_UP_REQUIRED_EVENT, {
    detail: {
      reason: getCallableReason(error),
    },
  }));
};

const ensureAppCheck = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if (
    typeof window.FIREBASE_APPCHECK_DEBUG_TOKEN === 'undefined' &&
    ((process.env.NODE_ENV !== 'production') || window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname === '127.0.0.1')
  ) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!recaptchaKey) {
    if (!(process.env.NODE_ENV !== 'production')) {
      console.warn('[Firebase] AppCheck desactive - NEXT_PUBLIC_RECAPTCHA_SITE_KEY non configuree.');
    }
    return Promise.resolve(null);
  }

  if (!appCheckPromise) {
    appCheckPromise = import('firebase/app-check')
      .then(({ initializeAppCheck, ReCaptchaV3Provider }) => initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider(recaptchaKey),
        isTokenAutoRefreshEnabled: true
      }))
      .catch((error) => {
        appCheckPromise = null;
        console.warn('[Firebase] AppCheck initialization failed:', error);
        return null;
      });
  }

  return appCheckPromise;
};

export const getFirebaseAppCheckToken = async () => {
  const appCheck = await ensureAppCheck();
  if (!appCheck) return '';
  const { getToken } = await import('firebase/app-check');
  const result = await getToken(appCheck, false);
  return result?.token || '';
};

export const loadFirestoreModule = () => {
  if (!firestoreModulePromise) {
    firestoreModulePromise = import('firebase/firestore');
  }
  return firestoreModulePromise;
};

export const getDb = async () => {
  if (!dbInstance) {
    await ensureAppCheck();
    const { getFirestore } = await loadFirestoreModule();
    dbInstance = getFirestore(app);
  }
  return dbInstance;
};

export const loadFunctionsModule = () => {
  if (!functionsModulePromise) {
    functionsModulePromise = import('firebase/functions');
  }
  return functionsModulePromise;
};

export const getFunctionsInstance = async () => {
  if (!functionsInstance) {
    await ensureAppCheck();
    const { getFunctions } = await loadFunctionsModule();
    functionsInstance = getFunctions(app, functionsRegion);
  }
  return functionsInstance;
};

export const loadStorageModule = () => {
  if (!storageModulePromise) {
    storageModulePromise = import('firebase/storage');
  }
  return storageModulePromise;
};

export const getStorageInstance = async () => {
  if (!storageInstance) {
    await ensureAppCheck();
    const { getStorage } = await loadStorageModule();
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

export const getCallableFunction = async (name) => {
  const [{ httpsCallable, httpsCallableFromURL }, functions] = await Promise.all([
    loadFunctionsModule(),
    getFunctionsInstance(),
  ]);
  const passkeyPath = getPasskeyEndpoint(name, process.env.NEXT_PUBLIC_PASSKEY_TRANSPORT)
    || getPublicOperationEndpoint(name, process.env.NEXT_PUBLIC_SHARED_RUNTIME_GROUPS);
  const sharedAdmin = usesSharedAdminReader(name, process.env.NEXT_PUBLIC_SHARED_ADMIN_READER);
  const transport = passkeyPath && typeof window !== 'undefined'
    ? httpsCallableFromURL(functions, new URL(passkeyPath, window.location.origin).href)
    : httpsCallable(functions, sharedAdmin ? 'readAdminSharedGen2' : getFunctionTarget(name));
  const invoke = sharedAdmin ? (data) => transport({ operation: name, data: data || {} }) : transport;
  const callable = COALESCED_CUSTOMER_READS.has(name) ? async (data) => {
    const auth = await getFirebaseAuth();
    return coalescePrivateRead(auth.currentUser, JSON.stringify([name, data]), () => invoke(data), () => auth.currentUser);
  } : invoke;
  return async (payload) => {
    const authorizationGeneration = getAdminCacheGeneration();
    try {
      if (!OBSERVED_CALLABLES.has(name)) {
        return await callable(payload);
      }
      const data = payload && typeof payload === 'object' && !Array.isArray(payload)
        ? payload
        : {};
      const requestId = typeof globalThis.crypto?.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      let sessionId = null;
      try {
        sessionId = window.sessionStorage.getItem('analytics_session_id');
      } catch {
        // Le stockage navigateur peut etre bloque. La requete reste tracable.
      }
      return await callable({
        ...data,
        _observability: {
          requestId,
          correlationId: requestId,
          sessionId,
        },
      });
    } catch (error) {
      if (authorizationGeneration === getAdminCacheGeneration() && ['functions/permission-denied', 'functions/unauthenticated'].includes(error?.code)) setAdminCacheAuthorization(null);
      emitAdminStepUpRequired(error);
      throw error;
    }
  };
};

export const loadAuthModule = () => {
  if (!authModulePromise) {
    authModulePromise = import('firebase/auth');
  }
  return authModulePromise;
};

export const getFirebaseAuth = async () => {
  if (!authInstance) {
    await ensureAppCheck();
    const { getAuth } = await loadAuthModule();
    authInstance = getAuth(app);
  }
  return authInstance;
};

export const getGoogleProvider = async () => {
  if (!googleProviderInstance) {
    const { GoogleAuthProvider } = await loadAuthModule();
    googleProviderInstance = new GoogleAuthProvider();
    googleProviderInstance.setCustomParameters({ prompt: 'select_account' });
  }
  return googleProviderInstance;
};
