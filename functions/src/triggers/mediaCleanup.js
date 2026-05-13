function collectMediaUrls(data = {}) {
    const urls = [];

    const pushUrl = (value) => {
        if (typeof value === 'string' && value.trim()) urls.push(value.trim());
    };

    const pushList = (value) => {
        if (Array.isArray(value)) value.forEach(pushUrl);
    };

    pushList(data.images);
    pushList(data.thumbnails);
    pushUrl(data.imageUrl);
    pushUrl(data.thumbnailUrl);

    if (Array.isArray(data.imageVariants)) {
        data.imageVariants.forEach((variant) => {
            if (!variant || typeof variant !== 'object') return;
            Object.values(variant).forEach(pushUrl);
        });
    }

    return urls;
}

function storagePathFromUrl(url) {
    if (typeof url !== 'string' || !url) return null;

    const firebaseMatch = url.match(/\/o\/([^?]+)/);
    if (firebaseMatch) {
        try {
            return decodeURIComponent(firebaseMatch[1]);
        } catch {
            return firebaseMatch[1];
        }
    }

    const gsMatch = url.match(/^gs:\/\/[^/]+\/(.+)$/);
    if (gsMatch) return gsMatch[1];

    return null;
}

function collectStoragePaths(data = {}) {
    return new Set(
        collectMediaUrls(data)
            .map(storagePathFromUrl)
            .filter(Boolean)
    );
}

async function deleteStoragePaths(bucket, paths, logPrefix = 'media-cleanup') {
    const uniquePaths = Array.from(new Set(paths)).filter(Boolean);
    const deleted = [];
    const missing = [];
    const failed = [];

    for (const filePath of uniquePaths) {
        try {
            await bucket.file(filePath).delete();
            deleted.push(filePath);
            console.log(`${logPrefix}: deleted ${filePath}`);
        } catch (error) {
            if (error.code === 404) {
                missing.push(filePath);
                continue;
            }
            failed.push({ filePath, message: error.message });
            console.error(`${logPrefix}: failed ${filePath}`, error.message);
        }
    }

    return { deleted, missing, failed };
}

module.exports = {
    collectMediaUrls,
    collectStoragePaths,
    deleteStoragePaths,
    storagePathFromUrl,
};
