import type {
  Task,
  TaskResult,
  TaskStatus
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";

/**
 * Storage strategy:
 * - primary path: PostgreSQL via DATABASE_URL
 * - fallback path: in-memory arrays/maps in this process
 *
 * The in-memory layer now acts as both:
 * - a fallback when PostgreSQL is unavailable
 * - a small read-through mirror of rows already fetched from PostgreSQL
 *
 * This keeps the API running during local setup problems, but it is not a
 * stable production store because data is process-local and resets on restart.
 */
const tasks: Task[] = [];
const taskResults = new Map<string, TaskResult>();

const INITIAL_TASK_STATUS: TaskStatus = "pending";

export interface CreateTaskInput {
  title: string;
  goal: string;
  audience: string;
  notes?: string;
}

export interface TaskListItem {
  task: Task;
  result?: TaskResult;
}

export async function listTasks(): Promise<Task[]> {
  try {
    const pool = getDbPool();
    const result = await pool.query(
      `
        SELECT
          id,
          task_type,
          title,
          goal,
          audience,
          notes,
          status,
          created_at
        FROM tasks
        ORDER BY created_at DESC
      `
    );

    const dbTasks = result.rows.map(mapTaskRowToTask);
    syncTasksMemory(dbTasks);
    return dbTasks;
  } catch (error) {
    console.error("[api] listTasks() falling back to memory:", error);
    return tasks;
  }
}

export async function listTaskItems(): Promise<TaskListItem[]> {
  try {
    const pool = getDbPool();

    const tasksResult = await pool.query(
      `
        SELECT
          id,
          task_type,
          title,
          goal,
          audience,
          notes,
          status,
          created_at
        FROM tasks
        ORDER BY created_at DESC
      `
    );

    const resultsResult = await pool.query(
      `
        SELECT
          id,
          task_id,
          agent_name,
          output_text,
          created_at
        FROM task_results
        ORDER BY created_at DESC
      `
    );

    const dbTasks = tasksResult.rows.map(mapTaskRowToTask);
    const dbResults = resultsResult.rows.map(mapTaskResultRowToTaskResult);

    syncTasksMemory(dbTasks);
    syncTaskResultsMemory(dbResults);

    return dbTasks.map((task) => ({
      task,
      result: taskResults.get(task.id)
    }));
  } catch (error) {
    console.error("[api] listTaskItems() falling back to memory:", error);
    return tasks.map((task) => ({
      task,
      result: taskResults.get(task.id)
    }));
  }
}

export async function getTaskItemById(
  taskId: string
): Promise<TaskListItem | undefined> {
  try {
    const pool = getDbPool();

    const taskResult = await pool.query(
      `
        SELECT
          id,
          task_type,
          title,
          goal,
          audience,
          notes,
          status,
          created_at
        FROM tasks
        WHERE id = $1
      `,
      [taskId]
    );

    if (taskResult.rows.length === 0) {
      return undefined;
    }

    const resultRow = await pool.query(
      `
        SELECT
          id,
          task_id,
          agent_name,
          output_text,
          created_at
        FROM task_results
        WHERE task_id = $1
        ORDER BY created_at DESC
        LIMIT 1
      `,
      [taskId]
    );

    const task = mapTaskRowToTask(taskResult.rows[0]);
    upsertTaskInMemory(task);

    const result =
      resultRow.rows.length > 0
        ? mapTaskResultRowToTaskResult(resultRow.rows[0])
        : undefined;

    if (result) {
      taskResults.set(task.id, result);
    }

    return {
      task,
      result
    };
  } catch (error) {
    console.error("[api] getTaskItemById() falling back to memory:", error);

    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
      return undefined;
    }

    return {
      task,
      result: taskResults.get(taskId)
    };
  }
}

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const task: Task = {
    id: createTaskId(),
    taskType: "growth",
    title: input.title,
    goal: input.goal,
    audience: input.audience,
    notes: input.notes,
    status: INITIAL_TASK_STATUS,
    createdAt: new Date().toISOString()
  };

  try {
    await insertTaskIntoPostgres(task);

    console.log(
      `[api] Stored task ${task.id} with title "${task.title}" in PostgreSQL`
    );
  } catch (error) {
    console.error("[api] createTask() PostgreSQL insert failed, using memory:", error);
  }

  upsertTaskInMemory(task);
  return task;
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus
): Promise<Task | undefined> {
  try {
    const updatedTask = await updateTaskStatusInPostgres(taskId, status);

    if (updatedTask) {
      upsertTaskInMemory(updatedTask);
      return updatedTask;
    }
  } catch (error) {
    console.error("[api] updateTaskStatus() PostgreSQL update failed, using memory:", error);
  }

  const task = tasks.find((item) => item.id === taskId);

  if (!task) {
    return undefined;
  }

  task.status = status;
  return task;
}

export async function saveTaskResult(result: TaskResult): Promise<void> {
  try {
    await insertTaskResultIntoPostgres(result);
  } catch (error) {
    console.error("[api] saveTaskResult() PostgreSQL insert failed, using memory:", error);
  }

  taskResults.set(result.taskId, result);
}

export async function deleteTask(taskId: string): Promise<boolean> {
  let deletedInPostgres = false;

  try {
    deletedInPostgres = await deleteTaskInPostgres(taskId);
  } catch (error) {
    console.error("[api] deleteTask() PostgreSQL delete failed, using memory:", error);
  }

  const deletedInMemory = deleteTaskFromMemory(taskId);

  return deletedInPostgres || deletedInMemory;
}

function createTaskId(): string {
  return `task_${Date.now()}`;
}

async function insertTaskIntoPostgres(task: Task): Promise<void> {
  const pool = getDbPool();

  await pool.query(
    `
      INSERT INTO tasks (
        id,
        task_type,
        title,
        goal,
        audience,
        notes,
        status,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      task.id,
      task.taskType,
      task.title,
      task.goal,
      task.audience,
      task.notes ?? null,
      task.status,
      task.createdAt
    ]
  );
}

async function updateTaskStatusInPostgres(
  taskId: string,
  status: TaskStatus
): Promise<Task | undefined> {
  const pool = getDbPool();

  const result = await pool.query(
    `
      UPDATE tasks
      SET status = $2
      WHERE id = $1
      RETURNING
        id,
        task_type,
        title,
        goal,
        audience,
        notes,
        status,
        created_at
    `,
    [taskId, status]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  return mapTaskRowToTask(result.rows[0]);
}

async function insertTaskResultIntoPostgres(result: TaskResult): Promise<void> {
  const pool = getDbPool();
  const resultId = createTaskResultId(result.taskId);

  await pool.query(
    `
      INSERT INTO task_results (
        id,
        task_id,
        agent_name,
        output_text,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5)
    `,
    [
      resultId,
      result.taskId,
      result.agentName,
      result.outputText,
      result.createdAt
    ]
  );
}

async function deleteTaskInPostgres(taskId: string): Promise<boolean> {
  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    await client.query(
      `
        DELETE FROM task_results
        WHERE task_id = $1
      `,
      [taskId]
    );

    const taskDeleteResult = await client.query(
      `
        DELETE FROM tasks
        WHERE id = $1
      `,
      [taskId]
    );

    await client.query("COMMIT");
    return (taskDeleteResult.rowCount ?? 0) > 0;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function mapTaskRowToTask(row: any): Task {
  return {
    id: row.id,
    taskType: row.task_type,
    title: row.title,
    goal: row.goal,
    audience: row.audience,
    notes: row.notes ?? undefined,
    status: row.status,
    createdAt: row.created_at
  };
}

function mapTaskResultRowToTaskResult(row: any): TaskResult {
  return {
    taskId: row.task_id,
    agentName: row.agent_name,
    outputText: row.output_text,
    createdAt: row.created_at
  };
}

/**
 * task_results has its own database row ID, but the app-level TaskResult
 * shape does not expose that field yet.
 *
 * So for now we generate the database-only ID inside the storage layer.
 */
function createTaskResultId(taskId: string): string {
  return `result_${taskId}`;
}

function upsertTaskInMemory(task: Task): void {
  const index = tasks.findIndex((item) => item.id === task.id);

  if (index === -1) {
    tasks.push(task);
    return;
  }

  tasks[index] = task;
}

function deleteTaskFromMemory(taskId: string): boolean {
  const index = tasks.findIndex((item) => item.id === taskId);

  taskResults.delete(taskId);

  if (index === -1) {
    return false;
  }

  tasks.splice(index, 1);
  return true;
}

function syncTasksMemory(dbTasks: Task[]): void {
  tasks.length = 0;
  tasks.push(...dbTasks);
}

function syncTaskResultsMemory(results: TaskResult[]): void {
  taskResults.clear();

  for (const result of results) {
    if (!taskResults.has(result.taskId)) {
      taskResults.set(result.taskId, result);
    }
  }
}
