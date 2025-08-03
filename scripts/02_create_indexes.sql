-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_membership_status ON users(membership_status);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_receipts_user_id ON receipts(user_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipts_upload_date ON receipts(upload_date);
CREATE INDEX idx_receipts_verified_by ON receipts(verified_by);

CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_payment_type ON payments(payment_type);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_month_year ON payments(month_year);
CREATE INDEX idx_payments_status ON payments(status);

CREATE INDEX idx_membership_history_user_id ON membership_history(user_id);
CREATE INDEX idx_membership_history_status ON membership_history(status);
CREATE INDEX idx_membership_history_dates ON membership_history(start_date, end_date);

CREATE INDEX idx_admin_logs_admin_id ON admin_logs(admin_id);
CREATE INDEX idx_admin_logs_target ON admin_logs(target_type, target_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
