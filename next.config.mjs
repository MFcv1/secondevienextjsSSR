/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 480, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [48, 64, 96, 128, 160, 256, 320, 384],
    minimumCacheTTL: 86400,
    dangerouslyAllowSVG: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/secondevienextjsssr.firebasestorage.app/o/**'
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/v0/b/secondeviesandbox.firebasestorage.app/o/**'
      },
      { protocol: 'https', hostname: 'secondevienextjsssr.firebasestorage.app', pathname: '/**' },
      { protocol: 'https', hostname: 'secondeviesandbox.firebasestorage.app', pathname: '/**' }
    ]
  },
  experimental: {
    optimizePackageImports: ['lucide-react']
  }
};

export default nextConfig;
