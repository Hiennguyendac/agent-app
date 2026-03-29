-- Migration 019: Add task_update_files table for evidence attachments on task updates
-- Allows departments to attach proof documents when updating task progress.

CREATE TABLE IF NOT EXISTS task_update_files (
  id TEXT PRIMARY KEY,
  task_update_id TEXT NOT NULL REFERENCES task_updates(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes BIGINT,
  content_text TEXT,
  content_base64 TEXT,
  uploaded_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS task_update_files_task_update_id_idx
  ON task_update_files (task_update_id);

CREATE INDEX IF NOT EXISTS task_update_files_task_id_idx
  ON task_update_files (task_id);

-- Also add report_submitted_at and report_note to tasks for final report submission tracking
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS report_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS report_note TEXT,
  ADD COLUMN IF NOT EXISTS quality_check_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS quality_check_note TEXT,
  ADD COLUMN IF NOT EXISTS quality_checked_at TIMESTAMPTZ;

-- Add principal_approved_at and principal_approval_note for final HT approval
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS principal_approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS principal_approval_note TEXT;
