'use client';

/*
 * Preparation des photos du devis, sans dependance Firebase.
 *
 * Chaque photo est decodee puis re-encodee en JPEG des sa selection : l'erreur
 * apparait sur la vignette au lieu d'etre decouverte a l'envoi, et l'envoi ne
 * fait plus que transmettre. Le decodage passe par le navigateur : Safari lit
 * le HEIC des iPhone et Mac, Chrome desktop non (la vignette le signale).
 */

export const QUOTE_PHOTO_MAX_UPLOAD_BYTES = 1536 * 1024;
const MAX_EDGE = 1800;
const MAX_INPUT_BYTES = 40 * 1024 * 1024;
const MAX_INPUT_PIXELS = 25_000_000;
const IMAGE_EXTENSION = /\.(jpe?g|png|webp|gif|bmp|avif|heic|heif|tiff?)$/i;

const randomHex = (byteLength) => {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
};

/* Identifiant stable par photo : un retrait entre deux essais ne decale rien. */
export const createQuotePhotoId = () => randomHex(16);

export const isLikelyImageFile = (file) => Boolean(file)
  && (String(file.type || '').startsWith('image/') || (!file.type && IMAGE_EXTENSION.test(String(file.name || ''))));

export const quotePhotoErrorMessage = (code) => {
  switch (code) {
    case 'QUOTE_PHOTO_TYPE_INVALID':
      return 'Ce fichier n’est pas une image.';
    case 'QUOTE_PHOTO_READ_FAILED':
      return 'Format illisible ici. Exportez-la en JPEG.';
    case 'QUOTE_PHOTO_INPUT_TOO_LARGE':
      return 'Fichier trop lourd (40 Mo max).';
    case 'QUOTE_PHOTO_DIMENSIONS_INVALID':
      return 'Image trop grande (25 mégapixels max). Exportez une version réduite.';
    default:
      return 'Photo non traitée. Réessayez.';
  }
};

const photoError = (code) => {
  const error = new Error(code);
  error.code = code;
  return error;
};

const loadWithImageElement = async (file) => {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.decoding = 'async';
      element.onload = () => resolve(element);
      element.onerror = () => reject(photoError('QUOTE_PHOTO_READ_FAILED'));
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

const loadImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
      return {
        width: bitmap.width,
        height: bitmap.height,
        draw: (context, width, height) => context.drawImage(bitmap, 0, 0, width, height),
        close: () => bitmap.close(),
      };
    } catch {
      // Options non prises en charge ou format refuse par createImageBitmap :
      // l'element <img> applique aussi l'orientation EXIF et lit davantage de formats.
    }
  }
  return loadWithImageElement(file);
};

const canvasBlob = (canvas, quality) => new Promise((resolve, reject) => {
  canvas.toBlob(
    (blob) => (blob ? resolve(blob) : reject(photoError('QUOTE_PHOTO_COMPRESSION_FAILED'))),
    'image/jpeg',
    quality
  );
});

export const prepareQuotePhoto = async (file) => {
  if (!(file instanceof Blob) || !isLikelyImageFile(file)) {
    throw photoError('QUOTE_PHOTO_TYPE_INVALID');
  }
  if (file.size > MAX_INPUT_BYTES) throw photoError('QUOTE_PHOTO_INPUT_TOO_LARGE');

  const image = await loadImage(file);
  try {
    if (!image.width || !image.height) throw photoError('QUOTE_PHOTO_READ_FAILED');
    if (image.width * image.height > MAX_INPUT_PIXELS) throw photoError('QUOTE_PHOTO_DIMENSIONS_INVALID');

    let scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    let result = null;
    for (const quality of [0.84, 0.72, 0.6]) {
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      try {
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) throw photoError('QUOTE_PHOTO_CANVAS_UNAVAILABLE');
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        image.draw(context, width, height);
        result = { blob: await canvasBlob(canvas, quality), width, height };
      } finally {
        // iOS plafonne la memoire totale des canvas : on la rend tout de suite.
        canvas.width = 0;
        canvas.height = 0;
      }
      if (result.blob.size <= QUOTE_PHOTO_MAX_UPLOAD_BYTES) break;
      scale *= 0.78;
    }
    if (!result || result.blob.size > QUOTE_PHOTO_MAX_UPLOAD_BYTES) throw photoError('QUOTE_PHOTO_TOO_LARGE');

    const baseName = String(file.name || 'photo').replace(/\.[^/.]+$/, '').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80) || 'photo';
    return {
      blob: result.blob,
      width: result.width,
      height: result.height,
      contentType: 'image/jpeg',
      fileName: `${baseName}.jpg`,
    };
  } finally {
    image.close();
  }
};

/* Une photo a la fois : dix decodages 12 Mpx simultanes saturent un telephone. */
export const createQuotePhotoQueue = () => {
  let tail = Promise.resolve();
  return (file, { shouldPrepare = () => true } = {}) => {
    const run = tail.then(() => shouldPrepare() ? prepareQuotePhoto(file) : null);
    tail = run.catch(() => {});
    return run;
  };
};

export const quotePhotoToBase64 = async (blob) => {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};
