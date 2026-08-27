-- 0002_temporary_media.sql: Temporary Media tracking for 72-hour auto-cleanup

CREATE TABLE IF NOT EXISTS temporary_media (
  id TEXT PRIMARY KEY,
  provider_asset_id TEXT,
  provider_public_id TEXT NOT NULL,
  resource_type TEXT NOT NULL, -- 'image' or 'video'
  media_url TEXT NOT NULL,
  birthday_token TEXT,
  wish_id TEXT,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  deleted_at TEXT,
  cleanup_status TEXT DEFAULT 'pending', -- 'pending', 'deleted', 'failed'
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_temp_media_expires_at ON temporary_media(expires_at);
CREATE INDEX IF NOT EXISTS idx_temp_media_cleanup_status ON temporary_media(cleanup_status);
CREATE INDEX IF NOT EXISTS idx_temp_media_birthday_token ON temporary_media(birthday_token);
CREATE INDEX IF NOT EXISTS idx_temp_media_wish_id ON temporary_media(wish_id);
CREATE INDEX IF NOT EXISTS idx_temp_media_public_id ON temporary_media(provider_public_id);
