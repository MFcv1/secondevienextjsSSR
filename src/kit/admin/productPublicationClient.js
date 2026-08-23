'use client';

import { getFirebaseAppCheckToken } from '../config/firebaseLazy';

const PENDING_PUBLICATION_KEY = 'secondevie:pending-product-publication:v1';
const FILE_DATABASE = 'secondevie-product-publications';
const FILE_STORE = 'files';
const CATALOG_POLL_INTERVAL_MS = 750;

const openFileDatabase = () => new Promise((resolve, reject) => {
  if (typeof indexedDB === 'undefined') {
    reject(new Error('Le stockage local de reprise est indisponible dans ce navigateur.'));
    return;
  }
  const request = indexedDB.open(FILE_DATABASE, 1);
  request.onerror = () => reject(request.error || new Error('Ouverture du stockage local impossible.'));
  request.onupgradeneeded = () => {
    const database = request.result;
    if (!database.objectStoreNames.contains(FILE_STORE)) {
      const store = database.createObjectStore(FILE_STORE, { keyPath: 'id' });
      store.createIndex('sessionId', 'sessionId', { unique: false });
    }
  };
  request.onsuccess = () => resolve(request.result);
});

const runFileTransaction = async (mode, operation) => {
  const database = await openFileDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_STORE, mode);
      const store = transaction.objectStore(FILE_STORE);
      let result;
      try {
        result = operation(store);
      } catch (error) {
        reject(error);
        return;
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = () => reject(transaction.error || new Error('Écriture locale impossible.'));
      transaction.onabort = () => reject(transaction.error || new Error('Écriture locale interrompue.'));
    });
  } finally {
    database.close();
  }
};

const deletePublicationFiles = async (sessionId) => {
  await runFileTransaction('readwrite', (store) => {
    const request = store.index('sessionId').openKeyCursor(IDBKeyRange.only(sessionId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) return;
      store.delete(cursor.primaryKey);
      cursor.continue();
    };
  });
};

export const getPendingPublicationDescriptor = () => {
  if (typeof localStorage === 'undefined') return null;
  try {
    const value = JSON.parse(localStorage.getItem(PENDING_PUBLICATION_KEY) || 'null');
    return value?.sessionId && value?.productId && value?.startInput ? value : null;
  } catch {
    return null;
  }
};

export const clearPendingProductPublication = async (sessionId) => {
  const pending = getPendingPublicationDescriptor();
  if (!pending || pending.sessionId === sessionId) localStorage.removeItem(PENDING_PUBLICATION_KEY);
  if (sessionId) await deletePublicationFiles(sessionId);
};

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export const waitForPublicCatalogProduct = async (productId, {
  timeoutMs = 5 * 60 * 1000,
  idToken = '',
  onStatus
} = {}) => {
  const startedAt = Date.now();
  const appCheckToken = await getFirebaseAppCheckToken();
  if (!appCheckToken) {
    throw new Error('La protection App Check est indisponible. Rechargez la page avant de confirmer la publication.');
  }
  let lastStatus = '';
  const reportStatus = (status) => {
    if (status === lastStatus) return;
    lastStatus = status;
    onStatus?.(status);
  };
  while (Date.now() - startedAt < timeoutMs) {
    reportStatus('Le meuble est enregistré. Construction du catalogue public…');
    try {
      const response = await fetch('/api/admin/catalog-publication-status', {
        method: 'POST',
        cache: 'no-store',
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${idToken}`,
          'x-firebase-appcheck': appCheckToken,
          'content-type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });
      if (response.ok) {
        const payload = await response.json();
        if ((payload?.product?.id === productId || payload?.product?.productId === productId)
            && Number(payload?.revision || payload?.catalogVersion || 0) > 0
            && typeof payload?.aggregateSha256 === 'string') {
          reportStatus('La version exacte du catalogue est publiée.');
          return payload;
        }
      }
    } catch {
      // La publication Firestore est durable; le polling attend son pointeur public exact.
    }
    await sleep(CATALOG_POLL_INTERVAL_MS);
  }
  return null;
};
