-- School workflow Phase 3
--
-- Adds principal assignment flow with one active assignment per work item in
-- the MVP, task linkage fields, and a minimal notifications table.

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  work_item_id TEXT NOT NULL REFERENCES work_items(id) ON DELETE CASCADE,
  main_department_id TEXT NOT NULL REFERENCES departments(id) ON DELETE RESTRICT,
  coordinating_department_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  deadline TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal',
  output_requirement TEXT,
  note TEXT,
  task_id TEXT UNIQUE,
  created_by_user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active BOOLEAN NOT NULL DEFAULT true
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignments_priority_check'
  ) THEN
    ALTER TABLE assignments
    ADD CONSTRAINT assignments_priority_check
    CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS assignments_one_active_per_work_item_idx
  ON assignments (work_item_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS assignments_main_department_id_idx
  ON assignments (main_department_id, created_at DESC);

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS work_item_id TEXT REFERENCES work_items(id) ON DELETE SET NULL;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS assignment_id TEXT REFERENCES assignments(id) ON DELETE SET NULL;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS owner_department_id TEXT REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS progress_percent INTEGER NOT NULL DEFAULT 0;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS tasks_work_item_id_idx
  ON tasks (work_item_id);

CREATE INDEX IF NOT EXISTS tasks_assignment_id_idx
  ON tasks (assignment_id);

CREATE INDEX IF NOT EXISTS tasks_owner_department_id_idx
  ON tasks (owner_department_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  message TEXT NOT NULL,
  recipient_department_id TEXT REFERENCES departments(id) ON DELETE CASCADE,
  recipient_user_id TEXT REFERENCES app_users(id) ON DELETE CASCADE,
  assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
  work_item_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_read BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX IF NOT EXISTS notifications_recipient_department_id_idx
  ON notifications (recipient_department_id, created_at DESC);

CREATE INDEX IF NOT EXISTS notifications_recipient_user_id_idx
  ON notifications (recipient_user_id, created_at DESC);
