# Sam24Fit Payment Gateway

This is a gym payment gateway web application built with Next.js, Supabase, and Tailwind CSS. It allows users to manage their gym payments, upload receipts, and view their membership status.

## Features

- User authentication (Sign up, Sign in, Sign out)
- User profile management with profile picture upload
- Receipt upload and tracking
- Membership status display
- Admin dashboard (future expansion)
- Responsive design

## Technologies Used

- **Next.js 14+**: React framework for building full-stack web applications.
- **React**: JavaScript library for building user interfaces.
- **Supabase**: Open-source Firebase alternative for database, authentication, and storage.
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development.
- **shadcn/ui**: Reusable UI components built with Radix UI and Tailwind CSS.
- **Lucide React**: Beautifully simple and customizable open-source icons.

## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

- Node.js (v18.x or higher)
- npm or yarn
- Git
- A Supabase project

### 1. Clone the Repository

\`\`\`bash
git clone https://github.com/your-username/sam24fit-payment-app.git
cd sam24fit-payment-app
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
# or
yarn install
\`\`\`

### 3. Set up Supabase

#### a. Create a Supabase Project
If you don't have one, create a new project on [Supabase](https://supabase.com/).

#### b. Get Your Supabase Credentials
Navigate to your Supabase project settings:
- **Project Settings > API**: Copy your `Project URL` and `anon public` key.
- **Project Settings > API**: Copy your `service_role` key (this is a secret key, keep it secure).

#### c. Configure Environment Variables
Create a `.env.local` file in the root of your project and add your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=YOUR_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY

# For local development, this can be localhost
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`
**Replace `YOUR_SUPABASE_URL`, `YOUR_SUPABASE_ANON_KEY`, and `YOUR_SUPABASE_SERVICE_ROLE_KEY` with your actual keys.**

#### d. Run SQL Scripts
Go to your Supabase Dashboard, navigate to **SQL Editor**, and run the SQL scripts located in the `scripts/` directory of this project. **Run them in the following order:**

1.  `01_create_tables.sql`
2.  `02_create_indexes.sql`
3.  `03_create_triggers.sql`
4.  `09_create_rls_helper_functions.sql` (Crucial for RLS and server actions)
5.  `04_create_rls_policies.sql` (Updated to use the RLS helper function)
6.  `06_create_functions.sql`
7.  `07_storage_policies.sql` (Updated to use the RLS helper function)
8.  `05_seed_data.sql` (Optional: Only run this if you want to populate with demo data. **Remember to replace `some-user-id-from-supabase-auth` with an actual user ID from your `auth.users` table if you use it.**)

#### e. Create Storage Bucket
In your Supabase Dashboard, go to **Storage**.
- Click **"Create Bucket"**.
- Name it `receipts` (must be exactly this, lowercase).
- Set it to **Public**.
- Set a file size limit (e.g., 10MB).
- You can leave allowed MIME types empty or specify `image/jpeg, image/png, application/pdf`.

#### f. Configure Authentication Settings
In your Supabase Dashboard, go to **Authentication > Settings**.
- Set **Site URL** to `http://localhost:3000`.
- Add `http://localhost:3000/auth` and `http://localhost:3000/dashboard` to **Redirect URLs**.

### 4. Run the Development Server

\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Test Environment Variables

On the login/signup page (`/auth`), click the "Test Environment Variables" button. Check your terminal where the development server is running for the output. It should show that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present.

### 6. Sign Up and Log In

- Navigate to the `/auth` page.
- Try signing up a new user, ensuring you upload a profile picture.
- After successful signup (and email verification if enabled in Supabase Auth settings), try logging in. You should be redirected to the dashboard.

## Deployment

For deployment to Vercel, refer to the `UPDATED_DEPLOYMENT_GUIDE.md` file for detailed instructions on setting up environment variables and other configurations.

## Project Structure

\`\`\`
.
├── app/
│   ├── actions/
│   │   ├── profile-actions.ts  # Server actions for fetching user profiles (bypasses RLS)
│   │   ├── test-env-action.ts  # Server action to test environment variables
│   │   └── user-actions.ts     # Server action for creating user profiles (handles profile picture upload)
│   ├── admin/
│   │   └── page.tsx            # Admin dashboard page
│   ├── auth/
│   │   └── page.tsx            # Login and Signup page
│   ├── dashboard/
│   │   └── page.tsx            # User dashboard page
│   ├── upload/
│   │   └── page.tsx            # Receipt upload page
│   ├── globals.css             # Global CSS styles
│   └── layout.tsx              # Root layout for the application
├── components/
│   ├── ui/                     # shadcn/ui components
│   │   ├── ...                 # (e.g., button.tsx, card.tsx, input.tsx, etc.)
│   │   ├── auth-provider.tsx   # React Context provider for authentication state
│   │   ├── loading-spinner.tsx # Custom loading spinner component
│   │   ├── membership-form.tsx # Form for membership details
│   │   ├── toaster.tsx         # shadcn/ui Toaster component
│   │   └── toast.tsx           # shadcn/ui Toast component
│   ├── gym-registration.tsx    # Main registration component
│   └── search-form.tsx         # Search form component
├── hooks/
│   ├── useAuth.ts              # Custom hook for authentication state
│   └── use-toast.ts            # shadcn/ui useToast hook
├── lib/
│   ├── auth.ts                 # Authentication functions (sign up, sign in, sign out, get current user)
│   ├── constants.ts            # Application constants
│   ├── storage.ts              # Supabase Storage utility functions
│   └── supabase.ts             # Supabase client initialization and types
├── public/                     # Static assets
│   └── placeholder.svg
├── scripts/                    # SQL scripts for Supabase database setup
│   ├── 01_create_tables.sql
│   ├── 02_create_indexes.sql
│   ├── 03_create_triggers.sql
│   ├── 04_create_rls_policies.sql
│   ├── 05_seed_data.sql
│   ├── 06_create_functions.sql
│   ├── 07_storage_policies.sql
│   ├── 08_create_storage_bucket.sql (Deprecated, manual creation recommended)
│   ├── 08_create_storage_bucket_fixed.sql (Deprecated, manual creation recommended)
│   ├── 09_create_rls_helper_functions.sql
│   ├── fix_password_hash_nullable.sql
│   └── update-receipts-bucket-settings.js
├── .env.example                 # Example environment variables
├── .env.local                   # Local environment variables (ignored by Git)
├── .env.vercel                  # Vercel environment variables (for deployment)
├── BUILD_FIX_GUIDE.md           # Guide for build issues
├── DEPLOYMENT_GUIDE.md          # Old deployment guide
├── next.config.mjs              # Next.js configuration
├── package.json                 # Project dependencies and scripts
├── STORAGE_SETUP_GUIDE.md       # Old storage setup guide
├── tsconfig.json                # TypeScript configuration
└── UPDATED_DEPLOYMENT_GUIDE.md  # Updated deployment guide for Vercel
