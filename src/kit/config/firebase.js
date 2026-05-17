import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

// --- CONFIGURATION FIREBASE (Via Variables d'Environnement) ---
// Cette configuration est chargée dynamiquement depuis le fichier .env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);

// ============================================================
// SÉCURITÉ: Firebase App Check (Anti-Bot / Anti-Script)
// Vérifie silencieusement que les requêtes viennent du vrai site.
// En mode développement (localhost), utilise un token debug.
// ============================================================
if (typeof window !== 'undefined') {
  // On active le mode debug pour localhost ET les IP locales en développement
  if ((process.env.NODE_ENV !== 'production') || window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.') || window.location.hostname === '127.0.0.1') {
    window.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
  }

  // AppCheck : uniquement si une clé reCAPTCHA est configurée
  const recaptchaKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (recaptchaKey) {
    initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      isTokenAutoRefreshEnabled: true
    });
  } else if (!(process.env.NODE_ENV !== 'production')) {
    console.warn('[Firebase] AppCheck désactivé — VITE_RECAPTCHA_SITE_KEY non configurée.');
  }
}

const db = getFirestore(app);
const functions = getFunctions(app, 'us-central1');

// Nom logique pour isoler les données si besoin
// ⚠️ CONFIGURER dans .env.local : VITE_APP_LOGICAL_NAME=votre-identifiant
const appId = process.env.NEXT_PUBLIC_APP_LOGICAL_NAME || 'my-store';

let authInstance = null;
let googleProviderInstance = null;
let authModulePromise = null;

const loadAuthModule = () => {
  if (!authModulePromise) {
    authModulePromise = import('firebase/auth');
  }
  return authModulePromise;
};

const getFirebaseAuth = async () => {
  if (!authInstance) {
    const { getAuth } = await loadAuthModule();
    authInstance = getAuth(app);
  }
  return authInstance;
};

const getGoogleProvider = async () => {
  if (!googleProviderInstance) {
    const { GoogleAuthProvider } = await loadAuthModule();
    googleProviderInstance = new GoogleAuthProvider();
  }
  return googleProviderInstance;
};

export { app, db, functions, appId, getFirebaseAuth, getGoogleProvider, loadAuthModule };
