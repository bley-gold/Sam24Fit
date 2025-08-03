-- Create storage bucket for receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', true);

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own receipts" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all receipts" ON storage.objects;
DROP POLICY IF EXISTS "Public can view receipts" ON storage.objects;

-- Policy 1: Users can upload receipts to their own folder
CREATE POLICY "Users can upload receipts" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 2: Users can view their own receipts
CREATE POLICY "Users can view own receipts" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 3: Admins can view all receipts
CREATE POLICY "Admins can view all receipts" 
ON storage.objects 
FOR SELECT 
TO authenticated
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy 4: Public can view receipts (for display purposes)
CREATE POLICY "Public can view receipts" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'receipts');

-- Policy 5: Users can update their own receipts
CREATE POLICY "Users can update own receipts" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 6: Users can delete their own receipts
CREATE POLICY "Users can delete own receipts" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'receipts' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy 7: Admins can delete any receipts
CREATE POLICY "Admins can delete receipts" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'receipts' AND
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
