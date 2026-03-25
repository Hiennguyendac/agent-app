import type {
  AiAnalysis,
  WorkItem,
  WorkItemFile,
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
}

export interface UpdateWorkItemInput {
  title?: string;
  description?: string;
  departmentId?: string | null;
  assignedToUserId?: string | null;
  status?: WorkItemStatus;
}

export interface CreateWorkItemFileInput {
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  contentText?: string;
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
        created_by_user_id,
        assigned_to_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        title,
        description,
        status,
        department_id,
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
        uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id,
        work_item_id,
        filename,
        content_type,
        size_bytes,
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
      uploadedByUserId
    ]
  );

  return mapWorkItemFileRow(result.rows[0]);
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
    departmentId: (row.department_id as string | null) ?? undefined,
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
    uploadedByUserId: (row.uploaded_by_user_id as string | null) ?? undefined,
    createdAt: row.created_at as string
  };
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
