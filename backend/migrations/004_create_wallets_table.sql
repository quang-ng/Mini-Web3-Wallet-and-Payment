-- Migration: Create wallets table
-- Phase 6: Centralized wallet address tracking

CREATE TABLE IF NOT EXISTS wallets (
  id SERIAL PRIMARY KEY,
  address VARCHAR(42) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by address
CREATE INDEX idx_wallets_address ON wallets(address);
