/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for production
  swcMinify: true,

  // Image optimization for Vercel
  images: {
    // IMPORTANT: Replace 'cybjdyouocdxrcedtjkq.supabase.co' with YOUR ACTUAL Supabase Project URL
    // You can find this in your Supabase Dashboard -> Project Settings -> API -> Project URL
    domains: (() => {
      const domains = [];
      
      // Extract domain from NEXT_PUBLIC_SUPABASE_URL if available
      if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
        try {
          const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
          domains.push(url.hostname);
        } catch (error) {
          console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL:', error);
        }
      }
      
      // Fallback domains for common Supabase patterns (in case env var is not available during build)
      domains.push('*.supabase.co');
      
      return domains;
    })(),
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

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
