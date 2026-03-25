import "dotenv/config";
import { existsSync, mkdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL?.trim();
const dockerImage = process.env.PG_DUMP_IMAGE?.trim() || "postgres:17";
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

const nativeResult = runCommand("pg_dump", ["-Fc", "-f", backupFile, databaseUrl]);

if (nativeResult.status === 0) {
  console.log(`[db:backup] OK ${backupFile}`);
  process.exit(0);
}

if (canRetryWithDocker(nativeResult)) {
  console.warn(`[db:backup] Retrying backup with Docker image ${dockerImage}.`);

  const dockerResult = runCommand("docker", [
    "run",
    "--rm",
    "-v",
    `${dirname(backupFile)}:/backup`,
    dockerImage,
    "pg_dump",
    "-Fc",
    "-f",
    `/backup/${basename(backupFile)}`,
    databaseUrl
  ]);

  if (dockerResult.status === 0) {
    console.log(`[db:backup] OK ${backupFile}`);
    process.exit(0);
  }

  printFailure("docker pg_dump", dockerResult);
  process.exit(dockerResult.status ?? 1);
}

printFailure("pg_dump", nativeResult);
process.exit(nativeResult.status ?? 1);

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

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8"
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  return result;
}

function canRetryWithDocker(result) {
  return result.error?.code === "ENOENT" || result.stderr?.includes("server version mismatch");
}

function printFailure(command, result) {
  if (result.error) {
    if (result.error.code === "ENOENT") {
      console.error(
        `[db:backup] ${command} was not found. Install PostgreSQL client tools or make Docker available.`
      );
      return;
    }

    console.error(`[db:backup] Failed to start ${command}: ${result.error.message}`);
    return;
  }

  console.error(`[db:backup] ${command} failed with exit code ${result.status ?? "unknown"}.`);
}
