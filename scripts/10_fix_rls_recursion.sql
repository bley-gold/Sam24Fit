-- First, let's drop all existing policies on the users table to start fresh
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can update all profiles" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- Create a simpler, non-recursive policy structure
-- Policy 1: Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 2: Users can view their own profile (using auth.uid() directly to avoid recursion)
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy 3: Users can update their own profile (using auth.uid() directly)
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Admins can view all profiles (simplified check)
CREATE POLICY "Admins can view all profiles" ON users
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- Policy 5: Admins can update all profiles (simplified check)
CREATE POLICY "Admins can update all profiles" ON users
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin'
  )
);

-- Policy 6: Admins can delete users (simplified check)
CREATE POLICY "Admins can delete users" ON users
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM users admin_user 
    WHERE admin_user.id = auth.uid() 
    AND admin_user.role = 'admin'
  )
);
