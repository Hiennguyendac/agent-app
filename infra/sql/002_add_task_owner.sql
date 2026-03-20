-- Adds optional task ownership for future multi-user support.
--
-- The column is nullable to stay backward-compatible with existing task rows.
-- Older tasks remain readable when ownership enforcement is enabled because
-- the API still treats NULL owner_id as unowned/shared data.

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS owner_id TEXT;

CREATE INDEX IF NOT EXISTS tasks_owner_id_idx
  ON tasks (owner_id);
