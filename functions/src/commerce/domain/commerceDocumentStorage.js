'use strict';

async function resolveStorageBucketName(env = process.env, appOptions = {}) {
    const explicitBucket = String(env.FUNCTIONS_STORAGE_BUCKET || '').trim();
    if (explicitBucket) return explicitBucket;

    const firebaseConfig = String(env.FIREBASE_CONFIG || '').trim();
    if (firebaseConfig) {
        try {
            const configuredBucket = String(JSON.parse(firebaseConfig)?.storageBucket || '').trim();
            if (configuredBucket) return configuredBucket;
        } catch {
            // A malformed optional config must not hide the project-derived fallback.
        }
    }

    const adminBucket = String(appOptions.storageBucket || '').trim();
    if (adminBucket) return adminBucket;

    let projectId = String(
        env.GCLOUD_PROJECT || env.GOOGLE_CLOUD_PROJECT || env.GCP_PROJECT || appOptions.projectId || ''
    ).trim();
    if (!projectId && typeof appOptions.credential?.getProjectId === 'function') {
        try {
            projectId = String(await appOptions.credential.getProjectId() || '').trim();
        } catch {
            // Keep one fail-closed domain error instead of leaking credential details.
        }
    }
    if (!projectId) throw new Error('COMMERCE_DOCUMENT_STORAGE_BUCKET_UNAVAILABLE');
    return `${projectId}.firebasestorage.app`;
}

module.exports = { resolveStorageBucketName };
