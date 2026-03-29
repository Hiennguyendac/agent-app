import type {
  AiAnalysis,
  WorkItem,
  WorkItemFile,
  WorkItemOutputType,
  WorkItemSourceType,
  WorkItemStatus
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";
import type { TaskAccessContext } from "./request-user.js";
import { analyzeWorkItemContent } from "./work-item-ai.js";

export interface WorkItemListItem {
  workItem: WorkItem;
  latestAnalysis?: AiAnalysis;
  files: WorkItemFile[];
}

export interface CreateWorkItemInput {
  title: string;
  description: string;
  departmentId?: string;
  sourceType?: WorkItemSourceType;
  intakeCode?: string;
  deadline?: string;
  outputType?: WorkItemOutputType;
}

export interface UpdateWorkItemInput {
  title?: string;
  description?: string;
  departmentId?: string | null;
  assignedToUserId?: string | null;
  status?: WorkItemStatus;
}

export interface ReviewWorkItemInput {
  decision: "assign" | "return_intake" | "hold";
  leadDepartmentId?: string | null;
  coordinatingDepartmentIds?: string[];
  priority?: "low" | "normal" | "high" | "urgent";
  outputRequirement?: string | null;
  outputType?: WorkItemOutputType | null;
  deadline?: string | null;
  principalNote?: string | null;
}

export interface CreateWorkItemFileInput {
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  contentText?: string;
  contentBase64?: string;
}

export interface DownloadableWorkItemFile {
  filename: string;
  contentType: string;
  content: Buffer;
}

export async function createWorkItem(
  input: CreateWorkItemInput,
  createdByUserId: string
): Promise<WorkItem> {
  const workItemId = createWorkItemId();
  const result = await getDbPool().query(
    `
      INSERT INTO work_items (
        id,
        title,
        description,
        status,
        department_id,
        source_type,
        intake_code,
        deadline,
        output_type,
        created_by_user_id,
        assigned_to_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING
        id,
        title,
        description,
        status,
        department_id,
        lead_department_id,
        coordinating_department_ids,
        routing_priority,
        output_requirement,
        source_type,
        intake_code,
        deadline,
        output_type,
        principal_note,
        principal_decision,
        principal_reviewed_at,
        principal_reviewed_by_user_id,
        created_by_user_id,
        assigned_to_user_id,
        created_at,
        updated_at
    `,
    [
      workItemId,
      input.title,
      input.description,
      "waiting_review",
      input.departmentId ?? null,
      input.sourceType ?? null,
      input.intakeCode ?? null,
      input.deadline ?? null,
      input.outputType ?? null,
      createdByUserId,
      null
    ]
  );

  return mapWorkItemRow(result.rows[0]);
}

export async function listWorkItems(
  accessContext: TaskAccessContext
): Promise<WorkItemListItem[]> {
  const access = buildWorkItemAccessWhereClause(1, accessContext);
  const workItemsResult = await getDbPool().query(
    `
      SELECT
        w.id,
        w.title,
        w.description,
        w.status,
        w.department_id,
        w.lead_department_id,
        w.coordinating_department_ids,
        w.routing_priority,
        w.output_requirement,
        w.source_type,
        w.intake_code,
        w.deadline,
        w.output_type,
        w.principal_note,
        w.principal_decision,
        w.principal_reviewed_at,
        w.principal_reviewed_by_user_id,
        w.created_by_user_id,
        w.assigned_to_user_id,
        w.created_at,
        w.updated_at
      FROM work_items w
      ${access.clause}
      ORDER BY w.created_at DESC
    `,
    access.values
  );

  const workItems = workItemsResult.rows.map(mapWorkItemRow);

  if (workItems.length === 0) {
    return [];
  }

  const workItemIds = workItems.map((item) => item.id);
  const files = await listFilesForWorkItems(workItemIds);
  const analyses = await listLatestAnalysesForWorkItems(workItemIds);

  return workItems.map((workItem) => ({
    workItem,
    latestAnalysis: analyses.get(workItem.id),
    files: files.get(workItem.id) ?? []
  }));
}

export async function getWorkItemById(
  workItemId: string,
  accessContext: TaskAccessContext
): Promise<WorkItemListItem | null> {
  const access = buildWorkItemAccessWhereClause(2, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        w.id,
        w.title,
        w.description,
        w.status,
        w.department_id,
        w.lead_department_id,
        w.coordinating_department_ids,
        w.routing_priority,
        w.output_requirement,
        w.source_type,
        w.intake_code,
        w.deadline,
        w.output_type,
        w.principal_note,
        w.principal_decision,
        w.principal_reviewed_at,
        w.principal_reviewed_by_user_id,
        w.created_by_user_id,
        w.assigned_to_user_id,
        w.created_at,
        w.updated_at
      FROM work_items w
      WHERE w.id = $1
      ${access.clause ? `AND (${access.clause.replace(/^WHERE\s+/u, "")})` : ""}
      LIMIT 1
    `,
    [workItemId, ...access.values]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const workItem = mapWorkItemRow(result.rows[0]);
  const files = await listFilesForWorkItems([workItem.id]);
  const analyses = await listLatestAnalysesForWorkItems([workItem.id]);

  return {
    workItem,
    latestAnalysis: analyses.get(workItem.id),
    files: files.get(workItem.id) ?? []
  };
}

export async function updateWorkItem(
  workItemId: string,
  input: UpdateWorkItemInput,
  accessContext: TaskAccessContext
): Promise<WorkItem | null> {
  const existing = await getWorkItemById(workItemId, accessContext);

  if (!existing) {
    return null;
  }

  const role = accessContext.role;
  const nextStatus = input.status ?? existing.workItem.status;
  const nextAssignedToUserId =
    role === "principal" || role === "admin"
      ? input.assignedToUserId ?? existing.workItem.assignedToUserId ?? null
      : existing.workItem.assignedToUserId ?? null;

  const result = await getDbPool().query(
    `
      UPDATE work_items
      SET title = $2,
          description = $3,
          department_id = $4,
          assigned_to_user_id = $5,
          status = $6,
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        title,
        description,
        status,
        department_id,
        lead_department_id,
        coordinating_department_ids,
        routing_priority,
        output_requirement,
        principal_note,
        principal_decision,
        principal_reviewed_at,
        principal_reviewed_by_user_id,
        created_by_user_id,
        assigned_to_user_id,
        created_at,
        updated_at
    `,
    [
      workItemId,
      input.title ?? existing.workItem.title,
      input.description ?? existing.workItem.description,
      input.departmentId === undefined
        ? existing.workItem.departmentId ?? null
        : input.departmentId,
      nextAssignedToUserId,
      nextStatus
    ]
  );

  return result.rows.length > 0 ? mapWorkItemRow(result.rows[0]) : null;
}

export async function reviewWorkItem(
  workItemId: string,
  input: ReviewWorkItemInput,
  reviewedByUserId: string,
  accessContext: TaskAccessContext
): Promise<WorkItem | null> {
  const existing = await getWorkItemById(workItemId, accessContext);

  if (!existing) {
    return null;
  }

  const nextStatus: WorkItemStatus =
    input.decision === "assign"
      ? "waiting_assignment"
      : input.decision === "hold"
        ? "on_hold"
        : "draft";

  const nextDepartmentId =
    input.decision === "assign"
      ? input.leadDepartmentId ?? existing.workItem.departmentId ?? null
      : existing.workItem.departmentId ?? null;

  const result = await getDbPool().query(
    `
      UPDATE work_items
      SET status = $2,
          department_id = $3,
          lead_department_id = $4,
          coordinating_department_ids = $5,
          routing_priority = $6,
          output_requirement = $7,
          output_type = $8,
          deadline = $9,
          principal_note = $10,
          principal_decision = $11,
          principal_reviewed_at = NOW(),
          principal_reviewed_by_user_id = $12,
          updated_at = NOW()
      WHERE id = $1
      RETURNING
        id,
        title,
        description,
        status,
        department_id,
        lead_department_id,
        coordinating_department_ids,
        routing_priority,
        output_requirement,
        source_type,
        intake_code,
        deadline,
        output_type,
        principal_note,
        principal_decision,
        principal_reviewed_at,
        principal_reviewed_by_user_id,
        created_by_user_id,
        assigned_to_user_id,
        created_at,
        updated_at
    `,
    [
      workItemId,
      nextStatus,
      nextDepartmentId,
      input.leadDepartmentId ?? null,
      input.coordinatingDepartmentIds ?? [],
      input.priority ?? null,
      input.outputRequirement ?? null,
      input.outputType ?? null,
      input.deadline ?? null,
      input.principalNote ?? null,
      input.decision,
      reviewedByUserId
    ]
  );

  return result.rows.length > 0 ? mapWorkItemRow(result.rows[0]) : null;
}

export async function markWorkItemAssigned(
  workItemId: string,
  accessContext: TaskAccessContext
): Promise<WorkItem | null> {
  return updateWorkItem(
    workItemId,
    {
      status: "assigned"
    },
    accessContext
  );
}

export async function addWorkItemFile(
  workItemId: string,
  input: CreateWorkItemFileInput,
  uploadedByUserId: string
): Promise<WorkItemFile> {
  const result = await getDbPool().query(
    `
      INSERT INTO work_item_files (
        id,
        work_item_id,
        filename,
        content_type,
        size_bytes,
        content_text,
        content_base64,
        uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        work_item_id,
        filename,
        content_type,
        size_bytes,
        content_text,
        content_base64,
        uploaded_by_user_id,
        created_at
    `,
    [
      createWorkItemFileId(workItemId),
      workItemId,
      input.filename,
      input.contentType ?? null,
      input.sizeBytes ?? null,
      input.contentText ?? null,
      input.contentBase64 ?? null,
      uploadedByUserId
    ]
  );

  return mapWorkItemFileRow(result.rows[0]);
}

export async function getWorkItemFileDownload(
  workItemId: string,
  fileId: string,
  accessContext: TaskAccessContext
): Promise<DownloadableWorkItemFile | null> {
  const detail = await getWorkItemById(workItemId, accessContext);

  if (!detail) {
    return null;
  }

  const result = await getDbPool().query(
    `
      SELECT
        id,
        filename,
        content_type,
        content_text,
        content_base64
      FROM work_item_files
      WHERE id = $1
        AND work_item_id = $2
      LIMIT 1
    `,
    [fileId, workItemId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as {
    filename: string;
    content_type?: string | null;
    content_text?: string | null;
    content_base64?: string | null;
  };

  if (typeof row.content_base64 === "string" && row.content_base64.length > 0) {
    return {
      filename: row.filename,
      contentType: row.content_type ?? "application/octet-stream",
      content: Buffer.from(row.content_base64, "base64")
    };
  }

  if (typeof row.content_text === "string" && row.content_text.length > 0) {
    return {
      filename: buildTextFallbackFilename(row.filename),
      contentType: "text/plain; charset=utf-8",
      content: Buffer.from(row.content_text, "utf8")
    };
  }

  return null;
}

export async function analyzeWorkItem(
  workItemId: string,
  createdByUserId: string,
  accessContext: TaskAccessContext
): Promise<AiAnalysis | null> {
  const detail = await getWorkItemById(workItemId, accessContext);

  if (!detail) {
    return null;
  }

  const analysisInput = await analyzeWorkItemContent(
    detail.workItem,
    detail.files,
    createdByUserId
  );

  const result = await getDbPool().query(
    `
      INSERT INTO ai_analysis (
        id,
        work_item_id,
        summary,
        raw_output,
        model,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        work_item_id,
        summary,
        raw_output,
        model,
        created_by_user_id,
        created_at
    `,
    [
      createAiAnalysisId(workItemId),
      workItemId,
      analysisInput.summary,
      analysisInput.rawOutput,
      analysisInput.model ?? null,
      createdByUserId
    ]
  );

  return mapAiAnalysisRow(result.rows[0]);
}

export async function deleteWorkItem(
  workItemId: string,
  accessContext: TaskAccessContext
): Promise<boolean> {
  const existing = await getWorkItemById(workItemId, accessContext);

  if (!existing) {
    return false;
  }

  const assignmentCheck = await getDbPool().query(
    `
      SELECT 1
      FROM assignments
      WHERE work_item_id = $1
      LIMIT 1
    `,
    [workItemId]
  );

  if (assignmentCheck.rows.length > 0) {
    throw new Error("Work items with assignment history cannot be deleted");
  }

  const taskHistoryCheck = await getDbPool().query(
    `
      SELECT 1
      FROM tasks
      WHERE work_item_id = $1
      LIMIT 1
    `,
    [workItemId]
  );

  if (taskHistoryCheck.rows.length > 0) {
    throw new Error("Work items with task history cannot be deleted");
  }

  await getDbPool().query(`DELETE FROM work_item_files WHERE work_item_id = $1`, [workItemId]);
  await getDbPool().query(`DELETE FROM ai_analysis WHERE work_item_id = $1`, [workItemId]);
  await getDbPool().query(`DELETE FROM work_items WHERE id = $1`, [workItemId]);

  return true;
}

export function canCreateWorkItems(accessContext: TaskAccessContext): boolean {
  return (
    accessContext.role === "principal" ||
    accessContext.role === "admin" ||
    accessContext.role === "clerk"
  );
}

function buildWorkItemAccessWhereClause(
  startIndex: number,
  accessContext: TaskAccessContext
): { clause: string; values: string[] } {
  if (
    accessContext.role === "principal" ||
    accessContext.role === "admin"
  ) {
    return {
      clause: "",
      values: []
    };
  }

  if (!accessContext.userId) {
    return {
      clause: "WHERE 1 = 0",
      values: []
    };
  }

  if (accessContext.role === "clerk") {
    return {
      clause: `WHERE (w.created_by_user_id = $${startIndex} OR w.assigned_to_user_id = $${startIndex})`,
      values: [accessContext.userId]
    };
  }

  if (accessContext.role === "department_head" && accessContext.departmentId) {
    return {
      clause: `WHERE (
        w.department_id = $${startIndex}
        OR w.assigned_to_user_id = $${startIndex + 1}
        OR EXISTS (
          SELECT 1
          FROM assignments a
          JOIN tasks t
            ON t.assignment_id = a.id
          WHERE a.work_item_id = w.id
            AND (
              a.main_department_id = $${startIndex}
              OR t.owner_department_id = $${startIndex}
            )
        )
      )`,
      values: [accessContext.departmentId, accessContext.userId]
    };
  }

  return {
    clause: `WHERE w.assigned_to_user_id = $${startIndex}`,
    values: [accessContext.userId]
  };
}

async function listFilesForWorkItems(
  workItemIds: string[]
): Promise<Map<string, WorkItemFile[]>> {
  const result = await getDbPool().query(
    `
      SELECT
        id,
        work_item_id,
        filename,
        content_type,
        size_bytes,
        content_text,
        content_base64,
        uploaded_by_user_id,
        created_at
      FROM work_item_files
      WHERE work_item_id = ANY($1)
      ORDER BY created_at DESC
    `,
    [workItemIds]
  );

  const filesByWorkItem = new Map<string, WorkItemFile[]>();

  for (const row of result.rows) {
    const file = mapWorkItemFileRow(row);
    const currentList = filesByWorkItem.get(file.workItemId) ?? [];
    currentList.push(file);
    filesByWorkItem.set(file.workItemId, currentList);
  }

  return filesByWorkItem;
}

async function listLatestAnalysesForWorkItems(
  workItemIds: string[]
): Promise<Map<string, AiAnalysis>> {
  const result = await getDbPool().query(
    `
      SELECT DISTINCT ON (work_item_id)
        id,
        work_item_id,
        summary,
        raw_output,
        model,
        created_by_user_id,
        created_at
      FROM ai_analysis
      WHERE work_item_id = ANY($1)
      ORDER BY work_item_id, created_at DESC
    `,
    [workItemIds]
  );

  const analyses = new Map<string, AiAnalysis>();

  for (const row of result.rows) {
    const analysis = mapAiAnalysisRow(row);
    analyses.set(analysis.workItemId, analysis);
  }

  return analyses;
}

function createWorkItemId(): string {
  return `work_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createWorkItemFileId(workItemId: string): string {
  return `wif_${workItemId}_${Math.random().toString(36).slice(2, 8)}`;
}

function createAiAnalysisId(workItemId: string): string {
  return `wai_${workItemId}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapWorkItemRow(row: Record<string, unknown>): WorkItem {
  return {
    id: row.id as string,
    title: row.title as string,
    description: row.description as string,
    status: row.status as WorkItemStatus,
    sourceType: (row.source_type as WorkItemSourceType | null) ?? undefined,
    intakeCode: (row.intake_code as string | null) ?? undefined,
    deadline: (row.deadline as string | null) ?? undefined,
    outputType: (row.output_type as WorkItemOutputType | null) ?? undefined,
    departmentId: (row.department_id as string | null) ?? undefined,
    leadDepartmentId: (row.lead_department_id as string | null) ?? undefined,
    coordinatingDepartmentIds:
      (row.coordinating_department_ids as string[] | null) ?? [],
    routingPriority:
      (row.routing_priority as
        | "low"
        | "normal"
        | "high"
        | "urgent"
        | null) ?? undefined,
    outputRequirement: (row.output_requirement as string | null) ?? undefined,
    principalNote: (row.principal_note as string | null) ?? undefined,
    principalDecision:
      (row.principal_decision as
        | "assign"
        | "return_intake"
        | "hold"
        | null) ?? undefined,
    principalReviewedAt:
      (row.principal_reviewed_at as string | null) ?? undefined,
    principalReviewedByUserId:
      (row.principal_reviewed_by_user_id as string | null) ?? undefined,
    createdByUserId: row.created_by_user_id as string,
    assignedToUserId: (row.assigned_to_user_id as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string
  };
}

function mapWorkItemFileRow(row: Record<string, unknown>): WorkItemFile {
  return {
    id: row.id as string,
    workItemId: row.work_item_id as string,
    filename: row.filename as string,
    contentType: (row.content_type as string | null) ?? undefined,
    sizeBytes: row.size_bytes ? Number(row.size_bytes) : undefined,
    hasFileContent:
      (typeof row.content_base64 === "string" && row.content_base64.length > 0) ||
      (typeof row.content_text === "string" && row.content_text.length > 0),
    uploadedByUserId: (row.uploaded_by_user_id as string | null) ?? undefined,
    createdAt: row.created_at as string
  };
}

function buildTextFallbackFilename(filename: string): string {
  const trimmed = filename.trim();

  if (trimmed.toLowerCase().endsWith(".txt")) {
    return trimmed;
  }

  return `${trimmed}.txt`;
}

function mapAiAnalysisRow(row: Record<string, unknown>): AiAnalysis {
  return {
    id: row.id as string,
    workItemId: row.work_item_id as string,
    summary: row.summary as string,
    rawOutput: row.raw_output as string,
    model: (row.model as string | null) ?? undefined,
    createdByUserId: (row.created_by_user_id as string | null) ?? undefined,
    createdAt: row.created_at as string
  };
}
