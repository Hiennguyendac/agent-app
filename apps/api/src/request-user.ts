import type { IncomingMessage } from "node:http";
import { getSessionUserId } from "./session.js";

export interface TaskAccessContext {
  enforceOwnership: boolean;
  userId: string | null;
}

export async function resolveTaskAccessContext(
  req: IncomingMessage
): Promise<TaskAccessContext> {
  return {
    enforceOwnership: isTaskOwnershipEnforced(),
    userId: await resolveRequestUserId(req)
  };
}

export function isTaskOwnershipEnforced(): boolean {
  return process.env.ENFORCE_TASK_OWNERSHIP === "true";
}

export function isProductionIdentityRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

export async function resolveRequestUserId(
  req: IncomingMessage
): Promise<string | null> {
  const userIdFromSession = await getSessionUserId(req);

  if (userIdFromSession) {
    return userIdFromSession;
  }

  if (isProductionIdentityRuntime()) {
    return null;
  }

  const headerValue = req.headers["x-user-id"];
  const normalizedHeaderValue = Array.isArray(headerValue)
    ? headerValue[0]
    : headerValue;

  const userIdFromHeader = normalizeUserId(normalizedHeaderValue);

  if (userIdFromHeader) {
    return userIdFromHeader;
  }

  return (
    normalizeUserId(process.env.MOCK_USER_ID) ??
    normalizeUserId(process.env.DEFAULT_USER_ID)
  );
}

function normalizeUserId(value: string | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim();
  return normalizedValue.length > 0 ? normalizedValue : null;
}
