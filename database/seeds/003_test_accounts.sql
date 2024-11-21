BEGIN;

-- Insert test accounts for Test User
INSERT INTO accounts (id, user_id, name, type, balance, currency) VALUES
    ('a0a80121-1234-4321-a123-111111111111', 
    'u0a80121-1234-4321-a123-111111111111',
    'Main Checking', 'checking', 5000.00, 'USD'),
    
    ('a0a80121-1234-4321-a123-222222222222',
    'u0a80121-1234-4321-a123-111111111111',
    'Savings Account', 'savings', 10000.00, 'USD'),
    
    ('a0a80121-1234-4321-a123-333333333333',
    'u0a80121-1234-4321-a123-111111111111',
    'Credit Card', 'credit', -1500.00, 'USD');

-- Insert test accounts for Demo User
INSERT INTO accounts (id, user_id, name, type, balance, currency) VALUES
    ('a0a80121-1234-4321-a123-444444444444',
    'u0a80121-1234-4321-a123-222222222222',
    'Personal Checking', 'checking', 3500.00, 'USD'),
    
    ('a0a80121-1234-4321-a123-555555555555',
    'u0a80121-1234-4321-a123-222222222222',
    'Emergency Fund', 'savings', 15000.00, 'USD');

COMMIT;