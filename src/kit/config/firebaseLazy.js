import { app, functionsRegion } from './firebaseCore';
import { getFunctionTarget } from './functionTargets';

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
export const ADMIN_STEP_UP_REQUIRED_EVENT = 'sv:admin-step-up-required';

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
  const [{ httpsCallable }, functions] = await Promise.all([
    loadFunctionsModule(),
    getFunctionsInstance(),
  ]);
  const callable = httpsCallable(functions, getFunctionTarget(name));
  return async (payload) => {
    try {
      return await callable(payload);
    } catch (error) {
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
  }
  return googleProviderInstance;
};
