import type { IncomingMessage, ServerResponse } from "node:http";
import { routeTask } from "../../orchestrator/src/index.js";
import { logError, logInfo, logRequest } from "./log.js";
import {
  createTask,
  deleteTask,
  getTaskItemById,
  listTaskItems,
  saveTaskResult,
  updateTaskStatus,
  type CreateTaskInput
} from "./store.js";

/**
 * This file contains the basic HTTP logic for the API.
 *
 * It handles:
 * - GET /health
 * - GET /tasks
 * - GET /tasks/:id
 * - POST /tasks
 * - DELETE /tasks/:id
 */

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";
  const startedAtMs = Date.now();
  const taskId = getTaskIdFromUrl(url);

  if (method === "GET" && url === "/health") {
    sendJson(res, 200, {
      status: "ok"
    }, startedAtMs, method, url);
    return;
  }

  if (method === "GET" && url === "/tasks") {
    logInfo("Listing tasks");
    sendJson(res, 200, {
      tasks: await listTaskItems()
    }, startedAtMs, method, url);
    return;
  }

  if (method === "POST" && url === "/tasks") {
    const body = await readJsonBody(req);
    logInfo("Received task creation request");

    if (!isCreateTaskInput(body)) {
      sendJson(res, 400, {
        error: getCreateTaskInputError(body)
      }, startedAtMs, method, url);
      return;
    }

    const task = await createTask(body);

    try {
      await updateTaskStatus(task.id, "running");
      const result = await routeTask(task);
      await saveTaskResult(result);
      const updatedTask = (await updateTaskStatus(task.id, "completed")) ?? task;

      logInfo("Task completed", {
        taskId: updatedTask.id,
        status: updatedTask.status
      });

      sendJson(res, 201, {
        task: updatedTask,
        result
      }, startedAtMs, method, url, {
        taskId: updatedTask.id
      });
    } catch (error: unknown) {
      const failedTask = (await updateTaskStatus(task.id, "failed")) ?? task;

      logError("Task processing failed", {
        taskId: failedTask.id,
        error: error instanceof Error ? error.message : String(error)
      });

      sendJson(res, 500, {
        task: failedTask,
        error:
          error instanceof Error ? error.message : "Failed to process task"
      }, startedAtMs, method, url, {
        taskId: failedTask.id
      });
    }
    return;
  }

  if (method === "GET" && taskId) {
    const taskItem = await getTaskItemById(taskId);

    if (!taskItem) {
      sendJson(res, 404, {
        error: "Task not found"
      }, startedAtMs, method, url, {
        taskId
      });
      return;
    }

    sendJson(res, 200, taskItem, startedAtMs, method, url, {
      taskId
    });
    return;
  }

  if (method === "DELETE" && taskId) {
    const deleted = await deleteTask(taskId);

    if (!deleted) {
      sendJson(res, 404, {
        error: "Task not found"
      }, startedAtMs, method, url, {
        taskId
      });
      return;
    }

    logInfo("Task deleted", {
      taskId
    });

    sendJson(res, 200, {
      success: true
    }, startedAtMs, method, url, {
      taskId
    });
    return;
  }

  sendJson(res, 404, {
    error: "Route not found"
  }, startedAtMs, method, url);
}

function getTaskIdFromUrl(url: string): string | null {
  const match = /^\/tasks\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

/**
 * Reads the request body and converts it from JSON into a JavaScript object.
 */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return {};
  }
}

/**
 * Validates the body for creating a Growth task.
 *
 * If the data is valid, this function returns null.
 * If the data is invalid, it returns an error message.
 */
function getCreateTaskInputError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const input = body as Partial<CreateTaskInput>;

  if (!isNonEmptyString(input.title)) {
    return "Field 'title' is required";
  }

  if (!isNonEmptyString(input.goal)) {
    return "Field 'goal' is required";
  }

  if (!isNonEmptyString(input.audience)) {
    return "Field 'audience' is required";
  }

  if (input.notes !== undefined && typeof input.notes !== "string") {
    return "Field 'notes' must be a string if provided";
  }

  return null;
}

/**
 * TypeScript needs a type guard to understand that the request body
 * is safe to use as CreateTaskInput after validation.
 */
function isCreateTaskInput(body: unknown): body is CreateTaskInput {
  return getCreateTaskInputError(body) === null;
}

/**
 * Helper for simple string validation.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Sends a JSON response with the correct headers.
 */
function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
  startedAtMs?: number,
  method?: string,
  path?: string,
  metadata?: Record<string, unknown>
): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json"
  });
  res.end(JSON.stringify(payload, null, 2));

  if (startedAtMs !== undefined && method && path) {
    logRequest(method, path, statusCode, startedAtMs, metadata);
  }
}
