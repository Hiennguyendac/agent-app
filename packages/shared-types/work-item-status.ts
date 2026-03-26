export type WorkItemStatus =
  | "draft"
  | "waiting_review"
  | "waiting_assignment"
  | "assigned"
  | "on_hold"
  | "in_review"
  | "needs_supplement"
  | "needs_rework"
  | "late_explanation_required"
  | "waiting_principal_approval"
  | "completed"
  | "archived";
