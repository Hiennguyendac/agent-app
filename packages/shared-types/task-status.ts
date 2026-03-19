/**
 * TaskStatus describes where a task is in its lifecycle.
 *
 * These values are intentionally simple so the web app, API,
 * and orchestrator can all use the same language.
 */
export type TaskStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed";
