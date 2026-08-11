import 'server-only';

import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getAppCheck } from 'firebase-admin/app-check';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { publicEnv } from './env';

const parseServiceAccount = () => {
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return applicationDefault();
  }
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

  return getFirestore(getAdminApp());
};

export const getAdminAuth = () => {
  if (!publicEnv.projectId) return null;

  return getAuth(getAdminApp());
};

export const getAdminAppCheck = () => {
  if (!publicEnv.projectId) return null;
  return getAppCheck(getAdminApp());
};

export const getAdminStorage = () => {
  if (!publicEnv.projectId) return null;
  return getStorage(getAdminApp());
};

const getAdminApp = () => {
  const credential = parseServiceAccount();
  return getApps()[0] || initializeApp({
    projectId: publicEnv.projectId,
    ...(credential ? { credential } : {})
  });
};
