/**
 * Compresses and converts an image file to WebP format client-side.
 * @param {File} file - The original image file (JPEG, PNG, etc.)
 * @param {number} quality - Quality from 0 to 1 (default 0.8)
 * @param {number} maxWidth - Maximum width (default 1920px)
 * @returns {Promise<File>} - The compressed WebP file
 */
export const compressImage = (file, quality = 0.8, maxWidth = 1920) => {
    return new Promise((resolve, reject) => {
        const reader = new window.FileReader();
        reader.readAsDataURL(file);

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;

            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Resize if too large
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error('Canvas is empty'));
                            return;
                        }
                        // Create a new file with .webp extension
                        const newName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
                        const compressedFile = new File([blob], newName, {
                            type: 'image/webp',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    },
                    'image/webp',
                    quality
                );
            };

            img.onerror = (error) => reject(error);
        };

        reader.onerror = (error) => reject(error);
    });
};

const imageLoadCache = new Map();
const imageDecodeCache = new Map();

export const PRODUCT_IMAGE_VARIANT_SPECS = [
    { key: 'thumb', width: 480, quality: 0.74, folder: 'thumbnails' },
    { key: 'card', width: 768, quality: 0.78, folder: 'responsive' },
    { key: 'medium', width: 1024, quality: 0.8, folder: 'responsive' },
    { key: 'large', width: 1440, quality: 0.82, folder: 'responsive' },
    { key: 'full', width: 1920, quality: 0.85, folder: 'responsive' },
];

export const createProductImageVariantFiles = async (file, specs = PRODUCT_IMAGE_VARIANT_SPECS) => {
    const entries = [];
    for (const spec of specs) {
        const variantFile = await compressImage(file, spec.quality, spec.width);
        entries.push([spec.key, variantFile]);
    }

    return Object.fromEntries(entries);
};

export const getImageFileMetadata = (file) => {
    if (!file || typeof window === 'undefined') {
        return Promise.resolve(null);
    }

    return new Promise((resolve) => {
        const reader = new window.FileReader();
        reader.onload = (event) => {
            const image = new Image();
            image.onload = () => {
                const width = image.naturalWidth || image.width || 0;
                const height = image.naturalHeight || image.height || 0;
                const ratio = width > 0 && height > 0 ? Number((width / height).toFixed(4)) : null;
                const canvas = document.createElement('canvas');
                const size = 16;
                canvas.width = size;
                canvas.height = size;
                const ctx = canvas.getContext('2d', { willReadFrequently: true });

                let dominantColor = '#f7f3ee';
                let blurDataUrl = '';

                if (ctx) {
                    ctx.drawImage(image, 0, 0, size, size);
                    try {
                        const { data } = ctx.getImageData(0, 0, size, size);
                        let red = 0;
                        let green = 0;
                        let blue = 0;
                        let count = 0;

                        for (let index = 0; index < data.length; index += 4) {
                            const alpha = data[index + 3];
                            if (alpha < 20) continue;
                            red += data[index];
                            green += data[index + 1];
                            blue += data[index + 2];
                            count += 1;
                        }

                        if (count > 0) {
                            dominantColor = `rgb(${Math.round(red / count)}, ${Math.round(green / count)}, ${Math.round(blue / count)})`;
                        }
                    } catch {
                        dominantColor = '#f7f3ee';
                    }

                    try {
                        blurDataUrl = canvas.toDataURL('image/webp', 0.45);
                    } catch {
                        blurDataUrl = '';
                    }
                }

                resolve({
                    width,
                    height,
                    ratio,
                    dominantColor,
                    blurDataUrl,
                });
            };
            image.onerror = () => resolve(null);
            image.src = event.target.result;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
    });
};

const getImageLoadCacheKey = (src) => src || '';

const asArray = (value) => Array.isArray(value) ? value.filter(Boolean) : [];

const normalizeVariantSlot = (slot) => {
    if (!slot || typeof slot !== 'object') return {};

    return PRODUCT_IMAGE_VARIANT_SPECS.reduce((variants, spec) => {
        if (typeof slot[spec.key] === 'string' && slot[spec.key].trim()) {
            variants[spec.key] = slot[spec.key].trim();
        }
        return variants;
    }, {});
};

const normalizeMetadataSlot = (slot) => {
    if (!slot || typeof slot !== 'object') return null;

    const width = Number(slot.width) || 0;
    const height = Number(slot.height) || 0;
    const ratio = Number(slot.ratio) || (width > 0 && height > 0 ? width / height : 0);
    const dominantColor = typeof slot.dominantColor === 'string' ? slot.dominantColor : '';
    const blurDataUrl = typeof slot.blurDataUrl === 'string' ? slot.blurDataUrl : '';

    if (!width && !height && !ratio && !dominantColor && !blurDataUrl) return null;

    return {
        width,
        height,
        ratio: ratio > 0 ? ratio : null,
        dominantColor,
        blurDataUrl,
    };
};

const buildSrcSet = (candidates) => {
    const seen = new Set();
    return candidates
        .filter(({ src }) => Boolean(src))
        .filter(({ src }) => {
            if (seen.has(src)) return false;
            seen.add(src);
            return true;
        })
        .map(({ src, width }) => `${src} ${width}w`)
        .join(', ');
};

export const getProductImageItems = (item) => {
    if (!item) return [];

    const fullImages = asArray(item.images);
    const thumbnails = asArray(item.thumbnails);
    const imageVariants = asArray(item.imageVariants);
    const imageMetadata = asArray(item.imageMetadata);
    const fallback = item.imageUrl || item.thumbnailUrl || '';
    const sources = fullImages.length > 0 ? fullImages : (fallback ? [fallback] : []);

    return sources.map((source, index) => {
        const variants = normalizeVariantSlot(imageVariants[index]);
        const metadata = normalizeMetadataSlot(imageMetadata[index]);
        const legacyThumb = thumbnails[index] || (index === 0 ? item.thumbnailUrl : '') || '';
        const full = variants.full || source;
        const large = variants.large || full;
        const medium = variants.medium || large;
        const card = variants.card || legacyThumb || medium;
        const thumb = variants.thumb || legacyThumb || card;
        const srcSet = buildSrcSet([
            { src: thumb, width: 480 },
            { src: card, width: 768 },
            { src: medium, width: 1024 },
            { src: large, width: 1440 },
            { src: full, width: 1920 },
        ]);

        return {
            src: large || full || medium || card || thumb || source,
            thumb,
            card,
            medium,
            large,
            full,
            srcSet,
            variants,
            metadata,
            ratio: metadata?.ratio || null,
        };
    });
};

export const PRODUCT_CARD_IMAGE_SIZES = '(max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw';
export const PRODUCT_DETAIL_IMAGE_SIZES = '(max-width: 1023px) min(94vw, 430px), calc(100vw - 610px)';
export const PRODUCT_DIRECT_DETAIL_IMAGE_SIZES = '(max-width: 1023px) min(94vw, 430px), 820px';

export const PRODUCT_DISPLAY_IMAGE_VARIANTS = {
    mobile: 'medium',
    desktop: 'medium',
};

const getProductDisplayVariant = (options = {}) => {
    if (options.variant) return options.variant;
    if (options.viewport === 'mobile') return PRODUCT_DISPLAY_IMAGE_VARIANTS.mobile;
    if (options.viewport === 'desktop') return PRODUCT_DISPLAY_IMAGE_VARIANTS.desktop;

    if (typeof window !== 'undefined') {
        return window.matchMedia?.('(min-width: 1024px)').matches
            ? PRODUCT_DISPLAY_IMAGE_VARIANTS.desktop
            : PRODUCT_DISPLAY_IMAGE_VARIANTS.mobile;
    }

    return PRODUCT_DISPLAY_IMAGE_VARIANTS.desktop;
};

export const getProductDisplayImageSrc = (image, options = {}) => {
    if (!image) return '';

    const variant = getProductDisplayVariant(options);
    if (variant && typeof image[variant] === 'string' && image[variant]) {
        return image[variant];
    }

    if (variant === PRODUCT_DISPLAY_IMAGE_VARIANTS.mobile) {
        return image.medium || image.large || image.src || image.card || image.thumb || image.full || '';
    }

    return image.large || image.medium || image.src || image.card || image.thumb || image.full || '';
};

export const getProductZoomInitialImageSrc = (image, options = {}) => (
    options.displaySrc || getProductDisplayImageSrc(image, options)
);

export const getProductZoomFullImageSrc = (image) => (
    image?.full || image?.large || image?.medium || image?.src || image?.card || image?.thumb || ''
);

export const getPrimaryProductImage = (item) => {
    const primary = getProductImageItems(item)[0];
    return getProductDisplayImageSrc(primary, { viewport: 'desktop' }) || item?.imageUrl || item?.thumbnailUrl || '';
};

export const getProductCardImage = (item) => {
    const primary = getProductImageItems(item)[0];
    const displaySrc = primary?.medium
        || primary?.card
        || primary?.large
        || primary?.src
        || primary?.thumb
        || item?.thumbnailUrl
        || item?.imageUrl
        || item?.image
        || '';
    const thumbSrcSet = buildSrcSet([
        { src: primary?.thumb, width: 480 },
    ]);

    return {
        src: displaySrc,
        srcSet: '',
        thumbSrcSet,
        mobileSrc: displaySrc,
        mobileSrcSet: '',
        metadata: primary?.metadata || null,
    };
};

export const preloadImage = (src, options = {}) => {
    if (!src || typeof window === 'undefined') return Promise.resolve(null);

    const decode = options.decode !== false;
    const cacheKey = getImageLoadCacheKey(`${src}|${options.srcSet || ''}|${options.sizes || ''}`, options);
    let loadPromise = imageLoadCache.get(cacheKey);

    if (!loadPromise) {
        loadPromise = new Promise((resolve, reject) => {
            const image = new Image();
            if (options.priority && 'fetchPriority' in image) {
                image.fetchPriority = options.priority;
            }
            image.decoding = options.decoding || 'async';
            if (options.sizes) image.sizes = options.sizes;
            if (options.srcSet) image.srcset = options.srcSet;
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = src;
        }).catch((error) => {
            imageLoadCache.delete(cacheKey);
            imageDecodeCache.delete(cacheKey);
            throw error;
        });

        imageLoadCache.set(cacheKey, loadPromise);
    }

    if (!decode) return loadPromise;

    let decodePromise = imageDecodeCache.get(cacheKey);
    if (!decodePromise) {
        decodePromise = loadPromise.then(async (image) => {
            if (typeof image.decode === 'function') {
                try {
                    await image.decode();
                } catch {
                    // The image has already loaded; decode failures should not block display.
                }
            }
            return image;
        }).catch((error) => {
            imageDecodeCache.delete(cacheKey);
            throw error;
        });
        imageDecodeCache.set(cacheKey, decodePromise);
    }

    return decodePromise;
};

export const preloadProductCardImages = (item, options = {}) => {
    const cardImage = getProductCardImage(item);
    const fullSrc = cardImage.src;
    const priority = options.priority || 'auto';
    const promises = [];

    if (fullSrc) {
        promises.push(preloadImage(fullSrc, {
            priority,
            srcSet: cardImage.srcSet,
            sizes: PRODUCT_CARD_IMAGE_SIZES,
            decode: options.decodeFull ?? false,
        }).catch(() => null));
    }

    return promises;
};

export const preloadProductImages = (item, options = {}) => {
    const imageItems = getProductImageItems(item);
    if (!imageItems.length) return [];

    const activeIndex = Math.max(0, Math.min(options.activeIndex || 0, imageItems.length - 1));
    const radius = options.radius ?? 1;
    const indexes = new Set([activeIndex]);

    for (let offset = 1; offset <= radius; offset += 1) {
        if (activeIndex + offset < imageItems.length) indexes.add(activeIndex + offset);
        if (activeIndex - offset >= 0) indexes.add(activeIndex - offset);
    }

    return Array.from(indexes).flatMap((index) => {
        const image = imageItems[index];
        const priority = index === activeIndex ? (options.priority || 'high') : (options.neighborPriority || 'auto');
        const displaySrc = getProductDisplayImageSrc(image, {
            variant: options.variant,
            viewport: options.viewport,
        });
        return preloadImage(displaySrc, {
            priority,
            srcSet: options.srcSet === true ? image.srcSet : undefined,
            sizes: options.sizes || PRODUCT_DETAIL_IMAGE_SIZES,
            decode: options.decode,
            decoding: 'async',
        }).catch(() => null);
    });
};

export const preloadPrimaryProductDetailImage = (item, options = {}) => {
    const imageItems = getProductImageItems(item);
    if (!imageItems.length) return Promise.resolve(null);

    const activeIndex = Math.max(0, Math.min(options.activeIndex || 0, imageItems.length - 1));
    const image = imageItems[activeIndex];
    const src = getProductDisplayImageSrc(image, {
        variant: options.variant,
        viewport: options.viewport,
    });
    if (!src) return Promise.resolve(null);

    return preloadImage(src, {
        priority: options.priority || 'high',
        srcSet: options.srcSet === true ? image.srcSet : undefined,
        sizes: options.sizes || PRODUCT_DETAIL_IMAGE_SIZES,
        decode: options.decode !== false,
        decoding: options.decoding || 'async',
    }).catch(() => null);
};

export const prewarmProductListImages = (items, options = {}) => {
    if (!Array.isArray(items) || !items.length || typeof window === 'undefined') return () => {};

    const connection = navigator?.connection || navigator?.mozConnection || navigator?.webkitConnection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return () => {};

    const maxItems = Math.max(1, options.maxItems ?? 36);
    const delay = Math.max(80, options.delay ?? 220);
    const initialDelay = Math.max(0, options.initialDelay ?? 700);
    const includeDetailPrimary = options.includeDetailPrimary !== false;
    const useIdle = options.idle !== false;
    const seen = new Set();
    const queue = [];
    const srcSetBySrc = new Map();

    const push = (src, metadata = {}) => {
        if (!src || seen.has(src)) return;
        seen.add(src);
        queue.push(src);
        if (metadata.srcSet) srcSetBySrc.set(src, metadata.srcSet);
    };

    items.slice(0, maxItems).forEach((item) => {
        const cardImage = getProductCardImage(item);
        push(cardImage.src, { srcSet: cardImage.srcSet });

        if (includeDetailPrimary) {
            const primary = getProductImageItems(item)[0];
            const detailSrc = getProductDisplayImageSrc(primary, {
                variant: options.detailVariant,
                viewport: options.detailViewport,
            });
            push(detailSrc, {
                srcSet: options.detailSrcSet === true ? primary?.srcSet : undefined,
            });
        }
    });

    let cancelled = false;
    let timeoutId = 0;
    let idleId = 0;

    const clearScheduled = () => {
        if (timeoutId) window.clearTimeout(timeoutId);
        if (idleId && typeof window.cancelIdleCallback === 'function') window.cancelIdleCallback(idleId);
        timeoutId = 0;
        idleId = 0;
    };

    const schedule = (callback, wait) => {
        timeoutId = window.setTimeout(() => {
            timeoutId = 0;
            if (useIdle && typeof window.requestIdleCallback === 'function') {
                idleId = window.requestIdleCallback(() => {
                    idleId = 0;
                    callback();
                }, { timeout: 1500 });
                return;
            }
            callback();
        }, wait);
    };

    const runNext = () => {
        if (cancelled) return;
        const src = queue.shift();
        if (!src) return;

        preloadImage(src, {
            priority: options.priority || 'low',
            srcSet: srcSetBySrc.get(src),
            sizes: options.sizes || PRODUCT_CARD_IMAGE_SIZES,
            decode: options.decode === true,
            decoding: 'async',
        }).catch(() => null);

        if (queue.length) schedule(runNext, delay);
    };

    schedule(runNext, initialDelay);

    return () => {
        cancelled = true;
        clearScheduled();
    };
};

const createImage = (url) =>
    new Promise((resolve, reject) => {
        const image = new Image();
        image.addEventListener('load', () => resolve(image));
        image.addEventListener('error', (error) => reject(error));
        image.setAttribute('crossOrigin', 'anonymous');
        image.src = url;
    });

function getRadianAngle(degreeValue) {
    return (degreeValue * Math.PI) / 180;
}

/**
 * Utility to get cropped image from canvas as a Blob/File
 * Supports rotation
 */
export const getCroppedImg = async (imageSrc, pixelCrop, rotation = 0, maxDimension = 1920) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const maxSize = Math.max(image.width, image.height);
    const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

    // set each dimensions to double largest dimension to allow for a safe area for the
    // image to rotate in without being clipped by canvas context
    canvas.width = safeArea;
    canvas.height = safeArea;

    // translate canvas context to a central location on image to allow rotating around the center.
    ctx.translate(safeArea / 2, safeArea / 2);
    ctx.rotate(getRadianAngle(rotation));
    ctx.translate(-safeArea / 2, -safeArea / 2);

    // draw rotated image and store data.
    ctx.drawImage(
        image,
        safeArea / 2 - image.width * 0.5,
        safeArea / 2 - image.height * 0.5
    );
    const data = ctx.getImageData(0, 0, safeArea, safeArea);

    // set canvas width to final desired crop size - this will clear existing context
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // paste generated rotate image with correct offsets for x,y crop values.
    ctx.putImageData(
        data,
        Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
        Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
    );

    // Check for maxDimension scaling
    let finalCanvas = canvas;
    if (canvas.width > maxDimension || canvas.height > maxDimension) {
        const ratio = Math.min(maxDimension / canvas.width, maxDimension / canvas.height);
        const targetWidth = Math.round(canvas.width * ratio);
        const targetHeight = Math.round(canvas.height * ratio);

        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = targetWidth;
        scaledCanvas.height = targetHeight;
        const scaledCtx = scaledCanvas.getContext('2d');
        scaledCtx.drawImage(canvas, 0, 0, targetWidth, targetHeight);
        finalCanvas = scaledCanvas;
    }

    // Return as Blob
    return new Promise((resolve, reject) => {
        finalCanvas.toBlob(
            (blob) => {
                if (!blob) {
                    reject(new Error('Canvas is empty'));
                    return;
                }
                resolve(blob);
            },
            'image/webp',
            0.85
        );
    });
};
