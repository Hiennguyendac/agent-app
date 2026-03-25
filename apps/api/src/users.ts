import type {
  AppUserProfile,
  AppUserRole
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";
import { hashPassword, verifyPassword } from "./password.js";

export interface AppUser extends AppUserProfile {
  passwordHash?: string;
}

export async function findUserByUsername(username: string): Promise<AppUser | null> {
  const result = await getDbPool().query(
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.role,
        u.department_id,
        d.name AS department_name,
        u.position,
        u.is_active,
        u.password_hash,
        u.created_at
      FROM app_users u
      LEFT JOIN departments d
        ON d.id = u.department_id
      WHERE u.username = $1
      LIMIT 1
    `,
    [username]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return {
    id: result.rows[0].id as string,
    username: result.rows[0].username as string,
    displayName: (result.rows[0].display_name as string | null) ?? undefined,
    role: (result.rows[0].role as AppUserRole | null) ?? "staff",
    departmentId: (result.rows[0].department_id as string | null) ?? undefined,
    position: (result.rows[0].position as string | null) ?? undefined,
    isActive: Boolean(result.rows[0].is_active),
    passwordHash: (result.rows[0].password_hash as string | null) ?? undefined
  };
}

export async function findUserById(userId: string): Promise<AppUser | null> {
  const result = await getDbPool().query(
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.role,
        u.department_id,
        d.name AS department_name,
        u.position,
        u.is_active,
        u.password_hash
      FROM app_users u
      LEFT JOIN departments d
        ON d.id = u.department_id
      WHERE u.id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAppUserRow(result.rows[0]);
}

export async function listUsers(): Promise<AppUserProfile[]> {
  const result = await getDbPool().query(
    `
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.role,
        u.department_id,
        d.name AS department_name,
        u.position,
        u.is_active,
        u.password_hash
      FROM app_users u
      LEFT JOIN departments d
        ON d.id = u.department_id
      ORDER BY u.username ASC
    `
  );

  return result.rows.map((row) => mapAppUserRow(row));
}

export interface UpdateUserAssignmentInput {
  role: AppUserRole;
  departmentId: string | null;
  position: string | null;
  isActive: boolean;
}

export async function updateUserAssignment(
  userId: string,
  input: UpdateUserAssignmentInput
): Promise<AppUserProfile | null> {
  const result = await getDbPool().query(
    `
      UPDATE app_users
      SET role = $2,
          department_id = $3,
          position = $4,
          is_active = $5
      WHERE id = $1
      RETURNING
        id,
        username,
        display_name,
        role,
        department_id,
        position,
        is_active,
        password_hash
    `,
    [userId, input.role, input.departmentId, input.position, input.isActive]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapAppUserRow(result.rows[0]);
}

export async function verifyUserCredentials(
  username: string,
  password: string
): Promise<
  | { ok: true; user: AppUser }
  | { ok: false; reason: "unknown-user" | "inactive-user" | "invalid-password" }
> {
  const user = await findUserByUsername(username);

  if (!user) {
    return { ok: false, reason: "unknown-user" };
  }

  if (!user.isActive) {
    return { ok: false, reason: "inactive-user" };
  }

  if (!user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { ok: false, reason: "invalid-password" };
  }

  return { ok: true, user };
}

export async function changeUserPassword(
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<
  | { ok: true; user: AppUser }
  | { ok: false; reason: "unknown-user" | "inactive-user" | "invalid-current-password" }
> {
  const result = await getDbPool().query(
    `
      SELECT
        id,
        username,
        display_name,
        is_active,
        password_hash
      FROM app_users
      WHERE id = $1
      LIMIT 1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    return { ok: false, reason: "unknown-user" };
  }

  const user: AppUser = {
    ...mapAppUserRow(result.rows[0]),
    passwordHash: (result.rows[0].password_hash as string | null) ?? undefined
  };

  if (!user.isActive) {
    return { ok: false, reason: "inactive-user" };
  }

  if (!user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
    return { ok: false, reason: "invalid-current-password" };
  }

  await getDbPool().query(
    `
      UPDATE app_users
      SET password_hash = $2,
          password_updated_at = NOW()
      WHERE id = $1
    `,
    [user.id, hashPassword(newPassword)]
  );

  return { ok: true, user };
}

function mapAppUserRow(row: Record<string, unknown>): AppUser {
  return {
    id: row.id as string,
    username: row.username as string,
    displayName: (row.display_name as string | null) ?? undefined,
    role: (row.role as AppUserRole | null) ?? "staff",
    departmentId: (row.department_id as string | null) ?? undefined,
    departmentName: (row.department_name as string | null) ?? undefined,
    position: (row.position as string | null) ?? undefined,
    isActive: Boolean(row.is_active),
    passwordHash: (row.password_hash as string | null) ?? undefined
  };
}
