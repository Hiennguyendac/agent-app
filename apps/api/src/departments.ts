import type { Department } from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";

export interface DepartmentInput {
  name: string;
  code?: string;
}

export async function listDepartments(): Promise<Department[]> {
  const result = await getDbPool().query(
    `
      SELECT
        id,
        name,
        code,
        created_at
      FROM departments
      ORDER BY name ASC
    `
  );

  return result.rows.map(mapDepartmentRow);
}

export async function createDepartment(
  input: DepartmentInput
): Promise<Department> {
  const departmentId = createDepartmentId(input.name, input.code);
  const result = await getDbPool().query(
    `
      INSERT INTO departments (
        id,
        name,
        code
      )
      VALUES ($1, $2, $3)
      RETURNING
        id,
        name,
        code,
        created_at
    `,
    [departmentId, input.name, input.code ?? null]
  );

  return mapDepartmentRow(result.rows[0]);
}

export async function updateDepartment(
  departmentId: string,
  input: DepartmentInput
): Promise<Department | null> {
  const result = await getDbPool().query(
    `
      UPDATE departments
      SET name = $2,
          code = $3
      WHERE id = $1
      RETURNING
        id,
        name,
        code,
        created_at
    `,
    [departmentId, input.name, input.code ?? null]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return mapDepartmentRow(result.rows[0]);
}

export async function deleteDepartment(
  departmentId: string
): Promise<boolean> {
  const result = await getDbPool().query(
    `
      DELETE FROM departments
      WHERE id = $1
    `,
    [departmentId]
  );

  return (result.rowCount ?? 0) > 0;
}

function mapDepartmentRow(row: Record<string, unknown>): Department {
  return {
    id: row.id as string,
    name: row.name as string,
    code: (row.code as string | null) ?? undefined,
    createdAt: row.created_at as string
  };
}

function createDepartmentId(name: string, code?: string): string {
  const baseValue = (code ?? name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `dept_${baseValue || Date.now().toString()}`;
}
