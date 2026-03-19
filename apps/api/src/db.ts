import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";
import { Pool } from "pg";

/**
 * This file is the first PostgreSQL access layer for the API.
 *
 * Right now, the app still uses in-memory storage.
 * This file does not replace that yet.
 *
 * Its job is only to:
 * - load environment variables from .env when available
 * - read DATABASE_URL
 * - create a shared PostgreSQL pool
 * - provide a small connection test helper
 *
 * Later, store.ts can use this file to run real database queries.
 */

loadEnvironmentVariables();

let pool: Pool | null = null;

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
 * This is useful later when you want to confirm:
 * - the API can reach PostgreSQL
 * - DATABASE_URL is correct
 * - the database is accepting connections
 *
 * It is not used by the app flow yet.
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
