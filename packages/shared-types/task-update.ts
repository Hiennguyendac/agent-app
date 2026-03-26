export type TaskExecutionStatus =
  | "pending"
  | "running"
  | "waiting_dependency"
  | "needs_data"
  | "internally_completed"
  | "submitted";

export interface TaskUpdate {
  id: string;
  taskId: string;
  updatedByUserId?: string;
  executionStatus: TaskExecutionStatus;
  progressPercent: number;
  note?: string;
  createdAt: string;
}
