import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_KEY_LENGTH = 64;
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const HASH_PREFIX = "scrypt";
const MIN_PASSWORD_LENGTH = 10;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derivedKey = scryptSync(password, salt, SCRYPT_KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P
  });

  return [
    HASH_PREFIX,
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("hex"),
    derivedKey.toString("hex")
  ].join("$");
}

export function verifyPassword(password: string, passwordHash: string): boolean {
  const parts = passwordHash.split("$");

  if (parts.length !== 6 || parts[0] !== HASH_PREFIX) {
    return false;
  }

  const n = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  const salt = Buffer.from(parts[4], "hex");
  const expectedHash = Buffer.from(parts[5], "hex");

  if (
    !Number.isFinite(n) ||
    !Number.isFinite(r) ||
    !Number.isFinite(p) ||
    salt.length === 0 ||
    expectedHash.length === 0
  ) {
    return false;
  }

  const derivedKey = scryptSync(password, salt, expectedHash.length, {
    N: n,
    r,
    p
  });

  return timingSafeEqual(derivedKey, expectedHash);
}

export function getPasswordValidationError(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `New password must be at least ${MIN_PASSWORD_LENGTH} characters long`;
  }

  return null;
}
