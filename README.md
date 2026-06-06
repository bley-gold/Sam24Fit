# Sam24Fit - Community Gym Membership Platform

A premium community gym membership platform built with modern web technologies.

## Project Overview

Sam24Fit is a community-focused fitness hub in Sunnyside, Pretoria, offering affordable memberships, personal guidance, and a supportive fitness community.

**Address:** 438 De Kock Street, Sunnyside, Pretoria, South Africa  
**Phone:** +27 67 993 4104  
**Email:** contact@sam24fit.co.za  
**Website:** https://sam24fit.co.za

## Features

- User authentication and profile management
- Membership registration and payment tracking
- Receipt upload and verification system
- Responsive member dashboard
- Community member showcase
- Flexible membership options

## Technologies

- **Next.js 14+** - React framework for production
- **React 18** - UI library
- **Supabase** - Backend, authentication, and storage
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Reusable component system
- **TypeScript** - Type-safe development

## Getting Started

### Prerequisites

- Node.js v18.x or higher
- npm or yarn package manager
- Git

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/bley-gold/Sam24Fit.git
   cd Sam24Fit
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

Deploy to Netlify or Vercel with environment variables configured in your hosting platform's settings.

## Support

For questions or support, reach out via:
- **WhatsApp:** +27 67 993 4104
- **Email:** contact@sam24fit.co.za

---

Built with ❤️ for the fitness community in Pretoria.
