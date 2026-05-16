/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  }
};

export default nextConfig;
