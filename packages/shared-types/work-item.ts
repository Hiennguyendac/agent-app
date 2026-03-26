import type { AssignmentPriority } from "./assignment-priority";
import type { WorkItemStatus } from "./work-item-status";

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  departmentId?: string;
  leadDepartmentId?: string;
  coordinatingDepartmentIds: string[];
  routingPriority?: AssignmentPriority;
  outputRequirement?: string;
  principalNote?: string;
  principalDecision?: "assign" | "return_intake" | "hold";
  principalReviewedAt?: string;
  principalReviewedByUserId?: string;
  createdByUserId: string;
  assignedToUserId?: string;
  createdAt: string;
  updatedAt: string;
}
