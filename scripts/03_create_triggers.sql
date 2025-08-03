-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_receipts_updated_at 
    BEFORE UPDATE ON receipts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at 
    BEFORE UPDATE ON payments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_membership_history_updated_at 
    BEFORE UPDATE ON membership_history 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to validate age (must be at least 15 years old)
CREATE OR REPLACE FUNCTION validate_age()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.date_of_birth > CURRENT_DATE - INTERVAL '15 years' THEN
        RAISE EXCEPTION 'User must be at least 15 years old';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create age validation trigger
CREATE TRIGGER validate_user_age 
    BEFORE INSERT OR UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION validate_age();

-- Function to set verified_date when status changes to verified
CREATE OR REPLACE FUNCTION set_verified_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'verified' AND OLD.status != 'verified' THEN
        NEW.verified_date = NOW();
    ELSIF NEW.status != 'verified' THEN
        NEW.verified_date = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create verified date trigger
CREATE TRIGGER set_receipt_verified_date 
    BEFORE UPDATE ON receipts 
    FOR EACH ROW EXECUTE FUNCTION set_verified_date();
