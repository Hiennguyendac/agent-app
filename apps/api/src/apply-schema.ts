import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDbPool } from "./db.js";

async function main(): Promise<void> {
  const schemaPath = resolve(process.cwd(), "../../infra/sql/001_growth_mvp_schema.sql");
  const sql = await readFile(schemaPath, "utf8");

  const pool = getDbPool();

  try {
    await pool.query(sql);
    console.log(`[api] Applied schema from ${schemaPath}`);
    process.exit(0);
  } catch (error) {
    console.error("[api] Failed to apply schema:");
    console.error(error);
    process.exit(1);
  }
}

void main();
