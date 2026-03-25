export function logInfo(message: string, metadata?: Record<string, unknown>): void {
  writeLog("INFO", message, metadata);
}

export function logWarn(message: string, metadata?: Record<string, unknown>): void {
  writeLog("WARN", message, metadata);
}

export function logError(message: string, metadata?: Record<string, unknown>): void {
  writeLog("ERROR", message, metadata);
}

export function logRequest(
  method: string,
  path: string,
  statusCode: number,
  startedAtMs: number,
  metadata?: Record<string, unknown>
): void {
  writeLog("REQ", `${method} ${path}`, {
    statusCode,
    durationMs: Date.now() - startedAtMs,
    ...metadata
  });
}

export function logAuthEvent(
  event: string,
  metadata?: Record<string, unknown>,
  level: "INFO" | "WARN" = "INFO"
): void {
  writeLog(level, `auth.${event}`, {
    at: new Date().toISOString(),
    ...metadata
  });
}

export function logAuditEvent(
  event: string,
  metadata?: Record<string, unknown>,
  level: "INFO" | "WARN" | "ERROR" = "INFO"
): void {
  writeLog(level, event, {
    at: new Date().toISOString(),
    ...metadata
  });
}

function writeLog(
  level: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  if (!metadata || Object.keys(metadata).length === 0) {
    console.log(`[api] [${level}] ${message}`);
    return;
  }

  console.log(`[api] [${level}] ${message}`, metadata);
}
