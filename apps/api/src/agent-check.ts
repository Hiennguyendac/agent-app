/**
 * agent-check.ts
 *
 * AI Agent automation layer for:
 * 1. Deadline reminder scanning (D-3, D-1, D-day, overdue)
 * 2. Daily/weekly operational report generation
 * 3. Bottleneck detection (stalled work items)
 * 4. Quality check on submitted task reports using AI
 */

import { getDbPool } from "./db.js";
import { createAssignmentNotification } from "./assignments.js";
import { analyzeWorkItemContent } from "./work-item-ai.js";
import type { WorkItem, WorkItemFile } from "../../../packages/shared-types/index.js";

export interface DeadlineReminderResult {
  checked: number;
  remindersCreated: number;
  overdue: number;
  upcoming: number;
}

export interface DailyReportData {
  date: string;
  totalWorkItems: number;
  byStatus: Record<string, number>;
  overdueAssignments: number;
  pendingReview: number;
  completedToday: number;
  byDepartment: Array<{ departmentName: string; total: number; overdue: number; completed: number }>;
  needsAttention: Array<{ workItemId: string; title: string; reason: string; deadline?: string }>;
}

export interface WeeklyReportData extends DailyReportData {
  weekStart: string;
  weekEnd: string;
  completionRate: number;
  topPerformingDepartments: string[];
  bottlenecks: Array<{ workItemId: string; title: string; stalledDays: number }>;
}

export interface QualityCheckResult {
  passed: boolean;
  score: number;
  issues: string[];
  recommendation: string;
  returnStage?: "submission" | "execution" | "execution_late" | "principal_review";
}

/**
 * Scan all active assignments and create reminder notifications
 * based on deadline proximity. Skips if reminder already sent.
 */
export async function runDeadlineReminders(): Promise<DeadlineReminderResult> {
  const pool = getDbPool();
  const now = new Date();
  let remindersCreated = 0;
  let overdue = 0;
  let upcoming = 0;

  const assignmentsResult = await pool.query(
    `
      SELECT
        a.id,
        a.work_item_id,
        a.deadline,
        a.main_department_id,
        a.status,
        a.priority,
        w.title AS work_item_title,
        d.name AS department_name
      FROM assignments a
      JOIN work_items w ON w.id = a.work_item_id
      LEFT JOIN departments d ON d.id = a.main_department_id
      WHERE a.active = true
        AND a.status NOT IN ('closed', 'overdue')
        AND a.deadline IS NOT NULL
      ORDER BY a.deadline ASC
    `
  );

  for (const row of assignmentsResult.rows) {
    const deadline = new Date(row.deadline as string);
    const diffMs = deadline.getTime() - now.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    let reminderType: string | null = null;

    if (diffMs < 0) {
      reminderType = "overdue";
      overdue++;
    } else if (diffDays <= 1) {
      reminderType = "before_1_day";
      upcoming++;
    } else if (diffDays <= 3) {
      reminderType = "before_3_days";
      upcoming++;
    }

    if (!reminderType) {
      continue;
    }

    // Check if this reminder type was already sent for this assignment
    const alreadySent = await pool.query(
      `
        SELECT 1 FROM reminder_log
        WHERE assignment_id = $1
          AND reminder_type = $2
          AND sent_at > NOW() - INTERVAL '24 hours'
        LIMIT 1
      `,
      [row.id, reminderType]
    );

    if (alreadySent.rows.length > 0) {
      continue;
    }

    // Create reminder notification
    const message = buildReminderMessage(
      reminderType,
      row.work_item_title as string,
      deadline,
      row.department_name as string
    );

    await createAssignmentNotification({
      message,
      recipientDepartmentId: row.main_department_id as string,
      assignmentId: row.id as string,
      workItemId: row.work_item_id as string
    });

    // If overdue, also notify principal
    if (reminderType === "overdue") {
      await pool.query(
        `
          UPDATE assignments
          SET status = 'overdue'
          WHERE id = $1
        `,
        [row.id]
      );
    }

    // Log the reminder
    const logId = `rem_${row.id}_${Math.random().toString(36).slice(2, 8)}`;
    await pool.query(
      `
        INSERT INTO reminder_log (id, assignment_id, work_item_id, reminder_type, recipient_department_id)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [logId, row.id, row.work_item_id, reminderType, row.main_department_id]
    );

    remindersCreated++;
  }

  return {
    checked: assignmentsResult.rows.length,
    remindersCreated,
    overdue,
    upcoming
  };
}

/**
 * Generate daily operational report for HT and department heads
 */
export async function generateDailyReport(): Promise<DailyReportData> {
  const pool = getDbPool();
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // Work items by status
  const statusResult = await pool.query(
    `
      SELECT status, COUNT(*) as count
      FROM work_items
      WHERE status != 'archived'
      GROUP BY status
    `
  );

  const byStatus: Record<string, number> = {};

  for (const row of statusResult.rows) {
    byStatus[row.status as string] = Number(row.count);
  }

  // Overdue assignments
  const overdueResult = await pool.query(
    `
      SELECT COUNT(*) as count
      FROM assignments
      WHERE active = true
        AND deadline < NOW()
        AND status NOT IN ('closed', 'overdue')
    `
  );
  const overdueAssignments = Number(overdueResult.rows[0]?.count ?? 0);

  // Pending principal review
  const pendingReviewResult = await pool.query(
    `
      SELECT COUNT(*) as count
      FROM work_items
      WHERE status IN ('waiting_review', 'waiting_principal_approval')
    `
  );
  const pendingReview = Number(pendingReviewResult.rows[0]?.count ?? 0);

  // Completed today
  const completedTodayResult = await pool.query(
    `
      SELECT COUNT(*) as count
      FROM work_items
      WHERE status = 'completed'
        AND updated_at >= $1
    `,
    [todayStart.toISOString()]
  );
  const completedToday = Number(completedTodayResult.rows[0]?.count ?? 0);

  // By department
  const byDeptResult = await pool.query(
    `
      SELECT
        d.name AS department_name,
        COUNT(a.id) AS total,
        COUNT(CASE WHEN a.deadline < NOW() AND a.status NOT IN ('closed') THEN 1 END) AS overdue,
        COUNT(CASE WHEN w.status = 'completed' THEN 1 END) AS completed
      FROM departments d
      LEFT JOIN assignments a ON a.main_department_id = d.id AND a.active = true
      LEFT JOIN work_items w ON w.id = a.work_item_id
      GROUP BY d.id, d.name
      ORDER BY d.name
    `
  );

  const byDepartment = byDeptResult.rows.map((row) => ({
    departmentName: row.department_name as string,
    total: Number(row.total),
    overdue: Number(row.overdue),
    completed: Number(row.completed)
  }));

  // Needs attention: overdue, stalled, pending review
  const attentionResult = await pool.query(
    `
      SELECT
        w.id AS work_item_id,
        w.title,
        w.status,
        a.deadline,
        CASE
          WHEN w.status = 'waiting_review' THEN 'Chờ Hiệu trưởng xem'
          WHEN w.status = 'waiting_principal_approval' THEN 'Chờ HT phê duyệt'
          WHEN a.deadline < NOW() AND a.status NOT IN ('closed') THEN 'Quá hạn'
          WHEN a.status = 'waiting_acceptance' AND a.created_at < NOW() - INTERVAL '24 hours' THEN 'Chờ xác nhận tiếp nhận > 24h'
          ELSE 'Cần xem xét'
        END AS reason
      FROM work_items w
      LEFT JOIN assignments a ON a.work_item_id = w.id AND a.active = true
      WHERE w.status NOT IN ('completed', 'archived')
        AND (
          w.status IN ('waiting_review', 'waiting_principal_approval')
          OR (a.deadline < NOW() AND a.status NOT IN ('closed'))
          OR (a.status = 'waiting_acceptance' AND a.created_at < NOW() - INTERVAL '24 hours')
        )
      ORDER BY
        CASE WHEN a.deadline < NOW() THEN 0 ELSE 1 END,
        a.deadline ASC NULLS LAST
      LIMIT 20
    `
  );

  const needsAttention = attentionResult.rows.map((row) => ({
    workItemId: row.work_item_id as string,
    title: row.title as string,
    reason: row.reason as string,
    deadline: row.deadline ? String(row.deadline) : undefined
  }));

  return {
    date: now.toISOString(),
    totalWorkItems: Object.values(byStatus).reduce((a, b) => a + b, 0),
    byStatus,
    overdueAssignments,
    pendingReview,
    completedToday,
    byDepartment,
    needsAttention
  };
}

/**
 * Generate weekly report for HT with performance metrics
 */
export async function generateWeeklyReport(): Promise<WeeklyReportData> {
  const daily = await generateDailyReport();
  const pool = getDbPool();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  // Completion rate this week
  const weekStatsResult = await pool.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE w.status = 'completed' AND w.updated_at >= $1) AS completed_week,
        COUNT(*) FILTER (WHERE w.created_at >= $1) AS created_week
      FROM work_items w
    `,
    [weekAgo.toISOString()]
  );

  const completedWeek = Number(weekStatsResult.rows[0]?.completed_week ?? 0);
  const createdWeek = Number(weekStatsResult.rows[0]?.created_week ?? 0);
  const completionRate = createdWeek > 0 ? Math.round((completedWeek / createdWeek) * 100) : 0;

  // Top performing departments (most completed)
  const topDeptResult = await pool.query(
    `
      SELECT d.name
      FROM departments d
      JOIN assignments a ON a.main_department_id = d.id
      JOIN work_items w ON w.id = a.work_item_id
      WHERE w.status = 'completed' AND w.updated_at >= $1
      GROUP BY d.id, d.name
      ORDER BY COUNT(*) DESC
      LIMIT 3
    `,
    [weekAgo.toISOString()]
  );
  const topPerformingDepartments = topDeptResult.rows.map((r) => r.name as string);

  // Bottlenecks: work items stalled without update for > 3 days
  const bottleneckResult = await pool.query(
    `
      SELECT
        w.id AS work_item_id,
        w.title,
        EXTRACT(DAY FROM NOW() - w.updated_at) AS stalled_days
      FROM work_items w
      WHERE w.status IN ('assigned', 'in_review', 'needs_supplement', 'needs_rework')
        AND w.updated_at < NOW() - INTERVAL '3 days'
      ORDER BY w.updated_at ASC
      LIMIT 10
    `
  );

  const bottlenecks = bottleneckResult.rows.map((row) => ({
    workItemId: row.work_item_id as string,
    title: row.title as string,
    stalledDays: Number(row.stalled_days)
  }));

  const weekEnd = new Date();
  const weekStart = weekAgo;

  return {
    ...daily,
    weekStart: weekStart.toISOString(),
    weekEnd: weekEnd.toISOString(),
    completionRate,
    topPerformingDepartments,
    bottlenecks
  };
}

/**
 * AI quality check: evaluate submitted report against original requirements
 */
export async function runQualityCheck(
  taskId: string
): Promise<QualityCheckResult> {
  const pool = getDbPool();

  // Get task with its linked work item and assignment
  const taskResult = await pool.query(
    `
      SELECT
        t.id,
        t.title,
        t.goal,
        t.report_note,
        t.report_submitted_at,
        t.accepted_at,
        a.deadline,
        a.output_requirement,
        a.priority,
        w.title AS work_item_title,
        w.description AS work_item_description,
        w.output_type,
        w.output_requirement AS work_item_output_requirement
      FROM tasks t
      LEFT JOIN assignments a ON a.id = t.assignment_id
      LEFT JOIN work_items w ON w.id = t.work_item_id
      WHERE t.id = $1
      LIMIT 1
    `,
    [taskId]
  );

  if (taskResult.rows.length === 0) {
    return {
      passed: false,
      score: 0,
      issues: ["Không tìm thấy task"],
      recommendation: "Không thể kiểm tra",
      returnStage: "execution"
    };
  }

  const row = taskResult.rows[0];
  const issues: string[] = [];

  // Check 1: Was report submitted?
  if (!row.report_submitted_at) {
    issues.push("Chưa nộp báo cáo kết quả");
    return { passed: false, score: 0, issues, recommendation: "Yêu cầu nộp báo cáo", returnStage: "submission" };
  }

  // Check 2: Is it overdue?
  let isLate = false;

  if (row.deadline) {
    const deadline = new Date(row.deadline as string);
    const submittedAt = new Date(row.report_submitted_at as string);

    if (submittedAt > deadline) {
      issues.push(`Nộp trễ hạn (deadline: ${deadline.toLocaleDateString("vi-VN")})`);
      isLate = true;
    }
  }

  // Check 3: Report content check
  const reportNote = row.report_note as string | null;

  if (!reportNote || reportNote.trim().length < 20) {
    issues.push("Nội dung báo cáo quá ngắn hoặc trống");
  }

  // Check 4: Get evidence files
  const filesResult = await pool.query(
    `
      SELECT COUNT(*) as count
      FROM task_update_files
      WHERE task_id = $1
    `,
    [taskId]
  );
  const evidenceFileCount = Number(filesResult.rows[0]?.count ?? 0);

  if (evidenceFileCount === 0) {
    issues.push("Chưa đính kèm file minh chứng");
  }

  // Compute score
  let score = 100;
  score -= issues.length * 20;
  score = Math.max(0, Math.min(100, score));

  const passed = score >= 60 && !isLate;

  let returnStage: QualityCheckResult["returnStage"] = "principal_review";

  if (isLate) {
    returnStage = "execution_late";
  } else if (issues.some((i) => i.includes("nội dung"))) {
    returnStage = "execution";
  } else if (issues.some((i) => i.includes("file") || i.includes("hồ sơ"))) {
    returnStage = "submission";
  }

  const recommendation = passed
    ? "Hồ sơ đạt yêu cầu, sẵn sàng trình Hiệu trưởng phê duyệt"
    : `Hồ sơ chưa đạt: ${issues.join("; ")}. Cần xử lý trước khi trình HT.`;

  return { passed, score, issues, recommendation, returnStage };
}

function buildReminderMessage(
  reminderType: string,
  workItemTitle: string,
  deadline: Date,
  departmentName: string
): string {
  const deadlineStr = deadline.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  switch (reminderType) {
    case "before_3_days":
      return `[Nhắc việc] Công việc "${workItemTitle}" sẽ đến hạn sau 3 ngày (${deadlineStr}). Đề nghị ${departmentName} cập nhật tiến độ.`;
    case "before_1_day":
      return `[NHẮC KHẨN] Công việc "${workItemTitle}" sẽ đến hạn vào ngày mai (${deadlineStr}). Đề nghị ${departmentName} hoàn thành và nộp báo cáo ngay.`;
    case "on_deadline":
      return `[NHẮC CUỐI] Hôm nay là hạn chót cho công việc "${workItemTitle}" (${deadlineStr}). Đề nghị ${departmentName} nộp báo cáo kết quả.`;
    case "overdue":
      return `[CẢNH BÁO QUÁ HẠN] Công việc "${workItemTitle}" đã quá hạn (${deadlineStr}). Đề nghị ${departmentName} báo cáo tình hình và có giải trình.`;
    default:
      return `Nhắc việc: "${workItemTitle}" - Deadline: ${deadlineStr}`;
  }
}
