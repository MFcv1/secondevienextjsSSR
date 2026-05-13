import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { appId, auth, db } from '../config/firebase';
import { clearPublicCatalogSessionCache } from '../shared/publicCatalogCache';

export const revalidateNextCatalog = async ({
  reason = 'admin_update',
  productId = '',
  categoryIds = [],
  paths = [],
} = {}) => {
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.isAnonymous) return { skipped: true, reason: 'no_admin_user' };

  const token = await currentUser.getIdToken();
  const response = await fetch('/api/revalidate-catalog', {
    method: 'POST',
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ reason, productId, categoryIds, paths }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw new Error(`Next revalidate failed (${response.status}) ${detail}`);
  }

  return response.json();
};

export const bumpPublicCatalogVersion = async (reason = 'admin_update', options = {}) => {
  clearPublicCatalogSessionCache();

  await setDoc(
    doc(db, 'artifacts', appId, 'public', 'meta'),
    {
      catalogVersion: serverTimestamp(),
      catalogVersionReason: reason,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  try {
    await revalidateNextCatalog({ reason, ...options });
  } catch (error) {
    console.warn('[Admin] Next revalidation skipped/failed:', error?.message || error);
  }
};
