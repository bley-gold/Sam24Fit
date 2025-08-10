-- Make password_hash column nullable since Supabase Auth handles passwords separately
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Also add the password_hash column if it doesn't exist (just in case)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'password_hash') THEN
        ALTER TABLE users ADD COLUMN password_hash TEXT;
    END IF;
END $$;
