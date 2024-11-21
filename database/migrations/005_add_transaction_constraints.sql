BEGIN;

-- Add constraints to ensure data integrity
ALTER TABLE transactions
ADD CONSTRAINT check_positive_amount
CHECK (amount >= 0);

ALTER TABLE transactions
ADD CONSTRAINT check_valid_date
CHECK (date <= CURRENT_DATE);

ALTER TABLE budgets
ADD CONSTRAINT check_positive_budget_amount
CHECK (amount > 0);

ALTER TABLE budgets
ADD CONSTRAINT check_valid_date_range
CHECK (end_date IS NULL OR end_date > start_date);

ALTER TABLE goals
ADD CONSTRAINT check_positive_target_amount
CHECK (target_amount > 0);

ALTER TABLE goals
ADD CONSTRAINT check_valid_current_amount
CHECK (current_amount >= 0);

ALTER TABLE goals
ADD CONSTRAINT check_current_not_exceed_target
CHECK (current_amount <= target_amount);

COMMIT;