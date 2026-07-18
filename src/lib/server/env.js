import 'server-only';

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'http://localhost:3000';
const strictPublicOrigin = process.env.NEXT_STRICT_PUBLIC_ORIGIN === 'true';
const publicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'secondevienextjsssr';

const resolveSiteUrl = (value) => {
  try {
    const url = new URL(value);
    const isLocal = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
    if (strictPublicOrigin && (url.protocol !== 'https:' || isLocal)) {
      throw new Error('deployed public origin must use HTTPS and cannot be local');
    }
    url.pathname = '/';
    url.search = '';
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    throw new Error(`[env] Invalid NEXT_PUBLIC_SITE_URL "${value}": ${error.message}`);
  }
};

export const publicEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
  projectId: publicProjectId,
  appId: process.env.NEXT_PUBLIC_APP_LOGICAL_NAME || process.env.VITE_APP_LOGICAL_NAME || 'secondevie',
  catalogSnapshotBucket: process.env.CATALOG_SNAPSHOT_BUCKET || `${publicProjectId}-catalog-europe-west4`,
  siteUrl: resolveSiteUrl(rawSiteUrl),
  siteName: process.env.NEXT_PUBLIC_BRAND_NAME || process.env.VITE_BRAND_NAME || 'Seconde Vie',
  siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || process.env.VITE_SITE_DESCRIPTION || '',
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || process.env.VITE_OG_IMAGE || ''
};
