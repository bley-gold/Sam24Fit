# 📁 Storage Setup Guide - Manual Steps Required

## ⚠️ Important: Storage Bucket Must Be Created Manually

The storage bucket cannot be created via SQL due to permission restrictions. Follow these steps:

### Step 1: Create Storage Bucket (Manual)
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"Create Bucket"**
4. Enter bucket details:
   - **Name**: `receipts`
   - **Public**: ✅ **Yes** (check this box)
   - **File size limit**: 10MB
   - **Allowed MIME types**: Leave empty (allows all)
5. Click **"Create Bucket"**

### Step 2: Verify Bucket Settings
1. Click on the `receipts` bucket
2. Go to **Settings** tab
3. Ensure **Public** is enabled
4. Set **File size limit** to `10485760` (10MB in bytes)

### Step 3: Set Up Storage Policies (Optional - Auto-configured)
The storage policies are automatically handled by our application code, but if you want to set them manually:

1. Go to **Storage** → **Policies**
2. Click **"New Policy"**
3. Add these policies:

**Policy 1: User Upload Access**
\`\`\`sql
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'receipts' 
  AND auth.role() = 'authenticated' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
\`\`\`

**Policy 2: User Read Access**
\`\`\`sql
CREATE POLICY "Users can read own files" ON storage.objects
FOR SELECT USING (
  bucket_id = 'receipts' 
  AND (
    auth.role() = 'authenticated' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
);
\`\`\`

**Policy 3: Public Read Access**
\`\`\`sql
CREATE POLICY "Public read access" ON storage.objects
FOR SELECT USING (bucket_id = 'receipts');
\`\`\`

### Step 4: Test Storage
1. Try uploading a test file through the Supabase dashboard
2. Verify the file appears in the `receipts` bucket
3. Check that the file has a public URL

## ✅ Verification Checklist
- [ ] `receipts` bucket exists
- [ ] Bucket is set to **Public**
- [ ] File size limit is 10MB
- [ ] You can upload files manually
- [ ] Files have public URLs

## 🔧 Alternative: Use Supabase CLI (Advanced)
If you have Supabase CLI installed:

\`\`\`bash
# Create bucket
supabase storage create receipts --public

# Set policies
supabase storage set-policy receipts --policy-file storage-policies.sql
\`\`\`

## 🚨 Common Issues

**Issue**: "Permission denied" when creating policies
**Solution**: Use the Supabase Dashboard UI instead of SQL Editor

**Issue**: Files not uploading from app
**Solution**: Ensure bucket is set to **Public** and policies are correct

**Issue**: "Bucket not found" error
**Solution**: Double-check bucket name is exactly `receipts` (lowercase)

Once you've completed these manual steps, your storage will be fully configured! 🎉
