import "dotenv/config";
import { randomBytes, scryptSync } from "node:crypto";
import { Client } from "pg";

const username = normalizeUsername(process.argv[2]);
const password = process.env.APP_USER_PASSWORD?.trim() ?? "";
const databaseUrl = process.env.DATABASE_URL?.trim();

if (!databaseUrl) {
  console.error("[user:set-password] DATABASE_URL is required.");
  process.exit(1);
}

if (!username) {
  console.error("[user:set-password] Usage: APP_USER_PASSWORD='...' node scripts/set-user-password.mjs <username>");
  process.exit(1);
}

if (password.length === 0) {
  console.error("[user:set-password] APP_USER_PASSWORD is required.");
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl
});

await client.connect();

try {
  const passwordHash = hashPassword(password);
  const result = await client.query(
    `
      UPDATE app_users
      SET password_hash = $2,
          password_updated_at = NOW()
      WHERE username = $1
      RETURNING id, username, is_active
    `,
    [username, passwordHash]
  );

  if (result.rows.length === 0) {
    console.error(`[user:set-password] User not found: ${username}`);
    process.exit(1);
  }

  console.log(`[user:set-password] OK ${result.rows[0].username}`);
} finally {
  await client.end();
}

function normalizeUsername(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1
  });

  return [
    "scrypt",
    "16384",
    "8",
    "1",
    salt.toString("hex"),
    derivedKey.toString("hex")
  ].join("$");
}
