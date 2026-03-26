import type { AssignmentPriority } from "./assignment-priority";

export interface Assignment {
  id: string;
  workItemId: string;
  mainDepartmentId: string;
  coordinatingDepartmentIds: string[];
  status:
    | "draft"
    | "sent"
    | "waiting_acceptance"
    | "accepted"
    | "adjustment_requested"
    | "overdue"
    | "closed";
  deadline?: string;
  priority: AssignmentPriority;
  outputRequirement?: string;
  note?: string;
  taskId: string;
  createdByUserId: string;
  acceptedAt?: string;
  acceptedByUserId?: string;
  adjustmentRequestedAt?: string;
  adjustmentRequestedByUserId?: string;
  adjustmentReason?: string;
  createdAt: string;
  active: boolean;
}
