# 🚀 Sam24Fit Deployment Guide - Updated

## 📋 Pre-Deployment Checklist

### 1. Supabase Database Setup ✅
Run these SQL scripts in your Supabase SQL Editor **in order**:

1. ✅ `scripts/01_create_tables.sql` - Creates all database tables
2. ✅ `scripts/02_create_indexes.sql` - Adds performance indexes  
3. ✅ `scripts/03_create_triggers.sql` - Sets up automated triggers
4. ✅ `scripts/04_create_rls_policies.sql` - Configures security policies
5. ✅ `scripts/05_seed_data.sql` - Adds demo data
6. ✅ `scripts/06_create_functions.sql` - Creates utility functions
7. ✅ `scripts/07_storage_policies.sql` - Sets up file storage policies

### 2. ⚠️ Storage Setup (MANUAL REQUIRED)
**Skip script 08** - Follow these manual steps instead:

#### Create Storage Bucket:
1. Go to Supabase Dashboard → **Storage**
2. Click **"Create Bucket"**
3. Name: `receipts`
4. Public: ✅ **Yes** (important!)
5. Click **"Create Bucket"**

#### Verify Settings:
- Bucket name: `receipts`
- Public access: ✅ Enabled
- File size limit: 10MB

### 3. Authentication Settings
1. Go to Supabase Dashboard → **Authentication** → **Settings**
2. Set **Site URL** to: `https://your-netlify-domain.netlify.app`
3. Add **Redirect URLs**:
   - `https://your-netlify-domain.netlify.app/auth`
   - `https://your-netlify-domain.netlify.app/dashboard`

## 🌐 Netlify Deployment Steps

### Step 1: Push to GitHub
\`\`\`bash
git init
git add .
git commit -m "Sam24Fit - Production Ready"
git branch -M main
git remote add origin https://github.com/yourusername/sam24fit-gym-site.git
git push -u origin main
\`\`\`

### Step 2: Deploy on Netlify
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
\`\`\`

### Step 4: Deploy & Update URLs
1. Click "Deploy site"
2. Copy your Netlify URL (e.g., `https://amazing-name-123.netlify.app`)
3. Go back to Supabase → Authentication → Settings
4. Update **Site URL** with your actual Netlify URL

## ✅ Final Checklist

### Database Setup:
- [ ] All SQL scripts 1-7 executed successfully
- [ ] Demo users created (admin@sam24fit.com, demo@sam24fit.com)

### Storage Setup:
- [ ] `receipts` bucket created manually
- [ ] Bucket set to **Public**
- [ ] Can upload test files

### Deployment:
- [ ] Code pushed to GitHub
- [ ] Netlify connected to repository
- [ ] Environment variables added
- [ ] Site deployed successfully
- [ ] Supabase URLs updated with Netlify domain

### Testing:
- [ ] Landing page loads
- [ ] User registration works
- [ ] File upload works
- [ ] Admin dashboard accessible

## 🎉 You're Live!

Your Sam24Fit gym site should now be fully functional!

**Demo Accounts:**
- Admin: admin@sam24fit.com / password
- User: demo@sam24fit.com / password

## 🔧 Troubleshooting

**File Upload Issues:**
- Ensure `receipts` bucket exists and is **Public**
- Check browser console for CORS errors
- Verify file size is under 10MB

**Authentication Issues:**
- Check Site URL matches your Netlify domain exactly
- Ensure redirect URLs are correct

**Build Failures:**
- Verify all environment variables are set
- Check for typos in variable names
