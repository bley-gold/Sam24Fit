/*
  # Add payment-related database functions

  1. Functions
    - `get_total_verified_revenue()` - Get total revenue from verified receipts
    - `get_current_month_revenue()` - Get current month revenue
    - `create_payment_record()` - Safely create payment records
    - `cleanup_old_receipts()` - Clean up old receipt files

  2. Security
    - All functions use SECURITY DEFINER for admin access
    - Functions validate input parameters
*/

-- Function to get total verified revenue
CREATE OR REPLACE FUNCTION get_total_verified_revenue()
RETURNS NUMERIC AS $$
DECLARE
    total_revenue NUMERIC;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO total_revenue
    FROM receipts 
    WHERE status = 'verified';
    
    RETURN total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current month revenue
CREATE OR REPLACE FUNCTION get_current_month_revenue()
RETURNS NUMERIC AS $$
DECLARE
    current_month_revenue NUMERIC;
    current_month_year TEXT;
BEGIN
    current_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    SELECT COALESCE(SUM(amount), 0) INTO current_month_revenue
    FROM payments 
    WHERE status = 'completed' 
        AND payment_type = 'membership'
        AND month_year = current_month_year;
    
    RETURN current_month_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely create payment records
CREATE OR REPLACE FUNCTION create_payment_record(
    p_user_id UUID,
    p_amount NUMERIC,
    p_receipt_id UUID,
    p_payment_type TEXT DEFAULT 'membership'
)
RETURNS UUID AS $$
DECLARE
    payment_uuid UUID;
    target_month_year TEXT;
BEGIN
    -- Validate input
    IF p_user_id IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION 'Invalid payment parameters';
    END IF;
    
    -- Determine month_year for membership payments
    IF p_payment_type = 'membership' THEN
        target_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    ELSE
        target_month_year := NULL;
    END IF;
    
    -- Create payment record
    INSERT INTO payments (
        user_id,
        receipt_id,
        amount,
        payment_type,
        payment_date,
        month_year,
        status
    ) VALUES (
        p_user_id,
        p_receipt_id,
        p_amount,
        p_payment_type,
        CURRENT_DATE,
        target_month_year,
        'completed'
    ) RETURNING id INTO payment_uuid;
    
    -- Update user's last payment date
    UPDATE users 
    SET last_payment_date = CURRENT_DATE,
        updated_at = NOW()
    WHERE id = p_user_id;
    
    RETURN payment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up old receipts (admin utility)
CREATE OR REPLACE FUNCTION cleanup_old_receipts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete receipts older than 2 years that are rejected
    DELETE FROM receipts 
    WHERE status = 'rejected' 
        AND upload_date < CURRENT_DATE - INTERVAL '2 years';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;