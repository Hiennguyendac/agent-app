export interface WorkItemFile {
  id: string;
  workItemId: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  uploadedByUserId?: string;
  createdAt: string;
}
