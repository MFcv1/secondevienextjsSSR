import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { app, appId } from './firebaseCore';
import { getFirebaseAuth, getGoogleProvider, loadAuthModule } from './firebaseLazy';

const initializeAppCheckBeforeLegacyServices = () => {
  if (typeof window === 'undefined') return;

  if (
    typeof window.FIREBASE_APPCHECK_DEBUG_TOKEN === 'undefined' &&
    ((process.env.NODE_ENV !== 'production') || window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname === '127.0.0.1')
  ) {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!recaptchaKey) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('[Firebase] AppCheck desactive - NEXT_PUBLIC_RECAPTCHA_SITE_KEY non configuree.');
    }
    return;
  }

  try {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    });
  } catch (error) {
    const message = error?.message || String(error);
    if (!/already exists|already initialized|already-initialized/i.test(message)) {
      console.warn('[Firebase] AppCheck initialization failed:', error);
    }
  }
};

initializeAppCheckBeforeLegacyServices();

const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

export {
  app,
  db,
  functions,
  appId,
  getFirebaseAuth,
  getGoogleProvider,
  loadAuthModule,
};
