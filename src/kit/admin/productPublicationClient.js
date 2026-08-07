'use client';

import { ref, uploadBytesResumable } from 'firebase/storage';
import { getCallableFunction } from '../config/firebaseLazy';
import { getStorageInstance } from '../config/firebaseStorage';

const PENDING_PUBLICATION_KEY = 'secondevie:pending-product-publication:v1';
const FILE_DATABASE = 'secondevie-product-publications';
const FILE_STORE = 'files';
const POLL_INTERVAL_MS = 1800;
const PUBLICATION_TIMEOUT_MS = 15 * 60 * 1000;
const SOURCE_UPLOAD_TIMEOUT_MS = 2 * 60 * 1000;
const SOURCE_UPLOAD_MAX_ATTEMPTS = 3;

const randomId = (prefix) => {
  const suffix = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${suffix}`;
};

const callPublicationFunction = async (functionName, payload) => {
  const callable = await getCallableFunction(functionName);
  const result = await callable(payload);
  return result.data;
};

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

const storePublicationFiles = async (sessionId, files) => {
  await runFileTransaction('readwrite', (store) => {
    files.forEach((file, index) => {
      const slotKey = `slot-${String(index).padStart(2, '0')}`;
      store.put({
        id: `${sessionId}:${slotKey}`,
        sessionId,
        slotKey,
        file,
        name: file.name || `${slotKey}.webp`,
        type: file.type || 'image/webp',
        lastModified: Number(file.lastModified || Date.now())
      });
    });
  });
};

const readPublicationFiles = async (sessionId) => {
  const database = await openFileDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction(FILE_STORE, 'readonly');
      const request = transaction.objectStore(FILE_STORE).index('sessionId').getAll(sessionId);
      request.onsuccess = () => resolve((request.result || []).sort((left, right) => left.slotKey.localeCompare(right.slotKey)));
      request.onerror = () => reject(request.error || new Error('Lecture locale impossible.'));
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

const savePendingDescriptor = (descriptor) => {
  localStorage.setItem(PENDING_PUBLICATION_KEY, JSON.stringify(descriptor));
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

const sanitizeFileName = (name) => String(name || 'image.webp')
  .normalize('NFKD')
  .replace(/[^A-Za-z0-9._-]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 90) || 'image.webp';

const uploadSourceFile = async ({ sessionId, entry, onProgress }) => {
  const storage = await getStorageInstance();
  const objectPath = `furniture/publication-sessions/${sessionId}/originals/${entry.slotKey}/${sanitizeFileName(entry.name)}`;
  const task = uploadBytesResumable(ref(storage, objectPath), entry.file, {
    cacheControl: 'private, max-age=0, no-store',
    contentType: entry.type || entry.file?.type || 'image/webp',
    customMetadata: { publicationSessionId: sessionId, slotKey: entry.slotKey }
  });
  await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      task.cancel();
      const error = new Error('Le délai d’envoi de la photo est dépassé.');
      error.code = 'PRODUCT_PUBLICATION_UPLOAD_TIMEOUT';
      reject(error);
    }, SOURCE_UPLOAD_TIMEOUT_MS);
    task.on('state_changed', (snapshot) => {
      onProgress?.(snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0);
    }, (error) => {
      clearTimeout(timeout);
      reject(error);
    }, () => {
      clearTimeout(timeout);
      resolve();
    });
  });
};

const sleep = (duration) => new Promise((resolve) => setTimeout(resolve, duration));

export const getProductPublicationSession = (sessionId) => callPublicationFunction(
  'getProductPublicationSessionAdmin',
  { sessionId }
);

const ensurePublicationStarted = (descriptor) => callPublicationFunction(
  'startProductPublicationAdmin',
  {
    ...descriptor.startInput,
    sessionId: descriptor.sessionId,
    productId: descriptor.productId
  }
);

const retryFinalization = (sessionId) => callPublicationFunction(
  'retryProductPublicationFinalizationAdmin',
  { sessionId }
);

const reportClientFailure = async (sessionId, error) => {
  if (!sessionId) return;
  const rawCode = String(error?.code || 'PRODUCT_PUBLICATION_CLIENT_FAILED')
    .replace(/^storage\//, 'STORAGE_')
    .replace(/[^A-Za-z0-9_-]+/g, '_')
    .toUpperCase()
    .slice(0, 100);
  try {
    await callPublicationFunction('reportProductPublicationClientErrorAdmin', {
      sessionId,
      stage: error?.publicationStage || 'unknown',
      code: rawCode || 'PRODUCT_PUBLICATION_CLIENT_FAILED'
    });
  } catch {
    // Le signalement ne doit jamais remplacer l'erreur initiale ni bloquer la reprise locale.
  }
};

const resumeProductPublicationInternal = async (descriptor, { onProgress, onStatus } = {}) => {
  const startedAt = Date.now();
  let status = await ensurePublicationStarted(descriptor);
  if (status.status === 'published') return status;
  let entries;
  try {
    entries = await readPublicationFiles(descriptor.sessionId);
  } catch (error) {
    error.publicationStage = 'local_files';
    throw error;
  }
  if (entries.length !== Number(descriptor.startInput.expectedMediaCount)) {
    const error = new Error('Les photos locales nécessaires à la reprise sont incomplètes.');
    error.code = 'PRODUCT_PUBLICATION_LOCAL_FILES_INCOMPLETE';
    error.publicationStage = 'local_files';
    throw error;
  }

  const uploadedThisRun = new Set();
  const uploadAttempts = new Map();
  let lastFinalizationRetryAt = 0;
  while (Date.now() - startedAt < PUBLICATION_TIMEOUT_MS) {
    if (status.status === 'published') return status;
    const missingEntries = entries.filter((entry) => {
      const slotStatus = status.slots?.[entry.slotKey]?.status;
      if (slotStatus === 'failed') return true;
      return (!slotStatus || slotStatus === 'pending') && !uploadedThisRun.has(entry.slotKey);
    });

    for (let index = 0; index < missingEntries.length; index += 1) {
      const entry = missingEntries[index];
      onStatus?.(`Envoi de la photo ${Number(entry.slotKey.slice(-2)) + 1}/${entries.length}…`);
      let uploaded = false;
      while (!uploaded) {
        const attempts = Number(uploadAttempts.get(entry.slotKey) || 0) + 1;
        uploadAttempts.set(entry.slotKey, attempts);
        try {
          await uploadSourceFile({
            sessionId: descriptor.sessionId,
            entry,
            onProgress: (fileProgress) => {
              const completed = uploadedThisRun.size;
              onProgress?.(0.12 + ((completed + fileProgress) / entries.length) * 0.48);
            }
          });
          uploaded = true;
        } catch (error) {
          if (attempts >= SOURCE_UPLOAD_MAX_ATTEMPTS) {
            error.publicationStage = 'storage_upload';
            throw error;
          }
          onStatus?.(`Nouvelle tentative pour la photo ${Number(entry.slotKey.slice(-2)) + 1}…`);
          await sleep(POLL_INTERVAL_MS * attempts);
        }
      }
      uploadedThisRun.add(entry.slotKey);
    }

    status = await getProductPublicationSession(descriptor.sessionId);
    const processed = Number(status.processedMediaCount || 0);
    onProgress?.(0.6 + (processed / entries.length) * 0.3);
    if (status.status === 'ready' || (status.status === 'failed' && processed === entries.length)) {
      onStatus?.('Finalisation sécurisée de la publication…');
      status = await retryFinalization(descriptor.sessionId);
      continue;
    }
    if (status.status === 'finalizing' && Date.now() - lastFinalizationRetryAt >= 20000) {
      lastFinalizationRetryAt = Date.now();
      onStatus?.('Vérification de la finalisation serveur…');
      status = await retryFinalization(descriptor.sessionId);
      continue;
    }
    if (status.status === 'failed') {
      const failedSlots = Object.entries(status.slots || {}).filter(([, slot]) => slot?.status === 'failed');
      if (!failedSlots.length) throw new Error('La finalisation serveur doit être relancée.');
      failedSlots.forEach(([slotKey]) => uploadedThisRun.delete(slotKey));
    }
    onStatus?.(`Traitement des photos sur le serveur (${processed}/${entries.length})…`);
    await sleep(POLL_INTERVAL_MS);
  }
  throw new Error('La publication continue sur le serveur. Revenez sur cet écran pour vérifier son état.');
};

export const resumeProductPublication = async (descriptor, options = {}) => {
  try {
    return await resumeProductPublicationInternal(descriptor, options);
  } catch (error) {
    await reportClientFailure(descriptor?.sessionId, error);
    throw error;
  }
};

export const startDurableProductPublication = async ({ files, startInput, onProgress, onStatus }) => {
  if (getPendingPublicationDescriptor()) {
    throw new Error('Une publication précédente doit d’abord terminer sa reprise sur cet écran.');
  }
  const descriptor = {
    schemaVersion: 1,
    sessionId: randomId('publication'),
    productId: randomId('product'),
    createdAt: new Date().toISOString(),
    startInput
  };
  onStatus?.('Sauvegarde locale des photos pour permettre la reprise…');
  await storePublicationFiles(descriptor.sessionId, files);
  savePendingDescriptor(descriptor);
  try {
    return {
      descriptor,
      result: await resumeProductPublication(descriptor, { onProgress, onStatus })
    };
  } catch (error) {
    error.publicationDescriptor = descriptor;
    throw error;
  }
};

export const waitForPublicCatalogProduct = async (productId, { timeoutMs = 120000 } = {}) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`/api/catalog?id=${encodeURIComponent(productId)}`, {
        cache: 'no-store',
        headers: { accept: 'application/json' }
      });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.product?.id === productId || payload?.product?.productId === productId) return payload;
      }
    } catch {
      // La publication Firestore est durable; le polling attend seulement sa projection publique.
    }
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
};
