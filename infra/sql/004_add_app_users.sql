-- Adds a minimal DB-backed allowlist for Auth v1 logins.
--
-- Sprint 5 keeps the lightweight session model, but only users that exist in
-- app_users may log in. Passwords and external auth providers are intentionally
-- out of scope for this phase.

CREATE TABLE IF NOT EXISTS app_users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  display_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS app_users_username_active_idx
  ON app_users (username, is_active);

INSERT INTO app_users (id, username, display_name, is_active)
VALUES
  ('alice', 'alice', 'Alice', true),
  ('bob', 'bob', 'Bob', true),
  ('inactive-user', 'inactive-user', 'Inactive User', false)
ON CONFLICT (id) DO NOTHING;
