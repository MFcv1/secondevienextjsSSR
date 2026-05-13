import 'server-only';

export const publicEnv = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '',
  appId: process.env.NEXT_PUBLIC_APP_LOGICAL_NAME || process.env.VITE_APP_LOGICAL_NAME || 'secondevie',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || process.env.VITE_SITE_URL || 'http://localhost:3000',
  siteName: process.env.NEXT_PUBLIC_BRAND_NAME || process.env.VITE_BRAND_NAME || 'Seconde Vie',
  siteDescription: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || process.env.VITE_SITE_DESCRIPTION || '',
  ogImage: process.env.NEXT_PUBLIC_OG_IMAGE || process.env.VITE_OG_IMAGE || ''
};

export const publicCatalogUrl = (params = '') => {
  if (!publicEnv.projectId) return '';
  const query = params ? (params.startsWith('?') ? params : `?${params}`) : '';
  return `https://us-central1-${publicEnv.projectId}.cloudfunctions.net/publicCatalog${query}`;
};
