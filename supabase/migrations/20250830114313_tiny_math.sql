/*
  # Add missing columns to users table

  1. New Columns
    - `id_number` (text) - For ID number or passport
    - `accepted_terms` (boolean) - Track if user accepted terms
    - `password_hash` (text, nullable) - For compatibility
    - `last_payment_date` (date, nullable) - Track last payment

  2. Updates
    - Make date_of_birth nullable for compatibility
    - Make gender nullable for compatibility
*/

-- Add missing columns to users table
DO $$
BEGIN
  -- Add id_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'id_number'
  ) THEN
    ALTER TABLE users ADD COLUMN id_number TEXT;
  END IF;

  -- Add accepted_terms column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'accepted_terms'
  ) THEN
    ALTER TABLE users ADD COLUMN accepted_terms BOOLEAN DEFAULT TRUE;
  END IF;

  -- Add password_hash column if it doesn't exist (nullable)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
  END IF;

  -- Add last_payment_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'last_payment_date'
  ) THEN
    ALTER TABLE users ADD COLUMN last_payment_date DATE;
  END IF;
END $$;

-- Make date_of_birth nullable for compatibility
ALTER TABLE users ALTER COLUMN date_of_birth DROP NOT NULL;

-- Make gender nullable for compatibility  
ALTER TABLE users ALTER COLUMN gender DROP NOT NULL;