-- This script should be run AFTER you manually create the 'profile-pictures' bucket in Supabase Dashboard.

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies for 'profile-pictures' bucket if they exist
DROP POLICY IF EXISTS "Users can upload profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete profile pictures" ON storage.objects;

-- Policy 1: Users can upload profile pictures to their own folder
CREATE POLICY "Users can upload profile pictures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own profile pictures
CREATE POLICY "Users can view own profile pictures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Admins can view all profile pictures
CREATE POLICY "Admins can view all profile pictures" -- Corrected: Added missing CREATE POLICY statement
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  public.is_admin_rls() -- Use the helper function to avoid recursion
);

-- Policy 4: Users can update their own profile pictures
CREATE POLICY "Users can update own profile pictures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 5: Users can delete their own profile pictures
CREATE POLICY "Users can delete own profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: Admins can delete any profile pictures
CREATE POLICY "Admins can delete profile pictures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND
  public.is_admin_rls()
);
