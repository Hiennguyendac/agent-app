ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'waiting_acceptance';

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS accepted_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS adjustment_requested_at TIMESTAMPTZ;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS adjustment_requested_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

ALTER TABLE assignments
ADD COLUMN IF NOT EXISTS adjustment_reason TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'assignments_status_check'
  ) THEN
    ALTER TABLE assignments
    ADD CONSTRAINT assignments_status_check
    CHECK (status IN ('draft', 'sent', 'waiting_acceptance', 'accepted', 'adjustment_requested', 'overdue', 'closed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS assignments_status_idx
  ON assignments (status, created_at DESC);
