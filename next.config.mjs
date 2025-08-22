/** @type {import('next').NextConfig} */
const nextConfig = {
// Optimize for production
swcMinify: true,

// Image optimization for Vercel
images: {
  // IMPORTANT: Replace 'cybjdyouocdxrcedtjkq.supabase.co' with YOUR ACTUAL Supabase Project URL
  // You can find this in your Supabase Dashboard -> Project Settings -> API -> Project URL
  domains: ['https://noidkepohqhgdalkvzze.supabase.co'], 
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
