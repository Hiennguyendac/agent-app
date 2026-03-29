-- Migration 020: Add reminder_log table for deadline reminder tracking
-- The AI Agent uses this to avoid sending duplicate reminders.

CREATE TABLE IF NOT EXISTS reminder_log (
  id TEXT PRIMARY KEY,
  assignment_id TEXT REFERENCES assignments(id) ON DELETE CASCADE,
  work_item_id TEXT REFERENCES work_items(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL,
  -- reminder_type values: before_3_days | before_1_day | on_deadline | overdue
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  recipient_department_id TEXT REFERENCES departments(id) ON DELETE SET NULL,
  recipient_user_id TEXT REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS reminder_log_assignment_id_idx
  ON reminder_log (assignment_id, reminder_type);

CREATE INDEX IF NOT EXISTS reminder_log_sent_at_idx
  ON reminder_log (sent_at);
