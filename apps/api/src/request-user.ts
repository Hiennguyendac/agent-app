import type { IncomingMessage } from "node:http";

export interface TaskAccessContext {
  enforceOwnership: boolean;
  userId: string | null;
}

export function resolveTaskAccessContext(req: IncomingMessage): TaskAccessContext {
  return {
    enforceOwnership: isTaskOwnershipEnforced(),
    userId: resolveRequestUserId(req)
  };
}

export function isTaskOwnershipEnforced(): boolean {
  return process.env.ENFORCE_TASK_OWNERSHIP === "true";
}

export function resolveRequestUserId(req: IncomingMessage): string | null {
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
