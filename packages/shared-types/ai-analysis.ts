export interface AiAnalysis {
  id: string;
  workItemId: string;
  summary: string;
  rawOutput: string;
  model?: string;
  createdByUserId?: string;
  createdAt: string;
}
