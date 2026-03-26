CREATE TABLE IF NOT EXISTS submission_reviews (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  work_item_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  reviewed_by_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL,
  review_outcome TEXT NOT NULL,
  return_stage TEXT NOT NULL,
  reason_code TEXT,
  reason_text TEXT,
  review_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'submission_reviews_outcome_check'
  ) THEN
    ALTER TABLE submission_reviews
    ADD CONSTRAINT submission_reviews_outcome_check
    CHECK (
      review_outcome IN (
        'needs_supplement',
        'needs_rework',
        'late_explanation_required',
        'needs_reassignment',
        'ready_for_principal_approval'
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS submission_reviews_task_id_idx
  ON submission_reviews (task_id, created_at DESC);
