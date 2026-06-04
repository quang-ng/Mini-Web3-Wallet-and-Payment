-- Migration: Create transactions table
-- Phase 6: Transaction tracking for wallet operations

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  tx_hash VARCHAR(66) UNIQUE NOT NULL,
  from_address VARCHAR(42) NOT NULL,
  to_address TEXT,
  amount VARCHAR(50) NOT NULL,
  token_address TEXT,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL,
  block_number INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for query performance
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_from_address ON transactions(from_address);
CREATE INDEX idx_type ON transactions(type);
