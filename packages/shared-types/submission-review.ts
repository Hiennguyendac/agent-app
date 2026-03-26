export type SubmissionReviewOutcome =
  | "needs_supplement"
  | "needs_rework"
  | "late_explanation_required"
  | "needs_reassignment"
  | "ready_for_principal_approval";

export type SubmissionReturnStage =
  | "submission"
  | "execution"
  | "execution_late"
  | "principal_review";

export interface SubmissionReview {
  id: string;
  taskId: string;
  workItemId?: string;
  reviewedByUserId?: string;
  reviewOutcome: SubmissionReviewOutcome;
  returnStage: SubmissionReturnStage;
  reasonCode?: string;
  reasonText?: string;
  reviewPayload?: Record<string, unknown>;
  createdAt: string;
}
