BEGIN;

-- Insert test users with bcrypt hashed passwords
INSERT INTO users (id, email, password_hash, name, preferred_currency) VALUES
    ('u0a80121-1234-4321-a123-111111111111', 'test@example.com', 
    '$2a$10$rGN6Zg1RO4qPtIzpYhZlVO/Cj8lL6/6K3L6tKkPk3ZIvd5ZrQxj2', -- password: Test123!
    'Test User', 'USD'),
    
    ('u0a80121-1234-4321-a123-222222222222', 'demo@example.com',
    '$2a$10$rGN6Zg1RO4qPtIzpYhZlVO/Cj8lL6/6K3L6tKkPk3ZIvd5ZrQxj2', -- password: Test123!
    'Demo User', 'USD');

COMMIT;