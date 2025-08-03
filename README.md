# Sam24Fit Gym Site

A modern gym management and payment tracking system built with Next.js, Supabase, and Tailwind CSS.

## Features

- 🏋️ Modern gym landing page
- 👤 User authentication and registration
- 📄 Receipt upload and management
- 💳 Payment tracking
- 👨‍💼 Admin dashboard
- 📱 Fully responsive design
- 🔒 Secure with Row Level Security (RLS)

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Deployment**: Netlify

## Quick Start

1. **Clone the repository**
   \`\`\`bash
   git clone https://github.com/yourusername/sam24fit-gym-site.git
   cd sam24fit-gym-site
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Set up environment variables**
   \`\`\`bash
   cp .env.example .env.local
   # Fill in your Supabase credentials
   \`\`\`

4. **Run development server**
   \`\`\`bash
   npm run dev
   \`\`\`

5. **Open [http://localhost:3000](http://localhost:3000)**

## Deployment

### Netlify Deployment

1. Push to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

### Environment Variables

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Database Setup

1. Create a new Supabase project
2. Run the SQL scripts in the `scripts/` folder in order
3. Set up storage bucket for receipts
4. Configure Row Level Security policies

## Demo Accounts

- **Admin**: admin@sam24fit.com / password
- **User**: demo@sam24fit.com / password

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.
