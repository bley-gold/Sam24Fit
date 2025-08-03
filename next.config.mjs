/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  swcMinify: true,
  
  // Image optimization
  images: {
    domains: ['cybjdyouocdxrcedtjkq.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    unoptimized: true,
  },
  
  // Disable static optimization for pages that use Supabase
  // This prevents build-time errors when environment variables aren't available
  output: 'standalone',
  
  
  // Redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ]
  },
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  
  // ESLint and TypeScript configurations
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
