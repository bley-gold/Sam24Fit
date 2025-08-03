# 🚀 Sam24Fit Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Supabase Setup ✅
Your Supabase project is configured with:
- **Project URL**: `https://cybjdyouocdxrcedtjkq.supabase.co`
- **Anon Key**: Configured ✅
- **Service Role Key**: Configured ✅

### 2. Database Setup
Run these SQL scripts in your Supabase SQL Editor **in order**:

1. `scripts/01_create_tables.sql` - Creates all database tables
2. `scripts/02_create_indexes.sql` - Adds performance indexes
3. `scripts/03_create_triggers.sql` - Sets up automated triggers
4. `scripts/04_create_rls_policies.sql` - Configures security policies
5. `scripts/05_seed_data.sql` - Adds demo data
6. `scripts/06_create_functions.sql` - Creates utility functions
7. `scripts/07_storage_policies.sql` - Sets up file storage policies
8. `scripts/08_create_storage_bucket.sql` - Creates storage bucket

### 3. Storage Configuration
1. Go to Supabase Dashboard → Storage
2. Verify `receipts` bucket exists
3. Make sure it's set to **public**

### 4. Authentication Settings
1. Go to Supabase Dashboard → Authentication → Settings
2. Set **Site URL** to: `https://your-netlify-domain.netlify.app`
3. Add **Redirect URLs**:
   - `https://your-netlify-domain.netlify.app/auth`
   - `https://your-netlify-domain.netlify.app/dashboard`

## 🌐 Netlify Deployment Steps

### Step 1: Push to GitHub
\`\`\`bash
git init
git add .
git commit -m "Initial commit - Sam24Fit Production Ready"
git branch -M main
git remote add origin https://github.com/yourusername/sam24fit-gym-site.git
git push -u origin main
\`\`\`

### Step 2: Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Choose GitHub and select your repository
4. Build settings are auto-configured via `netlify.toml`

### Step 3: Environment Variables
Add these in Netlify Dashboard → Site Settings → Environment Variables:

\`\`\`
NEXT_PUBLIC_SUPABASE_URL=https://cybjdyouocdxrcedtjkq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmpkeW91b2NkeHJjZWR0amtxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDk5MzYsImV4cCI6MjA2OTUyNTkzNn0.r9IKLpAOd74eeoyXRk5kDgAxVA4Pd-E0qL1TtR053eA
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5YmpkeW91b2NkeHJjZWR0amtxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0OTkzNiwiZXhwIjoyMDY5NTI1OTM2fQ.vvDIsj14Ii6xKyNS0EpWRTjGdhZtEBwwwoXuUctTlxA
NEXT_PUBLIC_SITE_URL=https://your-netlify-domain.netlify.app
\`\`\`

### Step 4: Deploy
1. Click "Deploy site"
2. Wait for build to complete
3. Your site will be live at `https://random-name.netlify.app`

### Step 5: Update Supabase URLs
1. Copy your Netlify URL
2. Go back to Supabase → Authentication → Settings
3. Update **Site URL** with your actual Netlify URL
4. Update **Redirect URLs** with your actual domain

## 🧪 Testing Checklist

After deployment, test these features:

### ✅ Landing Page
- [ ] Page loads correctly
- [ ] All images display
- [ ] Navigation works
- [ ] Responsive on mobile

### ✅ Authentication
- [ ] Sign up form works
- [ ] Profile picture upload works
- [ ] Age validation works (try under 15)
- [ ] Login works
- [ ] Logout works

### ✅ Dashboard
- [ ] User dashboard loads
- [ ] Account info displays
- [ ] Quick actions work

### ✅ Receipt Upload
- [ ] File upload works
- [ ] File validation works (try wrong file type)
- [ ] Amount validation works
- [ ] Success message shows

### ✅ Admin Features
- [ ] Admin login works (admin@sam24fit.com)
- [ ] Admin can see all receipts
- [ ] Admin can verify/reject receipts

## 🔧 Troubleshooting

### Common Issues:

**Build Fails:**
- Check environment variables are set correctly
- Verify all dependencies are in package.json

**Authentication Not Working:**
- Check Supabase Site URL matches your Netlify domain
- Verify redirect URLs are correct

**File Upload Fails:**
- Check storage bucket exists and is public
- Verify storage policies are set up correctly

**Database Errors:**
- Ensure all SQL scripts ran successfully
- Check RLS policies are enabled

## 🎉 Success!

Your Sam24Fit gym site should now be fully functional at your Netlify URL!

### Demo Accounts:
- **Admin**: admin@sam24fit.com / password
- **User**: demo@sam24fit.com / password

### Next Steps:
1. Set up custom domain
2. Configure analytics
3. Set up monitoring
4. Add SSL certificate (automatic with Netlify)
