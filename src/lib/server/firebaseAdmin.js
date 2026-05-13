import 'server-only';

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { publicEnv } from './env';

const parseServiceAccount = () => {
  const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (rawJson) {
    const parsed = JSON.parse(rawJson);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return cert(parsed);
  }

  if (process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    return cert({
      projectId: process.env.FIREBASE_PROJECT_ID || publicEnv.projectId,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    });
  }

  return undefined;
};

export const getAdminDb = () => {
  if (!publicEnv.projectId) return null;

  const credential = parseServiceAccount();
  const app = getApps()[0] || initializeApp({
    projectId: publicEnv.projectId,
    ...(credential ? { credential } : {})
  });

  return getFirestore(app);
};
