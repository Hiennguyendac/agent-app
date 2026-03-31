import type {
  Document,
  DocumentAnalysis,
  WorkItem
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";
import type { TaskAccessContext } from "./request-user.js";
import { analyzeDocumentContent } from "./document-ai.js";
import { extractDocumentText } from "./document-extraction.js";
import { createWorkItem, type CreateWorkItemInput } from "./work-items.js";

export interface DocumentListItem {
  document: Document;
  latestAnalysis?: DocumentAnalysis;
}

export interface CreateDocumentInput {
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
  extractedText?: string;
  contentBase64?: string;
  ocrStatus?: "pending" | "ready" | "failed";
  uploadGroupId?: string;
}

export interface DownloadableDocumentFile {
  filename: string;
  contentType: string;
  content: Buffer;
}

export async function createDocument(
  input: CreateDocumentInput,
  uploadedByUserId: string
): Promise<Document> {
  const sanitizedFilename = stripNullCharacters(input.filename);
  const sanitizedContentType =
    typeof input.contentType === "string"
      ? stripNullCharacters(input.contentType)
      : null;
  const sanitizedExtractedText =
    typeof input.extractedText === "string"
      ? stripNullCharacters(input.extractedText)
      : null;
  const extractionResult = await extractDocumentText({
    filename: sanitizedFilename,
    contentType: sanitizedContentType ?? undefined,
    contentBase64: input.contentBase64,
    existingExtractedText: sanitizedExtractedText ?? undefined
  });
  const sanitizedMetadata = sanitizeMetadataValue({
    ...(input.metadata ?? {}),
    extractionNote: extractionResult.extractionNote ?? undefined
  });

  const result = await getDbPool().query(
    `
      INSERT INTO documents (
        id,
        filename,
        content_type,
        size_bytes,
        metadata_json,
        extracted_text,
        content_base64,
        ocr_status,
        upload_group_id,
        uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING
        id,
        filename,
        content_type,
        size_bytes,
        metadata_json,
        extracted_text,
        content_base64,
        ocr_status,
        upload_group_id,
        uploaded_by_user_id,
        created_work_item_id,
        created_at
    `,
    [
      createDocumentId(),
      sanitizedFilename,
      sanitizedContentType,
      input.sizeBytes ?? null,
      JSON.stringify(sanitizedMetadata),
      extractionResult.extractedText ?? sanitizedExtractedText,
      input.contentBase64 ?? null,
      extractionResult.ocrStatus ?? input.ocrStatus ?? "ready",
      typeof input.uploadGroupId === "string"
        ? stripNullCharacters(input.uploadGroupId)
        : null,
      uploadedByUserId
    ]
  );

  return mapDocumentRow(result.rows[0]);
}

export async function listDocuments(
  accessContext: TaskAccessContext
): Promise<DocumentListItem[]> {
  const access = buildDocumentAccessFilter(1, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        d.id,
        d.filename,
        d.content_type,
        d.size_bytes,
        d.metadata_json,
        d.extracted_text,
        CASE
          WHEN (d.content_base64 IS NOT NULL AND d.content_base64 <> '') THEN true
          WHEN (d.extracted_text IS NOT NULL AND d.extracted_text <> '') THEN true
          ELSE false
        END AS has_file_content,
        d.ocr_status,
        d.upload_group_id,
        d.uploaded_by_user_id,
        d.created_work_item_id,
        d.created_at
      FROM documents d
      ${access.whereClause}
      ORDER BY d.created_at DESC
    `,
    access.values
  );

  const documents = result.rows.map(mapDocumentRow);

  if (documents.length === 0) {
    return [];
  }

  const analyses = await listLatestAnalysesForDocuments(documents.map((item) => item.id));

  return documents.map((document) => ({
    document,
    latestAnalysis: analyses.get(document.id)
  }));
}

export async function getDocumentById(
  documentId: string,
  accessContext: TaskAccessContext
): Promise<DocumentListItem | null> {
  const access = buildDocumentAccessFilter(2, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        d.id,
        d.filename,
        d.content_type,
        d.size_bytes,
        d.metadata_json,
        d.extracted_text,
        d.content_base64,
        d.ocr_status,
        d.upload_group_id,
        d.uploaded_by_user_id,
        d.created_work_item_id,
        d.created_at
      FROM documents d
      WHERE d.id = $1
      ${access.expression ? `AND (${access.expression})` : ""}
      LIMIT 1
    `,
    [documentId, ...access.values]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const document = mapDocumentRow(result.rows[0]);
  const analyses = await listLatestAnalysesForDocuments([document.id]);

  return {
    document,
    latestAnalysis: analyses.get(document.id)
  };
}

export async function analyzeDocument(
  documentId: string,
  createdByUserId: string,
  accessContext: TaskAccessContext
): Promise<DocumentAnalysis | null> {
  const detail = await getDocumentById(documentId, accessContext);

  if (!detail) {
    return null;
  }

  const analysis = await analyzeDocumentContent(detail.document, createdByUserId);
  const result = await getDbPool().query(
    `
      INSERT INTO document_analysis (
        id,
        document_id,
        summary,
        raw_output,
        model,
        created_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        document_id,
        summary,
        raw_output,
        model,
        created_by_user_id,
        created_at
    `,
    [
      createDocumentAnalysisId(documentId),
      documentId,
      analysis.summary,
      analysis.rawOutput,
      analysis.model ?? null,
      createdByUserId
    ]
  );

  return mapDocumentAnalysisRow(result.rows[0]);
}

export async function createWorkItemFromDocument(
  documentId: string,
  input: CreateWorkItemInput,
  accessContext: TaskAccessContext,
  additionalDocumentIds: string[] = []
): Promise<{ document: Document; workItem: WorkItem } | null> {
  const detail = await getDocumentById(documentId, accessContext);

  if (!detail || !accessContext.userId) {
    return null;
  }

  const workItem = await createWorkItem(input, accessContext.userId);

  const result = await getDbPool().query(
    `
      UPDATE documents
      SET created_work_item_id = $2
      WHERE id = $1
      RETURNING
        id,
        filename,
        content_type,
        size_bytes,
        metadata_json,
        extracted_text,
        CASE
          WHEN (content_base64 IS NOT NULL AND content_base64 <> '') THEN true
          WHEN (extracted_text IS NOT NULL AND extracted_text <> '') THEN true
          ELSE false
        END AS has_file_content,
        ocr_status,
        upload_group_id,
        uploaded_by_user_id,
        created_work_item_id,
        created_at
    `,
    [documentId, workItem.id]
  );

  // Link any additional documents from the same upload batch to this work item
  const relatedDocumentIds = new Set(
    additionalDocumentIds.filter((id) => id !== documentId)
  );

  if (detail.document.uploadGroupId) {
    const groupedDocuments = await getDbPool().query(
      `
        SELECT id
        FROM documents
        WHERE upload_group_id = $1
          AND uploaded_by_user_id = $2
          AND id <> $3
          AND created_work_item_id IS NULL
      `,
      [detail.document.uploadGroupId, accessContext.userId, documentId]
    );

    for (const row of groupedDocuments.rows) {
      if (typeof row.id === "string") {
        relatedDocumentIds.add(row.id);
      }
    }
  }

  if (relatedDocumentIds.size > 0) {
    await getDbPool().query(
      `UPDATE documents SET created_work_item_id = $1 WHERE id = ANY($2::TEXT[])`,
      [workItem.id, [...relatedDocumentIds]]
    );
  }

  return {
    document: mapDocumentRow(result.rows[0]),
    workItem
  };
}

export async function getDocumentDownloadFile(
  documentId: string,
  accessContext: TaskAccessContext
): Promise<DownloadableDocumentFile | null> {
  // Single query: access-controlled + returns file content
  const access = buildDocumentAccessFilter(2, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        d.filename,
        d.content_type,
        d.content_base64,
        d.extracted_text
      FROM documents d
      WHERE d.id = $1
      ${access.expression ? `AND (${access.expression})` : ""}
      LIMIT 1
    `,
    [documentId, ...access.values]
  );

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0] as {
    filename: string;
    content_type?: string | null;
    content_base64?: string | null;
    extracted_text?: string | null;
  };

  if (typeof row.content_base64 === "string" && row.content_base64.length > 0) {
    return {
      filename: row.filename,
      contentType: row.content_type ?? "application/octet-stream",
      content: Buffer.from(row.content_base64, "base64")
    };
  }

  if (typeof row.extracted_text === "string" && row.extracted_text.length > 0) {
    return {
      filename: buildTextFallbackFilename(row.filename),
      contentType: "text/plain; charset=utf-8",
      content: Buffer.from(row.extracted_text, "utf8")
    };
  }

  return null;
}

export async function canCreateDocuments(
  accessContext: TaskAccessContext
): Promise<boolean> {
  return accessContext.userId !== null;
}

function buildDocumentAccessFilter(
  parameterStartIndex: number,
  accessContext: TaskAccessContext
): { whereClause: string; expression: string; values: string[] } {
  if (accessContext.role === "principal" || accessContext.role === "admin") {
    return { whereClause: "", expression: "", values: [] };
  }

  if (accessContext.role === "department_head" && accessContext.departmentId) {
    const expression = `(
      d.uploaded_by_user_id = $${parameterStartIndex}
      OR EXISTS (
        SELECT 1
        FROM work_items w
        LEFT JOIN assignments a
          ON a.work_item_id = w.id
        LEFT JOIN tasks t
          ON t.assignment_id = a.id
        WHERE w.id = d.created_work_item_id
          AND (
            w.department_id = $${parameterStartIndex + 1}
            OR a.main_department_id = $${parameterStartIndex + 1}
            OR t.owner_department_id = $${parameterStartIndex + 1}
          )
      )
    )`;

    return {
      whereClause: `WHERE ${expression}`,
      expression,
      values: [accessContext.userId ?? "", accessContext.departmentId]
    };
  }

  if (accessContext.userId) {
    const expression = `d.uploaded_by_user_id = $${parameterStartIndex}`;
    return {
      whereClause: `WHERE ${expression}`,
      expression,
      values: [accessContext.userId]
    };
  }

  return {
    whereClause: "WHERE 1 = 0",
    expression: "1 = 0",
    values: []
  };
}

async function listLatestAnalysesForDocuments(
  documentIds: string[]
): Promise<Map<string, DocumentAnalysis>> {
  const result = await getDbPool().query(
    `
      SELECT DISTINCT ON (a.document_id)
        a.id,
        a.document_id,
        a.summary,
        a.raw_output,
        a.model,
        a.created_by_user_id,
        a.created_at
      FROM document_analysis a
      WHERE a.document_id = ANY($1::TEXT[])
      ORDER BY a.document_id, a.created_at DESC
    `,
    [documentIds]
  );

  return new Map(
    result.rows.map((row) => {
      const analysis = mapDocumentAnalysisRow(row);
      return [analysis.documentId, analysis] as const;
    })
  );
}

function mapDocumentRow(row: Record<string, unknown>): Document {
  // has_file_content may come from a SQL CASE expression (list query)
  // or be computed from content_base64/extracted_text (detail query)
  const hasFileContent =
    typeof row.has_file_content === "boolean"
      ? row.has_file_content
      : (typeof row.content_base64 === "string" && row.content_base64.length > 0) ||
        (typeof row.extracted_text === "string" && row.extracted_text.length > 0);

  return {
    id: String(row.id),
    filename: String(row.filename),
    contentType:
      typeof row.content_type === "string" ? row.content_type : undefined,
    sizeBytes: typeof row.size_bytes === "number" ? row.size_bytes : undefined,
    metadata:
      row.metadata_json && typeof row.metadata_json === "object"
        ? (row.metadata_json as Record<string, unknown>)
        : {},
    extractedText:
      typeof row.extracted_text === "string" ? row.extracted_text : undefined,
    hasFileContent,
    ocrStatus:
      row.ocr_status === "pending" || row.ocr_status === "failed"
        ? row.ocr_status
        : "ready",
    uploadedByUserId: String(row.uploaded_by_user_id),
    uploadGroupId:
      typeof row.upload_group_id === "string" ? row.upload_group_id : undefined,
    createdWorkItemId:
      typeof row.created_work_item_id === "string"
        ? row.created_work_item_id
        : undefined,
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

function buildTextFallbackFilename(filename: string): string {
  const trimmed = filename.trim();

  if (trimmed.toLowerCase().endsWith(".txt")) {
    return trimmed;
  }

  return `${trimmed}.txt`;
}

function mapDocumentAnalysisRow(row: Record<string, unknown>): DocumentAnalysis {
  return {
    id: String(row.id),
    documentId: String(row.document_id),
    summary: String(row.summary),
    rawOutput: String(row.raw_output),
    model: typeof row.model === "string" ? row.model : undefined,
    createdByUserId:
      typeof row.created_by_user_id === "string"
        ? row.created_by_user_id
        : undefined,
    createdAt: new Date(String(row.created_at)).toISOString()
  };
}

function createDocumentId(): string {
  return `doc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function createDocumentAnalysisId(documentId: string): string {
  return `doc_analysis_${documentId}_${Math.random().toString(36).slice(2, 10)}`;
}

function stripNullCharacters(value: string): string {
  return value.replaceAll("\u0000", "");
}

function sanitizeMetadataValue(value: unknown): unknown {
  if (typeof value === "string") {
    return stripNullCharacters(value);
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeMetadataValue);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entryValue]) => [
        stripNullCharacters(key),
        sanitizeMetadataValue(entryValue)
      ])
    );
  }

  return value;
}
