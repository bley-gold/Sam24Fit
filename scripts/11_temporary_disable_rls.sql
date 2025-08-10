-- TEMPORARY: Disable RLS on users table for testing
-- WARNING: This removes security restrictions - only use for testing!
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- To re-enable later (after fixing policies):
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
