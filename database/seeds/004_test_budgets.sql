BEGIN;

-- Insert test budgets for Test User
INSERT INTO budgets (user_id, category_id, name, amount, period, start_date) VALUES
    ('u0a80121-1234-4321-a123-111111111111',
    (SELECT id FROM categories WHERE name = 'Food & Dining'),
    'Monthly Food Budget', 500.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE)),
    
    ('u0a80121-1234-4321-a123-111111111111',
    (SELECT id FROM categories WHERE name = 'Transportation'),
    'Transportation Budget', 300.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE)),
    
    ('u0a80121-1234-4321-a123-111111111111',
    (SELECT id FROM categories WHERE name = 'Entertainment'),
    'Entertainment Budget', 200.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE));

-- Insert test budgets for Demo User
INSERT INTO budgets (user_id, category_id, name, amount, period, start_date) VALUES
    ('u0a80121-1234-4321-a123-222222222222',
    (SELECT id FROM categories WHERE name = 'Food & Dining'),
    'Food Budget', 600.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE)),
    
    ('u0a80121-1234-4321-a123-222222222222',
    (SELECT id FROM categories WHERE name = 'Housing'),
    'Housing Expenses', 1500.00, 'monthly', DATE_TRUNC('month', CURRENT_DATE));

COMMIT;