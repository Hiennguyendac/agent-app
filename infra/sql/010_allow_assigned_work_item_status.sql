ALTER TABLE work_items
DROP CONSTRAINT IF EXISTS work_items_status_check;

ALTER TABLE work_items
ADD CONSTRAINT work_items_status_check
CHECK (status IN ('draft', 'waiting_review', 'assigned', 'in_review', 'completed'));
