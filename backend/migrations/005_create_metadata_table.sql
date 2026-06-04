-- Migration: Create metadata table
-- Phase 6: Store application metadata and sync state

CREATE TABLE IF NOT EXISTS metadata (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value BIGINT NOT NULL,
  data_synced INTEGER DEFAULT 0,
  error_message TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast lookups by key
CREATE INDEX idx_metadata_key ON metadata(key);
