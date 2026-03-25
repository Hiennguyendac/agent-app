-- Sprint: School workflow Phase 1
--
-- Adds the first organization model needed for school workflow:
-- - departments
-- - roles on app_users
-- - department assignment and position metadata

CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'staff';

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id) ON DELETE SET NULL;

ALTER TABLE app_users
ADD COLUMN IF NOT EXISTS position TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'app_users_role_check'
  ) THEN
    ALTER TABLE app_users
    ADD CONSTRAINT app_users_role_check
    CHECK (role IN ('principal', 'department_head', 'staff', 'clerk'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS app_users_role_idx
  ON app_users (role);

CREATE INDEX IF NOT EXISTS app_users_department_id_idx
  ON app_users (department_id);

CREATE INDEX IF NOT EXISTS departments_code_idx
  ON departments (code);

INSERT INTO departments (id, name, code)
VALUES
  ('dept_admin', 'Administration', 'ADMIN'),
  ('dept_academic', 'Academic Affairs', 'ACADEMIC'),
  ('dept_operations', 'Operations', 'OPS')
ON CONFLICT (id) DO NOTHING;

UPDATE app_users
SET role = 'principal',
    department_id = 'dept_admin',
    position = 'Principal'
WHERE id = 'alice';

UPDATE app_users
SET role = 'staff',
    department_id = 'dept_academic',
    position = 'Academic Staff'
WHERE id = 'bob';

UPDATE app_users
SET role = 'clerk',
    department_id = 'dept_operations',
    position = 'Clerk'
WHERE id = 'inactive-user';
