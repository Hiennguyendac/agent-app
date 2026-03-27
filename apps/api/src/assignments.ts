import type {
  Assignment,
  AssignmentPriority,
  Notification
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";
import type { TaskAccessContext } from "./request-user.js";

export interface AssignmentDetail {
  assignment: Assignment;
  notifications: Notification[];
}

export interface CancelAssignmentResult {
  assignmentId: string;
  taskId: string;
  workItemId: string;
}

export interface CreateAssignmentInput {
  workItemId: string;
  mainDepartmentId: string;
  coordinatingDepartmentIds?: string[];
  deadline?: string;
  priority: AssignmentPriority;
  outputRequirement?: string;
  note?: string;
  taskId: string;
  createdByUserId: string;
}

export async function acceptAssignment(
  assignmentId: string,
  acceptedByUserId: string,
  accessContext: TaskAccessContext
): Promise<Assignment | null> {
  const detail = await getAssignmentById(assignmentId, accessContext);

  if (!detail) {
    return null;
  }

  const result = await getDbPool().query(
    `
      UPDATE assignments
      SET status = 'accepted',
          accepted_at = NOW(),
          accepted_by_user_id = $2,
          adjustment_requested_at = NULL,
          adjustment_requested_by_user_id = NULL,
          adjustment_reason = NULL
      WHERE id = $1
      RETURNING
        id,
        work_item_id,
        main_department_id,
        coordinating_department_ids,
        status,
        deadline,
        priority,
        output_requirement,
        note,
        task_id,
        created_by_user_id,
        accepted_at,
        accepted_by_user_id,
        adjustment_requested_at,
        adjustment_requested_by_user_id,
        adjustment_reason,
        created_at,
        active
    `,
    [assignmentId, acceptedByUserId]
  );

  return result.rows.length > 0 ? mapAssignmentRow(result.rows[0]) : null;
}

export async function requestAssignmentAdjustment(
  assignmentId: string,
  requestedByUserId: string,
  reason: string | null,
  accessContext: TaskAccessContext
): Promise<Assignment | null> {
  const detail = await getAssignmentById(assignmentId, accessContext);

  if (!detail) {
    return null;
  }

  const result = await getDbPool().query(
    `
      UPDATE assignments
      SET status = 'adjustment_requested',
          adjustment_requested_at = NOW(),
          adjustment_requested_by_user_id = $2,
          adjustment_reason = $3
      WHERE id = $1
      RETURNING
        id,
        work_item_id,
        main_department_id,
        coordinating_department_ids,
        status,
        deadline,
        priority,
        output_requirement,
        note,
        task_id,
        created_by_user_id,
        accepted_at,
        accepted_by_user_id,
        adjustment_requested_at,
        adjustment_requested_by_user_id,
        adjustment_reason,
        created_at,
        active
    `,
    [assignmentId, requestedByUserId, reason]
  );

  return result.rows.length > 0 ? mapAssignmentRow(result.rows[0]) : null;
}

export async function cancelAssignment(
  assignmentId: string,
  accessContext: TaskAccessContext
): Promise<CancelAssignmentResult | null> {
  const detail = await getAssignmentById(assignmentId, accessContext);

  if (!detail) {
    return null;
  }

  const pool = getDbPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const taskStateResult = await client.query(
      `
        SELECT
          status,
          progress_percent,
          completed_at
        FROM tasks
        WHERE id = $1
        LIMIT 1
      `,
      [detail.assignment.taskId]
    );

    const taskState = taskStateResult.rows[0];

    if (
      taskState &&
      ((taskState.status as string) !== "pending" ||
        Number(taskState.progress_percent ?? 0) > 0 ||
        taskState.completed_at)
    ) {
      await client.query("ROLLBACK");
      throw new Error(
        "This assignment already has execution history. It cannot be cancelled anymore."
      );
    }

    await client.query(
      `
        DELETE FROM notifications
        WHERE assignment_id = $1
      `,
      [assignmentId]
    );

    await client.query(
      `
        DELETE FROM submission_reviews
        WHERE task_id = $1
      `,
      [detail.assignment.taskId]
    );

    await client.query(
      `
        DELETE FROM task_updates
        WHERE task_id = $1
      `,
      [detail.assignment.taskId]
    );

    await client.query(
      `
        DELETE FROM task_results
        WHERE task_id = $1
      `,
      [detail.assignment.taskId]
    );

    await client.query(
      `
        DELETE FROM tasks
        WHERE id = $1
      `,
      [detail.assignment.taskId]
    );

    await client.query(
      `
        DELETE FROM assignments
        WHERE id = $1
      `,
      [assignmentId]
    );

    await client.query(
      `
        UPDATE work_items
        SET status = 'waiting_assignment',
            updated_at = NOW()
        WHERE id = $1
      `,
      [detail.assignment.workItemId]
    );

    await client.query("COMMIT");

    return {
      assignmentId,
      taskId: detail.assignment.taskId,
      workItemId: detail.assignment.workItemId
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createAssignment(
  input: CreateAssignmentInput
): Promise<Assignment> {
  const result = await getDbPool().query(
    `
      INSERT INTO assignments (
        id,
        work_item_id,
        main_department_id,
        coordinating_department_ids,
        status,
        deadline,
        priority,
        output_requirement,
        note,
        task_id,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        work_item_id,
        main_department_id,
        coordinating_department_ids,
        status,
        deadline,
        priority,
        output_requirement,
        note,
        task_id,
        created_by_user_id,
        accepted_at,
        accepted_by_user_id,
        adjustment_requested_at,
        adjustment_requested_by_user_id,
        adjustment_reason,
        created_at,
        active
    `,
    [
      createAssignmentId(input.workItemId),
      input.workItemId,
      input.mainDepartmentId,
      input.coordinatingDepartmentIds ?? [],
      "waiting_acceptance",
      input.deadline ?? null,
      input.priority,
      input.outputRequirement ?? null,
      input.note ?? null,
      input.taskId,
      input.createdByUserId
    ]
  );

  return mapAssignmentRow(result.rows[0]);
}

export async function getAssignmentById(
  assignmentId: string,
  accessContext: TaskAccessContext
): Promise<AssignmentDetail | null> {
  const access = buildAssignmentAccessWhereClause(2, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        a.id,
        a.work_item_id,
        a.main_department_id,
        a.coordinating_department_ids,
        a.status,
        a.deadline,
        a.priority,
        a.output_requirement,
        a.note,
        a.task_id,
        a.created_by_user_id,
        a.accepted_at,
        a.accepted_by_user_id,
        a.adjustment_requested_at,
        a.adjustment_requested_by_user_id,
        a.adjustment_reason,
        a.created_at,
        a.active
      FROM assignments a
      LEFT JOIN tasks t
        ON t.id = a.task_id
      WHERE a.id = $1
      ${access.clause ? `AND (${access.clause.replace(/^WHERE\s+/u, "")})` : ""}
      LIMIT 1
    `,
    [assignmentId, ...access.values]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const assignment = mapAssignmentRow(result.rows[0]);
  const notifications = await listNotificationsForAssignment(assignment.id);

  return {
    assignment,
    notifications
  };
}

export async function listAssignments(
  accessContext: TaskAccessContext,
  filters?: { workItemId?: string }
): Promise<Assignment[]> {
  const access = buildAssignmentAccessWhereClause(2, accessContext);
  const hasWorkItemFilter = typeof filters?.workItemId === "string" && filters.workItemId.length > 0;
  const result = await getDbPool().query(
    `
      SELECT
        a.id,
        a.work_item_id,
        a.main_department_id,
        a.coordinating_department_ids,
        a.status,
        a.deadline,
        a.priority,
        a.output_requirement,
        a.note,
        a.task_id,
        a.created_by_user_id,
        a.accepted_at,
        a.accepted_by_user_id,
        a.adjustment_requested_at,
        a.adjustment_requested_by_user_id,
        a.adjustment_reason,
        a.created_at,
        a.active
      FROM assignments a
      LEFT JOIN tasks t
        ON t.id = a.task_id
      WHERE ($1::text IS NULL OR a.work_item_id = $1)
      ${access.clause ? `AND (${access.clause.replace(/^WHERE\s+/u, "")})` : ""}
      ORDER BY a.created_at DESC
    `,
    [hasWorkItemFilter ? filters?.workItemId ?? null : null, ...access.values]
  );

  return result.rows.map(mapAssignmentRow);
}

export async function createAssignmentNotification(input: {
  message: string;
  recipientDepartmentId?: string;
  recipientUserId?: string;
  assignmentId?: string;
  workItemId?: string;
}): Promise<Notification> {
  const result = await getDbPool().query(
    `
      INSERT INTO notifications (
        id,
        message,
        recipient_department_id,
        recipient_user_id,
        assignment_id,
        work_item_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        message,
        recipient_department_id,
        recipient_user_id,
        assignment_id,
        work_item_id,
        created_at,
        is_read
    `,
    [
      createNotificationId(),
      input.message,
      input.recipientDepartmentId ?? null,
      input.recipientUserId ?? null,
      input.assignmentId ?? null,
      input.workItemId ?? null
    ]
  );

  return mapNotificationRow(result.rows[0]);
}

export async function listNotifications(
  accessContext: TaskAccessContext
): Promise<Notification[]> {
  const access = buildNotificationAccessWhereClause(1, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        id,
        message,
        recipient_department_id,
        recipient_user_id,
        assignment_id,
        work_item_id,
        created_at,
        is_read
      FROM notifications
      ${access.clause}
      ORDER BY created_at DESC
      LIMIT 50
    `,
    access.values
  );

  return result.rows.map(mapNotificationRow);
}

function buildAssignmentAccessWhereClause(
  startIndex: number,
  accessContext: TaskAccessContext
): { clause: string; values: string[] } {
  if (accessContext.role === "principal" || accessContext.role === "admin") {
    return {
      clause: "",
      values: []
    };
  }

  if (accessContext.role === "department_head" && accessContext.departmentId) {
    return {
      clause: `WHERE (a.main_department_id = $${startIndex} OR t.owner_department_id = $${startIndex})`,
      values: [accessContext.departmentId]
    };
  }

  if (accessContext.userId) {
    return {
      clause: `WHERE t.owner_id = $${startIndex}`,
      values: [accessContext.userId]
    };
  }

  return {
    clause: "WHERE 1 = 0",
    values: []
  };
}

function buildNotificationAccessWhereClause(
  startIndex: number,
  accessContext: TaskAccessContext
): { clause: string; values: string[] } {
  if (accessContext.role === "principal" || accessContext.role === "admin") {
    return {
      clause: "",
      values: []
    };
  }

  if (accessContext.role === "department_head" && accessContext.departmentId) {
    return {
      clause: `WHERE recipient_department_id = $${startIndex}`,
      values: [accessContext.departmentId]
    };
  }

  if (accessContext.userId) {
    return {
      clause: `WHERE recipient_user_id = $${startIndex}`,
      values: [accessContext.userId]
    };
  }

  return {
    clause: "WHERE 1 = 0",
    values: []
  };
}

async function listNotificationsForAssignment(
  assignmentId: string
): Promise<Notification[]> {
  const result = await getDbPool().query(
    `
      SELECT
        id,
        message,
        recipient_department_id,
        recipient_user_id,
        assignment_id,
        work_item_id,
        created_at,
        is_read
      FROM notifications
      WHERE assignment_id = $1
      ORDER BY created_at DESC
    `,
    [assignmentId]
  );

  return result.rows.map(mapNotificationRow);
}

function createAssignmentId(workItemId: string): string {
  return `assign_${workItemId}_${Math.random().toString(36).slice(2, 8)}`;
}

function createNotificationId(): string {
  return `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapAssignmentRow(row: Record<string, unknown>): Assignment {
  return {
    id: row.id as string,
    workItemId: row.work_item_id as string,
    mainDepartmentId: row.main_department_id as string,
    coordinatingDepartmentIds:
      (row.coordinating_department_ids as string[] | null) ?? [],
    status:
      (row.status as
        | "draft"
        | "sent"
        | "waiting_acceptance"
        | "accepted"
        | "adjustment_requested"
        | "overdue"
        | "closed") ?? "waiting_acceptance",
    deadline: (row.deadline as string | null) ?? undefined,
    priority: row.priority as AssignmentPriority,
    outputRequirement: (row.output_requirement as string | null) ?? undefined,
    note: (row.note as string | null) ?? undefined,
    taskId: row.task_id as string,
    createdByUserId: row.created_by_user_id as string,
    acceptedAt: (row.accepted_at as string | null) ?? undefined,
    acceptedByUserId: (row.accepted_by_user_id as string | null) ?? undefined,
    adjustmentRequestedAt:
      (row.adjustment_requested_at as string | null) ?? undefined,
    adjustmentRequestedByUserId:
      (row.adjustment_requested_by_user_id as string | null) ?? undefined,
    adjustmentReason: (row.adjustment_reason as string | null) ?? undefined,
    createdAt: row.created_at as string,
    active: Boolean(row.active)
  };
}

function mapNotificationRow(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    message: row.message as string,
    recipientDepartmentId:
      (row.recipient_department_id as string | null) ?? undefined,
    recipientUserId: (row.recipient_user_id as string | null) ?? undefined,
    assignmentId: (row.assignment_id as string | null) ?? undefined,
    workItemId: (row.work_item_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    isRead: Boolean(row.is_read)
  };
}
