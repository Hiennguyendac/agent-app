import type {
  SubmissionReview,
  SubmissionReviewOutcome,
  SubmissionReturnStage
} from "../../../packages/shared-types/index.js";
import { getDbPool } from "./db.js";
import type { TaskAccessContext } from "./request-user.js";
import { getTaskItemById } from "./store.js";

export interface CreateSubmissionReviewInput {
  reviewOutcome: SubmissionReviewOutcome;
  returnStage: SubmissionReturnStage;
  reasonCode?: string;
  reasonText?: string;
  reviewPayload?: Record<string, unknown>;
}

export async function listSubmissionReviews(
  taskId: string,
  accessContext?: TaskAccessContext
): Promise<SubmissionReview[]> {
  const taskItem = await getTaskItemById(taskId, accessContext);

  if (!taskItem) {
    return [];
  }

  const result = await getDbPool().query(
    `
      SELECT
        id,
        task_id,
        work_item_id,
        reviewed_by_user_id,
        review_outcome,
        return_stage,
        reason_code,
        reason_text,
        review_payload,
        created_at
      FROM submission_reviews
      WHERE task_id = $1
      ORDER BY created_at DESC
    `,
    [taskId]
  );

  return result.rows.map(mapSubmissionReviewRow);
}

export async function createSubmissionReview(
  taskId: string,
  input: CreateSubmissionReviewInput,
  reviewedByUserId: string,
  accessContext?: TaskAccessContext
): Promise<SubmissionReview | null> {
  const taskItem = await getTaskItemById(taskId, accessContext);

  if (!taskItem) {
    return null;
  }

  const result = await getDbPool().query(
    `
      INSERT INTO submission_reviews (
        id,
        task_id,
        work_item_id,
        reviewed_by_user_id,
        review_outcome,
        return_stage,
        reason_code,
        reason_text,
        review_payload
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING
        id,
        task_id,
        work_item_id,
        reviewed_by_user_id,
        review_outcome,
        return_stage,
        reason_code,
        reason_text,
        review_payload,
        created_at
    `,
    [
      createSubmissionReviewId(taskId),
      taskId,
      taskItem.task.workItemId ?? null,
      reviewedByUserId,
      input.reviewOutcome,
      input.returnStage,
      input.reasonCode ?? null,
      input.reasonText ?? null,
      input.reviewPayload ?? null
    ]
  );

  return result.rows.length > 0 ? mapSubmissionReviewRow(result.rows[0]) : null;
}

function createSubmissionReviewId(taskId: string): string {
  return `submission_review_${taskId}_${Math.random().toString(36).slice(2, 8)}`;
}

function mapSubmissionReviewRow(row: Record<string, unknown>): SubmissionReview {
  return {
    id: String(row.id),
    taskId: String(row.task_id),
    workItemId: (row.work_item_id as string | null) ?? undefined,
    reviewedByUserId: (row.reviewed_by_user_id as string | null) ?? undefined,
    reviewOutcome: row.review_outcome as SubmissionReviewOutcome,
    returnStage: row.return_stage as SubmissionReturnStage,
    reasonCode: (row.reason_code as string | null) ?? undefined,
    reasonText: (row.reason_text as string | null) ?? undefined,
    reviewPayload:
      (row.review_payload as Record<string, unknown> | null) ?? undefined,
    createdAt: String(row.created_at)
  };
}
