import { randomUUID } from "node:crypto";
import type { IncomingMessage } from "node:http";
import { getDbPool, handleStorageFailure } from "./db.js";

const SESSION_COOKIE_NAME = "agent_app_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface SessionRecord {
  userId: string;
  expiresAt: number;
}

const fallbackSessions = new Map<string, SessionRecord>();

export async function createSession(userId: string): Promise<string> {
  const sessionId = randomUUID();
  const session = createSessionRecord(userId);

  try {
    await getDbPool().query(
      `
        INSERT INTO auth_sessions (
          id,
          user_id,
          expires_at
        )
        VALUES ($1, $2, to_timestamp($3 / 1000.0))
      `,
      [sessionId, session.userId, session.expiresAt]
    );
  } catch (error) {
    handleStorageFailure("createSession()", error);
    fallbackSessions.set(sessionId, session);
  }

  return sessionId;
}

export async function getSessionUserId(req: IncomingMessage): Promise<string | null> {
  const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);

  if (!sessionId) {
    return null;
  }

  try {
    const result = await getDbPool().query(
      `
        SELECT
          s.user_id,
          EXTRACT(EPOCH FROM s.expires_at) * 1000 AS expires_at_ms
        FROM auth_sessions s
        INNER JOIN app_users u
          ON u.id = s.user_id
         AND u.is_active = true
        WHERE s.id = $1
        LIMIT 1
      `,
      [sessionId]
    );

    if (result.rows.length === 0) {
      fallbackSessions.delete(sessionId);
      return null;
    }

    const session = {
      userId: result.rows[0].user_id as string,
      expiresAt: Number(result.rows[0].expires_at_ms)
    };

    if (session.expiresAt <= Date.now()) {
      await deleteSessionById(sessionId);
      return null;
    }

    return session.userId;
  } catch (error) {
    handleStorageFailure("getSessionUserId()", error);
    return getFallbackSessionUserId(sessionId);
  }
}

export async function clearSession(req: IncomingMessage): Promise<void> {
  const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);

  if (!sessionId) {
    return;
  }

  await deleteSessionById(sessionId);
}

export function buildSessionCookieHeader(sessionId: string): string {
  return [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`,
    isSecureCookieEnabled() ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

export function buildClearedSessionCookieHeader(): string {
  return [
    `${SESSION_COOKIE_NAME}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    isSecureCookieEnabled() ? "Secure" : ""
  ]
    .filter(Boolean)
    .join("; ");
}

function createSessionRecord(userId: string): SessionRecord {
  return {
    userId,
    expiresAt: Date.now() + SESSION_TTL_MS
  };
}

async function deleteSessionById(sessionId: string): Promise<void> {
  try {
    await getDbPool().query(
      `
        DELETE FROM auth_sessions
        WHERE id = $1
      `,
      [sessionId]
    );
  } catch (error) {
    handleStorageFailure("clearSession()", error);
  }

  fallbackSessions.delete(sessionId);
}

function getFallbackSessionUserId(sessionId: string): string | null {
  const session = fallbackSessions.get(sessionId);

  if (!session) {
    return null;
  }

  if (session.expiresAt <= Date.now()) {
    fallbackSessions.delete(sessionId);
    return null;
  }

  return session.userId;
}

function getCookieValue(req: IncomingMessage, cookieName: string): string | null {
  const rawCookieHeader = req.headers.cookie;

  if (!rawCookieHeader) {
    return null;
  }

  const cookies = rawCookieHeader.split(";");

  for (const cookie of cookies) {
    const [name, ...valueParts] = cookie.trim().split("=");

    if (name !== cookieName) {
      continue;
    }

    const rawValue = valueParts.join("=");

    if (!rawValue) {
      return null;
    }

    try {
      return decodeURIComponent(rawValue);
    } catch {
      return rawValue;
    }
  }

  return null;
}

function isSecureCookieEnabled(): boolean {
  return process.env.NODE_ENV === "production";
}
