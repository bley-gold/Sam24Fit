-- This function checks if the current authenticated user has the 'admin' role.
-- It is a SECURITY DEFINER function, meaning it runs with the privileges of the user
-- who created it (e.g., 'supabase_admin'), allowing it to bypass RLS when querying
-- the 'public.users' table to determine the role. This prevents RLS recursion.

CREATE OR REPLACE FUNCTION public.is_admin_rls()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: This makes the function run with the privileges of the defining user
AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin');
END;
$$;

-- Grant execute permission to authenticated users so they can call this function
GRANT EXECUTE ON FUNCTION public.is_admin_rls() TO authenticated;
