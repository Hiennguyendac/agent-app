ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS lead_department_id TEXT REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS coordinating_department_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS routing_priority TEXT;

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS output_requirement TEXT;

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS principal_note TEXT;

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS principal_decision TEXT;

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS principal_reviewed_at TIMESTAMPTZ;

ALTER TABLE work_items
ADD COLUMN IF NOT EXISTS principal_reviewed_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_items_routing_priority_check'
  ) THEN
    ALTER TABLE work_items
    ADD CONSTRAINT work_items_routing_priority_check
    CHECK (
      routing_priority IS NULL
      OR routing_priority IN ('low', 'normal', 'high', 'urgent')
    );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'work_items_principal_decision_check'
  ) THEN
    ALTER TABLE work_items
    ADD CONSTRAINT work_items_principal_decision_check
    CHECK (
      principal_decision IS NULL
      OR principal_decision IN ('assign', 'return_intake', 'hold')
    );
  END IF;
END $$;

ALTER TABLE work_items
DROP CONSTRAINT IF EXISTS work_items_status_check;

ALTER TABLE work_items
ADD CONSTRAINT work_items_status_check
CHECK (
  status IN (
    'draft',
    'waiting_review',
    'waiting_assignment',
    'assigned',
    'on_hold',
    'in_review',
    'completed',
    'archived'
  )
);

CREATE INDEX IF NOT EXISTS work_items_lead_department_id_idx
  ON work_items (lead_department_id);

CREATE INDEX IF NOT EXISTS work_items_principal_reviewed_by_user_id_idx
  ON work_items (principal_reviewed_by_user_id);
