/**
 * HELPERS: Configuration centralisee.
 */

const APP_ID = 'secondevie';
const PRODUCT_COLLECTIONS = ['furniture'];

function getSiteUrl() {
    const configuredSiteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
    if (configuredSiteUrl) return configuredSiteUrl;

    const projectId = process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
    return projectId ? `https://${projectId}.web.app` : 'http://localhost:3000';
}

module.exports = { APP_ID, PRODUCT_COLLECTIONS, getSiteUrl };
