BEGIN;

-- Insert test notifications for Test User
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
    ('u0a80121-1234-4321-a123-111111111111',
    'Budget Alert', 'You''ve reached 80% of your Food & Dining budget',
    'warning', false),
    
    ('u0a80121-1234-4321-a123-111111111111',
    'Large Transaction', 'A transaction of $500 was posted to your account',
    'alert', false),
    
    ('u0a80121-1234-4321-a123-111111111111',
    'Goal Progress', 'You''re halfway to your Emergency Fund goal!',
    'success', true);

-- Insert test notifications for Demo User
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
    ('u0a80121-1234-4321-a123-222222222222',
    'Welcome!', 'Welcome to FinTrack! Start by connecting your accounts.',
    'info', false),
    
    ('u0a80121-1234-4321-a123-222222222222',
    'New Feature', 'Try our new budget analysis tool',
    'info', false);

COMMIT;