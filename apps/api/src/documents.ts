import type {
  Document,
  DocumentAnalysis,
  WorkItem
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";
import type { TaskAccessContext } from "./request-user.js";
import { analyzeDocumentContent } from "./document-ai.js";
import { createWorkItem, getWorkItemById, type CreateWorkItemInput } from "./work-items.js";

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
  ocrStatus?: "pending" | "ready" | "failed";
}

export async function createDocument(
  input: CreateDocumentInput,
  uploadedByUserId: string
): Promise<Document> {
  const result = await getDbPool().query(
    `
      INSERT INTO documents (
        id,
        filename,
        content_type,
        size_bytes,
        metadata_json,
        extracted_text,
        ocr_status,
        uploaded_by_user_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        filename,
        content_type,
        size_bytes,
        metadata_json,
        extracted_text,
        ocr_status,
        uploaded_by_user_id,
        created_work_item_id,
        created_at
    `,
    [
      createDocumentId(),
      input.filename,
      input.contentType ?? null,
      input.sizeBytes ?? null,
      JSON.stringify(input.metadata ?? {}),
      input.extractedText ?? null,
      input.ocrStatus ?? "ready",
      uploadedByUserId
    ]
  );

  return mapDocumentRow(result.rows[0]);
}

export async function listDocuments(
  accessContext: TaskAccessContext
): Promise<DocumentListItem[]> {
  const access = buildDocumentAccessWhereClause(1, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        d.id,
        d.filename,
        d.content_type,
        d.size_bytes,
        d.metadata_json,
        d.extracted_text,
        d.ocr_status,
        d.uploaded_by_user_id,
        d.created_work_item_id,
        d.created_at
      FROM documents d
      ${access.clause}
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
  const access = buildDocumentAccessWhereClause(2, accessContext);
  const result = await getDbPool().query(
    `
      SELECT
        d.id,
        d.filename,
        d.content_type,
        d.size_bytes,
        d.metadata_json,
        d.extracted_text,
        d.ocr_status,
        d.uploaded_by_user_id,
        d.created_work_item_id,
        d.created_at
      FROM documents d
      WHERE d.id = $1
      ${access.clause ? `AND (${access.clause.replace(/^WHERE\\s+/u, "")})` : ""}
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
  accessContext: TaskAccessContext
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
        ocr_status,
        uploaded_by_user_id,
        created_work_item_id,
        created_at
    `,
    [documentId, workItem.id]
  );

  return {
    document: mapDocumentRow(result.rows[0]),
    workItem
  };
}

export async function canCreateDocuments(
  accessContext: TaskAccessContext
): Promise<boolean> {
  return accessContext.userId !== null;
}

function buildDocumentAccessWhereClause(
  parameterStartIndex: number,
  accessContext: TaskAccessContext
): { clause: string; values: string[] } {
  if (accessContext.role === "principal" || accessContext.role === "admin") {
    return { clause: "", values: [] };
  }

  if (accessContext.userId) {
    return {
      clause: `WHERE d.uploaded_by_user_id = $${parameterStartIndex}`,
      values: [accessContext.userId]
    };
  }

  return {
    clause: "WHERE 1 = 0",
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
    ocrStatus:
      row.ocr_status === "pending" || row.ocr_status === "failed"
        ? row.ocr_status
        : "ready",
    uploadedByUserId: String(row.uploaded_by_user_id),
    createdWorkItemId:
      typeof row.created_work_item_id === "string"
        ? row.created_work_item_id
        : undefined,
    createdAt: new Date(String(row.created_at)).toISOString()
  };
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
