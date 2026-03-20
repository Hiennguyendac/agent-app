import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { getDbPool } from "./db.js";

async function main(): Promise<void> {
  const sqlDirectoryPath = resolve(process.cwd(), "../../infra/sql");
  const schemaFiles = (await readdir(sqlDirectoryPath))
    .filter((filename) => filename.endsWith(".sql"))
    .sort();
  const pool = getDbPool();

  try {
    for (const schemaFile of schemaFiles) {
      const schemaPath = resolve(sqlDirectoryPath, schemaFile);
      const sql = await readFile(schemaPath, "utf8");
      await pool.query(sql);
      console.log(`[api] Applied schema from ${schemaPath}`);
    }

    process.exit(0);
  } catch (error) {
    console.error("[api] Failed to apply schema:");
    console.error(error);
    process.exit(1);
  }
}

void main();
