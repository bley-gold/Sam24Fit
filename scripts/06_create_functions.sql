-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS TABLE (
    total_users BIGINT,
    active_members BIGINT,
    pending_receipts BIGINT,
    total_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM users WHERE role = 'user') as total_users,
        (SELECT COUNT(*) FROM users WHERE role = 'user' AND membership_status = 'active') as active_members,
        (SELECT COUNT(*) FROM receipts WHERE status = 'pending') as pending_receipts,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE status = 'completed') as total_revenue;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue(target_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE))
RETURNS TABLE (
    month_year TEXT,
    revenue NUMERIC,
    payment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.month_year,
        SUM(p.amount) as revenue,
        COUNT(*) as payment_count
    FROM payments p
    WHERE p.status = 'completed' 
        AND p.payment_type = 'membership'
        AND p.month_year LIKE (target_year::TEXT || '-%')
    GROUP BY p.month_year
    ORDER BY p.month_year;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has paid for current month
CREATE OR REPLACE FUNCTION has_paid_current_month(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_month_year TEXT;
    payment_exists BOOLEAN;
BEGIN
    current_month_year := TO_CHAR(CURRENT_DATE, 'YYYY-MM');
    
    SELECT EXISTS(
        SELECT 1 FROM payments 
        WHERE user_id = user_uuid 
            AND payment_type = 'membership'
            AND month_year = current_month_year
            AND status = 'completed'
    ) INTO payment_exists;
    
    RETURN payment_exists;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create payment from verified receipt
CREATE OR REPLACE FUNCTION create_payment_from_receipt(receipt_uuid UUID)
RETURNS UUID AS $$
DECLARE
    receipt_record receipts%ROWTYPE;
    payment_uuid UUID;
    target_month_year TEXT;
BEGIN
    -- Get receipt details
    SELECT * INTO receipt_record FROM receipts WHERE id = receipt_uuid;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Receipt not found';
    END IF;
    
    IF receipt_record.status != 'verified' THEN
        RAISE EXCEPTION 'Receipt must be verified to create payment';
    END IF;
    
    -- Determine month_year based on upload date
    target_month_year := TO_CHAR(receipt_record.upload_date, 'YYYY-MM');
    
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
        receipt_record.user_id,
        receipt_uuid,
        receipt_record.amount,
        CASE 
            WHEN receipt_record.amount = 50 THEN 'joining_fee'
            WHEN receipt_record.amount = 120 THEN 'membership'
            ELSE 'other'
        END,
        receipt_record.upload_date::DATE,
        CASE 
            WHEN receipt_record.amount = 120 THEN target_month_year
            ELSE NULL
        END,
        'completed'
    ) RETURNING id INTO payment_uuid;
    
    RETURN payment_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
