import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { appId, db } from '../config/firebase';
import { clearPublicCatalogSessionCache } from '../shared/publicCatalogCache';

export const bumpPublicCatalogVersion = async (reason = 'admin_update') => {
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
};
