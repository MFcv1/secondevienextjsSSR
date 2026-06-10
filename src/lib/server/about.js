import 'server-only';

import { unstable_cache } from 'next/cache';
import { getAdminDb } from './firebaseAdmin';

const FALLBACK_ABOUT_DATA = Object.freeze({});

async function fetchAboutPersonalization() {
  try {
    const db = getAdminDb();
    if (!db) return FALLBACK_ABOUT_DATA;

    const snap = await db.collection('sys_metadata').doc('homepage_images').get();
    if (!snap.exists) return FALLBACK_ABOUT_DATA;

    return snap.data() || FALLBACK_ABOUT_DATA;
  } catch (error) {
    console.error('About personalization server load error:', error);
    return FALLBACK_ABOUT_DATA;
  }
}

export const getAboutPersonalization = unstable_cache(
  fetchAboutPersonalization,
  ['about-personalization-v1'],
  { revalidate: 300 },
);
