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
