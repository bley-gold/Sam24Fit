-- Insert demo receipts
INSERT INTO receipts (
    user_id,
    filename,
    file_url,
    amount,
    description,
    status,
    upload_date
) VALUES 
(
    'some-user-id-from-supabase-auth',
    'gym-payment-jan.jpg',
    'https://example.com/receipts/gym-payment-jan.jpg',
    120.00,
    'Monthly membership fee - January 2024',
    'verified',
    '2024-01-15 10:30:00'
),
(
    'some-user-id-from-supabase-auth',
    'membership-fee-dec.pdf',
    'https://example.com/receipts/membership-fee-dec.pdf',
    120.00,
    'Monthly membership fee - December 2023',
    'pending',
    '2023-12-15 14:20:00'
);

-- Insert demo payments
INSERT INTO payments (
    user_id,
    amount,
    payment_type,
    payment_date,
    month_year,
    status
) VALUES 
(
    'some-user-id-from-supabase-auth',
    50.00,
    'joining_fee',
    '2023-12-01',
    NULL,
    'completed'
),
(
    'some-user-id-from-supabase-auth',
    120.00,
    'membership',
    '2024-01-01',
    '2024-01',
    'completed'
);

-- Insert demo membership history
INSERT INTO membership_history (
    user_id,
    start_date,
    status,
    monthly_fee
) VALUES (
    'some-user-id-from-supabase-auth',
    '2023-12-01',
    'active',
    120.00
);
