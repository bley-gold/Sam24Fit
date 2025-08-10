# Updated Deployment Guide for Vercel

This guide provides detailed steps to deploy your Sam24Fit application to Vercel, ensuring all Supabase integrations and environment variables are correctly configured.

## Prerequisites

- A Vercel account.
- Your Sam24Fit project connected to a Git repository (GitHub, GitLab, or Bitbucket).
- Your Supabase project is fully set up as per the `README.md` and the comprehensive setup guide.

## Step 1: Connect Your Project to Vercel

1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click "Add New..." -> "Project".
3.  Select your Git repository (e.g., from GitHub).
4.  Click "Import".

## Step 2: Configure Project Settings in Vercel

After importing, Vercel will prompt you to configure your project.

### A. Build & Output Settings

-   **Framework Preset**: Next.js
-   **Root Directory**: Leave as default (usually empty, or `/` if your project is at the root of the repo).
-   **Build Command**: `next build` (default for Next.js)
-   **Output Directory**: `build` (default for Next.js)

### B. Environment Variables (CRITICAL)

This is the most important step for Supabase integration. You **must** add the following environment variables. Ensure they are available for **Production**, **Preview**, and **Development** environments.

1.  **`NEXT_PUBLIC_SUPABASE_URL`**:
    *   **Value**: Your Supabase Project URL (found in Supabase Dashboard -> Project Settings -> API).
    *   **Example**: `https://abcdefghijk.supabase.co`

2.  **`NEXT_PUBLIC_SUPABASE_ANON_KEY`**:
    *   **Value**: Your Supabase `anon public` key (found in Supabase Dashboard -> Project Settings -> API).
    *   **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprIiwicm9sZSI6ImFub24iLCJpYXQiOjEyMzQ1Njc4OTAsImV4cCI6MTIzNDU2Nzg5MH0.xyzABC123`

3.  **`SUPABASE_SERVICE_ROLE_KEY`**:
    *   **Value**: Your Supabase `service_role` key (found in Supabase Dashboard -> Project Settings -> API). **This is a secret key and should NOT be exposed on the client-side.**
    *   **Example**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFhYmMiLCJyZWYiOiJhYmNkZWZnaGlqayIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjEyMzQ1Njc4OTAsImV4cCI6MTIzNDU2Nzg5MH0.DEF456GHI`

4.  **`NEXT_PUBLIC_SITE_URL`**:
    *   **Value**: The public URL of your Vercel deployment.
    *   **For Production**: Use your custom domain if you have one (e.g., `https://www.sam24fit.com`). If not, use the Vercel default domain (e.g., `https://your-project-name.vercel.app`).
    *   **For Preview/Development**: You can use the Vercel default preview URLs or `http://localhost:3000` if you're testing locally against a deployed backend.

    **Important**: For `NEXT_PUBLIC_SITE_URL`, ensure it matches the **Site URL** you configured in your Supabase Authentication settings.

### C. Root Directory (if applicable)

If your Next.js project is not in the root of your Git repository (e.g., it's in a `frontend/` folder), you'll need to set the **Root Directory** accordingly.

### D. Deploy

Once all settings, especially environment variables, are correctly entered, click "Deploy".

## Step 3: Verify Deployment

After a successful deployment:

1.  **Visit your deployed application URL.**
2.  **Navigate to the `/auth` page.**
3.  **Click the "Test Environment Variables" button.**
    *   Check the Vercel deployment logs (in your Vercel Dashboard, go to your project -> Deployments -> select the latest deployment -> Logs tab).
    *   You should see the `console.log` output from `test-env-action.ts` confirming that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present.
4.  **Attempt to sign up a new user** (with a profile picture).
5.  **Attempt to log in with the new user.**

If everything is configured correctly, you should experience smooth authentication, profile picture uploads, and redirection to the dashboard.

## Troubleshooting Deployment Issues

-   **"Supabase URL or Service Role Key is not configured for server actions"**: Double-check that `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correctly set in Vercel environment variables for all relevant environments (Production, Preview, Development).
-   **Image not showing**:
    -   Ensure your `receipts` storage bucket in Supabase is set to **Public**.
    -   Verify that the `domains` array in `next.config.mjs` includes your Supabase project URL (e.g., `cybjdyouocdxrcedtjkq.supabase.co`).
    -   Check the browser console for any CORS errors related to image loading.
-   **Redirect issues**: Ensure your **Site URL** and **Redirect URLs** in Supabase Authentication settings match your deployed Vercel URLs.
-   **RLS errors**: Re-verify that all RLS policies and the `is_admin_rls()` helper function are correctly applied in your Supabase SQL Editor.

If you encounter persistent issues, check the Vercel deployment logs for more detailed error messages.
