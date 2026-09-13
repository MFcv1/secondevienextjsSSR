'use client';

import { getCallableFunction } from '../config/firebaseLazy';

const MAX_UPLOAD_ATTEMPTS = 3;
// Erreurs definitives : rejouer l'envoi ne changerait pas la reponse.
const FINAL_UPLOAD_ERRORS = ['invalid-argument', 'permission-denied', 'failed-precondition', 'not-found', 'deadline-exceeded', 'resource-exhausted'];

const randomHex = (byteLength) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
};

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

const isRetryableUploadError = (error) => {
  const code = String(error?.code || '');
  return !FINAL_UPLOAD_ERRORS.some((finalCode) => code.includes(finalCode));
};

export const createQuoteSubmissionIdentity = () => ({
  clientRequestId: typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${randomHex(8)}-${randomHex(8)}-${randomHex(8)}-${randomHex(8)}`,
  uploadToken: randomHex(32),
  photoIds: [],
});

/*
 * `files` accepte des photos deja preparees par le formulaire
 * ({ photoId, blob, contentType, fileName }) ou des File bruts.
 * Une photo preparee porte son propre identifiant : retirer une photo entre
 * deux essais ne reattribue jamais l'identifiant d'une autre.
 */
export async function submitQuoteRequest({ identity, payload, files = [], onProgress = () => {} }) {
  const [createQuote, uploadPhoto, finalizeQuote] = await Promise.all([
    getCallableFunction('createQuoteRequest'),
    getCallableFunction('uploadQuoteRequestPhoto'),
    getCallableFunction('finalizeQuoteRequest'),
  ]);
  onProgress({ phase: 'saving', completed: 0, total: files.length });
  const created = await createQuote({
    ...payload,
    clientRequestId: identity.clientRequestId,
    uploadToken: identity.uploadToken,
    expectedPhotoCount: files.length,
    consent: true,
  });
  const quoteId = created.data.quoteId;
  if (created.data.intakeStatus === 'submitted') {
    return {
      ...created.data,
      failedPhotoCount: Math.max(0, files.length - Number(created.data.photoCount || 0)),
    };
  }

  const photoPrep = files.length ? await import('./quotePhotoPrep') : null;
  identity.photoIds ||= [];
  let uploadedPhotoCount = Number(created.data.photoCount || 0);
  for (let index = 0; index < files.length; index += 1) {
    onProgress({ phase: 'photos', completed: index, total: files.length });
    try {
      const entry = files[index];
      const photoId = entry?.photoId || (identity.photoIds[index] ||= randomHex(16));
      const prepared = entry?.blob ? entry : await photoPrep.prepareQuotePhoto(entry);
      const base64 = await photoPrep.quotePhotoToBase64(prepared.blob);
      for (let attempt = 1; attempt <= MAX_UPLOAD_ATTEMPTS; attempt += 1) {
        try {
          const result = await uploadPhoto({
            quoteId,
            uploadToken: identity.uploadToken,
            photoId,
            contentType: prepared.contentType,
            fileName: prepared.fileName,
            base64,
          });
          uploadedPhotoCount = Math.max(uploadedPhotoCount, Number(result.data.photoCount || 0));
          break;
        } catch (error) {
          // Le serveur deduplique par photoId : un nouvel essai ne cree pas de doublon.
          if (attempt === MAX_UPLOAD_ATTEMPTS || !isRetryableUploadError(error)) throw error;
          await wait(700 * attempt);
        }
      }
    } catch {
      // Finalization reads the durable received-photo count. A lost upload
      // acknowledgement alone is not proof that its photo failed.
    }
  }

  onProgress({ phase: 'finalizing', completed: files.length, total: files.length });
  const finalized = await finalizeQuote({ quoteId, uploadToken: identity.uploadToken });
  const photoCount = Math.max(uploadedPhotoCount, Number(finalized.data.photoCount || 0));
  return {
    ...finalized.data,
    photoCount,
    failedPhotoCount: Math.max(0, files.length - photoCount),
  };
}
