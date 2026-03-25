-- School workflow Phase 2
--
-- Adds first-class work items, attached file metadata/content, and persisted
-- AI analysis output. Existing task tables remain untouched.

CREATE TABLE IF NOT EXISTS work_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting_review',
  department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  created_by_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  assigned_to_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_items_status_check'
  ) THEN
    ALTER TABLE work_items
    ADD CONSTRAINT work_items_status_check
    CHECK (status IN ('draft', 'waiting_review', 'in_review', 'completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS work_items_status_idx
  ON work_items (status);

CREATE INDEX IF NOT EXISTS work_items_created_by_user_id_idx
  ON work_items (created_by_user_id);

CREATE INDEX IF NOT EXISTS work_items_assigned_to_user_id_idx
  ON work_items (assigned_to_user_id);

CREATE INDEX IF NOT EXISTS work_items_department_id_idx
  ON work_items (department_id);

CREATE TABLE IF NOT EXISTS work_item_files (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  content_text TEXT,
  uploaded_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS work_item_files_work_item_id_idx
  ON work_item_files (work_item_id, created_at DESC);

CREATE TABLE IF NOT EXISTS ai_analysis (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  raw_output TEXT NOT NULL,
  model TEXT,
  created_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ai_analysis_work_item_id_idx
  ON ai_analysis (work_item_id, created_at DESC);
