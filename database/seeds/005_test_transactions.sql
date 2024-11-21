BEGIN;

-- Function to generate random timestamps within the last 30 days
CREATE OR REPLACE FUNCTION random_timestamp() RETURNS TIMESTAMP AS $$
BEGIN
    RETURN NOW() - (random() * INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql;

-- Insert test transactions for Test User
INSERT INTO transactions (
    user_id, account_id, category_id, type, amount, description, date, notes
)
SELECT
    'u0a80121-1234-4321-a123-111111111111' as user_id,
    'a0a80121-1234-4321-a123-111111111111' as account_id,
    c.id as category_id,
    'expense' as type,
    (random() * 100)::numeric(10,2) as amount,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'Grocery Shopping'
        WHEN 1 THEN 'Restaurant'
        WHEN 2 THEN 'Coffee'
        WHEN 3 THEN 'Fast Food'
        ELSE 'Food Delivery'
    END as description,
    random_timestamp() as date,
    'Sample transaction' as notes
FROM categories c
WHERE c.name = 'Food & Dining'
AND random() < 0.7
LIMIT 20;

-- Insert some income transactions
INSERT INTO transactions (
    user_id, account_id, category_id, type, amount, description, date
)
SELECT
    'u0a80121-1234-4321-a123-111111111111' as user_id,
    'a0a80121-1234-4321-a123-111111111111' as account_id,
    c.id as category_id,
    'income' as type,
    3000 + (random() * 1000)::numeric(10,2) as amount,
    'Monthly Salary' as description,
    date_trunc('month', NOW() - (n || ' month')::interval) as date
FROM categories c
CROSS JOIN generate_series(0, 2) n
WHERE c.name = 'Income';

-- Insert test transactions for Demo User
INSERT INTO transactions (
    user_id, account_id, category_id, type, amount, description, date, notes
)
SELECT
    'u0a80121-1234-4321-a123-222222222222' as user_id,
    'a0a80121-1234-4321-a123-444444444444' as account_id,
    c.id as category_id,
    'expense' as type,
    (random() * 200)::numeric(10,2) as amount,
    CASE floor(random() * 5)::int
        WHEN 0 THEN 'Target'
        WHEN 1 THEN 'Amazon'
        WHEN 2 THEN 'Walmart'
        WHEN 3 THEN 'Shopping'
        ELSE 'Online Purchase'
    END as description,
    random_timestamp() as date,
    'Demo transaction' as notes
FROM categories c
WHERE c.name = 'Shopping'
AND random() < 0.7
LIMIT 15;

-- Drop the temporary function
DROP FUNCTION random_timestamp();

COMMIT;
