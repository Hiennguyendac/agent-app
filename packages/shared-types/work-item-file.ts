export interface WorkItemFile {
  id: string;
  workItemId: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  hasFileContent?: boolean;
  uploadedByUserId?: string;
  createdAt: string;
}
