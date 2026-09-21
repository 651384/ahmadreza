CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,
  msg_id TEXT NOT NULL,
  corr_id TEXT,
  type TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  payload_json TEXT,
  error_code TEXT,
  error_message TEXT
);
CREATE INDEX IF NOT EXISTS idx_events_msg_id ON events(msg_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);

CREATE TABLE IF NOT EXISTS provider_health (
  provider TEXT PRIMARY KEY,
  status TEXT NOT NULL,
  checked_at TEXT NOT NULL,
  latency_ms INTEGER,
  error_count INTEGER DEFAULT 0,
  metadata_json TEXT
);

CREATE TABLE IF NOT EXISTS idempotency (
  msg_id TEXT PRIMARY KEY,
  first_seen_at TEXT NOT NULL,
  result_status TEXT NOT NULL
);
