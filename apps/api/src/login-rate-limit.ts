import type { IncomingMessage } from "node:http";

const MAX_FAILED_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;
const BLOCK_MS = 15 * 60 * 1000;

interface LoginRateLimitEntry {
  failedAttemptTimestamps: number[];
  blockedUntilMs: number;
}

const failedLoginAttempts = new Map<string, LoginRateLimitEntry>();

export function getLoginSourceIdentifier(req: IncomingMessage): string {
  const forwardedFor = readHeaderValue(req.headers["x-forwarded-for"]);

  if (forwardedFor) {
    const firstHop = forwardedFor
      .split(",")
      .map((value) => value.trim())
      .find((value) => value.length > 0);

    if (firstHop) {
      return firstHop;
    }
  }

  const realIp = readHeaderValue(req.headers["x-real-ip"]);

  if (realIp) {
    return realIp.trim();
  }

  return req.socket.remoteAddress?.trim() || "unknown";
}

export function getLoginRateLimitStatus(
  sourceId: string,
  username: string
): {
  limited: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const key = buildKey(sourceId, username);
  const entry = getActiveEntry(key, now);

  if (!entry || entry.blockedUntilMs <= now) {
    return {
      limited: false,
      retryAfterSeconds: 0
    };
  }

  return {
    limited: true,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((entry.blockedUntilMs - now) / 1000)
    )
  };
}

export function recordFailedLoginAttempt(sourceId: string, username: string): void {
  const now = Date.now();
  const key = buildKey(sourceId, username);
  const entry = getActiveEntry(key, now) ?? {
    failedAttemptTimestamps: [],
    blockedUntilMs: 0
  };

  entry.failedAttemptTimestamps.push(now);

  if (entry.failedAttemptTimestamps.length >= MAX_FAILED_ATTEMPTS) {
    entry.blockedUntilMs = now + BLOCK_MS;
  }

  failedLoginAttempts.set(key, entry);
}

export function clearFailedLoginAttempts(sourceId: string, username: string): void {
  failedLoginAttempts.delete(buildKey(sourceId, username));
}

function buildKey(sourceId: string, username: string): string {
  return `${sourceId.toLowerCase()}::${username.toLowerCase()}`;
}

function getActiveEntry(
  key: string,
  now: number
): LoginRateLimitEntry | undefined {
  const entry = failedLoginAttempts.get(key);

  if (!entry) {
    return undefined;
  }

  entry.failedAttemptTimestamps = entry.failedAttemptTimestamps.filter(
    (timestamp) => now - timestamp <= WINDOW_MS
  );

  if (
    entry.failedAttemptTimestamps.length === 0 &&
    entry.blockedUntilMs <= now
  ) {
    failedLoginAttempts.delete(key);
    return undefined;
  }

  failedLoginAttempts.set(key, entry);
  return entry;
}

function readHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0]?.trim() || null;
  }

  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
