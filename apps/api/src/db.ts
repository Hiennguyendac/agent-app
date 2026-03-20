import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";
import { logError, logInfo, logWarn } from "./log.js";

/**
 * This file owns the PostgreSQL connection for the API.
 *
 * The current production path uses PostgreSQL through DATABASE_URL.
 * That can be a local Postgres instance or a Supabase Postgres connection string.
 *
 * Its job is to:
 * - load environment variables from .env when available
 * - read DATABASE_URL
 * - create a shared PostgreSQL pool
 * - provide a small connection test helper
 */

loadEnvironmentVariables();

let pool: Pool | null = null;

export function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export function isInMemoryFallbackAllowed(): boolean {
  const rawValue = process.env.ALLOW_INMEMORY_FALLBACK?.trim().toLowerCase();

  if (rawValue === "true") {
    return true;
  }

  if (rawValue === "false") {
    return false;
  }

  return !isProductionRuntime();
}

export function logStorageMode(): void {
  const databaseUrl = process.env.DATABASE_URL;
  const runtimeLabel = isProductionRuntime() ? "production" : "non-production";
  const fallbackLabel = isInMemoryFallbackAllowed() ? "enabled" : "disabled";

  logInfo("Storage mode configured", {
    storage: "postgresql-primary",
    fallback: `in-memory-${fallbackLabel}`,
    runtime: runtimeLabel
  });

  if (!databaseUrl) {
    logWarn("DATABASE_URL is not set.");
  }
}

/**
 * Returns the PostgreSQL connection pool for the API.
 *
 * DATABASE_URL tells the API how to connect to PostgreSQL.
 * Example:
 * postgresql://postgres:postgres@db:5432/agentapp
 */
export function getDbPool(): Pool {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: databaseUrl
    });
  }

  return pool;
}

/**
 * Runs a very small PostgreSQL connection test.
 *
 * This is useful when you want to confirm:
 * - the API can reach PostgreSQL
 * - DATABASE_URL is correct
 * - the database is accepting connections
 */
export async function testDatabaseConnection(): Promise<boolean> {
  const client = await getDbPool().connect();

  try {
    await client.query("SELECT 1");
    return true;
  } finally {
    client.release();
  }
}

export async function ensureStorageReadyForStartup(): Promise<void> {
  logStorageMode();

  if (isInMemoryFallbackAllowed()) {
    logWarn(
      "In-memory fallback is allowed. PostgreSQL will still be used when DATABASE_URL is available."
    );
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required because in-memory fallback is disabled."
    );
  }

  await testDatabaseConnection();
  logInfo("PostgreSQL startup check passed.");
}

export function handleStorageFailure(operation: string, error: unknown): void {
  if (isInMemoryFallbackAllowed()) {
    logWarn(`${operation} PostgreSQL path failed. Falling back to in-memory storage.`, {
      error: error instanceof Error ? error.message : String(error)
    });
    return;
  }

  logError(
    `${operation} PostgreSQL path failed and in-memory fallback is disabled.`,
    {
      error: error instanceof Error ? error.message : String(error)
    }
  );

  throw error instanceof Error
    ? new Error(
        `${operation} failed because PostgreSQL is unavailable and in-memory fallback is disabled. ${error.message}`
      )
    : new Error(
        `${operation} failed because PostgreSQL is unavailable and in-memory fallback is disabled.`
      );
}

function loadEnvironmentVariables(): void {
  const candidatePaths = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "../../.env")
  ];

  for (const path of candidatePaths) {
    if (existsSync(path)) {
      loadEnv({ path });
      return;
    }
  }
}
