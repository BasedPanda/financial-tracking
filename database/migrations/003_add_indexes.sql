BEGIN;

-- Add indexes for performance optimization
CREATE INDEX idx_transactions_user_id_date ON transactions(user_id, date);
CREATE INDEX idx_transactions_account_id ON transactions(account_id);
CREATE INDEX idx_transactions_category_id ON transactions(category_id);
CREATE INDEX idx_transactions_plaid_id ON transactions(plaid_transaction_id);
CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_category_id ON budgets(category_id);
CREATE INDEX idx_accounts_user_id ON accounts(user_id);
CREATE INDEX idx_accounts_plaid_id ON accounts(plaid_account_id);
CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_notifications_user_id_created_at ON notifications(user_id, created_at);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_plaid_credentials_user_id ON plaid_credentials(user_id);

COMMIT;