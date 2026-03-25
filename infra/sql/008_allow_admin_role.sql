-- Phase 2 extends app_users.role to include admin.

ALTER TABLE app_users
DROP CONSTRAINT IF EXISTS app_users_role_check;

ALTER TABLE app_users
ADD CONSTRAINT app_users_role_check
CHECK (role IN ('admin', 'principal', 'department_head', 'staff', 'clerk'));
