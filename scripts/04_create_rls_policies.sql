-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on users to avoid conflicts
DROP POLICY IF EXISTS "Users can insert own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Admins can view all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;
DROP POLICY IF EXISTS "Admins can delete users" ON users;

-- New policies for 'users' table:

-- Policy 1: Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile" ON users
FOR INSERT WITH CHECK (auth.uid() = id);

-- Policy 2: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
FOR SELECT USING (auth.uid() = id);

-- Policy 3: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
FOR UPDATE USING (auth.uid() = id);

-- Policy 4: Admins can view all users
CREATE POLICY "Admins can view all users" ON users
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.users -- Explicitly use public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy 5: Admins can update all users
CREATE POLICY "Admins can update all users" ON users
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.users -- Explicitly use public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Policy 6: Admins can delete users
CREATE POLICY "Admins can delete users" ON users
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.users -- Explicitly use public.users
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Drop existing policies on receipts to avoid conflicts
DROP POLICY IF EXISTS "Users can view own receipts" ON receipts;
DROP POLICY IF EXISTS "Users can insert own receipts" ON receipts;
DROP POLICY IF EXISTS "Admins can manage all receipts" ON receipts;

-- Policies for 'receipts' table:
-- Users can only see their own receipts
CREATE POLICY "Users can view own receipts" ON receipts
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own receipts" ON receipts
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Admins can see and update all receipts
CREATE POLICY "Admins can manage all receipts" ON receipts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drop existing policies on payments to avoid conflicts
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Policies for 'payments' table:
-- Users can only see their own payments
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (user_id = auth.uid());

-- Admins can see all payments
CREATE POLICY "Admins can view all payments" ON payments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drop existing policies on membership_history to avoid conflicts
DROP POLICY IF EXISTS "Users can view own membership history" ON membership_history;
DROP POLICY IF EXISTS "Admins can view all membership history" ON membership_history;

-- Policies for 'membership_history' table:
-- Users can only see their own membership history
CREATE POLICY "Users can view own membership history" ON membership_history
    FOR SELECT USING (user_id = auth.uid());

-- Admins can see all membership history
CREATE POLICY "Admins can view all membership history" ON membership_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Drop existing policies on admin_logs to avoid conflicts
DROP POLICY IF EXISTS "Only admins can view admin logs" ON admin_logs;

-- Policies for 'admin_logs' table:
-- Only admins can view admin logs
CREATE POLICY "Only admins can view admin logs" ON admin_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
