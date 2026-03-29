-- Migration 018: Add source type, intake code, deadline, and output type to work_items
-- These fields support the full 9-stage workflow described in the specification.

ALTER TABLE work_items
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS intake_code TEXT,
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS output_type TEXT;

-- source_type values: incoming_document | internal_directive | plan
--                     spontaneous_task | department_request | work_schedule
-- output_type values: report | plan_document | minutes | list
--                     proposal | evidence_files | other

-- Index to support deadline-based reminder queries
CREATE INDEX IF NOT EXISTS work_items_deadline_idx
  ON work_items (deadline)
  WHERE deadline IS NOT NULL;

-- Index for intake code lookups
CREATE INDEX IF NOT EXISTS work_items_intake_code_idx
  ON work_items (intake_code)
  WHERE intake_code IS NOT NULL;
