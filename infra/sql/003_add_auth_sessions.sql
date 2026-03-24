-- Adds a minimal persistent session store for Auth v1.
--
-- Sessions are server-side and keyed by the opaque cookie value.
-- This keeps login/logout/session behavior stable while allowing
-- sessions to survive process restarts in production.

CREATE TABLE IF NOT EXISTS auth_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS auth_sessions_expires_at_idx
  ON auth_sessions (expires_at);
