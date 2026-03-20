-- Agent App Growth MVP PostgreSQL schema
--
-- This file prepares the first database tables for the current MVP.
-- The current API storage layer reads and writes these tables through pg.
--
-- Table overview:
-- 1. tasks
--    Stores the main Growth task data.
-- 2. task_results
--    Stores the Growth agent output linked to a task.

CREATE TABLE IF NOT EXISTS tasks (
  -- The task ID already used by the current app.
  id TEXT PRIMARY KEY,

  -- The kind of task, for example: growth
  task_type TEXT NOT NULL,

  -- A short task name shown in the UI.
  title TEXT NOT NULL,

  -- The main business goal for the task.
  goal TEXT NOT NULL,

  -- The target audience for the task output.
  audience TEXT NOT NULL,

  -- Optional extra notes from the user.
  notes TEXT,

  -- The task lifecycle state, such as pending or completed.
  status TEXT NOT NULL,

  -- When the task was created.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_results (
  -- A unique result row ID.
  id TEXT PRIMARY KEY,

  -- Links the result back to the task that produced it.
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,

  -- The agent that created the result, for example: growth-agent
  agent_name TEXT NOT NULL,

  -- The final Growth output text shown in the UI.
  output_text TEXT NOT NULL,

  -- When the result was created.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- For the current MVP, one task should have at most one result.
  CONSTRAINT task_results_task_id_unique UNIQUE (task_id)
);

-- Helpful index for listing the newest tasks first later.
CREATE INDEX IF NOT EXISTS tasks_created_at_idx
  ON tasks (created_at DESC);

-- Helpful index for joining results back to tasks.
CREATE INDEX IF NOT EXISTS task_results_task_id_idx
  ON task_results (task_id);
