import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();
const backupFile =
  process.env.BACKUP_FILE?.trim() ||
  resolve(
    process.cwd(),
    "backups",
    `agent-app-${formatTimestamp(new Date())}.dump`
  );

if (!databaseUrl) {
  console.error("[db:backup] DATABASE_URL is required.");
  process.exit(1);
}

mkdirSync(dirname(backupFile), { recursive: true });

if (existsSync(backupFile)) {
  console.error(`[db:backup] Refusing to overwrite existing file: ${backupFile}`);
  process.exit(1);
}

const result = spawnSync("pg_dump", ["-Fc", "-f", backupFile, databaseUrl], {
  stdio: "inherit"
});

if (result.status !== 0) {
  console.error("[db:backup] pg_dump failed.");
  process.exit(result.status ?? 1);
}

console.log(`[db:backup] OK ${backupFile}`);

function formatTimestamp(date) {
  const pad = (value) => String(value).padStart(2, "0");

  return [
    date.getUTCFullYear(),
    pad(date.getUTCMonth() + 1),
    pad(date.getUTCDate())
  ].join("") +
    "-" +
    [pad(date.getUTCHours()), pad(date.getUTCMinutes()), pad(date.getUTCSeconds())].join("");
}
