import 'server-only';

import { unstable_cache } from 'next/cache';
import { getAdminDb } from './firebaseAdmin';

export const DEFAULT_ANNOUNCEMENT_MESSAGES = Object.freeze([
  "🔥 Livraison offerte dès 250€ d'achat",
  '💡 Payez en 2x, 3x, 4x sans frais avec Klarna',
  'Rejoignez le programme de fidélité Seconde Vie 🎁',
]);

const sanitizeMessages = (value) => (
  [value?.msg_1, value?.msg_2, value?.msg_3, value?.msg_4]
    .map((message) => String(message || '').trim())
    .filter(Boolean)
);

async function fetchGalleryPersonalization() {
  try {
    const db = getAdminDb();
    if (!db) return { announcementMessages: DEFAULT_ANNOUNCEMENT_MESSAGES };

    const snap = await db.collection('sys_metadata').doc('gallery_app').get();
    if (!snap.exists) return { announcementMessages: DEFAULT_ANNOUNCEMENT_MESSAGES };

    const data = snap.data() || {};
    const announcementMessages = sanitizeMessages(data.announcement_banner_text);

    return {
      announcementMessages: announcementMessages.length
        ? announcementMessages
        : DEFAULT_ANNOUNCEMENT_MESSAGES,
    };
  } catch (error) {
    console.error('Gallery personalization server load error:', error);
    return { announcementMessages: DEFAULT_ANNOUNCEMENT_MESSAGES };
  }
}

export const getGalleryPersonalization = unstable_cache(
  fetchGalleryPersonalization,
  ['gallery-personalization-v1'],
  { revalidate: 300 },
);
