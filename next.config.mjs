/** @type {import('next').NextConfig} */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src 'self' 'unsafe-inline' https://apis.google.com https://www.google.com https://www.gstatic.com https://www.googletagmanager.com https://js.stripe.com https://m.stripe.network https://www.recaptcha.net",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://storage.googleapis.com https://*.firebasestorage.app https://images.unsplash.com https://www.google.com https://www.gstatic.com https://q.stripe.com https://www.transparenttextures.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.cloudfunctions.net https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebaseinstallations.googleapis.com https://content-firebaseappcheck.googleapis.com https://api.stripe.com https://maps.googleapis.com https://www.google.com https://www.recaptcha.net https://recaptchaenterprise.googleapis.com",
  "frame-src https://accounts.google.com https://checkout.stripe.com https://js.stripe.com https://hooks.stripe.com https://*.firebaseapp.com https://www.google.com https://www.recaptcha.net",
  "form-action 'self' https://checkout.stripe.com"
].join('; ');

const securityHeaders = [
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self)' },
  ...(process.env.NODE_ENV === 'production'
    ? [
      { key: 'Content-Security-Policy', value: contentSecurityPolicy },
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }
    ]
    : [])
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    qualities: [60, 70, 75, 80, 85],
    deviceSizes: [390, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [48, 64, 96, 128, 160, 256, 320, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/secondevienextjsssr.firebasestorage.app/o/furniture%2F**'
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/secondeviesandbox.firebasestorage.app/o/furniture%2F**'
      },
      { protocol: 'https', hostname: 'secondevienextjsssr.firebasestorage.app', pathname: '/furniture/**' },
      { protocol: 'https', hostname: 'secondeviesandbox.firebasestorage.app', pathname: '/furniture/**' }
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
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
