BEGIN;

-- Insert main categories
INSERT INTO categories (id, name, icon, color, parent_id) VALUES
    ('c0a80121-1234-4321-a123-111111111111', 'Housing', 'home', '#4A5568', NULL),
    ('c0a80121-1234-4321-a123-222222222222', 'Transportation', 'car', '#48BB78', NULL),
    ('c0a80121-1234-4321-a123-333333333333', 'Food & Dining', 'utensils', '#4299E1', NULL),
    ('c0a80121-1234-4321-a123-444444444444', 'Entertainment', 'film', '#ED64A6', NULL),
    ('c0a80121-1234-4321-a123-555555555555', 'Shopping', 'shopping-bag', '#9F7AEA', NULL),
    ('c0a80121-1234-4321-a123-666666666666', 'Utilities', 'zap', '#ECC94B', NULL),
    ('c0a80121-1234-4321-a123-777777777777', 'Healthcare', 'heart', '#F56565', NULL),
    ('c0a80121-1234-4321-a123-888888888888', 'Income', 'dollar-sign', '#38A169', NULL),
    ('c0a80121-1234-4321-a123-999999999999', 'Savings', 'piggy-bank', '#667EEA', NULL),
    ('c0a80121-1234-4321-a123-aaaaaaaaaaaa', 'Other', 'more-horizontal', '#718096', NULL);

-- Insert subcategories
INSERT INTO categories (name, icon, color, parent_id) VALUES
    -- Housing subcategories
    ('Rent', 'key', '#4A5568', 'c0a80121-1234-4321-a123-111111111111'),
    ('Mortgage', 'home', '#4A5568', 'c0a80121-1234-4321-a123-111111111111'),
    ('Utilities', 'zap', '#4A5568', 'c0a80121-1234-4321-a123-111111111111'),
    ('Maintenance', 'tool', '#4A5568', 'c0a80121-1234-4321-a123-111111111111'),
    ('Insurance', 'shield', '#4A5568', 'c0a80121-1234-4321-a123-111111111111'),

    -- Transportation subcategories
    ('Gas', 'droplet', '#48BB78', 'c0a80121-1234-4321-a123-222222222222'),
    ('Public Transit', 'train', '#48BB78', 'c0a80121-1234-4321-a123-222222222222'),
    ('Car Insurance', 'shield', '#48BB78', 'c0a80121-1234-4321-a123-222222222222'),
    ('Car Maintenance', 'tool', '#48BB78', 'c0a80121-1234-4321-a123-222222222222'),
    ('Parking', 'parking', '#48BB78', 'c0a80121-1234-4321-a123-222222222222'),

    -- Food & Dining subcategories
    ('Groceries', 'shopping-cart', '#4299E1', 'c0a80121-1234-4321-a123-333333333333'),
    ('Restaurants', 'coffee', '#4299E1', 'c0a80121-1234-4321-a123-333333333333'),
    ('Fast Food', 'burger', '#4299E1', 'c0a80121-1234-4321-a123-333333333333'),
    ('Coffee Shops', 'coffee', '#4299E1', 'c0a80121-1234-4321-a123-333333333333'),
    ('Food Delivery', 'truck', '#4299E1', 'c0a80121-1234-4321-a123-333333333333'),

    -- Entertainment subcategories
    ('Movies', 'film', '#ED64A6', 'c0a80121-1234-4321-a123-444444444444'),
    ('Games', 'gamepad', '#ED64A6', 'c0a80121-1234-4321-a123-444444444444'),
    ('Music', 'music', '#ED64A6', 'c0a80121-1234-4321-a123-444444444444'),
    ('Sports', 'activity', '#ED64A6', 'c0a80121-1234-4321-a123-444444444444'),
    ('Hobbies', 'heart', '#ED64A6', 'c0a80121-1234-4321-a123-444444444444');

COMMIT;