CREATE TABLE IF NOT EXISTS task_updates (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  updated_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  execution_status TEXT NOT NULL,
  progress_percent INTEGER NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'task_updates_execution_status_check'
  ) THEN
    ALTER TABLE task_updates
    ADD CONSTRAINT task_updates_execution_status_check
    CHECK (
      execution_status IN (
        'pending',
        'running',
        'waiting_dependency',
        'needs_data',
        'internally_completed',
        'submitted'
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS task_updates_task_id_idx
  ON task_updates (task_id, created_at DESC);
