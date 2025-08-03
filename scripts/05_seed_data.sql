-- Insert demo admin user
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    date_of_birth,
    gender,
    street_address,
    emergency_contact_name,
    emergency_contact_number,
    role,
    joining_fee_paid
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'admin@sam24fit.com',
    '$2b$10$rQZ8kJZjZjZjZjZjZjZjZu', -- This should be properly hashed in production
    'Sam24Fit Admin',
    '+27 67 993 4104',
    '1990-01-01',
    'other',
    '438 De Kock St, Sunnyside, Pretoria, 0002',
    'Emergency Contact',
    '+27 67 993 4105',
    'admin',
    true
);

-- Insert demo regular user
INSERT INTO users (
    id,
    email,
    password_hash,
    full_name,
    phone,
    date_of_birth,
    gender,
    street_address,
    emergency_contact_name,
    emergency_contact_number,
    role,
    joining_fee_paid
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'demo@sam24fit.com',
    '$2b$10$rQZ8kJZjZjZjZjZjZjZjZu', -- This should be properly hashed in production
    'Demo User',
    '+27 67 993 4106',
    '1995-06-15',
    'male',
    '123 Main Street, Pretoria, 0001',
    'John Doe',
    '+27 67 993 4107',
    'user',
    true
);

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
    '550e8400-e29b-41d4-a716-446655440001',
    'gym-payment-jan.jpg',
    'https://example.com/receipts/gym-payment-jan.jpg',
    120.00,
    'Monthly membership fee - January 2024',
    'verified',
    '2024-01-15 10:30:00'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
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
    '550e8400-e29b-41d4-a716-446655440001',
    50.00,
    'joining_fee',
    '2023-12-01',
    NULL,
    'completed'
),
(
    '550e8400-e29b-41d4-a716-446655440001',
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
    '550e8400-e29b-41d4-a716-446655440001',
    '2023-12-01',
    'active',
    120.00
);
