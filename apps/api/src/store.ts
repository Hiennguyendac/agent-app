import type {
  Task,
  TaskResult,
  TaskStatus,
  TaskUpdate,
  TaskExecutionStatus
} from "../../../packages/shared-types/index.js";
import { getDbPool, handleStorageFailure } from "./db.js";
import type { TaskAccessContext } from "./request-user.js";

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
const taskOwners = new Map<string, string | null>();
const taskOwnerDepartments = new Map<string, string | null>();

const INITIAL_TASK_STATUS: TaskStatus = "pending";

export interface CreateTaskInput {
  title: string;
  goal: string;
  audience: string;
  notes?: string;
  taskType?: Task["taskType"];
  workItemId?: string;
  assignmentId?: string;
  ownerDepartmentId?: string;
  progressPercent?: number;
  acceptedAt?: string;
  completedAt?: string;
}

export interface TaskListItem {
  task: Task;
  result?: TaskResult;
}

export interface CreateTaskUpdateInput {
  executionStatus: TaskExecutionStatus;
  progressPercent: number;
  note?: string;
}

export async function listTasks(accessContext?: TaskAccessContext): Promise<Task[]> {
  try {
    const pool = getDbPool();
    const ownershipClause = buildOwnershipWhereClause(1, accessContext);
    const result = await pool.query(
      `
        SELECT
          t.id,
          t.task_type,
          t.title,
          t.goal,
          t.audience,
          t.notes,
          t.status,
          t.created_at,
          t.owner_id,
          t.work_item_id,
          t.assignment_id,
          t.owner_department_id,
          t.progress_percent,
          t.accepted_at,
          t.completed_at,
          t.report_submitted_at,
          t.report_note,
          t.quality_check_passed,
          t.quality_check_note,
          t.quality_checked_at,
          t.principal_approved_at,
          t.principal_approval_note
        FROM tasks t
        ${ownershipClause.clause}
        ORDER BY t.created_at DESC
      `,
      ownershipClause.values
    );

    const dbTasks = result.rows.map(mapTaskRowToTask);
    syncTasksMemory(dbTasks);
    syncTaskOwnersMemory(result.rows);
    return dbTasks;
  } catch (error) {
    handleStorageFailure("listTasks()", error);
    return tasks.filter((task) => hasTaskAccess(task.id, accessContext));
  }
}

export async function listTaskItems(
  accessContext?: TaskAccessContext
): Promise<TaskListItem[]> {
  try {
    const pool = getDbPool();
    const ownershipClause = buildOwnershipWhereClause(1, accessContext);

    const tasksResult = await pool.query(
      `
        SELECT
          t.id,
          t.task_type,
          t.title,
          t.goal,
          t.audience,
          t.notes,
          t.status,
          t.created_at,
          t.owner_id,
          t.work_item_id,
          t.assignment_id,
          t.owner_department_id,
          t.progress_percent,
          t.accepted_at,
          t.completed_at,
          t.report_submitted_at,
          t.report_note,
          t.quality_check_passed,
          t.quality_check_note,
          t.quality_checked_at,
          t.principal_approved_at,
          t.principal_approval_note
        FROM tasks t
        ${ownershipClause.clause}
        ORDER BY t.created_at DESC
      `,
      ownershipClause.values
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
    syncTaskOwnersMemory(tasksResult.rows);
    syncTaskResultsMemory(dbResults);

    return dbTasks.map((task) => ({
      task,
      result: taskResults.get(task.id)
    }));
  } catch (error) {
    handleStorageFailure("listTaskItems()", error);
    return tasks
      .filter((task) => hasTaskAccess(task.id, accessContext))
      .map((task) => ({
      task,
      result: taskResults.get(task.id)
    }));
  }
}

export async function getTaskItemById(
  taskId: string,
  accessContext?: TaskAccessContext
): Promise<TaskListItem | undefined> {
  try {
    const pool = getDbPool();
    const ownershipClause = buildOwnershipWhereClause(2, accessContext);

    const taskResult = await pool.query(
      `
        SELECT
          t.id,
          t.task_type,
          t.title,
          t.goal,
          t.audience,
          t.notes,
          t.status,
          t.created_at,
          t.owner_id,
          t.work_item_id,
          t.assignment_id,
          t.owner_department_id,
          t.progress_percent,
          t.accepted_at,
          t.completed_at,
          t.report_submitted_at,
          t.report_note,
          t.quality_check_passed,
          t.quality_check_note,
          t.quality_checked_at,
          t.principal_approved_at,
          t.principal_approval_note
        FROM tasks t
        WHERE t.id = $1
        ${ownershipClause.clause ? `AND (${ownershipClause.clause.replace(/^WHERE\s+/u, "")})` : ""}
      `,
      [taskId, ...ownershipClause.values]
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
    upsertTaskOwnerInMemory(task.id, taskResult.rows[0].owner_id ?? null);
    upsertTaskOwnerDepartmentInMemory(
      task.id,
      (taskResult.rows[0].owner_department_id as string | null) ?? null
    );

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
    handleStorageFailure("getTaskItemById()", error);

    const task = tasks.find((item) => item.id === taskId);

    if (!task || !hasTaskAccess(task.id, accessContext)) {
      return undefined;
    }

    return {
      task,
      result: taskResults.get(taskId)
    };
  }
}

export async function createTask(
  input: CreateTaskInput,
  ownerId: string | null = null
): Promise<Task> {
  const task: Task = {
    id: createTaskId(),
    taskType: input.taskType ?? "growth",
    title: input.title,
    goal: input.goal,
    audience: input.audience,
    notes: input.notes,
    ownerId: ownerId ?? undefined,
    workItemId: input.workItemId,
    assignmentId: input.assignmentId,
    ownerDepartmentId: input.ownerDepartmentId,
    progressPercent: input.progressPercent ?? 0,
    acceptedAt: input.acceptedAt,
    completedAt: input.completedAt,
    status: INITIAL_TASK_STATUS,
    createdAt: new Date().toISOString()
  };

  try {
    await insertTaskIntoPostgres(task, ownerId);

    console.log(
      `[api] Stored task ${task.id} with title "${task.title}" in PostgreSQL`
    );
  } catch (error) {
    handleStorageFailure("createTask()", error);
  }

  upsertTaskInMemory(task);
  upsertTaskOwnerInMemory(task.id, ownerId);
  upsertTaskOwnerDepartmentInMemory(task.id, input.ownerDepartmentId ?? null);
  return task;
}

export async function acceptAssignedTask(taskId: string): Promise<Task | undefined> {
  return updateTaskAssignmentState(taskId, "running", {
    acceptedAt: new Date().toISOString(),
    progressPercent: 10
  });
}

export async function rejectAssignedTask(taskId: string): Promise<Task | undefined> {
  return updateTaskAssignmentState(taskId, "failed", {
    progressPercent: 0
  });
}

export async function submitTaskResponse(
  taskId: string
): Promise<Task | undefined> {
  return updateTaskAssignmentState(taskId, "running", {
    progressPercent: 90
  });
}

export async function approveTaskResponse(
  taskId: string
): Promise<Task | undefined> {
  return updateTaskAssignmentState(taskId, "completed", {
    progressPercent: 100,
    completedAt: new Date().toISOString()
  });
}

export async function submitTaskReport(
  taskId: string,
  reportNote: string
): Promise<Task | undefined> {
  const pool = getDbPool();
  const now = new Date().toISOString();
  const result = await pool.query(
    `
      UPDATE tasks
      SET report_submitted_at = $2,
          report_note = $3,
          progress_percent = 90,
          status = 'running'
      WHERE id = $1
      RETURNING
        id, task_type, title, goal, audience, notes, status, created_at,
        owner_id, work_item_id, assignment_id, owner_department_id,
        progress_percent, accepted_at, completed_at,
        report_submitted_at, report_note, quality_check_passed, quality_check_note,
        quality_checked_at, principal_approved_at, principal_approval_note
    `,
    [taskId, now, reportNote]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  const task = mapTaskRowToTask(result.rows[0]);
  upsertTaskInMemory(task);
  return task;
}

export async function recordQualityCheck(
  taskId: string,
  passed: boolean,
  note: string
): Promise<Task | undefined> {
  const pool = getDbPool();
  const now = new Date().toISOString();
  const newStatus = passed ? "running" : "running";
  const newProgress = passed ? 95 : 80;
  const result = await pool.query(
    `
      UPDATE tasks
      SET quality_check_passed = $2,
          quality_check_note = $3,
          quality_checked_at = $4,
          progress_percent = $5,
          status = $6
      WHERE id = $1
      RETURNING
        id, task_type, title, goal, audience, notes, status, created_at,
        owner_id, work_item_id, assignment_id, owner_department_id,
        progress_percent, accepted_at, completed_at,
        report_submitted_at, report_note, quality_check_passed, quality_check_note,
        quality_checked_at, principal_approved_at, principal_approval_note
    `,
    [taskId, passed, note, now, newProgress, newStatus]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  const task = mapTaskRowToTask(result.rows[0]);
  upsertTaskInMemory(task);
  return task;
}

export async function principalApproveTask(
  taskId: string,
  approvalNote: string
): Promise<Task | undefined> {
  const pool = getDbPool();
  const now = new Date().toISOString();
  const result = await pool.query(
    `
      UPDATE tasks
      SET principal_approved_at = $2,
          principal_approval_note = $3,
          progress_percent = 100,
          status = 'completed',
          completed_at = $2
      WHERE id = $1
      RETURNING
        id, task_type, title, goal, audience, notes, status, created_at,
        owner_id, work_item_id, assignment_id, owner_department_id,
        progress_percent, accepted_at, completed_at,
        report_submitted_at, report_note, quality_check_passed, quality_check_note,
        quality_checked_at, principal_approved_at, principal_approval_note
    `,
    [taskId, now, approvalNote]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  const task = mapTaskRowToTask(result.rows[0]);
  upsertTaskInMemory(task);
  return task;
}

export interface TaskUpdateFileInput {
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  contentText?: string;
  contentBase64?: string;
}

export async function addTaskUpdateFile(
  taskUpdateId: string,
  taskId: string,
  input: TaskUpdateFileInput,
  uploadedByUserId: string
): Promise<{ id: string; taskUpdateId: string; taskId: string; filename: string; contentType?: string; sizeBytes?: number; hasFileContent: boolean; uploadedByUserId: string; createdAt: string }> {
  const fileId = `tuf_${taskId}_${Math.random().toString(36).slice(2, 8)}`;
  const result = await getDbPool().query(
    `
      INSERT INTO task_update_files (
        id, task_update_id, task_id, filename, content_type,
        size_bytes, content_text, content_base64, uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, task_update_id, task_id, filename, content_type, size_bytes, uploaded_by_user_id, created_at
    `,
    [
      fileId,
      taskUpdateId,
      taskId,
      input.filename,
      input.contentType ?? null,
      input.sizeBytes ?? null,
      input.contentText ?? null,
      input.contentBase64 ?? null,
      uploadedByUserId
    ]
  );

  const row = result.rows[0];
  return {
    id: row.id,
    taskUpdateId: row.task_update_id,
    taskId: row.task_id,
    filename: row.filename,
    contentType: row.content_type ?? undefined,
    sizeBytes: row.size_bytes ? Number(row.size_bytes) : undefined,
    hasFileContent: Boolean(input.contentText || input.contentBase64),
    uploadedByUserId: row.uploaded_by_user_id,
    createdAt: row.created_at
  };
}

export async function listTaskUpdateFiles(taskId: string): Promise<Array<{
  id: string; taskUpdateId: string; taskId: string; filename: string;
  contentType?: string; sizeBytes?: number; hasFileContent: boolean;
  uploadedByUserId?: string; createdAt: string;
}>> {
  const result = await getDbPool().query(
    `
      SELECT id, task_update_id, task_id, filename, content_type, size_bytes,
             content_text, content_base64, uploaded_by_user_id, created_at
      FROM task_update_files
      WHERE task_id = $1
      ORDER BY created_at DESC
    `,
    [taskId]
  );

  return result.rows.map((row) => ({
    id: row.id,
    taskUpdateId: row.task_update_id,
    taskId: row.task_id,
    filename: row.filename,
    contentType: row.content_type ?? undefined,
    sizeBytes: row.size_bytes ? Number(row.size_bytes) : undefined,
    hasFileContent:
      (typeof row.content_text === "string" && row.content_text.length > 0) ||
      (typeof row.content_base64 === "string" && row.content_base64.length > 0),
    uploadedByUserId: row.uploaded_by_user_id ?? undefined,
    createdAt: row.created_at
  }));
}

export async function updateTaskWithAssignmentLink(
  taskId: string,
  assignmentId: string
): Promise<Task | undefined> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE tasks
      SET assignment_id = $2
      WHERE id = $1
      RETURNING
        id,
        task_type,
        title,
        goal,
        audience,
        notes,
        status,
        created_at,
        owner_id,
        work_item_id,
        assignment_id,
        owner_department_id,
        progress_percent,
        accepted_at,
        completed_at,
        report_submitted_at,
        report_note,
        quality_check_passed,
        quality_check_note,
        quality_checked_at,
        principal_approved_at,
        principal_approval_note
    `,
    [taskId, assignmentId]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  const task = mapTaskRowToTask(result.rows[0]);
  upsertTaskInMemory(task);
  upsertTaskOwnerInMemory(task.id, result.rows[0].owner_id ?? null);
  upsertTaskOwnerDepartmentInMemory(
    task.id,
    (result.rows[0].owner_department_id as string | null) ?? null
  );
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
    handleStorageFailure("updateTaskStatus()", error);
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
    handleStorageFailure("saveTaskResult()", error);
  }

  taskResults.set(result.taskId, result);
}

export async function deleteTask(taskId: string): Promise<boolean> {
  return deleteTaskWithAccess(taskId);
}

export async function deleteTaskWithAccess(
  taskId: string,
  accessContext?: TaskAccessContext
): Promise<boolean> {
  let deletedInPostgres = false;

  try {
    deletedInPostgres = await deleteTaskInPostgres(taskId, accessContext);
  } catch (error) {
    handleStorageFailure("deleteTask()", error);
  }

  const deletedInMemory = deleteTaskFromMemory(taskId, accessContext);

  return deletedInPostgres || deletedInMemory;
}

export async function listTaskUpdates(
  taskId: string,
  accessContext?: TaskAccessContext
): Promise<TaskUpdate[]> {
  const taskItem = await getTaskItemById(taskId, accessContext);

  if (!taskItem) {
    return [];
  }

  const result = await getDbPool().query(
    `
      SELECT
        id,
        task_id,
        updated_by_user_id,
        execution_status,
        progress_percent,
        note,
        created_at
      FROM task_updates
      WHERE task_id = $1
      ORDER BY created_at DESC
    `,
    [taskId]
  );

  return result.rows.map(mapTaskUpdateRow);
}

export async function createTaskUpdate(
  taskId: string,
  input: CreateTaskUpdateInput,
  updatedByUserId: string,
  accessContext?: TaskAccessContext
): Promise<TaskUpdate | null> {
  const taskItem = await getTaskItemById(taskId, accessContext);

  if (!taskItem) {
    return null;
  }

  const updateResult = await getDbPool().query(
    `
      INSERT INTO task_updates (
        id,
        task_id,
        updated_by_user_id,
        execution_status,
        progress_percent,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        task_id,
        updated_by_user_id,
        execution_status,
        progress_percent,
        note,
        created_at
    `,
    [
      createTaskUpdateId(taskId),
      taskId,
      updatedByUserId,
      input.executionStatus,
      input.progressPercent,
      input.note ?? null
    ]
  );

  const nextTaskStatus =
    input.executionStatus === "pending"
      ? "pending"
      : "running";

  await updateTaskAssignmentState(taskId, nextTaskStatus, {
    progressPercent: input.progressPercent
  });

  return mapTaskUpdateRow(updateResult.rows[0]);
}

export async function createAttachmentTaskUpdate(
  taskId: string,
  updatedByUserId: string,
  accessContext?: TaskAccessContext
): Promise<TaskUpdate | null> {
  const taskItem = await getTaskItemById(taskId, accessContext);

  if (!taskItem) {
    return null;
  }

  const executionStatus: TaskExecutionStatus =
    taskItem.task.status === "pending" ? "pending" : "running";

  const updateResult = await getDbPool().query(
    `
      INSERT INTO task_updates (
        id,
        task_id,
        updated_by_user_id,
        execution_status,
        progress_percent,
        note
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        task_id,
        updated_by_user_id,
        execution_status,
        progress_percent,
        note,
        created_at
    `,
    [
      createTaskUpdateId(taskId),
      taskId,
      updatedByUserId,
      executionStatus,
      taskItem.task.progressPercent ?? 0,
      "Evidence attachment uploaded"
    ]
  );

  return mapTaskUpdateRow(updateResult.rows[0]);
}

function createTaskId(): string {
  return `task_${Date.now()}`;
}

async function insertTaskIntoPostgres(
  task: Task,
  ownerId: string | null
): Promise<void> {
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
        created_at,
        owner_id,
        work_item_id,
        assignment_id,
        owner_department_id,
        progress_percent,
        accepted_at,
        completed_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
    `,
    [
      task.id,
      task.taskType,
      task.title,
      task.goal,
      task.audience,
      task.notes ?? null,
      task.status,
      task.createdAt,
      ownerId,
      task.workItemId ?? null,
      task.assignmentId ?? null,
      task.ownerDepartmentId ?? null,
      task.progressPercent ?? 0,
      task.acceptedAt ?? null,
      task.completedAt ?? null
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
        created_at,
        owner_id,
        work_item_id,
        assignment_id,
        owner_department_id,
        progress_percent,
        accepted_at,
        completed_at,
        report_submitted_at,
        report_note,
        quality_check_passed,
        quality_check_note,
        quality_checked_at,
        principal_approved_at,
        principal_approval_note
    `,
    [taskId, status]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  return mapTaskRowToTask(result.rows[0]);
}

async function updateTaskAssignmentState(
  taskId: string,
  status: TaskStatus,
  options: {
    acceptedAt?: string;
    progressPercent?: number;
    completedAt?: string;
  }
): Promise<Task | undefined> {
  const pool = getDbPool();
  const result = await pool.query(
    `
      UPDATE tasks
      SET status = $2,
          accepted_at = COALESCE($3, accepted_at),
          progress_percent = COALESCE($4, progress_percent),
          completed_at = COALESCE($5, completed_at)
      WHERE id = $1
      RETURNING
        id,
        task_type,
        title,
        goal,
        audience,
        notes,
        status,
        created_at,
        owner_id,
        work_item_id,
        assignment_id,
        owner_department_id,
        progress_percent,
        accepted_at,
        completed_at,
        report_submitted_at,
        report_note,
        quality_check_passed,
        quality_check_note,
        quality_checked_at,
        principal_approved_at,
        principal_approval_note
    `,
    [
      taskId,
      status,
      options.acceptedAt ?? null,
      options.progressPercent ?? null,
      options.completedAt ?? null
    ]
  );

  if (result.rows.length === 0) {
    return undefined;
  }

  const task = mapTaskRowToTask(result.rows[0]);
  upsertTaskInMemory(task);
  upsertTaskOwnerInMemory(task.id, result.rows[0].owner_id ?? null);
  upsertTaskOwnerDepartmentInMemory(
    task.id,
    (result.rows[0].owner_department_id as string | null) ?? null
  );
  return task;
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

async function deleteTaskInPostgres(
  taskId: string,
  accessContext?: TaskAccessContext
): Promise<boolean> {
  const pool = getDbPool();
  const client = await pool.connect();
  const ownershipClause = buildOwnershipWhereClause(2, accessContext);
  const deleteTaskParams = [taskId, ...ownershipClause.values];

  try {
    await client.query("BEGIN");

    const taskDeleteResult = await client.query(
      `
        DELETE FROM tasks t
        USING tasks t_filter
        LEFT JOIN app_users owner_user
          ON owner_user.id = t_filter.owner_id
        WHERE t.id = t_filter.id
          AND t.id = $1
          ${ownershipClause.clause ? `AND (${ownershipClause.clause.replace(/^WHERE\s+/u, "")})` : ""}
      `,
      deleteTaskParams
    );

    if ((taskDeleteResult.rowCount ?? 0) === 0) {
      await client.query("ROLLBACK");
      return false;
    }

    await client.query(
      `
        DELETE FROM task_results
        WHERE task_id = $1
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
    ownerId: row.owner_id ?? undefined,
    workItemId: row.work_item_id ?? undefined,
    assignmentId: row.assignment_id ?? undefined,
    ownerDepartmentId: row.owner_department_id ?? undefined,
    progressPercent:
      row.progress_percent !== null && row.progress_percent !== undefined
        ? Number(row.progress_percent)
        : undefined,
    acceptedAt: row.accepted_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    reportSubmittedAt: row.report_submitted_at ?? undefined,
    reportNote: row.report_note ?? undefined,
    qualityCheckPassed:
      row.quality_check_passed !== null && row.quality_check_passed !== undefined
        ? Boolean(row.quality_check_passed)
        : undefined,
    qualityCheckNote: row.quality_check_note ?? undefined,
    qualityCheckedAt: row.quality_checked_at ?? undefined,
    principalApprovedAt: row.principal_approved_at ?? undefined,
    principalApprovalNote: row.principal_approval_note ?? undefined,
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

function mapTaskUpdateRow(row: any): TaskUpdate {
  return {
    id: row.id,
    taskId: row.task_id,
    updatedByUserId: row.updated_by_user_id ?? undefined,
    executionStatus: row.execution_status,
    progressPercent: Number(row.progress_percent ?? 0),
    note: row.note ?? undefined,
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

function createTaskUpdateId(taskId: string): string {
  return `task_update_${taskId}_${Math.random().toString(36).slice(2, 8)}`;
}

function upsertTaskInMemory(task: Task): void {
  const index = tasks.findIndex((item) => item.id === task.id);

  if (index === -1) {
    tasks.push(task);
    return;
  }

  tasks[index] = task;
}

function deleteTaskFromMemory(
  taskId: string,
  accessContext?: TaskAccessContext
): boolean {
  const index = tasks.findIndex((item) => item.id === taskId);

  if (index === -1) {
    return false;
  }

  if (!hasTaskAccess(taskId, accessContext)) {
    return false;
  }

  taskResults.delete(taskId);
  taskOwners.delete(taskId);
  taskOwnerDepartments.delete(taskId);

  tasks.splice(index, 1);
  return true;
}

function syncTasksMemory(dbTasks: Task[]): void {
  tasks.length = 0;
  tasks.push(...dbTasks);
}

function syncTaskOwnersMemory(rows: Array<{ id: string; owner_id?: string | null }>): void {
  taskOwners.clear();
  taskOwnerDepartments.clear();

  for (const row of rows) {
    upsertTaskOwnerInMemory(row.id, row.owner_id ?? null);
    upsertTaskOwnerDepartmentInMemory(
      row.id,
      (row as { owner_department_id?: string | null }).owner_department_id ?? null
    );
  }
}

function syncTaskResultsMemory(results: TaskResult[]): void {
  taskResults.clear();

  for (const result of results) {
    if (!taskResults.has(result.taskId)) {
      taskResults.set(result.taskId, result);
    }
  }
}

function upsertTaskOwnerInMemory(taskId: string, ownerId: string | null): void {
  taskOwners.set(taskId, ownerId);
}

function upsertTaskOwnerDepartmentInMemory(
  taskId: string,
  ownerDepartmentId: string | null
): void {
  taskOwnerDepartments.set(taskId, ownerDepartmentId);
}

function hasTaskAccess(
  taskId: string,
  accessContext?: TaskAccessContext
): boolean {
  if (!accessContext?.enforceOwnership) {
    return true;
  }

  const ownerId = taskOwners.get(taskId) ?? null;
  const ownerDepartmentId = taskOwnerDepartments.get(taskId) ?? null;
  const isLegacyUnowned =
    ownerId === null && ownerDepartmentId === null;

  if (accessContext.role === "principal" || accessContext.role === "admin") {
    return true;
  }

  if (isLegacyUnowned) {
    return true;
  }

  if (
    accessContext.role === "department_head" &&
    accessContext.departmentId &&
    ownerDepartmentId === accessContext.departmentId
  ) {
    return true;
  }

  return ownerId === accessContext.userId;
}

function buildOwnershipWhereClause(
  startIndex: number,
  accessContext?: TaskAccessContext
): { clause: string; values: string[] } {
  if (!accessContext?.enforceOwnership) {
    return {
      clause: "",
      values: []
    };
  }

  if (accessContext.role === "principal" || accessContext.role === "admin") {
    return {
      clause: "",
      values: []
    };
  }

  if (!accessContext.userId) {
    return {
      clause: "WHERE t.owner_id IS NULL AND t.owner_department_id IS NULL",
      values: []
    };
  }

  if (accessContext.role === "department_head" && accessContext.departmentId) {
    return {
      clause: `WHERE (t.owner_id = $${startIndex} OR t.owner_department_id = $${startIndex + 1} OR (t.owner_id IS NULL AND t.owner_department_id IS NULL))`,
      values: [accessContext.userId, accessContext.departmentId]
    };
  }

  return {
    clause: `WHERE (t.owner_id = $${startIndex} OR (t.owner_id IS NULL AND t.owner_department_id IS NULL))`,
    values: [accessContext.userId]
  };
}
