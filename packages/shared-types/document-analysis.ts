export interface DocumentAnalysis {
  id: string;
  documentId: string;
  summary: string;
  rawOutput: string;
  model?: string;
  createdByUserId?: string;
  createdAt: string;
}
