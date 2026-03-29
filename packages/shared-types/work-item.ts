import type { AssignmentPriority } from "./assignment-priority";
import type { WorkItemStatus } from "./work-item-status";

export type WorkItemSourceType =
  | "incoming_document"
  | "internal_directive"
  | "plan"
  | "spontaneous_task"
  | "department_request"
  | "work_schedule";

export type WorkItemOutputType =
  | "report"
  | "plan_document"
  | "minutes"
  | "list"
  | "proposal"
  | "evidence_files"
  | "other";

export interface WorkItem {
  id: string;
  title: string;
  description: string;
  status: WorkItemStatus;
  sourceType?: WorkItemSourceType;
  intakeCode?: string;
  deadline?: string;
  outputType?: WorkItemOutputType;
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
