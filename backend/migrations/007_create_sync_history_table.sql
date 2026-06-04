-- Migration: Create sync_history table
-- Phase 6: Track blockchain sync operations and performance

CREATE TABLE IF NOT EXISTS sync_history (
  id SERIAL PRIMARY KEY,
  last_block_synced BIGINT NOT NULL,
  records_synced INTEGER DEFAULT 0,
  duration_ms INTEGER,
  status VARCHAR(20),
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for querying recent syncs
CREATE INDEX idx_sync_history_synced_at ON sync_history(synced_at DESC);
