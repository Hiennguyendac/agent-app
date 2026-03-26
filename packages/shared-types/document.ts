import type { DocumentOcrStatus } from "./document-ocr-status";

export interface Document {
  id: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
  extractedText?: string;
  hasFileContent?: boolean;
  ocrStatus: DocumentOcrStatus;
  uploadedByUserId: string;
  createdWorkItemId?: string;
  createdAt: string;
}
