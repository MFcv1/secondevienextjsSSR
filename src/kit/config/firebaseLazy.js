import { app } from './firebaseCore';

let firestoreModulePromise = null;
let functionsModulePromise = null;
let authModulePromise = null;
let dbInstance = null;
let functionsInstance = null;
let authInstance = null;
let googleProviderInstance = null;
let appCheckPromise = null;

const ensureAppCheck = () => {
  if (typeof window === 'undefined') return Promise.resolve(null);

  if ((process.env.NODE_ENV !== 'production') || window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname === '127.0.0.1') {
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
    functionsInstance = getFunctions(app, 'us-central1');
  }
  return functionsInstance;
};

export const getCallableFunction = async (name) => {
  const [{ httpsCallable }, functions] = await Promise.all([
    loadFunctionsModule(),
    getFunctionsInstance(),
  ]);
  return httpsCallable(functions, name);
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
