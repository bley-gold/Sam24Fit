-- This script should be run in the Supabase Dashboard, not SQL Editor
-- Go to Storage > Create Bucket instead

-- If you need to run via SQL, use this approach:
-- First, create the bucket via Supabase Dashboard UI:
-- 1. Go to Storage in your Supabase dashboard
-- 2. Click "Create Bucket"
-- 3. Name: "receipts"
-- 4. Set to Public: Yes
-- 5. Click Create

-- Then run these policies (these should work):

-- Enable RLS on storage.objects (may already be enabled)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create policies for the receipts bucket
CREATE POLICY "Give users authenticated access to own folder" ON storage.objects
FOR ALL USING (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Give users authenticated access to own folder for insert" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Allow public read access to receipts" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');

-- Admin access policy - UPDATED to use is_admin_rls()
CREATE POLICY "Give admins full access to receipts" ON storage.objects
FOR ALL USING (
  bucket_id = 'receipts'
  AND public.is_admin_rls() -- Use the helper function to avoid recursion
);
