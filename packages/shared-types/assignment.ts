import type { AssignmentPriority } from "./assignment-priority";

export interface Assignment {
  id: string;
  workItemId: string;
  mainDepartmentId: string;
  coordinatingDepartmentIds: string[];
  deadline?: string;
  priority: AssignmentPriority;
  outputRequirement?: string;
  note?: string;
  taskId: string;
  createdByUserId: string;
  createdAt: string;
  active: boolean;
}
