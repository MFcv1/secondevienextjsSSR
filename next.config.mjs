/** @type {import('next').NextConfig} */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://js.stripe.com https://*.js.stripe.com https://m.stripe.network https://www.recaptcha.net",
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://storage.googleapis.com https://*.firebasestorage.app https://images.unsplash.com https://www.google.com https://www.gstatic.com https://*.stripe.com https://www.transparenttextures.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://content-firebaseappcheck.googleapis.com https://api.stripe.com https://maps.googleapis.com https://www.google.com https://www.recaptcha.net https://recaptchaenterprise.googleapis.com",
  "frame-src https://accounts.google.com https://checkout.stripe.com https://js.stripe.com https://*.js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net",
  "form-action 'self' https://checkout.stripe.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests"
].join('; ');

const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Permitted-Cross-Domain-Policies', value: 'none' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Cross-Origin-Resource-Policy', value: 'same-site' },
  { key: 'Origin-Agent-Cluster', value: '?1' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  ...(process.env.NODE_ENV === 'production'
    ? [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
    ]
    : [])
];

const deploymentId = process.env.NEXT_DEPLOYMENT_ID?.trim();

const privateSurfaceHeaders = [
  { key: 'Cache-Control', value: 'private, no-store, max-age=0' },
  { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
];

const privateSurfaceSources = [
  '/admin/:path*',
  '/checkout/:path*',
  '/wishlist/:path*',
  '/mes-commandes/:path*',
  '/payer/:path*',
  '/api/admin/:path*',
  '/api/revalidate-catalog',
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  expireTime: 300,
  ...(deploymentId ? { deploymentId } : {}),
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      ...privateSurfaceSources.map((source) => ({ source, headers: privateSurfaceHeaders })),
    ];
  },
  async redirects() {
    return [
      {
        source: '/categorie/deco',
        destination: '/categorie/decorations',
        permanent: true,
      },
      {
        source: '/',
        has: [
          {
            type: 'query',
            key: 'page',
            value: 'gallery',
          },
        ],
        destination: '/galerie',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
