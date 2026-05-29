-- Phase 6: Add user_id to transactions table
ALTER TABLE transactions
ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_user_wallet ON transactions(user_id, from_address);
