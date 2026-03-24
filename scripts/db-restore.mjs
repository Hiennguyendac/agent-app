import "dotenv/config";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();
const restoreFile = process.env.RESTORE_FILE?.trim();
const allowRestore = process.env.CONFIRM_DB_RESTORE === "true";

if (!databaseUrl) {
  console.error("[db:restore] DATABASE_URL is required.");
  process.exit(1);
}

if (!restoreFile) {
  console.error("[db:restore] RESTORE_FILE is required.");
  process.exit(1);
}

if (!allowRestore) {
  console.error("[db:restore] Set CONFIRM_DB_RESTORE=true to confirm destructive restore.");
  process.exit(1);
}

const resolvedRestoreFile = resolve(process.cwd(), restoreFile);

if (!existsSync(resolvedRestoreFile) || !statSync(resolvedRestoreFile).isFile()) {
  console.error(`[db:restore] Restore file not found: ${resolvedRestoreFile}`);
  process.exit(1);
}

const result = spawnSync(
  "pg_restore",
  [
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "-d",
    databaseUrl,
    resolvedRestoreFile
  ],
  {
    stdio: "inherit"
  }
);

if (result.status !== 0) {
  console.error("[db:restore] pg_restore failed.");
  process.exit(result.status ?? 1);
}

console.log(`[db:restore] OK ${resolvedRestoreFile}`);
