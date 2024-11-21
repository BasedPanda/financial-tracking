BEGIN;

-- Insert test goals for Test User
INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES
    ('u0a80121-1234-4321-a123-111111111111',
    'Emergency Fund', 10000.00, 5000.00,
    CURRENT_DATE + INTERVAL '6 months'),
    
    ('u0a80121-1234-4321-a123-111111111111',
    'New Car', 25000.00, 8000.00,
    CURRENT_DATE + INTERVAL '1 year'),
    
    ('u0a80121-1234-4321-a123-111111111111',
    'Vacation', 3000.00, 1500.00,
    CURRENT_DATE + INTERVAL '3 months');

-- Insert test goals for Demo User
INSERT INTO goals (user_id, name, target_amount, current_amount, deadline) VALUES
    ('u0a80121-1234-4321-a123-222222222222',
    'Home Down Payment', 50000.00, 20000.00,
    CURRENT_DATE + INTERVAL '2 years'),
    
    ('u0a80121-1234-4321-a123-222222222222',
    'Wedding Fund', 15000.00, 5000.00,
    CURRENT_DATE + INTERVAL '1 year');

COMMIT;
