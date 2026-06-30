import { publicEnv } from '../src/lib/server/env';

export const dynamic = 'force-static';

export default function robots() {
  const siteUrl = publicEnv.siteUrl.replace(/\/$/, '');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin']
    },
    sitemap: `${siteUrl}/sitemap.xml`
  };
}
