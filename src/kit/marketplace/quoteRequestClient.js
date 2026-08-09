'use client';

import { getCallableFunction } from '../config/firebaseLazy';

const MAX_UPLOAD_BYTES = 1536 * 1024;
const MAX_EDGE = 1800;

const randomHex = (byteLength) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
};

export const createQuoteSubmissionIdentity = () => ({
  clientRequestId: typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${randomHex(8)}-${randomHex(8)}-${randomHex(8)}-${randomHex(8)}`,
  uploadToken: randomHex(32),
  photoIds: [],
});

const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(
    (blob) => (blob ? resolve(blob) : reject(new Error('QUOTE_PHOTO_COMPRESSION_FAILED'))),
    'image/jpeg',
    quality
  );
});

const loadImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return {
      width: bitmap.width,
      height: bitmap.height,
      draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
      close: () => bitmap.close(),
    };
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('QUOTE_PHOTO_READ_FAILED'));
      element.src = url;
    });
    return {
      width: image.naturalWidth,
      height: image.naturalHeight,
      draw: (context, width, height) => context.drawImage(image, 0, 0, width, height),
      close: () => {},
    };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const blobToBase64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

export const prepareQuotePhoto = async (file) => {
  if (!(file instanceof File) || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    throw new Error('QUOTE_PHOTO_TYPE_INVALID');
  }
  const image = await loadImage(file);
  try {
    if (!image.width || !image.height || image.width * image.height > 25_000_000) {
      throw new Error('QUOTE_PHOTO_DIMENSIONS_INVALID');
    }
    let scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    let blob = null;
    for (const quality of [0.84, 0.72, 0.6]) {
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { alpha: false });
      if (!context) throw new Error('QUOTE_PHOTO_CANVAS_UNAVAILABLE');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      image.draw(context, width, height);
      blob = await canvasBlob(canvas, quality);
      if (blob.size <= MAX_UPLOAD_BYTES) break;
      scale *= 0.78;
    }
    if (!blob || blob.size > MAX_UPLOAD_BYTES) throw new Error('QUOTE_PHOTO_TOO_LARGE');
    const baseName = String(file.name || 'photo').replace(/\.[^/.]+$/, '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || 'photo';
    return {
      base64: await blobToBase64(blob),
      contentType: 'image/jpeg',
      fileName: `${baseName}.jpg`,
    };
  } finally {
    image.close();
  }
};

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
      failedPhotoCount: 0,
      confirmationEmailStatus: 'pending',
    };
  }

  let failedPhotoCount = 0;
  let uploadedPhotoCount = Number(created.data.photoCount || 0);
  for (let index = 0; index < files.length; index += 1) {
    try {
      identity.photoIds[index] ||= randomHex(16);
      onProgress({ phase: 'photos', completed: index, total: files.length });
      const prepared = await prepareQuotePhoto(files[index]);
      const result = await uploadPhoto({
        quoteId,
        uploadToken: identity.uploadToken,
        photoId: identity.photoIds[index],
        ...prepared,
      });
      uploadedPhotoCount = Math.max(uploadedPhotoCount, Number(result.data.photoCount || 0));
    } catch {
      failedPhotoCount += 1;
    }
  }

  onProgress({ phase: 'finalizing', completed: files.length, total: files.length });
  const finalized = await finalizeQuote({ quoteId, uploadToken: identity.uploadToken });
  return {
    ...finalized.data,
    photoCount: Math.max(uploadedPhotoCount, Number(finalized.data.photoCount || 0)),
    failedPhotoCount,
  };
}
