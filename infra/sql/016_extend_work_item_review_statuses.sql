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
    'needs_supplement',
    'needs_rework',
    'late_explanation_required',
    'waiting_principal_approval',
    'completed',
    'archived'
  )
);
