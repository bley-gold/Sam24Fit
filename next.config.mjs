const supabaseImageHosts = new Set([
  'cybjdyouocdxrcedtjkq.supabase.co',
  'noidkepohqhgdalkvzze.supabase.co',
])

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    supabaseImageHosts.add(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname)
  } catch (error) {
    console.warn('Invalid NEXT_PUBLIC_SUPABASE_URL:', error)
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: process.cwd(),

  images: {
    remotePatterns: Array.from(supabaseImageHosts, (hostname) => ({
      protocol: 'https',
      hostname,
      pathname: '/**',
    })),
    formats: ['image/webp', 'image/avif'],
  },

  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ]
  },

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

  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
}

export default nextConfig
