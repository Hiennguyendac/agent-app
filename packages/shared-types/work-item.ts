import type { WorkItemStatus } from "./work-item-status";

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  departmentId?: string;
  createdByUserId: string;
  assignedToUserId?: string;
  createdAt: string;
  updatedAt: string;
}
