import "./styles.css";

/**
 * These types describe the JSON shape returned by the existing API.
 *
 * They are kept small and local so the beginner can understand
 * the data used by this page without needing a framework first.
 */
type TaskType = "growth" | "school_workflow";
type TaskStatus = "pending" | "running" | "completed" | "failed";
type AppUserRole = "admin" | "principal" | "department_head" | "staff" | "clerk";
type WorkItemStatus =
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
type AssignmentPriority = "low" | "normal" | "high" | "urgent";
type DocumentOcrStatus = "pending" | "ready" | "failed";

interface Task {
  id: string;
  taskType: TaskType;
  title: string;
  goal: string;
  audience: string;
  notes?: string;
  ownerId?: string;
  workItemId?: string;
  assignmentId?: string;
  ownerDepartmentId?: string;
  progressPercent?: number;
  acceptedAt?: string;
  completedAt?: string;
  reportSubmittedAt?: string;
  reportNote?: string;
  qualityCheckPassed?: boolean;
  qualityCheckNote?: string;
  qualityCheckedAt?: string;
  principalApprovedAt?: string;
  principalApprovalNote?: string;
  status: TaskStatus;
  createdAt: string;
}

interface TaskResult {
  taskId: string;
  agentName: string;
  outputText: string;
  createdAt: string;
}

type TaskExecutionStatus =
  | "pending"
  | "running"
  | "waiting_dependency"
  | "needs_data"
  | "internally_completed"
  | "submitted";

interface TaskUpdate {
  id: string;
  taskId: string;
  updatedByUserId?: string;
  executionStatus: TaskExecutionStatus;
  progressPercent: number;
  note?: string;
  createdAt: string;
}

type SubmissionReviewOutcome =
  | "needs_supplement"
  | "needs_rework"
  | "late_explanation_required"
  | "needs_reassignment"
  | "ready_for_principal_approval";

type SubmissionReturnStage =
  | "submission"
  | "execution"
  | "execution_late"
  | "principal_review";

interface SubmissionReview {
  id: string;
  taskId: string;
  workItemId?: string;
  reviewedByUserId?: string;
  reviewOutcome: SubmissionReviewOutcome;
  returnStage: SubmissionReturnStage;
  reasonCode?: string;
  reasonText?: string;
  createdAt: string;
}

interface TaskListItem {
  task: Task;
  result?: TaskResult;
}

interface TasksResponse {
  tasks: Array<Task | TaskListItem>;
}

interface CreateTaskResponse {
  task: Task;
  result: TaskResult;
}

interface ApiErrorResponse {
  error?: string;
}

interface DeleteTaskResponse {
  success: boolean;
}

interface SuccessResponse {
  success: boolean;
}

interface TaskUpdatesResponse {
  updates: TaskUpdate[];
}

interface SubmissionReviewsResponse {
  reviews: SubmissionReview[];
}

interface Department {
  id: string;
  name: string;
  code?: string;
  createdAt: string;
}

interface AppUserProfile {
  id: string;
  username: string;
  displayName?: string;
  role: AppUserRole;
  departmentId?: string;
  departmentName?: string;
  position?: string;
  isActive: boolean;
}

interface SessionResponse {
  authenticated: boolean;
  userId: string | null;
  user: AppUserProfile | null;
}

type WorkItemSourceType =
  | "incoming_document"
  | "internal_directive"
  | "plan"
  | "spontaneous_task"
  | "department_request"
  | "work_schedule";

type WorkItemOutputType =
  | "report"
  | "plan_document"
  | "minutes"
  | "list"
  | "proposal"
  | "evidence_files"
  | "other";

interface WorkItem {
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

interface WorkItemFile {
  id: string;
  workItemId: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  hasFileContent?: boolean;
  uploadedByUserId?: string;
  createdAt: string;
}

interface AiAnalysis {
  id: string;
  workItemId: string;
  summary: string;
  rawOutput: string;
  model?: string;
  createdByUserId?: string;
  createdAt: string;
}

interface WorkItemListItem {
  workItem: WorkItem;
  latestAnalysis?: AiAnalysis;
  files: WorkItemFile[];
}

interface WorkItemsResponse {
  workItems: WorkItemListItem[];
}

interface WorkItemResponse {
  workItem: WorkItem;
}

interface WorkItemDetailResponse extends WorkItemListItem {}

interface WorkItemFileResponse {
  file: WorkItemFile;
}

interface AiAnalysisResponse {
  analysis: AiAnalysis;
}

interface Document {
  id: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
  metadata?: Record<string, unknown>;
  extractedText?: string;
  hasFileContent?: boolean;
  ocrStatus: DocumentOcrStatus;
  uploadedByUserId: string;
  createdWorkItemId?: string;
  createdAt: string;
}

interface DocumentAnalysis {
  id: string;
  documentId: string;
  summary: string;
  rawOutput: string;
  model?: string;
  createdByUserId?: string;
  createdAt: string;
}

interface DocumentListItem {
  document: Document;
  latestAnalysis?: DocumentAnalysis;
}

interface DocumentsResponse {
  documents: DocumentListItem[];
}

interface DocumentResponse {
  document: Document;
}

interface DocumentDetailResponse extends DocumentListItem {}

interface DocumentAnalysisResponse {
  analysis: DocumentAnalysis;
}

interface CreateWorkItemFromDocumentResponse {
  document: Document;
  workItem: WorkItem;
}

interface Assignment {
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

interface AssignmentsResponse {
  assignments: Assignment[];
}

interface Notification {
  id: string;
  message: string;
  recipientDepartmentId?: string;
  recipientUserId?: string;
  assignmentId?: string;
  workItemId?: string;
  createdAt: string;
  isRead: boolean;
}

interface NotificationsResponse {
  notifications: Notification[];
}

interface DepartmentsResponse {
  departments: Department[];
}

interface DepartmentResponse {
  department: Department;
}

interface UsersResponse {
  users: AppUserProfile[];
}

interface UserResponse {
  user: AppUserProfile;
}

interface TaskTemplate {
  label: string;
  title: string;
  goal: string;
  audience: string;
  notes: string;
}

const MOCK_USER_STORAGE_KEY = "agent-app.mock-user-id";
const DEFAULT_MOCK_USER_ID = "";

let currentTasks: Task[] = [];
let currentTaskItems: TaskListItem[] = [];
let selectedTaskId: string | null = null;
let currentLatestResultTaskId: string | null = null;
let currentMockUserId = loadMockUserId();
let currentSessionUserId: string | null = null;
let currentSessionUser: AppUserProfile | null = null;
let currentDepartments: Department[] = [];
let currentUsers: AppUserProfile[] = [];
let currentDocuments: DocumentListItem[] = [];
let selectedDocumentId: string | null = null;
let currentAnalyzingDocumentId: string | null = null;
let currentWorkItems: WorkItemListItem[] = [];
let selectedWorkItemId: string | null = null;
let currentWorkItemAssignments: Assignment[] = [];
let currentAssignments: Assignment[] = [];
let currentSelectedTaskWorkItem: WorkItemListItem | null = null;
let currentSelectedTaskDocument: DocumentListItem | null = null;
let currentNotifications: Notification[] = [];
let currentSelectedTaskUpdates: TaskUpdate[] = [];
let currentSelectedTaskReviews: SubmissionReview[] = [];
let currentView:
  | "overview"
  | "documents"
  | "work-items"
  | "assignments"
  | "department-tasks"
  | "approvals"
  | "reports"
  | "admin"
  | "account"
  | "legacy" = "documents";
let currentDocumentSearch = "";
let currentWorkItemSearch = "";
let currentDepartmentTaskStatusFilter = "all";
let currentWorkItemStatusFilter = "active";

const TASK_TEMPLATES: Record<string, TaskTemplate> = {
  blogSeo: {
    label: "Blog SEO",
    title: "SEO blog draft for a core customer problem",
    goal: "Create an SEO-friendly blog draft that can attract organic search traffic.",
    audience: "Business owners searching for practical marketing guidance",
    notes: "Content Type: Blog SEO\nFocus on search intent, simple headings, and a clear CTA."
  },
  facebookPost: {
    label: "Facebook Post",
    title: "Facebook post for a weekly campaign idea",
    goal: "Write a short Facebook post that gets attention and encourages engagement.",
    audience: "Followers who want quick, useful business tips",
    notes: "Content Type: Facebook Post\nKeep the tone simple, direct, and social."
  },
  salesEmail: {
    label: "Sales Email",
    title: "Sales email for a warm lead follow-up",
    goal: "Write a short sales email that moves a warm lead toward a reply.",
    audience: "Prospects already aware of the offer but not yet committed",
    notes: "Content Type: Sales Email\nKeep the message concise with one clear CTA."
  },
  landingPageCopy: {
    label: "Landing Page Copy",
    title: "Landing page copy for a focused offer",
    goal: "Create simple landing page copy that explains value clearly and drives action.",
    audience: "Visitors comparing options and looking for a clear next step",
    notes: "Content Type: Landing Page Copy\nInclude a clear headline, benefit, and CTA."
  }
};

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App root element was not found");
}

app.innerHTML = `
  <main class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-brand">
        <p class="eyebrow">Hệ thống Quản lý Công việc</p>
        <h1>Nội bộ trường học</h1>
        <p class="intro">Tiếp nhận, phân luồng, giao việc và theo dõi thực hiện tập trung từ một nơi.</p>
      </div>
      <nav class="sidebar-nav" aria-label="Primary">
        <button class="nav-button" type="button" data-view="overview">📊 Tổng quan</button>
        <button class="nav-button" type="button" data-view="documents">📥 Tiếp nhận</button>
        <button class="nav-button" type="button" data-view="approvals">⚖️ Phân luồng HT</button>
        <button class="nav-button" type="button" data-view="department-tasks">🏃 Thực hiện</button>
        <button class="nav-button" type="button" data-view="work-items">📂 Hồ sơ</button>
        <button class="nav-button" type="button" data-view="reports">📈 Báo cáo</button>
        <button class="nav-button" type="button" data-view="admin">⚙️ Quản trị</button>
        <button class="nav-button" type="button" data-view="account">👤 Tài khoản</button>
        <button class="nav-button" type="button" data-view="legacy">🔧 Legacy</button>
      </nav>
      <section class="sidebar-account">
        <p class="detail-label">Người dùng hiện tại</p>
        <p id="session-user" class="mock-user-active">Đang kiểm tra phiên...</p>
        <p id="identity-source" class="identity-source-note">Đang xác thực...</p>
        <p id="active-user" class="identity-source-note"></p>
      </section>
    </aside>

    <section class="app-main">
      <header class="topbar panel">
        <div class="topbar-copy">
          <p id="view-eyebrow" class="eyebrow">Tổng quan</p>
          <h2 id="view-title">Hệ thống Quản lý Công việc</h2>
          <p id="view-description" class="intro">
            Tải văn bản, xem tóm tắt AI và tạo hồ sơ công việc từ các văn bản đã xác minh.
          </p>
        </div>
        <section class="account-card" aria-label="Current account">
          <p class="detail-label">Tài khoản</p>
          <p class="detail-value">Đăng nhập, đổi mật khẩu và điều khiển phiên làm việc.</p>
          <div class="auth-actions">
            <button class="secondary-button" type="button" data-view="account">Mở tài khoản</button>
          </div>
        </section>
      </header>

      <p id="status-message" class="status-message" aria-live="polite"></p>
      <p id="context-status-message" class="status-message status-message-context hidden" aria-live="polite"></p>
      <section id="workflow-stepper" class="workflow-stepper panel" aria-label="Workflow steps"></section>
      <section id="workflow-guidance" class="workflow-guidance panel" aria-label="Next actions"></section>

      <section id="overview-view" class="content-view">
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Tổng quan vận hành</p>
              <h3>KPI theo giai đoạn</h3>
            </div>
            <div id="overview-cards" class="metric-cards-grid"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Cần xử lý</p>
              <h3>Việc cần chú ý</h3>
            </div>
            <div id="needs-attention-panel" class="admin-list"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Hoạt động</p>
              <h3>Hoạt động gần đây</h3>
            </div>
            <div id="recent-activity-panel" class="admin-list"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Theo đơn vị</p>
              <h3>Tóm tắt các đơn vị</h3>
            </div>
            <div id="by-department-panel" class="admin-list"></div>
          </section>
        </div>
      </section>

      <section id="documents-view" class="content-view hidden">
        <div class="panel">
          <div class="tasks-header">
            <div>
              <p class="eyebrow">Giai đoạn 1</p>
              <h3>Tiếp nhận văn bản / Công việc</h3>
            </div>
            <button id="refresh-documents-button" class="secondary-button" type="button">Làm mới</button>
          </div>
          <p class="intro workflow-note">
            Văn thư tải lên văn bản đến, nhập thông tin và chuyển cho Hiệu trưởng xem xét.
            AI Agent sẽ tự động phân tích nội dung và gợi ý phân loại.
          </p>

          <div class="toolbar-row compact-toolbar">
            <div class="field">
              <label for="document-search">Tìm kiếm văn bản</label>
              <input id="document-search" type="text" placeholder="Tên file, nội dung trích xuất, người tải lên..." />
            </div>
            <details class="inline-disclosure">
              <summary>Tải lên văn bản mới</summary>
              <form id="document-form" class="task-form disclosure-form" novalidate>
                <div class="field">
                  <label for="document-file">File văn bản</label>
                  <input id="document-file" name="documentFile" type="file" multiple />
                </div>
                <div class="field">
                  <label for="document-title">Ghi chú</label>
                  <input id="document-title" name="documentTitle" type="text" placeholder="Văn bản đến từ Sở/Phòng/Phụ huynh..." />
                </div>
                <div class="field">
                  <label for="document-metadata">Thông tin bổ sung (JSON)</label>
                  <textarea id="document-metadata" name="documentMetadata" rows="2" placeholder='{"nguon":"cong-van","kenh":"email"}'></textarea>
                </div>
                <button id="create-document-button" class="primary-button" type="submit">Tải lên văn bản</button>
              </form>
            </details>
          </div>

          <div class="work-item-layout app-split-layout">
            <div id="document-list" class="task-list split-list"></div>
            <section id="document-detail" class="result-card split-detail hidden">
              <h3 id="document-detail-title">Chi tiết văn bản</h3>
              <p id="document-detail-meta" class="result-meta"></p>
              <div id="document-detail-body" class="work-item-detail-body"></div>
            </section>
          </div>
        </div>
      </section>

      <section id="work-items-view" class="content-view hidden">
        <div class="panel">
          <div class="tasks-header">
            <div>
              <p class="eyebrow">Hồ sơ công việc</p>
              <h3>Quản lý hồ sơ</h3>
            </div>
            <button id="refresh-work-items-button" class="secondary-button" type="button">Làm mới</button>
          </div>
          <p class="intro workflow-note">
            Toàn bộ hồ sơ công việc từ khi tiếp nhận đến lưu trữ. Xem trạng thái, lịch sử và hồ sơ đính kèm.
          </p>
          <div class="status-filter-tabs" id="work-item-status-tabs" style="margin-bottom:12px">
            <button class="tab-button is-active" type="button" data-wi-status-filter="active">Đang xử lý</button>
            <button class="tab-button" type="button" data-wi-status-filter="completed">Hoàn thành</button>
            <button class="tab-button" type="button" data-wi-status-filter="archived">Lưu trữ</button>
            <button class="tab-button" type="button" data-wi-status-filter="all">Tất cả</button>
          </div>

          <div class="toolbar-row compact-toolbar">
            <div class="field">
              <label for="work-item-search">Search work items</label>
              <input id="work-item-search" type="text" placeholder="Tìm tiêu đề, mô tả, mã hồ sơ..." />
            </div>
            <details class="inline-disclosure">
              <summary>Tạo hồ sơ công việc mới</summary>
              <form id="work-item-form" class="task-form disclosure-form" novalidate>
                <div class="form-row-2col">
                  <div class="field">
                    <label for="work-item-intake-code">Mã hồ sơ</label>
                    <input id="work-item-intake-code" name="intakeCode" type="text" placeholder="VB-2024-001" />
                  </div>
                  <div class="field">
                    <label for="work-item-source-type">Nguồn vào</label>
                    <select id="work-item-source-type" name="sourceType">
                      <option value="">-- Chọn nguồn --</option>
                      <option value="incoming_document">Công văn đến</option>
                      <option value="internal_directive">Chỉ đạo nội bộ</option>
                      <option value="plan">Kế hoạch</option>
                      <option value="spontaneous_task">Nhiệm vụ phát sinh</option>
                      <option value="department_request">Đề nghị từ bộ phận</option>
                      <option value="work_schedule">Lịch công tác</option>
                    </select>
                  </div>
                </div>
                <div class="field">
                  <label for="work-item-title">Tiêu đề công việc / văn bản</label>
                  <input id="work-item-title" name="workItemTitle" type="text" placeholder="VD: Triển khai kế hoạch tuyển sinh tháng 4" />
                </div>
                <div class="field">
                  <label for="work-item-description">Nội dung / Mô tả</label>
                  <textarea id="work-item-description" name="workItemDescription" rows="3" placeholder="Mô tả chi tiết nội dung công việc hoặc văn bản..."></textarea>
                </div>
                <div class="form-row-2col">
                  <div class="field">
                    <label for="work-item-output-type">Loại đầu ra yêu cầu</label>
                    <select id="work-item-output-type" name="outputType">
                      <option value="">-- Chọn loại đầu ra --</option>
                      <option value="report">Báo cáo văn bản</option>
                      <option value="plan_document">Kế hoạch thực hiện</option>
                      <option value="minutes">Biên bản</option>
                      <option value="list">Danh sách</option>
                      <option value="proposal">Đề xuất phương án</option>
                      <option value="evidence_files">Minh chứng file/hình ảnh</option>
                      <option value="other">Khác</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="work-item-deadline">Thời hạn xử lý sơ bộ</label>
                    <input id="work-item-deadline" name="deadline" type="datetime-local" />
                  </div>
                </div>
                <div class="field">
                  <label for="work-item-department">Đơn vị sơ bộ</label>
                  <select id="work-item-department" name="workItemDepartment">
                    <option value="">-- Chưa xác định --</option>
                  </select>
                </div>
                <button id="create-work-item-button" class="primary-button" type="submit">Tạo hồ sơ &amp; Chuyển HT xem</button>
              </form>
            </details>
          </div>

          <section id="department-task-queue" class="result-card hidden">
            <h3>Hàng chờ nhiệm vụ đơn vị</h3>
            <div id="department-task-queue-list" class="work-item-queue"></div>
          </section>

          <div class="work-item-layout app-split-layout">
            <div id="work-item-list" class="task-list split-list"></div>
            <section id="work-item-detail" class="result-card split-detail hidden">
              <h3 id="work-item-detail-title">Chi tiết hồ sơ</h3>
              <p id="work-item-detail-meta" class="result-meta"></p>
              <div id="work-item-detail-body" class="work-item-detail-body"></div>
            </section>
          </div>
        </div>
      </section>

      <section id="assignments-view" class="content-view hidden">
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Giao việc</p>
              <h3>Hàng chờ giao việc</h3>
            </div>
            <div id="assignment-queue" class="work-item-queue"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Giao việc</p>
              <h3>Không gian giao việc</h3>
            </div>
            <div id="assignment-workspace" class="admin-list"></div>
            <div id="assignment-list" class="admin-list"></div>
          </section>
        </div>
      </section>

      <section id="department-tasks-view" class="content-view hidden">
        <div class="panel">
          <div class="tasks-header">
            <div>
              <p class="eyebrow">Giai đoạn 4 – Đơn vị thực hiện</p>
              <h3>Thực hiện công việc</h3>
            </div>
            <button id="refresh-button" class="secondary-button" type="button">Làm mới</button>
          </div>
          <p class="intro workflow-note">
            Mở nhiệm vụ được giao, xác nhận tiếp nhận, cập nhật tiến độ, đính kèm minh chứng và nộp báo cáo kết quả.
          </p>
          <div class="toolbar-row">
            <div class="status-filter-tabs" id="department-task-status-tabs">
              <button class="tab-button is-active" type="button" data-status-filter="all">Tất cả</button>
              <button class="tab-button" type="button" data-status-filter="pending">Chờ tiếp nhận</button>
              <button class="tab-button" type="button" data-status-filter="running">Đang thực hiện</button>
              <button class="tab-button" type="button" data-status-filter="completed">Hoàn thành</button>
              <button class="tab-button" type="button" data-status-filter="failed">Thất bại</button>
            </div>
            <select id="department-task-status-filter" class="hidden">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div class="work-item-layout app-split-layout">
            <div id="task-list" class="task-list split-list"></div>
            <section id="department-task-detail" class="result-card split-detail hidden">
              <h3 id="department-task-detail-title">Chi tiết nhiệm vụ</h3>
              <p id="department-task-detail-meta" class="result-meta"></p>
              <div id="department-task-detail-body" class="work-item-detail-body"></div>
            </section>
          </div>
        </div>
      </section>

      <section id="approvals-view" class="content-view hidden">
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Giai đoạn 2 – Hiệu trưởng</p>
              <h3>Hàng chờ xem xét &amp; phê duyệt</h3>
              <p class="intro">HT xem văn bản, gợi ý AI, chọn hướng xử lý và giao việc cho đơn vị.</p>
            </div>
            <div id="approvals-queue" class="work-item-queue"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Giai đoạn 2 &amp; 3</p>
              <h3>Không gian phân luồng &amp; giao việc</h3>
            </div>
            <div id="approvals-assignment-list" class="admin-list"></div>
          </section>
        </div>
      </section>

      <section id="reports-view" class="content-view hidden">
        <div class="panel">
          <div class="tasks-header">
            <div>
              <p class="eyebrow">Báo cáo Agent</p>
              <h3>Tổng hợp vận hành</h3>
            </div>
            <div class="button-row">
              <button id="load-daily-report-button" class="secondary-button" type="button">Báo cáo ngày</button>
              <button id="load-weekly-report-button" class="secondary-button" type="button">Báo cáo tuần</button>
              <button id="run-reminders-button" class="primary-button" type="button">Chạy nhắc deadline</button>
            </div>
          </div>
          <div id="report-cards" class="overview-cards"></div>
          <div id="report-attention-list" class="admin-list" style="margin-top:16px"></div>
          <div id="report-department-table" style="margin-top:16px"></div>
        </div>
      </section>

      <section id="admin-view" class="content-view hidden">
        <section id="admin-panel" class="panel hidden" aria-label="School admin">
          <div class="panel-header">
            <p class="eyebrow">Quản trị</p>
            <h3>Đơn vị &amp; Phân công người dùng</h3>
            <p class="intro">Chỉ Hiệu trưởng mới được cài đặt đơn vị và phân công vai trò người dùng.</p>
          </div>
          <div class="detail-tabs">
            <button class="tab-button is-active" type="button" data-admin-tab="departments">Đơn vị</button>
            <button class="tab-button" type="button" data-admin-tab="users">Người dùng</button>
          </div>
          <div class="admin-section">
            <div class="admin-card" data-admin-panel="departments">
              <h3>Danh sách đơn vị</h3>
              <details class="inline-disclosure">
                <summary>Thêm đơn vị mới</summary>
                <div class="admin-form-row disclosure-form">
                  <div class="field">
                    <label for="department-name">Tên đơn vị</label>
                    <input id="department-name" name="departmentName" type="text" placeholder="Phòng Đào tạo" />
                  </div>
                  <div class="field">
                    <label for="department-code">Mã đơn vị</label>
                    <input id="department-code" name="departmentCode" type="text" placeholder="DAO_TAO" />
                  </div>
                  <div class="auth-actions">
                    <button id="create-department-button" class="secondary-button" type="button">Thêm đơn vị</button>
                  </div>
                </div>
              </details>
              <div id="department-list" class="admin-list"></div>
            </div>

            <div class="admin-card hidden" data-admin-panel="users">
              <h3>Phân công người dùng</h3>
              <details class="inline-disclosure" open>
                <summary>Thêm người dùng mới</summary>
                <article class="admin-item disclosure-form">
                  <div class="admin-user-header">
                    <strong>Tạo tài khoản nội bộ</strong>
                    <span>Có thể đặt vai trò và đơn vị ngay khi tạo</span>
                  </div>
                  <div class="admin-item-grid">
                    <div class="field">
                      <label for="create-user-username">Tên đăng nhập</label>
                      <input id="create-user-username" type="text" placeholder="nguyen.van.a" />
                    </div>
                    <div class="field">
                      <label for="create-user-display-name">Tên hiển thị</label>
                      <input id="create-user-display-name" type="text" placeholder="Nguyễn Văn A" />
                    </div>
                    <div class="field">
                      <label for="create-user-password">Mật khẩu</label>
                      <input id="create-user-password" type="password" placeholder="Ít nhất 10 ký tự" />
                    </div>
                    <div class="field">
                      <label for="create-user-role">Vai trò</label>
                      <select id="create-user-role">
                        <option value="admin">Quản trị viên (admin)</option>
                        <option value="principal">Hiệu trưởng (principal)</option>
                        <option value="department_head">Trưởng khoa (department_head)</option>
                        <option value="staff" selected>Cán bộ (staff)</option>
                        <option value="clerk">Văn thư (clerk)</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="create-user-department">Đơn vị</label>
                      <select id="create-user-department">
                        <option value="">-- Chưa phân công --</option>
                      </select>
                    </div>
                    <div class="field">
                      <label for="create-user-position">Chức vụ</label>
                      <input id="create-user-position" type="text" placeholder="Chuyên viên" />
                    </div>
                    <label class="checkbox-field">
                      <input id="create-user-active" type="checkbox" checked />
                      Kích hoạt tài khoản
                    </label>
                    <div class="auth-actions">
                      <button id="create-user-button" class="secondary-button" type="button">
                        Thêm người dùng
                      </button>
                    </div>
                  </div>
                </article>
              </details>
              <div id="user-admin-list" class="admin-list"></div>
            </div>
          </div>
        </section>
      </section>

      <section id="account-view" class="content-view hidden">
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Tài khoản</p>
              <h3>Đăng nhập / Đăng xuất</h3>
            </div>
            <div id="account-summary" class="admin-item"></div>
            <div class="account-grid">
              <div class="field">
                <label for="username">Tên đăng nhập</label>
                <input id="username" name="username" type="text" placeholder="alice" />
              </div>
              <div class="field">
                <label for="password">Mật khẩu</label>
                <input id="password" name="password" type="password" placeholder="Nhập mật khẩu" />
              </div>
              <div class="auth-actions">
                <button id="login-button" class="primary-button" type="button">Đăng nhập</button>
                <button id="logout-button" class="secondary-button" type="button">Đăng xuất</button>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Tài khoản</p>
              <h3>Đổi mật khẩu &amp; Dev fallback</h3>
            </div>
            <div class="auth-panel-row">
              <div class="field">
                <label for="current-password">Mật khẩu hiện tại</label>
                <input id="current-password" name="currentPassword" type="password" placeholder="Mật khẩu hiện tại" />
              </div>
              <div class="field">
                <label for="new-password">Mật khẩu mới</label>
                <input id="new-password" name="newPassword" type="password" placeholder="Mật khẩu mới" />
              </div>
              <div class="auth-actions">
                <button id="change-password-button" class="secondary-button" type="button">Đổi mật khẩu</button>
              </div>
            </div>
            <div class="auth-panel-row">
              <div class="field">
                <label for="mock-user-id">ID người dùng (dev)</label>
                <input
                  id="mock-user-id"
                  name="mockUserId"
                  type="text"
                  placeholder="user-a"
                  value="${escapeHtml(currentMockUserId)}"
                />
              </div>
            </div>
          </section>
        </div>
      </section>

      <section id="legacy-view" class="content-view hidden">
        <div class="legacy-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Cũ (Legacy)</p>
              <h3>Công việc tăng trưởng</h3>
              <p class="intro">Công cụ cũ vẫn khả dụng nhưng không còn là luồng chính của nhà trường.</p>
            </div>
            <form id="task-form" class="task-form" novalidate>
              <div class="field">
                <label for="template">Mẫu nội dung</label>
                <select id="template" name="template">
                  <option value="">-- Chọn mẫu --</option>
                  <option value="blogSeo">Blog SEO</option>
                  <option value="facebookPost">Facebook Post</option>
                  <option value="salesEmail">Sales Email</option>
                  <option value="landingPageCopy">Landing Page Copy</option>
                </select>
              </div>
              <div class="field">
                <label for="title">Tiêu đề nhiệm vụ</label>
                <input id="title" name="title" type="text" placeholder="Viết ý tưởng blog" required />
                <p id="title-error" class="field-error hidden" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="goal">Mục tiêu</label>
                <textarea id="goal" name="goal" rows="3" placeholder="Tạo ý tưởng nội dung cho agency nhỏ" required></textarea>
                <p id="goal-error" class="field-error hidden" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="audience">Đối tượng</label>
                <input id="audience" name="audience" type="text" placeholder="Chủ doanh nghiệp nhỏ" required />
                <p id="audience-error" class="field-error hidden" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="notes">Ghi chú</label>
                <textarea id="notes" name="notes" rows="3" placeholder="Ghi chú bổ sung (tùy chọn)"></textarea>
              </div>
              <button id="submit-button" class="primary-button" type="submit">Tạo nhiệm vụ</button>
            </form>
          </section>

          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Latest Result</p>
              <h3>Growth Output</h3>
            </div>
            <section id="latest-result" class="result-card hidden" aria-live="polite">
              <p id="result-meta" class="result-meta"></p>
              <pre id="result-text" class="result-text"></pre>
            </section>
            <div id="legacy-task-list" class="task-list"></div>
          </section>
        </div>
      </section>
    </section>

    <div id="task-modal" class="task-modal hidden" aria-hidden="true">
      <button
        id="task-modal-backdrop"
        class="task-modal-backdrop"
        type="button"
        aria-label="Close task detail"
      ></button>
      <section
        class="task-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-modal-title"
      >
        <header class="task-modal-header">
          <div class="task-modal-heading">
            <p class="eyebrow">Chi tiết nhiệm vụ</p>
            <h3 id="task-modal-title">Chi tiết nhiệm vụ</h3>
            <p id="task-modal-meta" class="result-meta"></p>
          </div>
          <button
            id="task-modal-close"
            class="secondary-button"
            type="button"
            aria-label="Close task detail"
          >
            Close
          </button>
        </header>
        <div id="task-modal-body" class="task-modal-body"></div>
      </section>
    </div>

    <div id="document-modal" class="task-modal hidden" aria-hidden="true">
      <button
        id="document-modal-backdrop"
        class="task-modal-backdrop"
        type="button"
        aria-label="Close document detail"
      ></button>
      <section
        class="task-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-modal-title"
      >
        <header class="task-modal-header">
          <div class="task-modal-heading">
            <p class="eyebrow">Chi tiết văn bản</p>
            <h3 id="document-modal-title">Chi tiết văn bản</h3>
            <p id="document-modal-meta" class="result-meta"></p>
          </div>
          <button
            id="document-modal-close"
            class="secondary-button"
            type="button"
            aria-label="Close document detail"
          >
            Close
          </button>
        </header>
        <div id="document-modal-body" class="task-modal-body"></div>
      </section>
    </div>

    <div id="work-item-modal" class="task-modal hidden" aria-hidden="true">
      <button
        id="work-item-modal-backdrop"
        class="task-modal-backdrop"
        type="button"
        aria-label="Close work item detail"
      ></button>
      <section
        class="task-modal-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="work-item-modal-title"
      >
        <header class="task-modal-header">
          <div class="task-modal-heading">
            <p class="eyebrow">Chi tiết hồ sơ</p>
            <h3 id="work-item-modal-title">Chi tiết hồ sơ</h3>
            <p id="work-item-modal-meta" class="result-meta"></p>
          </div>
          <button
            id="work-item-modal-close"
            class="secondary-button"
            type="button"
            aria-label="Close work item detail"
          >
            Close
          </button>
        </header>
        <div id="work-item-modal-body" class="task-modal-body"></div>
      </section>
    </div>
  </main>
`;

const form = document.querySelector<HTMLFormElement>("#task-form")!;
const statusMessage = document.querySelector<HTMLParagraphElement>("#status-message")!;
const contextStatusMessage =
  document.querySelector<HTMLParagraphElement>("#context-status-message")!;
const taskList = document.querySelector<HTMLDivElement>("#task-list")!;
const legacyTaskList =
  document.querySelector<HTMLDivElement>("#legacy-task-list")!;
const refreshButton = document.querySelector<HTMLButtonElement>("#refresh-button")!;
const submitButton = document.querySelector<HTMLButtonElement>("#submit-button")!;
const latestResult = document.querySelector<HTMLElement>("#latest-result")!;
const resultMeta = document.querySelector<HTMLParagraphElement>("#result-meta")!;
const resultText = document.querySelector<HTMLElement>("#result-text")!;
const titleInput = document.querySelector<HTMLInputElement>("#title")!;
const titleError = document.querySelector<HTMLParagraphElement>("#title-error")!;
const goalInput = document.querySelector<HTMLTextAreaElement>("#goal")!;
const goalError = document.querySelector<HTMLParagraphElement>("#goal-error")!;
const audienceInput = document.querySelector<HTMLInputElement>("#audience")!;
const audienceError =
  document.querySelector<HTMLParagraphElement>("#audience-error")!;
const templateSelect = document.querySelector<HTMLSelectElement>("#template")!;
const mockUserInput = document.querySelector<HTMLInputElement>("#mock-user-id")!;
const activeUser = document.querySelector<HTMLParagraphElement>("#active-user")!;
const sessionUser = document.querySelector<HTMLParagraphElement>("#session-user")!;
const identitySource =
  document.querySelector<HTMLParagraphElement>("#identity-source")!;
const usernameInput = document.querySelector<HTMLInputElement>("#username")!;
const passwordInput = document.querySelector<HTMLInputElement>("#password")!;
const currentPasswordInput =
  document.querySelector<HTMLInputElement>("#current-password")!;
const newPasswordInput =
  document.querySelector<HTMLInputElement>("#new-password")!;
const adminPanel = document.querySelector<HTMLElement>("#admin-panel")!;
const departmentNameInput =
  document.querySelector<HTMLInputElement>("#department-name")!;
const departmentCodeInput =
  document.querySelector<HTMLInputElement>("#department-code")!;
const createDepartmentButton =
  document.querySelector<HTMLButtonElement>("#create-department-button")!;
const departmentList = document.querySelector<HTMLDivElement>("#department-list")!;
const userAdminList = document.querySelector<HTMLDivElement>("#user-admin-list")!;
const createUserUsernameInput =
  document.querySelector<HTMLInputElement>("#create-user-username")!;
const createUserDisplayNameInput =
  document.querySelector<HTMLInputElement>("#create-user-display-name")!;
const createUserPasswordInput =
  document.querySelector<HTMLInputElement>("#create-user-password")!;
const createUserRoleSelect =
  document.querySelector<HTMLSelectElement>("#create-user-role")!;
const createUserDepartmentSelect =
  document.querySelector<HTMLSelectElement>("#create-user-department")!;
const createUserPositionInput =
  document.querySelector<HTMLInputElement>("#create-user-position")!;
const createUserActiveInput =
  document.querySelector<HTMLInputElement>("#create-user-active")!;
const createUserButton =
  document.querySelector<HTMLButtonElement>("#create-user-button")!;
const documentForm = document.querySelector<HTMLFormElement>("#document-form")!;
const documentFileInput =
  document.querySelector<HTMLInputElement>("#document-file")!;
const documentTitleInput =
  document.querySelector<HTMLInputElement>("#document-title")!;
const documentMetadataInput =
  document.querySelector<HTMLTextAreaElement>("#document-metadata")!;
const createDocumentButton =
  document.querySelector<HTMLButtonElement>("#create-document-button")!;
const refreshDocumentsButton =
  document.querySelector<HTMLButtonElement>("#refresh-documents-button")!;
const documentSearchInput =
  document.querySelector<HTMLInputElement>("#document-search")!;
const documentList = document.querySelector<HTMLDivElement>("#document-list")!;
const documentDetail = document.querySelector<HTMLElement>("#document-detail")!;
const documentDetailTitle =
  document.querySelector<HTMLHeadingElement>("#document-detail-title")!;
const documentDetailMeta =
  document.querySelector<HTMLParagraphElement>("#document-detail-meta")!;
const documentDetailBody =
  document.querySelector<HTMLDivElement>("#document-detail-body")!;
const documentModal = document.querySelector<HTMLElement>("#document-modal")!;
const documentModalBackdrop =
  document.querySelector<HTMLButtonElement>("#document-modal-backdrop")!;
const documentModalClose =
  document.querySelector<HTMLButtonElement>("#document-modal-close")!;
const documentModalTitle =
  document.querySelector<HTMLHeadingElement>("#document-modal-title")!;
const documentModalMeta =
  document.querySelector<HTMLParagraphElement>("#document-modal-meta")!;
const documentModalBody =
  document.querySelector<HTMLDivElement>("#document-modal-body")!;
const workItemForm = document.querySelector<HTMLFormElement>("#work-item-form")!;
const workItemTitleInput =
  document.querySelector<HTMLInputElement>("#work-item-title")!;
const workItemDescriptionInput =
  document.querySelector<HTMLTextAreaElement>("#work-item-description")!;
const workItemDepartmentSelect =
  document.querySelector<HTMLSelectElement>("#work-item-department")!;
const createWorkItemButton =
  document.querySelector<HTMLButtonElement>("#create-work-item-button")!;
const refreshWorkItemsButton =
  document.querySelector<HTMLButtonElement>("#refresh-work-items-button")!;
const workItemSearchInput =
  document.querySelector<HTMLInputElement>("#work-item-search")!;
const workItemList = document.querySelector<HTMLDivElement>("#work-item-list")!;
const workItemDetail = document.querySelector<HTMLElement>("#work-item-detail")!;
const workItemDetailTitle =
  document.querySelector<HTMLHeadingElement>("#work-item-detail-title")!;
const workItemDetailMeta =
  document.querySelector<HTMLParagraphElement>("#work-item-detail-meta")!;
const workItemDetailBody =
  document.querySelector<HTMLDivElement>("#work-item-detail-body")!;
const workItemModal = document.querySelector<HTMLElement>("#work-item-modal")!;
const workItemModalBackdrop =
  document.querySelector<HTMLButtonElement>("#work-item-modal-backdrop")!;
const workItemModalClose =
  document.querySelector<HTMLButtonElement>("#work-item-modal-close")!;
const workItemModalTitle =
  document.querySelector<HTMLHeadingElement>("#work-item-modal-title")!;
const workItemModalMeta =
  document.querySelector<HTMLParagraphElement>("#work-item-modal-meta")!;
const workItemModalBody =
  document.querySelector<HTMLDivElement>("#work-item-modal-body")!;
const departmentTaskQueue =
  document.querySelector<HTMLElement>("#department-task-queue")!;
const departmentTaskQueueList =
  document.querySelector<HTMLDivElement>("#department-task-queue-list")!;
const departmentTaskStatusFilter =
  document.querySelector<HTMLSelectElement>("#department-task-status-filter")!;
const loginButton = document.querySelector<HTMLButtonElement>("#login-button")!;
const logoutButton = document.querySelector<HTMLButtonElement>("#logout-button")!;
const changePasswordButton =
  document.querySelector<HTMLButtonElement>("#change-password-button")!;
const navButtons = document.querySelectorAll<HTMLButtonElement>("[data-view]");
const viewEyebrow = document.querySelector<HTMLParagraphElement>("#view-eyebrow")!;
const viewTitle = document.querySelector<HTMLHeadingElement>("#view-title")!;
const viewDescription =
  document.querySelector<HTMLParagraphElement>("#view-description")!;
const workflowStepper =
  document.querySelector<HTMLElement>("#workflow-stepper")!;
const workflowGuidance =
  document.querySelector<HTMLElement>("#workflow-guidance")!;
const overviewView = document.querySelector<HTMLElement>("#overview-view")!;
const documentsView = document.querySelector<HTMLElement>("#documents-view")!;
const workItemsView = document.querySelector<HTMLElement>("#work-items-view")!;
const assignmentsView = document.querySelector<HTMLElement>("#assignments-view")!;
const departmentTasksView =
  document.querySelector<HTMLElement>("#department-tasks-view")!;
const reportsView = document.querySelector<HTMLElement>("#reports-view")!;
const adminView = document.querySelector<HTMLElement>("#admin-view")!;
const approvalsView = document.querySelector<HTMLElement>("#approvals-view")!;
const accountView = document.querySelector<HTMLElement>("#account-view")!;
const legacyView = document.querySelector<HTMLElement>("#legacy-view")!;
const overviewCards = document.querySelector<HTMLDivElement>("#overview-cards")!;
const needsAttentionPanel =
  document.querySelector<HTMLDivElement>("#needs-attention-panel")!;
const recentActivityPanel =
  document.querySelector<HTMLDivElement>("#recent-activity-panel")!;
const byDepartmentPanel =
  document.querySelector<HTMLDivElement>("#by-department-panel")!;
const reportCards = document.querySelector<HTMLDivElement>("#report-cards")!;
const assignmentQueue = document.querySelector<HTMLDivElement>("#assignment-queue")!;
const assignmentWorkspace =
  document.querySelector<HTMLDivElement>("#assignment-workspace")!;
const assignmentList = document.querySelector<HTMLDivElement>("#assignment-list")!;
const approvalsQueue = document.querySelector<HTMLDivElement>("#approvals-queue")!;
const approvalsAssignmentList =
  document.querySelector<HTMLDivElement>("#approvals-assignment-list")!;
const accountSummary = document.querySelector<HTMLDivElement>("#account-summary")!;
const departmentTaskStatusTabs =
  document.querySelector<HTMLDivElement>("#department-task-status-tabs")!;
const departmentTaskDetail =
  document.querySelector<HTMLElement>("#department-task-detail")!;
const departmentTaskDetailTitle =
  document.querySelector<HTMLHeadingElement>("#department-task-detail-title")!;
const departmentTaskDetailMeta =
  document.querySelector<HTMLParagraphElement>("#department-task-detail-meta")!;
const departmentTaskDetailBody =
  document.querySelector<HTMLDivElement>("#department-task-detail-body")!;
const taskModal = document.querySelector<HTMLElement>("#task-modal")!;
const taskModalBackdrop =
  document.querySelector<HTMLButtonElement>("#task-modal-backdrop")!;
const taskModalClose =
  document.querySelector<HTMLButtonElement>("#task-modal-close")!;
const taskModalTitle =
  document.querySelector<HTMLHeadingElement>("#task-modal-title")!;
const taskModalMeta =
  document.querySelector<HTMLParagraphElement>("#task-modal-meta")!;
const taskModalBody =
  document.querySelector<HTMLDivElement>("#task-modal-body")!;

if (
  !form ||
  !statusMessage ||
  !contextStatusMessage ||
  !taskList ||
  !legacyTaskList ||
  !refreshButton ||
  !submitButton ||
  !latestResult ||
  !resultMeta ||
  !resultText ||
  !titleInput ||
  !titleError ||
  !goalInput ||
  !goalError ||
  !audienceInput ||
  !audienceError ||
  !templateSelect ||
  !mockUserInput ||
  !activeUser ||
  !sessionUser ||
  !identitySource ||
  !usernameInput ||
  !passwordInput ||
  !currentPasswordInput ||
  !newPasswordInput ||
  !adminPanel ||
  !departmentNameInput ||
  !departmentCodeInput ||
  !createDepartmentButton ||
  !departmentList ||
  !userAdminList ||
  !documentForm ||
  !documentFileInput ||
  !documentTitleInput ||
  !documentMetadataInput ||
  !createDocumentButton ||
  !refreshDocumentsButton ||
  !documentSearchInput ||
  !documentList ||
  !documentDetail ||
  !documentDetailTitle ||
  !documentDetailMeta ||
  !documentDetailBody ||
  !documentModal ||
  !documentModalBackdrop ||
  !documentModalClose ||
  !documentModalTitle ||
  !documentModalMeta ||
  !documentModalBody ||
  !workItemForm ||
  !workItemTitleInput ||
  !workItemDescriptionInput ||
  !workItemDepartmentSelect ||
  !createWorkItemButton ||
  !refreshWorkItemsButton ||
  !workItemSearchInput ||
  !workItemList ||
  !workItemDetail ||
  !workItemDetailTitle ||
  !workItemDetailMeta ||
  !workItemDetailBody ||
  !workItemModal ||
  !workItemModalBackdrop ||
  !workItemModalClose ||
  !workItemModalTitle ||
  !workItemModalMeta ||
  !workItemModalBody ||
  !departmentTaskQueue ||
  !departmentTaskQueueList ||
  !departmentTaskStatusFilter ||
  !loginButton ||
  !logoutButton ||
  !changePasswordButton ||
  navButtons.length === 0 ||
  !viewEyebrow ||
  !viewTitle ||
  !viewDescription ||
  !workflowStepper ||
  !workflowGuidance ||
  !overviewView ||
  !documentsView ||
  !workItemsView ||
  !assignmentsView ||
  !departmentTasksView ||
  !reportsView ||
  !adminView ||
  !approvalsView ||
  !accountView ||
  !legacyView ||
  !overviewCards ||
  !needsAttentionPanel ||
  !recentActivityPanel ||
  !byDepartmentPanel ||
  !reportCards ||
  !assignmentQueue ||
  !assignmentWorkspace ||
  !assignmentList ||
  !approvalsQueue ||
  !approvalsAssignmentList ||
  !accountSummary ||
  !departmentTaskStatusTabs ||
  !departmentTaskDetail ||
  !departmentTaskDetailTitle ||
  !departmentTaskDetailMeta ||
  !departmentTaskDetailBody ||
  !taskModal ||
  !taskModalBackdrop ||
  !taskModalClose ||
  !taskModalTitle ||
  !taskModalMeta ||
  !taskModalBody ||
  !createUserUsernameInput ||
  !createUserDisplayNameInput ||
  !createUserPasswordInput ||
  !createUserRoleSelect ||
  !createUserDepartmentSelect ||
  !createUserPositionInput ||
  !createUserActiveInput ||
  !createUserButton
) {
  throw new Error("One or more required UI elements were not found");
}

renderActiveUser();
renderSessionUser();
renderCurrentView();

titleInput.addEventListener("input", () => {
  clearTitleError();
});

goalInput.addEventListener("input", () => {
  clearGoalError();
});

audienceInput.addEventListener("input", () => {
  clearAudienceError();
});

templateSelect.addEventListener("change", () => {
  applySelectedTemplate(templateSelect.value);
});

navButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const nextView = button.dataset.view as typeof currentView | undefined;

    if (!nextView) {
      return;
    }

    if (nextView === "admin" && !isAdminLikeSession()) {
      setStatus("Admin access is required for this view.", "error");
      return;
    }

    currentView = nextView;
    renderCurrentView();
  });
});

taskModalBackdrop.addEventListener("click", () => {
  closeTaskModal();
});

taskModalClose.addEventListener("click", () => {
  closeTaskModal();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !taskModal.classList.contains("hidden")) {
    closeTaskModal();
  }
  if (event.key === "Escape" && !documentModal.classList.contains("hidden")) {
    closeDocumentModal();
  }
  if (event.key === "Escape" && !workItemModal.classList.contains("hidden")) {
    closeWorkItemModal();
  }
});

documentModalBackdrop.addEventListener("click", () => {
  closeDocumentModal();
});

documentModalClose.addEventListener("click", () => {
  closeDocumentModal();
});

workItemModalBackdrop.addEventListener("click", () => {
  closeWorkItemModal();
});

workItemModalClose.addEventListener("click", () => {
  closeWorkItemModal();
});

workItemSearchInput.addEventListener("input", () => {
  currentWorkItemSearch = workItemSearchInput.value.trim().toLowerCase();
  renderWorkItemList(currentWorkItems);
});

document.querySelector("#work-item-status-tabs")?.addEventListener("click", (e) => {
  const button = (e.target as HTMLElement).closest<HTMLButtonElement>("[data-wi-status-filter]");
  if (!button) return;
  currentWorkItemStatusFilter = button.dataset.wiStatusFilter ?? "active";
  document.querySelectorAll("#work-item-status-tabs .tab-button").forEach((b) =>
    b.classList.toggle("is-active", b === button)
  );
  renderWorkItemList(currentWorkItems);
});

documentSearchInput.addEventListener("input", () => {
  currentDocumentSearch = documentSearchInput.value.trim().toLowerCase();
  renderDocumentList(currentDocuments);
});

departmentTaskStatusFilter.addEventListener("change", () => {
  currentDepartmentTaskStatusFilter = departmentTaskStatusFilter.value;
  renderTaskList(currentTaskItems);
});

departmentTaskStatusTabs
  .querySelectorAll<HTMLButtonElement>("[data-status-filter]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const nextFilter = button.dataset.statusFilter ?? "all";
      currentDepartmentTaskStatusFilter = nextFilter;
      departmentTaskStatusFilter.value = nextFilter;
      departmentTaskStatusTabs
        .querySelectorAll<HTMLButtonElement>("[data-status-filter]")
        .forEach((item) => {
          item.classList.toggle("is-active", item.dataset.statusFilter === nextFilter);
        });
      renderTaskList(currentTaskItems);
    });
  });

mockUserInput.addEventListener("input", () => {
  currentMockUserId = normalizeMockUserId(mockUserInput.value);
  saveMockUserId(currentMockUserId);
  renderActiveUser();
});

mockUserInput.addEventListener("change", async () => {
  currentMockUserId = normalizeMockUserId(mockUserInput.value);
  mockUserInput.value = currentMockUserId;
  saveMockUserId(currentMockUserId);
  renderActiveUser();
  resetUserScopedUiState();
  await loadDocuments();
  await loadWorkItems();
  await loadTasks();
  await loadAssignments();
});

loginButton.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (username.length === 0) {
    setStatus("Username is required to log in.", "error");
    return;
  }

  if (password.length === 0) {
    setStatus("Password is required to log in.", "error");
    return;
  }

  setAuthButtonsDisabled(true);
  setStatus("Logging in...", "loading");

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        password
      })
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not log in"));
    }

    const data = (await response.json()) as SessionResponse;
    currentSessionUserId = data.userId;
    currentSessionUser = data.user;
    renderSessionUser();
    usernameInput.value = "";
    passwordInput.value = "";
    resetUserScopedUiState();
    await loadAdminData();
    await loadDocuments();
    await loadWorkItems();
    await loadTasks();
    await loadAssignments();
    await loadNotifications();
    setStatus("Logged in successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while logging in.",
      "error"
    );
  } finally {
    setAuthButtonsDisabled(false);
  }
});

changePasswordButton.addEventListener("click", async () => {
  const currentPassword = currentPasswordInput.value;
  const newPassword = newPasswordInput.value;

  if (!currentSessionUserId) {
    setStatus("You must be logged in to change your password.", "error");
    return;
  }

  if (currentPassword.length === 0) {
    setStatus("Current password is required.", "error");
    return;
  }

  if (newPassword.length === 0) {
    setStatus("New password is required.", "error");
    return;
  }

  setAuthButtonsDisabled(true);
  setStatus("Changing password...", "loading");

  try {
    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not change the password")
      );
    }

    const _data = (await response.json()) as SuccessResponse;
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    setStatus("Password changed successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while changing the password.",
      "error"
    );
  } finally {
    setAuthButtonsDisabled(false);
  }
});

logoutButton.addEventListener("click", async () => {
  setAuthButtonsDisabled(true);
  setStatus("Logging out...", "loading");

  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST"
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not log out"));
    }

    const data = (await response.json()) as SessionResponse;
    currentSessionUserId = data.userId;
    currentSessionUser = data.user;
    renderSessionUser();
    passwordInput.value = "";
    currentPasswordInput.value = "";
    newPasswordInput.value = "";
    resetUserScopedUiState();
    await loadAdminData();
    await loadDocuments();
    await loadWorkItems();
    await loadTasks();
    await loadAssignments();
    await loadNotifications();
    setStatus("Logged out successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while logging out.",
      "error"
    );
  } finally {
    setAuthButtonsDisabled(false);
  }
});

createDepartmentButton.addEventListener("click", async () => {
  const name = departmentNameInput.value.trim();
  const code = departmentCodeInput.value.trim();

  if (!isPrincipalSession()) {
    setStatus("Principal access is required.", "error");
    return;
  }

  if (name.length === 0) {
    setStatus("Department name is required.", "error");
    return;
  }

  createDepartmentButton.disabled = true;
  setStatus("Creating department...", "loading");

  try {
    const response = await fetch("/api/departments", {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        name,
        code
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not create the department")
      );
    }

    departmentNameInput.value = "";
    departmentCodeInput.value = "";
    await loadAdminData();
    setStatus("Department created successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the department.",
      "error"
    );
  } finally {
    createDepartmentButton.disabled = false;
  }
});

createUserButton.addEventListener("click", async () => {
  await handleCreateUser();
});

refreshDocumentsButton.addEventListener("click", async () => {
  await loadDocuments();
});

// Report view buttons
document.querySelector<HTMLButtonElement>("#load-daily-report-button")
  ?.addEventListener("click", async () => {
    await loadAndRenderDailyReport();
  });

document.querySelector<HTMLButtonElement>("#load-weekly-report-button")
  ?.addEventListener("click", async () => {
    await loadAndRenderWeeklyReport();
  });

document.querySelector<HTMLButtonElement>("#run-reminders-button")
  ?.addEventListener("click", async () => {
    await handleRunDeadlineReminders();
  });

documentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await handleCreateDocument();
});

workItemForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!canUseWorkItems()) {
    setStatus("Your current role cannot create work items.", "error");
    return;
  }

  const title = workItemTitleInput.value.trim();
  const description = workItemDescriptionInput.value.trim();
  const departmentId = workItemDepartmentSelect.value || "";

  if (title.length === 0) {
    setStatus("Work item title is required.", "error");
    return;
  }

  if (description.length === 0) {
    setStatus("Work item description is required.", "error");
    return;
  }

  const intakeCodeInput = document.querySelector<HTMLInputElement>("#work-item-intake-code");
  const sourceTypeSelect = document.querySelector<HTMLSelectElement>("#work-item-source-type");
  const outputTypeSelect = document.querySelector<HTMLSelectElement>("#work-item-output-type");
  const deadlineInput = document.querySelector<HTMLInputElement>("#work-item-deadline");

  createWorkItemButton.disabled = true;
  setStatus("Đang tạo hồ sơ công việc...", "loading");

  try {
    const response = await fetch("/api/work-items", {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        title,
        description,
        departmentId: departmentId || undefined,
        intakeCode: intakeCodeInput?.value.trim() || undefined,
        sourceType: sourceTypeSelect?.value || undefined,
        outputType: outputTypeSelect?.value || undefined,
        deadline: deadlineInput?.value ? new Date(deadlineInput.value).toISOString() : undefined
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "Không thể tạo hồ sơ công việc")
      );
    }

    const data = (await response.json()) as WorkItemResponse;
    workItemForm.reset();
    workItemDepartmentSelect.value = "";

    // Auto-trigger AI analysis after creation
    try {
      await fetch(`/api/work-items/${encodeURIComponent(data.workItem.id)}/analyze`, {
        method: "POST",
        headers: buildApiHeaders()
      });
    } catch {
      // AI analysis failure is non-fatal
    }

    await loadWorkItems();
    selectWorkItemById(data.workItem.id);
    setStatus("Hồ sơ đã tạo. AI Agent đang phân tích nội dung...", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Đã xảy ra lỗi khi tạo hồ sơ công việc.",
      "error"
    );
  } finally {
    createWorkItemButton.disabled = false;
  }
});

refreshWorkItemsButton.addEventListener("click", async () => {
  setStatus("Refreshing work items...", "loading");
  await loadWorkItems();
  setStatus("Work items refreshed.", "success");
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const rawTitle = String(formData.get("title") ?? "");
  const payload = {
    taskType: "growth" as const,
    title: rawTitle.trim(),
    goal: String(formData.get("goal") ?? "").trim(),
    audience: String(formData.get("audience") ?? "").trim(),
    notes: String(formData.get("notes") ?? "").trim()
  };

  clearAllFieldErrors();

  const titleErrorMessage = getTitleValidationError(payload.title);
  const goalErrorMessage = getRequiredFieldError(payload.goal, "Goal");
  const audienceErrorMessage = getRequiredFieldError(
    payload.audience,
    "Audience"
  );

  if (titleErrorMessage) {
    setTitleError(titleErrorMessage);
  }

  if (goalErrorMessage) {
    setGoalError(goalErrorMessage);
  }

  if (audienceErrorMessage) {
    setAudienceError(audienceErrorMessage);
  }

  if (titleErrorMessage || goalErrorMessage || audienceErrorMessage) {
    setStatus("Please fix the form errors and try again.", "error");
    return;
  }

  setStatus("Creating Growth task...", "loading");

  /**
   * Important: disable the form only after reading FormData.
   *
   * Disabled form fields are not included in FormData,
   * which is why the API was receiving missing fields before.
   */
  setFormDisabled(true);
  setSubmitButtonLoading(true);

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not create the task"));
    }

    const data = (await response.json()) as CreateTaskResponse;

    setStatus("Growth task created successfully.", "success");
    showLatestResult(data.task.id, data.result);
    form.reset();
    templateSelect.value = "";
    clearAllFieldErrors();
    await loadTasks();
    selectTaskById(data.task.id);
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the task.",
      "error"
    );
  } finally {
    setSubmitButtonLoading(false);
    setFormDisabled(false);
  }
});

refreshButton.addEventListener("click", async () => {
  setStatus("Refreshing task list...", "loading");
  await loadTasks();
  setStatus("Task list refreshed.", "success");
});

/**
 * Loads the current tasks from the API and redraws the task list.
 */
async function loadTasks(): Promise<void> {
  try {
    const response = await fetch("/api/tasks", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not load tasks"));
    }

    const data = (await response.json()) as TasksResponse;
    const taskItems = normalizeTaskListItems(data.tasks).sort((left, right) => {
      return (
        new Date(right.task.createdAt).getTime() -
        new Date(left.task.createdAt).getTime()
      );
    });

    currentTaskItems = taskItems;
    currentTasks = taskItems.map((item) => item.task);
    syncSelectedTaskDetail(taskItems);
    syncLatestResult(taskItems);
    renderTaskList(taskItems);
    renderLegacyTaskList(taskItems);
    renderDepartmentTaskQueue(taskItems);
    renderOverview();
    renderReports();
  } catch (error: unknown) {
    currentTaskItems = [];
    currentTasks = [];
    resetUserScopedUiState();
    renderTaskList([]);
    renderLegacyTaskList([]);
    renderDepartmentTaskQueue([]);
    renderOverview();
    renderReports();
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading tasks.",
      "error"
    );
  }
}

function renderDepartmentTaskQueue(taskItems: TaskListItem[]): void {
  const queueItems = taskItems.filter(
    (item) => item.task.taskType === "school_workflow"
  );

  if (
    !currentSessionUser ||
    !(
      currentSessionUser.role === "department_head" ||
      currentSessionUser.role === "staff" ||
      currentSessionUser.role === "clerk" ||
      currentSessionUser.role === "principal" ||
      currentSessionUser.role === "admin"
    )
  ) {
    departmentTaskQueue.classList.add("hidden");
    departmentTaskQueueList.innerHTML = "";
    return;
  }

  departmentTaskQueue.classList.remove("hidden");

  if (queueItems.length === 0) {
    departmentTaskQueueList.innerHTML = `
      <div class="empty-state">
        Chưa có nhiệm vụ giao việc nào hiển thị cho người dùng hiện tại.
      </div>
    `;
    return;
  }

  departmentTaskQueueList.innerHTML = queueItems
    .map(
      (item) => `
        <article class="admin-item">
          <div class="task-card-row">
            <strong>${escapeHtml(item.task.title)}</strong>
            <span class="status-badge status-${escapeHtml(item.task.status)}">
              ${escapeHtml(item.task.status)}
            </span>
          </div>
          <p><strong>Department:</strong> ${escapeHtml(item.task.ownerDepartmentId ?? "—")}</p>
          <p><strong>Assignment Status:</strong> ${escapeHtml(getAssignmentStatusForTask(item.task.assignmentId))}</p>
          <p><strong>Progress:</strong> ${escapeHtml(String(item.task.progressPercent ?? 0))}%</p>
          <p><strong>Linked Work Item:</strong> ${escapeHtml(item.task.workItemId ?? "—")}</p>
          <p class="workflow-inline-hint"><strong>Next:</strong> ${escapeHtml(getNextTaskAction(item.task))}</p>
          <div class="auth-actions">
            <button
              class="secondary-button"
              type="button"
              data-open-assignment-task-id="${escapeHtml(item.task.id)}"
            >
              Mở chi tiết nhiệm vụ
            </button>
            ${
              item.task.status === "pending"
                ? `
                  <button
                    class="secondary-button"
                    type="button"
                    data-accept-assignment-task-id="${escapeHtml(item.task.id)}"
                  >
                    Accept
                  </button>
                  <button
                    class="secondary-button danger-button"
                    type="button"
                    data-reject-assignment-task-id="${escapeHtml(item.task.id)}"
                  >
                    Request Adjustment
                  </button>
                `
                : ""
            }
          </div>
        </article>
      `
    )
    .join("");

  departmentTaskQueueList
    .querySelectorAll<HTMLButtonElement>("[data-open-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        void focusTaskById(button.dataset.openAssignmentTaskId ?? null);
      });
    });

  departmentTaskQueueList
    .querySelectorAll<HTMLButtonElement>("[data-accept-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleAcceptAssignmentTask(button.dataset.acceptAssignmentTaskId ?? null);
      });
    });

  departmentTaskQueueList
    .querySelectorAll<HTMLButtonElement>("[data-reject-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleRejectAssignmentTask(button.dataset.rejectAssignmentTaskId ?? null);
      });
    });
}

/**
 * Draws the task list in the page.
 */
function renderTaskList(tasks: TaskListItem[]): void {
  const filteredTasks = tasks.filter((item) => {
    if (item.task.taskType !== "school_workflow") {
      return false;
    }

    if (currentDepartmentTaskStatusFilter === "all") {
      return true;
    }

    return item.task.status === currentDepartmentTaskStatusFilter;
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        Không có nhiệm vụ nào phù hợp với bộ lọc hiện tại.
      </div>
    `;
    hideDepartmentTaskDetail();
    return;
  }

  taskList.innerHTML = filteredTasks
    .map(
      (task) => {
        const linkedWI = currentWorkItems.find(
          (wi) => wi.workItem.id === task.task.workItemId
        );
        const isOverdueTask = linkedWI?.workItem.deadline
          ? new Date(linkedWI.workItem.deadline) < new Date() && task.task.status !== "completed"
          : false;

        return `
        <article class="task-card list-row ${selectedTaskId === task.task.id ? "is-selected" : ""}">
          <div class="task-card-row list-row-header">
            <h3 class="list-row-title">${escapeHtml(task.task.title)}</h3>
            <span class="status-badge status-${task.task.status}">
              ${escapeHtml(getTaskStatusLabel(task.task.status))}
            </span>
          </div>
          <div class="list-row-meta">
            <span>${escapeHtml(task.task.ownerDepartmentId ?? "—")}</span>
            <span>${escapeHtml(getOwnerLabel(task.task.ownerId))}</span>
            ${
              linkedWI?.workItem.deadline
                ? `<span style="color:${isOverdueTask ? "#cf222e" : "#57606a"}">${isOverdueTask ? "⚠ QUÁ HẠN" : "Hạn"}: ${new Date(linkedWI.workItem.deadline).toLocaleDateString("vi-VN")}</span>`
                : `<span>${formatDate(task.task.createdAt)}</span>`
            }
          </div>
          ${task.task.progressPercent != null && task.task.progressPercent > 0 ? `
            <div style="background:#eaeef2;border-radius:4px;height:4px;margin:4px 0">
              <div style="background:#0969da;height:4px;border-radius:4px;width:${Math.min(task.task.progressPercent, 100)}%"></div>
            </div>
          ` : ""}
          <div class="auth-actions">
            <button
              class="secondary-button task-detail-button"
              type="button"
              data-task-id="${escapeHtml(task.task.id)}"
            >
              ${selectedTaskId === task.task.id ? "Đóng" : "Mở nhiệm vụ"}
            </button>
          </div>
        </article>
      `;
      }
    )
    .join("");

  bindTaskListInteractions(taskList);

  const selectedTask = filteredTasks.find((item) => item.task.id === selectedTaskId) ?? null;

  if (selectedTask) {
    renderDepartmentTaskDetail(selectedTask);
  } else {
    hideDepartmentTaskDetail();
  }
}

function renderLegacyTaskList(tasks: TaskListItem[]): void {
  if (tasks.length === 0) {
    legacyTaskList.innerHTML = `
      <div class="empty-state">
        No legacy growth tasks are visible for the current user.
      </div>
    `;
    return;
  }

  legacyTaskList.innerHTML = tasks
    .map(
      (task) => `
        <article class="task-card">
          <div class="task-card-row">
            <h3>${escapeHtml(task.task.title)}</h3>
            <span class="status-badge status-${task.task.status}">
              ${escapeHtml(task.task.status)}
            </span>
          </div>
          <p><strong>Task Type:</strong> ${escapeHtml(task.task.taskType)}</p>
          <p><strong>Owner:</strong> ${escapeHtml(getOwnerLabel(task.task.ownerId))}</p>
          <p><strong>Created At:</strong> ${formatDate(task.task.createdAt)}</p>
          <button
            class="secondary-button task-detail-button"
            type="button"
            data-task-id="${escapeHtml(task.task.id)}"
          >
            ${selectedTaskId === task.task.id ? "Ẩn chi tiết" : "Xem chi tiết"}
          </button>
          ${selectedTaskId === task.task.id ? renderTaskDetail(task) : ""}
        </article>
      `
    )
    .join("");
  bindTaskListInteractions(legacyTaskList);
}

function renderDepartmentTaskDetail(taskItem: TaskListItem): void {
  departmentTaskDetail.classList.add("hidden");
  departmentTaskDetailTitle.textContent = taskItem.task.title;
  departmentTaskDetailMeta.textContent = [
    `Status: ${taskItem.task.status}`,
    `Department: ${taskItem.task.ownerDepartmentId ?? "none"}`,
    `Assignment: ${taskItem.task.assignmentId ?? "none"}`
  ].join(" | ");
  taskModalTitle.textContent = taskItem.task.title;
  taskModalMeta.textContent = departmentTaskDetailMeta.textContent;
  taskModalBody.innerHTML = renderTaskDetail(taskItem);
  bindTaskListInteractions(taskModalBody);
  openTaskModal();
}

function hideDepartmentTaskDetail(): void {
  departmentTaskDetail.classList.add("hidden");
  departmentTaskDetailTitle.textContent = "Chi tiết nhiệm vụ";
  departmentTaskDetailMeta.textContent = "";
  departmentTaskDetailBody.innerHTML = "";
  taskModalTitle.textContent = "Chi tiết nhiệm vụ";
  taskModalMeta.textContent = "";
  taskModalBody.innerHTML = "";
  taskModal.classList.add("hidden");
  taskModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function openTaskModal(): void {
  taskModal.classList.remove("hidden");
  taskModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeTaskModal(): void {
  selectedTaskId = null;
  hideDepartmentTaskDetail();
  renderTaskList(currentTaskItems);
}

function bindTaskListInteractions(container: HTMLElement): void {
  container.querySelectorAll<HTMLButtonElement>("[data-task-id]").forEach((button) => {
    button.addEventListener("click", async () => {
      await selectTaskById(button.dataset.taskId ?? null);
    });
  });

  container.querySelectorAll<HTMLButtonElement>("[data-copy-mode]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleCopyAction(button);
    });
  });

  container
    .querySelectorAll<HTMLButtonElement>("[data-retry-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleRetryTask(button.dataset.retryTaskId ?? null, button);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-delete-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleDeleteTask(button.dataset.deleteTaskId ?? null, button);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-accept-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleAcceptAssignmentTask(button.dataset.acceptAssignmentTaskId ?? null);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-reject-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleRejectAssignmentTask(button.dataset.rejectAssignmentTaskId ?? null);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-open-linked-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await openWorkItemWithTab(
          button.dataset.openLinkedWorkItemId ?? null,
          button.dataset.openWorkItemTab ?? "info"
        );
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-open-linked-document-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await openDocumentWithTab(
          button.dataset.openLinkedDocumentId ?? null,
          "summary"
        );
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-download-linked-document-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await downloadApiFile(
            `/api/documents/${encodeURIComponent(button.dataset.downloadLinkedDocumentId ?? "")}/download`,
            button.dataset.downloadLinkedDocumentFilename ?? "document.bin",
            "Document downloaded."
          );
        } catch (error: unknown) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Something went wrong while downloading the document.",
            "error"
          );
        }
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-download-work-item-file-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await downloadApiFile(
            `/api/work-items/${encodeURIComponent(button.dataset.downloadWorkItemId ?? "")}/files/${encodeURIComponent(button.dataset.downloadWorkItemFileId ?? "")}/download`,
            button.dataset.downloadWorkItemFilename ?? "attachment.bin",
            "Attachment downloaded."
          );
        } catch (error: unknown) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Something went wrong while downloading the attachment.",
            "error"
          );
        }
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-trigger-response-file-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const targetId = button.dataset.triggerResponseFileId ?? "";
        const input = container.querySelector<HTMLInputElement>(`#${CSS.escape(targetId)}`);
        input?.click();
      });
    });

  container
    .querySelectorAll<HTMLInputElement>("[data-response-work-item-id]")
    .forEach((input) => {
      input.addEventListener("change", async () => {
        await handleUploadWorkItemFile(
          input.dataset.responseWorkItemId ?? "",
          input
        );
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-submit-task-response-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleSubmitTaskResponse(
          button.dataset.submitTaskResponseId ?? null
        );
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-create-task-update-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleCreateTaskUpdate(
          button.dataset.createTaskUpdateId ?? null
        );
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-create-submission-review-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleCreateSubmissionReview(
          button.dataset.createSubmissionReviewId ?? null
        );
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-submit-report-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleSubmitTaskReport(button.dataset.submitReportTaskId ?? null);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-quality-check-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleQualityCheck(button.dataset.qualityCheckTaskId ?? null);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-principal-approve-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handlePrincipalApproveTask(button.dataset.principalApproveTaskId ?? null);
      });
    });

  container
    .querySelectorAll<HTMLButtonElement>("[data-upload-evidence-task-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const input = container.querySelector<HTMLInputElement>(`#evidence-file-${button.dataset.uploadEvidenceTaskId}`);
        input?.click();
      });
    });

  container
    .querySelectorAll<HTMLInputElement>("[data-evidence-file-task-id]")
    .forEach((input) => {
      input.addEventListener("change", async () => {
        await handleUploadTaskEvidenceFile(input.dataset.evidenceFileTaskId ?? null, input);
      });
    });
}

/**
 * The backend list endpoint has had two shapes during the MVP:
 *
 * Old shape:
 * - tasks: Task[]
 *
 * New shape:
 * - tasks: Array<{ task: Task, result?: TaskResult }>
 *
 * This helper lets the UI safely support both shapes.
 */
function normalizeTaskListItems(
  items: Array<Task | TaskListItem>
): TaskListItem[] {
  return items.map((item) => {
    if (isTaskListItem(item)) {
      return item;
    }

    return { task: item };
  });
}

function isTaskListItem(item: Task | TaskListItem): item is TaskListItem {
  return "task" in item;
}

/**
 * Shows the latest TaskResult returned after creating a task.
 */
function showLatestResult(taskId: string, result: TaskResult): void {
  currentLatestResultTaskId = taskId;
  latestResult.classList.remove("hidden");
  resultMeta.textContent = `Agent: ${result.agentName} | Created: ${formatDate(
    result.createdAt
  )}`;
  resultText.textContent = result.outputText;
}

function applySelectedTemplate(templateKey: string): void {
  if (!templateKey) {
    return;
  }

  const template = TASK_TEMPLATES[templateKey];

  if (!template) {
    return;
  }

  /**
   * Templates are only a starting point.
   * Users can still edit every field after prefilling.
   */
  titleInput.value = template.title;
  goalInput.value = template.goal;
  audienceInput.value = template.audience;

  const notesInput = form.querySelector<HTMLTextAreaElement>("#notes");
  if (notesInput) {
    notesInput.value = template.notes;
  }

  clearAllFieldErrors();
}

async function selectTaskById(taskId: string | null): Promise<void> {
  selectedTaskId = selectedTaskId === taskId ? null : taskId;
  syncSelectedTaskDetail(currentTaskItems);
  if (selectedTaskId) {
    await refreshSelectedTaskContext();
  }
  renderTaskList(currentTaskItems);
}

async function focusTaskById(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  selectedTaskId = taskId;
  syncSelectedTaskDetail(currentTaskItems);
  await refreshSelectedTaskContext();
  renderTaskList(currentTaskItems);
  document
    .querySelector<HTMLElement>(`[data-task-id="${CSS.escape(taskId)}"]`)
    ?.scrollIntoView({
      behavior: "smooth",
      block: "nearest"
    });
}

function syncSelectedTaskDetail(taskItems: TaskListItem[]): void {
  if (taskItems.length === 0) {
    selectedTaskId = null;
    currentSelectedTaskWorkItem = null;
    currentSelectedTaskDocument = null;
    currentSelectedTaskUpdates = [];
    currentSelectedTaskReviews = [];
    return;
  }

  if (!selectedTaskId) {
    return;
  }

  const selectedTask =
    taskItems.find((item) => item.task.id === selectedTaskId) ?? null;

  if (!selectedTask) {
    selectedTaskId = null;
    currentSelectedTaskWorkItem = null;
    currentSelectedTaskDocument = null;
    currentSelectedTaskUpdates = [];
    currentSelectedTaskReviews = [];
  }
}

async function refreshSelectedTaskContext(): Promise<void> {
  if (!selectedTaskId) {
    currentSelectedTaskWorkItem = null;
    currentSelectedTaskDocument = null;
    currentSelectedTaskUpdates = [];
    currentSelectedTaskReviews = [];
    return;
  }

  try {
    const updatesResponse = await fetch(
      `/api/tasks/${encodeURIComponent(selectedTaskId)}/updates`,
      {
        headers: buildApiHeaders()
      }
    );

    if (updatesResponse.ok) {
      const updatesData = (await updatesResponse.json()) as TaskUpdatesResponse;
      currentSelectedTaskUpdates = updatesData.updates;
    } else {
      currentSelectedTaskUpdates = [];
    }
  } catch {
    currentSelectedTaskUpdates = [];
  }

  try {
    const reviewsResponse = await fetch(
      `/api/tasks/${encodeURIComponent(selectedTaskId)}/reviews`,
      {
        headers: buildApiHeaders()
      }
    );

    if (reviewsResponse.ok) {
      const reviewsData = (await reviewsResponse.json()) as SubmissionReviewsResponse;
      currentSelectedTaskReviews = reviewsData.reviews;
    } else {
      currentSelectedTaskReviews = [];
    }
  } catch {
    currentSelectedTaskReviews = [];
  }

  const selectedTask =
    currentTaskItems.find((item) => item.task.id === selectedTaskId) ?? null;

  if (!selectedTask?.task.workItemId) {
    currentSelectedTaskWorkItem = null;
    currentSelectedTaskDocument = null;
    return;
  }

  currentSelectedTaskDocument = findLinkedDocumentByWorkItemId(
    selectedTask.task.workItemId
  );

  const cachedWorkItem =
    currentWorkItems.find(
      (item) => item.workItem.id === selectedTask.task.workItemId
    ) ?? null;

  if (cachedWorkItem && cachedWorkItem.files.length > 0) {
    currentSelectedTaskWorkItem = cachedWorkItem;
    return;
  }

  try {
    const response = await fetch(
      `/api/work-items/${encodeURIComponent(selectedTask.task.workItemId)}`,
      {
        headers: buildApiHeaders()
      }
    );

    if (!response.ok) {
      currentSelectedTaskWorkItem = cachedWorkItem;
      return;
    }

    const detail = (await response.json()) as WorkItemDetailResponse;
    currentSelectedTaskWorkItem = detail;
    currentSelectedTaskDocument = findLinkedDocumentByWorkItemId(
      detail.workItem.id
    );

    const currentIndex = currentWorkItems.findIndex(
      (item) => item.workItem.id === detail.workItem.id
    );

    if (currentIndex >= 0) {
      currentWorkItems[currentIndex] = detail;
    } else {
      currentWorkItems.unshift(detail);
    }
  } catch {
    currentSelectedTaskWorkItem = cachedWorkItem;
  }
}

function findLinkedDocumentByWorkItemId(
  workItemId: string
): DocumentListItem | null {
  return (
    currentDocuments.find((item) => item.document.createdWorkItemId === workItemId) ??
    null
  );
}

function findRelatedDocumentForTask(
  taskItem: TaskListItem,
  linkedWorkItem: WorkItemListItem | null
): DocumentListItem | null {
  const exactWorkItemMatch =
    linkedWorkItem?.workItem.id
      ? findLinkedDocumentByWorkItemId(linkedWorkItem.workItem.id)
      : taskItem.task.workItemId
        ? findLinkedDocumentByWorkItemId(taskItem.task.workItemId)
        : null;

  if (exactWorkItemMatch) {
    return exactWorkItemMatch;
  }

  const titleHaystack = `${taskItem.task.title} ${linkedWorkItem?.workItem.title ?? ""}`
    .toLowerCase();

  return (
    currentDocuments.find((item) =>
      titleHaystack.includes(item.document.filename.toLowerCase())
    ) ?? null
  );
}

function syncLatestResult(taskItems: TaskListItem[]): void {
  if (!currentLatestResultTaskId) {
    return;
  }

  const matchingTaskItem = taskItems.find(
    (item) =>
      item.task.id === currentLatestResultTaskId &&
      typeof item.result?.outputText === "string"
  );

  if (!matchingTaskItem?.result) {
    hideLatestResult();
    return;
  }

  showLatestResult(matchingTaskItem.task.id, matchingTaskItem.result);
}

function renderTaskDetail(taskItem: TaskListItem): string {
  const linkedWorkItem =
    selectedTaskId === taskItem.task.id ? currentSelectedTaskWorkItem : null;
  const linkedDocument =
    selectedTaskId === taskItem.task.id
      ? findRelatedDocumentForTask(taskItem, currentSelectedTaskWorkItem)
      : null;

  return `
    <div class="task-detail-panel">
      <div class="task-actions">
        <button
          class="secondary-button task-action-button"
          type="button"
          data-copy-mode="result"
          data-task-id="${escapeHtml(taskItem.task.id)}"
        >
          Copy Result
        </button>
        <button
          class="secondary-button task-action-button"
          type="button"
          data-copy-mode="draft"
          data-task-id="${escapeHtml(taskItem.task.id)}"
        >
          Copy Draft Content
        </button>
        <button
          class="secondary-button task-action-button"
          type="button"
          data-copy-mode="full"
          data-task-id="${escapeHtml(taskItem.task.id)}"
        >
          Copy Full Output
        </button>
        <button
          class="secondary-button task-action-button"
          type="button"
          data-retry-task-id="${escapeHtml(taskItem.task.id)}"
        >
          Retry Task
        </button>
        <button
          class="secondary-button task-action-button danger-button"
          type="button"
          data-delete-task-id="${escapeHtml(taskItem.task.id)}"
        >
          Delete Task
        </button>
        ${
          taskItem.task.taskType === "school_workflow" &&
          taskItem.task.status === "pending"
            ? `
              <button
                class="secondary-button task-action-button"
                type="button"
                data-accept-assignment-task-id="${escapeHtml(taskItem.task.id)}"
              >
                Accept Assignment
              </button>
              <button
                class="secondary-button task-action-button danger-button"
                type="button"
                data-reject-assignment-task-id="${escapeHtml(taskItem.task.id)}"
              >
                Reject Assignment
              </button>
            `
            : ""
        }
      </div>
      <div class="task-detail-grid">
        <div>
          <p class="detail-label">Tiêu đề</p>
          <p class="detail-value">${escapeHtml(taskItem.task.title)}</p>
        </div>
        <div>
          <p class="detail-label">Trạng thái</p>
          <p class="detail-value">${escapeHtml(taskItem.task.status)}</p>
        </div>
        <div>
          <p class="detail-label">Mục tiêu</p>
          <p class="detail-value">${escapeHtml(taskItem.task.goal)}</p>
        </div>
        <div>
          <p class="detail-label">Đối tượng</p>
          <p class="detail-value">${escapeHtml(taskItem.task.audience)}</p>
        </div>
        <div>
          <p class="detail-label">Ghi chú</p>
          <p class="detail-value">${escapeHtml(taskItem.task.notes ?? "Không có ghi chú")}</p>
        </div>
        <div>
          <p class="detail-label">Thời gian tạo</p>
          <p class="detail-value">${formatDate(taskItem.task.createdAt)}</p>
        </div>
        <div>
          <p class="detail-label">Người thực hiện</p>
          <p class="detail-value owner-badge">${escapeHtml(getOwnerLabel(taskItem.task.ownerId))}</p>
        </div>
        <div>
          <p class="detail-label">Đơn vị</p>
          <p class="detail-value">${escapeHtml(taskItem.task.ownerDepartmentId ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Phiếu giao</p>
          <p class="detail-value">${escapeHtml(taskItem.task.assignmentId ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Trạng thái phiếu giao</p>
          <p class="detail-value">${escapeHtml(getAssignmentStatusForTask(taskItem.task.assignmentId))}</p>
        </div>
        <div>
          <p class="detail-label">Tiến độ</p>
          <p class="detail-value">${escapeHtml(String(taskItem.task.progressPercent ?? 0))}%</p>
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Ngữ cảnh hồ sơ liên kết</p>
        <div class="detail-value">
          <p><strong>Work Item:</strong> ${escapeHtml(linkedWorkItem?.workItem.title ?? taskItem.task.workItemId ?? "—")}</p>
          <p><strong>Work Item Status:</strong> ${escapeHtml(linkedWorkItem?.workItem.status ?? "Chưa tải")}</p>
          ${linkedWorkItem?.workItem.intakeCode ? `<p><strong>Mã hồ sơ:</strong> ${escapeHtml(linkedWorkItem.workItem.intakeCode)}</p>` : ""}
          ${linkedWorkItem?.workItem.sourceType ? `<p><strong>Nguồn vào:</strong> ${escapeHtml(linkedWorkItem.workItem.sourceType)}</p>` : ""}
          ${linkedWorkItem?.workItem.outputType ? `<p><strong>Loại đầu ra:</strong> ${escapeHtml(linkedWorkItem.workItem.outputType)}</p>` : ""}
          ${linkedWorkItem?.workItem.deadline ? `<p><strong style="color:#b35c00">⏰ Thời hạn:</strong> ${escapeHtml(new Date(linkedWorkItem.workItem.deadline).toLocaleString("vi-VN"))}</p>` : ""}
          <p><strong>Source Document:</strong> ${escapeHtml(linkedDocument?.document.filename ?? "—")}</p>
          ${
            linkedWorkItem?.workItem.id
              ? `
                <div class="auth-actions">
                  <button
                    class="secondary-button task-action-button"
                    type="button"
                    data-open-linked-work-item-id="${escapeHtml(linkedWorkItem.workItem.id)}"
                  >
                    Mở hồ sơ
                  </button>
                  ${
                    linkedDocument?.document.id
                      ? `
                        <button
                          class="secondary-button task-action-button"
                          type="button"
                          data-open-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                        >
                          Mở văn bản nguồn
                        </button>
                        ${
                          linkedDocument.document.hasFileContent
                            ? `
                              <button
                                class="secondary-button task-action-button"
                                type="button"
                                data-download-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                                data-download-linked-document-filename="${escapeHtml(linkedDocument.document.filename)}"
                              >
                                Tải văn bản nguồn
                              </button>
                            `
                            : ""
                        }
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Đính kèm</p>
        <div class="detail-value">
          ${
            linkedWorkItem && linkedWorkItem.files.length > 0
              ? linkedWorkItem.files
                  .map(
                    (file) => `
                      <div class="task-card-row">
                        <span>${escapeHtml(file.filename)}${file.contentType ? ` (${escapeHtml(file.contentType)})` : ""}</span>
                        ${
                          file.hasFileContent
                            ? `
                              <button
                                class="secondary-button task-action-button"
                                type="button"
                                data-download-work-item-file-id="${escapeHtml(file.id)}"
                                data-download-work-item-id="${escapeHtml(file.workItemId)}"
                                data-download-work-item-filename="${escapeHtml(file.filename)}"
                              >
                                Download
                              </button>
                            `
                            : ""
                        }
                      </div>
                    `
                  )
                  .join("")
              : linkedDocument
                ? `
                    <div class="task-card-row">
                      <span>${escapeHtml(linkedDocument.document.filename)} (source document)</span>
                      ${
                        linkedDocument.document.hasFileContent
                          ? `
                            <button
                              class="secondary-button task-action-button"
                              type="button"
                              data-download-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                              data-download-linked-document-filename="${escapeHtml(linkedDocument.document.filename)}"
                            >
                              Download
                            </button>
                          `
                          : ""
                      }
                    </div>
                  `
                : "<p>No files attached to this task yet.</p>"
          }
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Cập nhật thực hiện</p>
        <div class="detail-value">
          <p>Record progress, blockers, and internal completion milestones so the principal and agent can track execution history.</p>
          <div class="admin-item-grid">
            <div class="field">
              <label for="task-update-status-${escapeHtml(taskItem.task.id)}">Execution status</label>
              <select id="task-update-status-${escapeHtml(taskItem.task.id)}">
                ${renderTaskExecutionStatusOptions("running")}
              </select>
            </div>
            <div class="field">
              <label for="task-update-progress-${escapeHtml(taskItem.task.id)}">Progress percent</label>
              <input
                id="task-update-progress-${escapeHtml(taskItem.task.id)}"
                type="number"
                min="0"
                max="100"
                value="${escapeHtml(String(taskItem.task.progressPercent ?? 0))}"
              />
            </div>
            <div class="field">
              <label for="task-update-note-${escapeHtml(taskItem.task.id)}">Update note</label>
              <textarea
                id="task-update-note-${escapeHtml(taskItem.task.id)}"
                rows="2"
                placeholder="Explain progress, blockers, or what was completed"
              ></textarea>
            </div>
            <div class="auth-actions">
              <button
                class="secondary-button task-action-button"
                type="button"
                data-create-task-update-id="${escapeHtml(taskItem.task.id)}"
              >
                Save Execution Update
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Giai đoạn 6 – Nộp báo cáo kết quả</p>
        <div class="detail-value">
          ${
            taskItem.task.reportSubmittedAt
              ? `
                <p class="status-badge status-completed" style="display:inline-block;margin-bottom:8px">
                  ✅ Đã nộp báo cáo: ${formatDate(taskItem.task.reportSubmittedAt)}
                </p>
                <p>${escapeHtml(taskItem.task.reportNote ?? "")}</p>
              `
              : ""
          }
          ${
            taskItem.task.qualityCheckedAt
              ? `
                <p class="status-badge ${taskItem.task.qualityCheckPassed ? "status-completed" : "status-failed"}" style="display:inline-block;margin-bottom:8px">
                  ${taskItem.task.qualityCheckPassed ? "✅ Agent: Đạt" : "⚠️ Agent: Chưa đạt"}
                </p>
                <p class="detail-label">${escapeHtml(taskItem.task.qualityCheckNote ?? "")}</p>
              `
              : ""
          }
          ${
            taskItem.task.principalApprovedAt
              ? `
                <p class="status-badge status-completed" style="display:inline-block;margin-bottom:8px">
                  🎉 HT đã phê duyệt: ${formatDate(taskItem.task.principalApprovedAt)}
                </p>
                <p>${escapeHtml(taskItem.task.principalApprovalNote ?? "")}</p>
              `
              : ""
          }

          ${
            taskItem.task.taskType === "school_workflow" &&
            !taskItem.task.reportSubmittedAt &&
            (taskItem.task.status === "running" || taskItem.task.status === "pending")
              ? `
                <div class="admin-item-grid" style="gap:8px">
                  <div class="field">
                    <label for="task-report-note-${escapeHtml(taskItem.task.id)}">Nội dung báo cáo kết quả</label>
                    <textarea
                      id="task-report-note-${escapeHtml(taskItem.task.id)}"
                      rows="3"
                      placeholder="Tóm tắt kết quả thực hiện, vấn đề phát sinh, kiến nghị..."
                    ></textarea>
                  </div>
                  <div class="auth-actions">
                    <button
                      class="secondary-button task-action-button"
                      type="button"
                      data-upload-evidence-task-id="${escapeHtml(taskItem.task.id)}"
                    >
                      📎 Đính kèm minh chứng
                    </button>
                    <input
                      id="evidence-file-${escapeHtml(taskItem.task.id)}"
                      class="visually-hidden-file-input"
                      type="file"
                      multiple
                      data-evidence-file-task-id="${escapeHtml(taskItem.task.id)}"
                    />
                    <button
                      class="primary-button task-action-button"
                      type="button"
                      data-submit-report-task-id="${escapeHtml(taskItem.task.id)}"
                    >
                      📤 Nộp báo cáo kết quả
                    </button>
                  </div>
                </div>
              `
              : ""
          }

          ${
            isAdminLikeSession() &&
            taskItem.task.taskType === "school_workflow" &&
            taskItem.task.reportSubmittedAt &&
            !taskItem.task.qualityCheckedAt
              ? `
                <div class="auth-actions" style="margin-top:8px">
                  <button
                    class="secondary-button task-action-button"
                    type="button"
                    data-quality-check-task-id="${escapeHtml(taskItem.task.id)}"
                  >
                    🔍 Agent kiểm tra đạt/chưa đạt
                  </button>
                </div>
              `
              : ""
          }

          ${
            isAdminLikeSession() &&
            taskItem.task.qualityCheckPassed === true &&
            !taskItem.task.principalApprovedAt
              ? `
                <div class="admin-item-grid" style="gap:8px;margin-top:8px">
                  <div class="field">
                    <label for="principal-approval-note-${escapeHtml(taskItem.task.id)}">Ý kiến phê duyệt</label>
                    <textarea
                      id="principal-approval-note-${escapeHtml(taskItem.task.id)}"
                      rows="2"
                      placeholder="Ghi chú khi phê duyệt (không bắt buộc)"
                    ></textarea>
                  </div>
                  <div class="auth-actions">
                    <button
                      class="primary-button task-action-button"
                      type="button"
                      data-principal-approve-task-id="${escapeHtml(taskItem.task.id)}"
                    >
                      ✅ HT Phê duyệt hoàn thành
                    </button>
                  </div>
                </div>
              `
              : ""
          }

          ${
            linkedWorkItem?.workItem.id
              ? `
                <div class="auth-actions" style="margin-top:8px">
                  <button
                    class="secondary-button task-action-button"
                    type="button"
                    data-open-linked-work-item-id="${escapeHtml(linkedWorkItem.workItem.id)}"
                    data-open-work-item-tab="files"
                  >
                    Xem hồ sơ đính kèm
                  </button>
                </div>
              `
              : ""
          }
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Tiến trình thực hiện</p>
        <div class="detail-value">
          ${
            currentSelectedTaskUpdates.length > 0
              ? currentSelectedTaskUpdates
                  .map(
                    (update) => `
                      <div class="admin-item">
                        <div class="task-card-row">
                          <strong>${escapeHtml(update.executionStatus)}</strong>
                          <span>${escapeHtml(String(update.progressPercent))}%</span>
                        </div>
                        <p><strong>Updated:</strong> ${escapeHtml(formatDate(update.createdAt))}</p>
                        <p><strong>By:</strong> ${escapeHtml(update.updatedByUserId ?? "system")}</p>
                        <p>${escapeHtml(update.note ?? "No note")}</p>
                      </div>
                    `
                  )
                  .join("")
              : "<p>No execution updates have been recorded yet.</p>"
          }
        </div>
      </div>

      ${
        isAdminLikeSession() && taskItem.task.taskType === "school_workflow"
          ? `
            <div class="task-output">
              <p class="detail-label">Xét duyệt nộp bài</p>
              <div class="detail-value">
                <p>Classify the submitted response so it returns to the correct step instead of restarting the whole workflow.</p>
                <div class="admin-item-grid">
                  <div class="field">
                    <label for="submission-review-outcome-${escapeHtml(taskItem.task.id)}">Review outcome</label>
                    <select id="submission-review-outcome-${escapeHtml(taskItem.task.id)}">
                      ${renderSubmissionReviewOutcomeOptions("needs_supplement")}
                    </select>
                  </div>
                  <div class="field">
                    <label for="submission-review-stage-${escapeHtml(taskItem.task.id)}">Return stage</label>
                    <select id="submission-review-stage-${escapeHtml(taskItem.task.id)}">
                      ${renderSubmissionReturnStageOptions("submission")}
                    </select>
                  </div>
                  <div class="field">
                    <label for="submission-review-reason-code-${escapeHtml(taskItem.task.id)}">Reason code</label>
                    <input id="submission-review-reason-code-${escapeHtml(taskItem.task.id)}" type="text" placeholder="missing-attachment" />
                  </div>
                  <div class="field">
                    <label for="submission-review-reason-text-${escapeHtml(taskItem.task.id)}">Reason detail</label>
                    <textarea id="submission-review-reason-text-${escapeHtml(taskItem.task.id)}" rows="2" placeholder="Explain what is missing or what needs rework"></textarea>
                  </div>
                  <div class="auth-actions">
                    <button
                      class="secondary-button task-action-button"
                      type="button"
                      data-create-submission-review-id="${escapeHtml(taskItem.task.id)}"
                    >
                      Save Review Decision
                    </button>
                  </div>
                </div>
              </div>
            </div>
          `
          : ""
      }

      ${
        isAdminLikeSession() && taskItem.task.taskType === "school_workflow"
          ? `
            <div class="task-output">
              <p class="detail-label">Lịch sử xét duyệt</p>
              <div class="detail-value">
                ${
                  currentSelectedTaskReviews.length > 0
                    ? currentSelectedTaskReviews
                        .map(
                          (review) => `
                            <div class="admin-item">
                              <div class="task-card-row">
                                <strong>${escapeHtml(review.reviewOutcome)}</strong>
                                <span>${escapeHtml(review.returnStage)}</span>
                              </div>
                              <p><strong>Reviewed:</strong> ${escapeHtml(formatDate(review.createdAt))}</p>
                              <p><strong>By:</strong> ${escapeHtml(review.reviewedByUserId ?? "system")}</p>
                              <p><strong>Reason code:</strong> ${escapeHtml(review.reasonCode ?? "—")}</p>
                              <p>${escapeHtml(review.reasonText ?? "No explanation provided.")}</p>
                            </div>
                          `
                        )
                        .join("")
                    : "<p>No submission review decisions have been recorded yet.</p>"
                }
              </div>
            </div>
          `
          : ""
      }

      <div class="task-output">
        <p class="detail-label">Operational Follow-up</p>
        <div class="detail-value">
          ${buildTaskFollowUpLines(taskItem, linkedWorkItem, linkedDocument)
            .map((line) => `<p>${escapeHtml(line)}</p>`)
            .join("")}
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Result Content</p>
        <pre class="task-output-text">${escapeHtml(
          taskItem.result?.outputText ?? "Chưa có kết quả."
        )}</pre>
      </div>
    </div>
  `;
}

function buildFullOutput(taskItem: TaskListItem): string {
  return [
    `Title: ${taskItem.task.title}`,
    `Status: ${taskItem.task.status}`,
    `Goal: ${taskItem.task.goal}`,
    `Audience: ${taskItem.task.audience}`,
    `Ghi chú: ${taskItem.task.notes ?? "—"}`,
    `Created Time: ${formatDate(taskItem.task.createdAt)}`,
    "",
    "Result Content:",
    taskItem.result?.outputText ?? "Chưa có kết quả."
  ].join("\n");
}

function buildTaskFollowUpLines(
  taskItem: TaskListItem,
  linkedWorkItem: WorkItemListItem | null,
  linkedDocument: DocumentListItem | null
): string[] {
  const lines: string[] = [];

  if (taskItem.task.status === "pending") {
    lines.push("Task is waiting for department acceptance before execution starts.");
  } else if (taskItem.task.status === "running") {
    if (linkedWorkItem?.workItem.status === "in_review") {
      lines.push("Department response has been submitted. The work item is now waiting for principal review before the task can be marked completed.");
    } else {
      lines.push("Task has been accepted and is currently in execution. Keep progress updated and review linked materials.");
    }
  } else if (taskItem.task.status === "completed") {
    lines.push("Task is marked completed. Review the saved result and confirm the output against the assignment requirement.");
  } else if (taskItem.task.status === "failed") {
    lines.push("Task execution failed. Review the result content, linked work item context, and decide whether to retry or reassign.");
  }

  if (linkedWorkItem?.files.length) {
    lines.push(`There are ${linkedWorkItem.files.length} attached work item file(s) available for review.`);
  } else if (linkedDocument) {
    lines.push("Source document is available, but no separate work item file attachments are currently stored.");
  } else {
    lines.push("No linked file context is available yet. The assignment may need supporting documents uploaded to the work item.");
  }

  if (!taskItem.result?.outputText) {
    lines.push("No response has been saved yet. The assigned user should add progress notes or trigger the next processing step from the linked work item.");
  }

  return lines;
}

async function handleCopyAction(button: HTMLButtonElement): Promise<void> {
  const taskId = button.dataset.taskId ?? "";
  const copyMode = button.dataset.copyMode ?? "result";
  const taskItem = currentTaskItems.find((item) => item.task.id === taskId);

  if (!taskItem) {
    setStatus("The selected task could not be found.", "error");
    return;
  }

  const textToCopy =
    copyMode === "full"
      ? buildFullOutput(taskItem)
      : copyMode === "draft"
        ? extractDraftContent(taskItem.result?.outputText)
        : taskItem.result?.outputText ?? "Chưa có kết quả.";

  try {
    await navigator.clipboard.writeText(textToCopy);
    flashButtonLabel(
      button,
      "Copied",
      copyMode === "full"
        ? "Copy Full Output"
        : copyMode === "draft"
          ? "Copy Draft Content"
          : "Copy Result"
    );
  } catch {
    setStatus("Copy failed. Your browser may not allow clipboard access.", "error");
  }
}

function extractDraftContent(outputText?: string): string {
  if (!outputText) {
    return "Chưa có kết quả.";
  }

  const match = outputText.match(
    /## Draft Content\s*([\s\S]*?)(?:\n## [^\n]+|\s*$)/
  );

  if (!match || !match[1]) {
    return outputText;
  }

  return match[1].trim() || outputText;
}

async function handleRetryTask(
  taskId: string | null,
  button: HTMLButtonElement
): Promise<void> {
  if (!taskId) {
    return;
  }

  const taskItem = currentTaskItems.find((item) => item.task.id === taskId);

  if (!taskItem) {
    setStatus("The selected task could not be found.", "error");
    return;
  }

  flashButtonLabel(button, "Retrying...", "Retry Task", 1200);

  setStatus("Retrying task...", "loading");

  try {
    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        taskType: "growth",
        title: taskItem.task.title,
        goal: taskItem.task.goal,
        audience: taskItem.task.audience,
        notes: taskItem.task.notes ?? ""
      })
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not retry the task"));
    }

    const data = (await response.json()) as CreateTaskResponse;

    setStatus("Task retried successfully.", "success");
    showLatestResult(data.task.id, data.result);
    await loadTasks();
    selectedTaskId = data.task.id;
    renderTaskList(currentTaskItems);
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while retrying the task.",
      "error"
    );
  }
}

async function handleDeleteTask(
  taskId: string | null,
  button: HTMLButtonElement
): Promise<void> {
  if (!taskId) {
    return;
  }

  flashButtonLabel(button, "Deleting...", "Delete Task", 1200);
  setStatus("Deleting task...", "loading");

  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
      method: "DELETE",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not delete the task"));
    }

    const _data = (await response.json()) as DeleteTaskResponse;

    if (selectedTaskId === taskId) {
      selectedTaskId = null;
    }

    await loadTasks();
    setStatus("Task deleted successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while deleting the task.",
      "error"
    );
  }
}

async function handleDeleteWorkItem(workItemId: string | null): Promise<void> {
  if (!workItemId) {
    return;
  }

  if (
    !window.confirm(
      "Delete this work item only if it was created by mistake and has no assignment or task history. This cannot be undone."
    )
  ) {
    return;
  }

  setStatus("Deleting work item...", "loading");

  try {
    const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}`, {
      method: "DELETE",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not delete the work item"));
    }

    selectedWorkItemId = null;
    closeWorkItemModal();
    await loadWorkItems();
    await loadAssignments();
    setStatus("Work item deleted successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while deleting the work item.",
      "error"
    );
  }
}

async function handleArchiveWorkItem(workItemId: string | null): Promise<void> {
  if (!workItemId) return;

  if (!window.confirm("Lưu trữ hồ sơ này? Hồ sơ sẽ chuyển sang trạng thái lưu trữ và chỉ được tra cứu.")) {
    return;
  }

  setStatus("Đang lưu trữ...", "loading");

  try {
    const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}/archive`, {
      method: "POST",
      headers: buildApiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({})
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể lưu trữ hồ sơ"));
    }

    await loadWorkItems();
    await selectWorkItemById(workItemId);
    setStatus("✅ Hồ sơ đã được lưu trữ thành công (Giai đoạn 9).", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi lưu trữ hồ sơ.",
      "error"
    );
  }
}

function flashButtonLabel(
  button: HTMLButtonElement,
  temporaryLabel: string,
  defaultLabel: string,
  durationMs = 900
): void {
  button.textContent = temporaryLabel;
  window.setTimeout(() => {
    button.textContent = defaultLabel;
  }, durationMs);
}

type StatusTone = "info" | "loading" | "success" | "error";

function setStatus(message: string, tone: StatusTone = "info"): void {
  statusMessage.textContent = message;
  statusMessage.dataset.state = tone;
  contextStatusMessage.textContent = message;
  contextStatusMessage.dataset.state = tone;
  contextStatusMessage.classList.toggle("hidden", message.trim().length === 0);

  const host = resolveContextStatusHost();

  if (host && contextStatusMessage.parentElement !== host) {
    host.prepend(contextStatusMessage);
  }
}

function resolveContextStatusHost(): HTMLElement | null {
  if (!taskModal.classList.contains("hidden")) {
    return taskModalBody;
  }

  if (!documentModal.classList.contains("hidden")) {
    return documentModalBody;
  }

  if (!workItemModal.classList.contains("hidden")) {
    return workItemModalBody;
  }

  const viewMap: Record<typeof currentView, HTMLElement> = {
    overview: overviewView,
    documents: documentsView,
    "work-items": workItemsView,
    assignments: assignmentsView,
    "department-tasks": departmentTasksView,
    approvals: approvalsView,
    reports: reportsView,
    admin: adminView,
    account: accountView,
    legacy: legacyView
  };

  const activeView = viewMap[currentView];

  return (
    activeView.querySelector<HTMLElement>(".panel, .result-card, .account-card, .admin-card") ??
    activeView
  );
}

function getTitleValidationError(title: string): string | null {
  const requiredError = getRequiredFieldError(title, "Title");

  if (requiredError) {
    return requiredError;
  }

  const normalizedTitle = normalizeTitle(title);
  const hasDuplicateTitle = currentTasks.some(
    (task) => normalizeTitle(task.title) === normalizedTitle
  );

  if (hasDuplicateTitle) {
    return "Title already exists.";
  }

  return null;
}

function getRequiredFieldError(value: string, fieldLabel: string): string | null {
  if (value.length === 0) {
    return `${fieldLabel} is required.`;
  }

  return null;
}

function setTitleError(message: string): void {
  titleError.textContent = message;
  titleError.classList.remove("hidden");
  titleInput.setAttribute("aria-invalid", "true");
}

function clearTitleError(): void {
  titleError.textContent = "";
  titleError.classList.add("hidden");
  titleInput.removeAttribute("aria-invalid");
}

function setGoalError(message: string): void {
  goalError.textContent = message;
  goalError.classList.remove("hidden");
  goalInput.setAttribute("aria-invalid", "true");
}

function clearGoalError(): void {
  goalError.textContent = "";
  goalError.classList.add("hidden");
  goalInput.removeAttribute("aria-invalid");
}

function setAudienceError(message: string): void {
  audienceError.textContent = message;
  audienceError.classList.remove("hidden");
  audienceInput.setAttribute("aria-invalid", "true");
}

function clearAudienceError(): void {
  audienceError.textContent = "";
  audienceError.classList.add("hidden");
  audienceInput.removeAttribute("aria-invalid");
}

function clearAllFieldErrors(): void {
  clearTitleError();
  clearGoalError();
  clearAudienceError();
}

function setFormDisabled(isDisabled: boolean): void {
  submitButton.disabled = isDisabled;

  const formElements = form.querySelectorAll<
    HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
  >("input, textarea, button");

  formElements.forEach((element) => {
    element.disabled = isDisabled;
  });
}

/**
 * Gives the submit button a very simple loading state
 * while the form request is in progress.
 */
function setSubmitButtonLoading(isLoading: boolean): void {
  submitButton.textContent = isLoading
    ? "Creating Growth Task..."
    : "Create Growth Task";
}

/**
 * Reads the real error message returned by the API, if one exists.
 *
 * This helps beginners see the backend validation message directly
 * instead of a generic browser error.
 */
async function readApiError(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorResponse;

    if (typeof data.error === "string" && data.error.trim().length > 0) {
      return data.error;
    }

    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

async function downloadApiFile(
  path: string,
  fallbackFilename: string,
  successMessage: string
): Promise<void> {
  const response = await fetch(path, {
    headers: buildApiHeaders()
  });

  if (!response.ok) {
    throw new Error(await readApiError(response, "The API could not download the file"));
  }

  const blob = await response.blob();
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch =
    contentDisposition?.match(/filename="([^"]+)"/i) ??
    contentDisposition?.match(/filename=([^;]+)/i);
  const filename = filenameMatch?.[1]?.trim() || fallbackFilename;
  const blobUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
  setStatus(successMessage, "success");
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

/**
 * Escapes text before inserting it into HTML.
 *
 * This is a simple safety step because task titles come from user input.
 */
function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeTitle(value: string): string {
  return value.trim().toLocaleLowerCase();
}

function getOwnerLabel(ownerId?: string): string {
  return ownerId && ownerId.trim().length > 0 ? ownerId : "unowned";
}

function hideLatestResult(): void {
  currentLatestResultTaskId = null;
  latestResult.classList.add("hidden");
  resultMeta.textContent = "";
  resultText.textContent = "";
}

function resetUserScopedUiState(): void {
  selectedTaskId = null;
  selectedDocumentId = null;
  selectedWorkItemId = null;
  currentSelectedTaskWorkItem = null;
  currentSelectedTaskDocument = null;
  currentNotifications = [];
  currentDocuments = [];
  currentWorkItems = [];
  currentWorkItemAssignments = [];
  currentAssignments = [];
  hideLatestResult();
  hideDocumentDetail();
  hideWorkItemDetail();
  renderDocumentList([]);
  renderWorkItemList([]);
  renderAssignmentsList([]);
  renderOverview();
  renderReports();
}

function buildApiHeaders(
  extraHeaders: Record<string, string> = {}
): Record<string, string> {
  const headers = { ...extraHeaders };

  if (!currentSessionUserId && isSafeHeaderValue(currentMockUserId)) {
    headers["x-user-id"] = currentMockUserId;
  }

  return headers;
}

function isSafeHeaderValue(value: string): boolean {
  if (value.trim().length === 0) {
    return false;
  }

  return /^[\x20-\x7E]+$/.test(value);
}

function loadMockUserId(): string {
  try {
    const storedValue = window.localStorage.getItem(MOCK_USER_STORAGE_KEY);
    return normalizeMockUserId(storedValue ?? DEFAULT_MOCK_USER_ID);
  } catch {
    return DEFAULT_MOCK_USER_ID;
  }
}

function saveMockUserId(value: string): void {
  try {
    window.localStorage.setItem(MOCK_USER_STORAGE_KEY, value);
  } catch {
    // Ignore storage write failures and keep using in-memory state.
  }
}

function renderActiveUser(): void {
  activeUser.textContent =
    currentMockUserId.length > 0
      ? `Mock user header: ${currentMockUserId}`
      : "Mock user header: off";
  renderIdentitySource();
}

function renderSessionUser(): void {
  const roleLabel = currentSessionUser?.role
    ? ` (${currentSessionUser.role})`
    : "";

  sessionUser.textContent =
    currentSessionUserId && currentSessionUserId.length > 0
      ? `Đăng nhập: ${currentSessionUserId}${roleLabel}`
      : "Chưa đăng nhập";
  renderIdentitySource();
  renderAdminPanel();
  renderAccountSummary();
  renderSidebarVisibility();
  renderCurrentView();
  renderOverview();
  renderReports();
}

function renderIdentitySource(): void {
  if (currentSessionUserId && currentSessionUserId.length > 0) {
    identitySource.textContent =
      currentMockUserId.length > 0
        ? `Phiên: ${currentSessionUserId}. Dev fallback ${currentMockUserId} bị bỏ qua.`
        : `Phiên: ${currentSessionUserId}.`;
    return;
  }

  if (currentMockUserId.length > 0) {
    identitySource.textContent = `Dev fallback: ${currentMockUserId}. Chưa có phiên đăng nhập.`;
    return;
  }

  identitySource.textContent = "Chưa đăng nhập. Vui lòng đăng nhập để tiếp tục.";
}

function setAuthButtonsDisabled(isDisabled: boolean): void {
  loginButton.disabled = isDisabled;
  logoutButton.disabled = isDisabled;
  changePasswordButton.disabled = isDisabled;
  createDepartmentButton.disabled = isDisabled;
  createWorkItemButton.disabled = isDisabled;
  refreshWorkItemsButton.disabled = isDisabled;
}

function normalizeMockUserId(value: string): string {
  return value.trim();
}

function isPrincipalSession(): boolean {
  return currentSessionUser?.role === "principal";
}

function isAdminLikeSession(): boolean {
  return currentSessionUser?.role === "principal" || currentSessionUser?.role === "admin";
}

function getAllowedViews(): Array<typeof currentView> {
  const role = currentSessionUser?.role;

  if (role === "principal" || role === "admin") {
    return [
      "overview",
      "documents",
      "approvals",
      "department-tasks",
      "work-items",
      "reports",
      "admin",
      "account",
      "legacy"
    ];
  }

  if (role === "department_head") {
    return ["overview", "documents", "work-items", "department-tasks", "reports", "account"];
  }

  if (role === "clerk") {
    return ["overview", "documents", "work-items", "account"];
  }

  if (role === "staff") {
    return ["overview", "documents", "department-tasks", "reports", "account"];
  }

  return ["overview", "account"];
}

function renderSidebarVisibility(): void {
  const allowedViews = new Set(getAllowedViews());

  navButtons.forEach((button) => {
    const view = button.dataset.view as typeof currentView | undefined;
    const shouldShow = view ? allowedViews.has(view) : false;
    button.classList.toggle("hidden", !shouldShow);
  });

  if (currentView === "assignments") {
    currentView = allowedViews.has("approvals") ? "approvals" : "overview";
  }

  if (!allowedViews.has(currentView)) {
    currentView = allowedViews.has("documents")
      ? "documents"
      : allowedViews.has("approvals")
        ? "approvals"
        : allowedViews.has("department-tasks")
          ? "department-tasks"
          : allowedViews.has("work-items")
            ? "work-items"
        : "overview";
  }
}

function renderAccountSummary(): void {
  accountSummary.innerHTML = `
    <div class="admin-item-grid">
      <div>
        <p class="detail-label">Phiên đăng nhập</p>
        <p class="detail-value">${escapeHtml(currentSessionUserId ?? "Chưa đăng nhập")}</p>
      </div>
      <div>
        <p class="detail-label">Vai trò</p>
        <p class="detail-value">${escapeHtml(currentSessionUser?.role ?? "khách")}</p>
      </div>
      <div>
        <p class="detail-label">Đơn vị</p>
        <p class="detail-value">${escapeHtml(currentSessionUser?.departmentName ?? currentSessionUser?.departmentId ?? "—")}</p>
      </div>
      <div>
        <p class="detail-label">Chức vụ</p>
        <p class="detail-value">${escapeHtml(currentSessionUser?.position ?? "—")}</p>
      </div>
    </div>
  `;
}

function canUseWorkItems(): boolean {
  return (
    currentSessionUser?.role === "principal" ||
    currentSessionUser?.role === "admin" ||
    currentSessionUser?.role === "clerk"
  );
}

function canUseDocumentIntake(): boolean {
  return currentSessionUserId !== null;
}

function renderAdminPanel(): void {
  if (!(currentSessionUser?.role === "principal" || currentSessionUser?.role === "admin")) {
    adminPanel.classList.add("hidden");
    departmentList.innerHTML = "";
    userAdminList.innerHTML = "";
    if (currentView === "admin") {
      currentView = "overview";
      renderCurrentView();
    }
    return;
  }

  adminPanel.classList.remove("hidden");
  renderDepartmentList();
  renderUserAdminList();
  bindAdminTabs();
}

function bindAdminTabs(): void {
  adminPanel
    .querySelectorAll<HTMLButtonElement>("[data-admin-tab]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const nextTab = button.dataset.adminTab ?? "departments";
        adminPanel
          .querySelectorAll<HTMLButtonElement>("[data-admin-tab]")
          .forEach((item) => {
            item.classList.toggle("is-active", item.dataset.adminTab === nextTab);
          });
        adminPanel
          .querySelectorAll<HTMLElement>("[data-admin-panel]")
          .forEach((panel) => {
            panel.classList.toggle("hidden", panel.dataset.adminPanel !== nextTab);
          });
      });
    });
}

function renderWorkItemDepartmentOptions(): void {
  workItemDepartmentSelect.innerHTML = `
    <option value="">No department</option>
    ${currentDepartments
      .map(
        (department) => `
          <option value="${escapeHtml(department.id)}">
            ${escapeHtml(department.name)}
          </option>
        `
      )
      .join("")}
  `;

  createUserDepartmentSelect.innerHTML = `
    <option value="">No department</option>
    ${currentDepartments
      .map(
        (department) => `
          <option value="${escapeHtml(department.id)}">
            ${escapeHtml(department.name)}
          </option>
        `
      )
      .join("")}
  `;
}

function renderDepartmentList(): void {
  if (currentDepartments.length === 0) {
    departmentList.innerHTML = `
      <div class="empty-state">
        No departments yet.
      </div>
    `;
    return;
  }

  departmentList.innerHTML = currentDepartments
    .map(
      (department) => `
        <article class="admin-item">
          <div class="admin-item-grid">
            <div class="field">
              <label>Name</label>
              <input
                type="text"
                data-department-field="name"
                data-department-id="${escapeHtml(department.id)}"
                value="${escapeHtml(department.name)}"
              />
            </div>
            <div class="field">
              <label>Code</label>
              <input
                type="text"
                data-department-field="code"
                data-department-id="${escapeHtml(department.id)}"
                value="${escapeHtml(department.code ?? "")}"
              />
            </div>
            <div class="auth-actions">
              <button
                class="secondary-button"
                type="button"
                data-save-department-id="${escapeHtml(department.id)}"
              >
                Save
              </button>
              <button
                class="secondary-button danger-button"
                type="button"
                data-delete-department-id="${escapeHtml(department.id)}"
              >
                Delete
              </button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  departmentList
    .querySelectorAll<HTMLButtonElement>("[data-save-department-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleSaveDepartment(button.dataset.saveDepartmentId ?? null);
      });
    });

  departmentList
    .querySelectorAll<HTMLButtonElement>("[data-delete-department-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleDeleteDepartment(button.dataset.deleteDepartmentId ?? null);
      });
    });
}

function renderUserAdminList(): void {
  const existingUsersMarkup =
    currentUsers.length === 0
      ? `
          <div class="empty-state">
            No users available for assignment.
          </div>
        `
      : currentUsers
    .map(
      (user) => `
        <article class="admin-item">
          <div class="admin-user-header">
            <strong>${escapeHtml(user.username)}</strong>
            <span>${escapeHtml(user.displayName ?? user.username)}</span>
          </div>
          <div class="admin-item-grid">
            <div class="field">
              <label>Role</label>
              <select data-user-field="role" data-user-id="${escapeHtml(user.id)}">
                ${renderRoleOptions(user.role)}
              </select>
            </div>
            <div class="field">
              <label>Department</label>
              <select data-user-field="department" data-user-id="${escapeHtml(user.id)}">
                <option value="">No department</option>
                ${currentDepartments
                  .map(
                    (department) => `
                      <option
                        value="${escapeHtml(department.id)}"
                        ${department.id === user.departmentId ? "selected" : ""}
                      >
                        ${escapeHtml(department.name)}
                      </option>
                    `
                  )
                  .join("")}
              </select>
            </div>
            <div class="field">
              <label>Position</label>
              <input
                type="text"
                data-user-field="position"
                data-user-id="${escapeHtml(user.id)}"
                value="${escapeHtml(user.position ?? "")}"
              />
            </div>
            <label class="checkbox-field">
              <input
                type="checkbox"
                data-user-field="active"
                data-user-id="${escapeHtml(user.id)}"
                ${user.isActive ? "checked" : ""}
              />
              Active
            </label>
            <div class="auth-actions">
              <button
                class="secondary-button"
                type="button"
                data-save-user-id="${escapeHtml(user.id)}"
              >
                Save Assignment
              </button>
            </div>
          </div>
        </article>
      `
    )
    .join("");

  userAdminList.innerHTML = existingUsersMarkup;

  userAdminList
    .querySelectorAll<HTMLButtonElement>("[data-save-user-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleSaveUserAssignment(button.dataset.saveUserId ?? null);
      });
    });
}

async function handleCreateUser(
  usernameField = createUserUsernameInput,
  displayNameField = createUserDisplayNameInput,
  passwordField = createUserPasswordInput,
  roleField = createUserRoleSelect,
  departmentField = createUserDepartmentSelect,
  positionField = createUserPositionInput,
  activeField = createUserActiveInput,
  button = createUserButton
): Promise<void> {
  const username = usernameField.value.trim().toLowerCase();
  const displayName = displayNameField.value.trim();
  const password = passwordField.value;

  if (username.length === 0) {
    setStatus("Username is required.", "error");
    return;
  }

  if (password.length === 0) {
    setStatus("Password is required.", "error");
    return;
  }

  button.disabled = true;
  setStatus("Creating user...", "loading");

  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        username,
        displayName: displayName || null,
        password,
        role: roleField.value,
        departmentId: departmentField.value || null,
        position: positionField.value.trim() || null,
        isActive: activeField.checked
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not create the user")
      );
    }

    usernameField.value = "";
    displayNameField.value = "";
    passwordField.value = "";
    roleField.value = "staff";
    departmentField.value = "";
    positionField.value = "";
    activeField.checked = true;
    await loadAdminData();
    setStatus("User created successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the user.",
      "error"
    );
  } finally {
    button.disabled = false;
  }
}

function renderRoleOptions(selectedRole: AppUserRole): string {
  const roles: AppUserRole[] = [
    "admin",
    "principal",
    "department_head",
    "staff",
    "clerk"
  ];

  return roles
    .map(
      (role) => `
        <option value="${escapeHtml(role)}" ${role === selectedRole ? "selected" : ""}>
          ${escapeHtml(role)}
        </option>
      `
    )
    .join("");
}

async function loadAdminData(): Promise<void> {
  if (!currentSessionUserId) {
    currentDepartments = [];
    currentUsers = [];
    renderWorkItemDepartmentOptions();
    renderAdminPanel();
    renderOverview();
    return;
  }

  try {
    const departmentsResponse = await fetch("/api/departments", {
      headers: buildApiHeaders()
    });

    if (!departmentsResponse.ok) {
      throw new Error(
        await readApiError(
          departmentsResponse,
          "The API could not load departments"
        )
      );
    }

    const departmentsData = (await departmentsResponse.json()) as DepartmentsResponse;
    currentDepartments = departmentsData.departments;
    renderWorkItemDepartmentOptions();

    if (currentSessionUser?.role === "principal" || currentSessionUser?.role === "admin") {
      const usersResponse = await fetch("/api/users", {
        headers: buildApiHeaders()
      });

      if (!usersResponse.ok) {
        throw new Error(
          await readApiError(usersResponse, "The API could not load users")
        );
      }

      const usersData = (await usersResponse.json()) as UsersResponse;
      currentUsers = usersData.users;
    } else {
      currentUsers = [];
    }

    renderAdminPanel();
    renderOverview();
  } catch (error: unknown) {
    currentDepartments = [];
    currentUsers = [];
    renderWorkItemDepartmentOptions();
    renderAdminPanel();
    renderOverview();
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading admin data.",
      "error"
    );
  }
}

async function loadDocuments(): Promise<void> {
  if (!currentSessionUserId) {
    currentDocuments = [];
    selectedDocumentId = null;
    renderDocumentList([]);
    hideDocumentDetail();
    renderOverview();
    return;
  }

  try {
    const response = await fetch("/api/documents", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load documents")
      );
    }

    const data = (await response.json()) as DocumentsResponse;
    currentDocuments = data.documents;
    syncSelectedDocument();
    renderDocumentList(currentDocuments);
    renderOverview();
  } catch (error: unknown) {
    currentDocuments = [];
    selectedDocumentId = null;
    renderDocumentList([]);
    hideDocumentDetail();
    renderOverview();
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading documents.",
      "error"
    );
  }
}

function renderDocumentList(items: DocumentListItem[]): void {
  const filteredItems = items.filter((item) => {
    if (currentDocumentSearch.length === 0) {
      return true;
    }

    const haystack = [
      item.document.filename,
      item.document.uploadedByUserId,
      item.document.extractedText ?? "",
      JSON.stringify(item.document.metadata ?? {})
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(currentDocumentSearch);
  });

  if (filteredItems.length === 0) {
    documentList.innerHTML = `
      <div class="empty-state">
        No documents match the current search.
      </div>
    `;
    return;
  }

  documentList.innerHTML = filteredItems
    .map(
      (item) => `
        <article class="task-card list-row ${selectedDocumentId === item.document.id ? "is-selected" : ""}">
          <div class="task-card-row list-row-header">
            <h3 class="list-row-title">${escapeHtml(item.document.filename)}</h3>
            <span class="status-badge status-${escapeHtml(item.document.ocrStatus)}">
              ${escapeHtml(item.document.ocrStatus)}
            </span>
          </div>
          <div class="list-row-meta">
            <span>Uploaded by ${escapeHtml(item.document.uploadedByUserId)}</span>
            <span>${formatDate(item.document.createdAt)}</span>
            <span>${escapeHtml(item.document.createdWorkItemId ? "Linked work item" : "No work item")}</span>
          </div>
          <div class="auth-actions">
            <button
              class="secondary-button task-detail-button"
              type="button"
              data-document-id="${escapeHtml(item.document.id)}"
            >
              ${selectedDocumentId === item.document.id ? "Đóng" : "Mở"}
            </button>
          </div>
        </article>
      `
    )
    .join("");

  documentList
    .querySelectorAll<HTMLButtonElement>("[data-document-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        void selectDocumentById(button.dataset.documentId ?? null);
      });
    });
}

function syncSelectedDocument(): void {
  if (!selectedDocumentId) {
    hideDocumentDetail();
    return;
  }

  const selected = currentDocuments.find(
    (item) => item.document.id === selectedDocumentId
  );

  if (!selected) {
    selectedDocumentId = null;
    hideDocumentDetail();
    return;
  }

  renderDocumentDetail(selected);
}

async function selectDocumentById(documentId: string | null): Promise<void> {
  selectedDocumentId = selectedDocumentId === documentId ? null : documentId;

  if (!selectedDocumentId) {
    hideDocumentDetail();
    renderDocumentList(currentDocuments);
    return;
  }

  try {
    const response = await fetch(`/api/documents/${encodeURIComponent(selectedDocumentId)}`, {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load the document")
      );
    }

    const detail = (await response.json()) as DocumentDetailResponse;
    const index = currentDocuments.findIndex(
      (item) => item.document.id === detail.document.id
    );

    if (index >= 0) {
      currentDocuments[index] = detail;
    } else {
      currentDocuments.unshift(detail);
    }

    renderDocumentList(currentDocuments);
    renderDocumentDetail(detail);
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading the document.",
      "error"
    );
  }
}

async function openDocumentWithTab(
  documentId: string | null,
  tabName: string
): Promise<void> {
  if (!documentId) {
    return;
  }

  currentView = "documents";
  renderCurrentView();

  if (selectedDocumentId === documentId) {
    selectedDocumentId = null;
  }

  await selectDocumentById(documentId);
  setActiveDocumentDetailTab(tabName);
}

function renderDocumentDetail(item: DocumentListItem): void {
  const isAnalyzing = currentAnalyzingDocumentId === item.document.id;
  documentDetail.classList.add("hidden");
  documentDetailTitle.textContent = item.document.filename;
  documentDetailMeta.textContent = [
    `OCR: ${item.document.ocrStatus}`,
    `Tải lên: ${formatDate(item.document.createdAt)}`,
    `Hồ sơ: ${item.document.createdWorkItemId ?? "Chưa tạo"}`
  ].join(" | ");
  documentModalTitle.textContent = item.document.filename;
  documentModalMeta.textContent = documentDetailMeta.textContent;
  documentModalBody.innerHTML = `
    <div class="detail-tabs">
      <button class="tab-button is-active" type="button" data-document-tab="summary">Tóm tắt AI</button>
      <button class="tab-button" type="button" data-document-tab="metadata">Thông tin</button>
      <button class="tab-button" type="button" data-document-tab="text">Văn bản trích xuất</button>
    </div>
    <div class="task-actions">
      <button
        id="analyze-document-button"
        class="secondary-button"
        type="button"
        ${isAnalyzing ? "disabled" : ""}
      >${isAnalyzing ? "Đang phân tích..." : "Phân tích văn bản"}</button>
      <button id="create-document-work-item-button" class="secondary-button" type="button">
        Tạo hồ sơ công việc
      </button>
    </div>
    <section class="tab-panel" data-document-panel="summary">
      <div class="task-output">
        <p class="detail-label">Tóm tắt AI / Văn bản trích xuất</p>
        <pre class="task-output-text">${escapeHtml(
          item.latestAnalysis?.rawOutput ??
            item.document.extractedText?.slice(0, 2400) ??
            "Chưa có phân tích AI hoặc văn bản trích xuất nào."
        )}</pre>
      </div>
    </section>
    <section class="tab-panel hidden" data-document-panel="metadata">
      <div class="task-detail-grid">
        <div>
          <p class="detail-label">Người tải lên</p>
          <p class="detail-value">${escapeHtml(item.document.uploadedByUserId)}</p>
        </div>
        <div>
          <p class="detail-label">Định dạng</p>
          <p class="detail-value">${escapeHtml(item.document.contentType ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Kích thước</p>
          <p class="detail-value">${escapeHtml(
            item.document.sizeBytes !== undefined ? `${item.document.sizeBytes} bytes` : "—"
          )}</p>
        </div>
        <div>
          <p class="detail-label">Hồ sơ liên kết</p>
          <p class="detail-value">${escapeHtml(item.document.createdWorkItemId ?? "Chưa tạo")}</p>
        </div>
      </div>
      <div class="task-output">
        <p class="detail-label">Metadata JSON</p>
        <pre class="task-output-text">${escapeHtml(
          JSON.stringify(item.document.metadata ?? {}, null, 2)
        )}</pre>
      </div>
    </section>
    <section class="tab-panel hidden" data-document-panel="text">
      <div class="task-output">
        <p class="detail-label">Văn bản trích xuất đầy đủ</p>
        <pre class="task-output-text">${escapeHtml(
          item.document.extractedText ?? "Chưa có văn bản trích xuất nào được lưu trữ."
        )}</pre>
      </div>
    </section>
  `;

  documentModalBody
    .querySelectorAll<HTMLButtonElement>("[data-document-tab]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        setActiveDocumentDetailTab(button.dataset.documentTab ?? "summary");
      });
    });

  documentModalBody
    .querySelector<HTMLButtonElement>("#analyze-document-button")
    ?.addEventListener("click", async () => {
      await handleAnalyzeDocument(item.document.id);
    });

  documentModalBody
    .querySelector<HTMLButtonElement>("#create-document-work-item-button")
    ?.addEventListener("click", async () => {
      await handleCreateWorkItemFromDocument(item.document.id);
    });

  openDocumentModal();
  setActiveDocumentDetailTab("summary");
}

function hideDocumentDetail(): void {
  documentDetail.classList.add("hidden");
  documentDetailTitle.textContent = "Chi tiết văn bản";
  documentDetailMeta.textContent = "";
  documentDetailBody.innerHTML = "";
  documentModalTitle.textContent = "Chi tiết văn bản";
  documentModalMeta.textContent = "";
  documentModalBody.innerHTML = "";
  documentModal.classList.add("hidden");
  documentModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setActiveDocumentDetailTab(tabName: string): void {
  documentModalBody
    .querySelectorAll<HTMLButtonElement>("[data-document-tab]")
    .forEach((button) => {
      button.classList.toggle("is-active", button.dataset.documentTab === tabName);
    });

  documentModalBody
    .querySelectorAll<HTMLElement>("[data-document-panel]")
    .forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.documentPanel !== tabName);
    });
}

function openDocumentModal(): void {
  documentModal.classList.remove("hidden");
  documentModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeDocumentModal(): void {
  selectedDocumentId = null;
  hideDocumentDetail();
  renderDocumentList(currentDocuments);
}

async function handleCreateDocument(): Promise<void> {
  if (!canUseDocumentIntake()) {
    setStatus("You must be logged in to upload a document.", "error");
    return;
  }

  const files = Array.from(documentFileInput.files ?? []);

  if (files.length === 0) {
    setStatus("At least one document file is required.", "error");
    return;
  }

  let baseMetadata: Record<string, unknown> = {};

  if (documentMetadataInput.value.trim().length > 0) {
    try {
      const parsed = JSON.parse(documentMetadataInput.value) as unknown;

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Metadata JSON must be an object.");
      }

      baseMetadata = parsed as Record<string, unknown>;
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Metadata JSON is invalid.",
        "error"
      );
      return;
    }
  }

  if (documentTitleInput.value.trim().length > 0) {
    baseMetadata.note = documentTitleInput.value.trim();
  }

  createDocumentButton.disabled = true;
  setStatus(
    files.length === 1
      ? "Uploading document..."
      : `Uploading ${files.length} documents...`,
    "loading"
  );

  try {
    let lastUploadedDocumentId: string | null = null;

    for (const file of files) {
      const canInlineExtractText = isInlineExtractableDocument(file);
      const extractedText = canInlineExtractText
        ? sanitizeUploadedText(await file.text())
        : undefined;
      const contentBase64 = canInlineExtractText
        ? undefined
        : await readFileAsBase64(file);
      const ocrStatus: DocumentOcrStatus =
        canInlineExtractText && extractedText && extractedText.trim().length > 0
          ? "ready"
          : "pending";
      const metadata = {
        ...baseMetadata,
        originalFilename: file.name,
        inlineTextExtraction: canInlineExtractText
      };

      const response = await fetch("/api/documents", {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "text/plain",
          sizeBytes: file.size,
          metadata,
          extractedText,
          contentBase64,
          ocrStatus
        })
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "The API could not upload the document")
        );
      }

      const data = (await response.json()) as DocumentResponse;
      lastUploadedDocumentId = data.document.id;
    }

    documentForm.reset();
    documentMetadataInput.value = "";
    documentTitleInput.value = "";
    setStatus(
      files.length === 1
        ? "Document uploaded successfully."
        : `${files.length} documents uploaded successfully.`,
      "success"
    );

    try {
      await loadDocuments();
      if (lastUploadedDocumentId) {
        await selectDocumentById(lastUploadedDocumentId);
      }
    } catch {
      setStatus(
        files.length === 1
          ? "Document uploaded successfully. Refresh the intake list if the new record is not shown yet."
          : `${files.length} documents uploaded successfully. Refresh the intake list if the new records are not shown yet.`,
        "success"
      );
    }
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while uploading the document.",
      "error"
    );
  } finally {
    createDocumentButton.disabled = false;
  }
}

function isInlineExtractableDocument(file: File): boolean {
  const lowerName = file.name.toLowerCase();

  if (
    file.type.startsWith("text/") ||
    lowerName.endsWith(".txt") ||
    lowerName.endsWith(".md") ||
    lowerName.endsWith(".json") ||
    lowerName.endsWith(".csv") ||
    lowerName.endsWith(".xml") ||
    lowerName.endsWith(".html")
  ) {
    return true;
  }

  return false;
}

function sanitizeUploadedText(value: string): string {
  return value.replaceAll("\u0000", "").trim();
}

async function readFileAsBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return window.btoa(binary);
}

async function handleAnalyzeDocument(documentId: string): Promise<void> {
  try {
    currentAnalyzingDocumentId = documentId;
    const currentDetail = currentDocuments.find((item) => item.document.id === documentId);

    if (currentDetail) {
      renderDocumentDetail(currentDetail);
    }

    setStatus("Analyzing document intake...", "loading");
    const response = await fetch(`/api/documents/${encodeURIComponent(documentId)}/analyze`, {
      method: "POST",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not analyze the document")
      );
    }

    const _data = (await response.json()) as DocumentAnalysisResponse;
    await loadDocuments();
    await selectDocumentById(documentId);
    setStatus("Document analysis completed.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while analyzing the document.",
      "error"
    );
  } finally {
    currentAnalyzingDocumentId = null;

    const refreshedDetail = currentDocuments.find((item) => item.document.id === documentId);

    if (refreshedDetail) {
      renderDocumentDetail(refreshedDetail);
    }
  }
}

async function handleCreateWorkItemFromDocument(documentId: string): Promise<void> {
  try {
    const detail = currentDocuments.find((item) => item.document.id === documentId);
    const response = await fetch(
      `/api/documents/${encodeURIComponent(documentId)}/create-work-item`,
      {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          title: detail ? `School Workflow: ${detail.document.filename}` : undefined,
          description:
            detail?.latestAnalysis?.summary ??
            detail?.document.extractedText?.slice(0, 1200) ??
            undefined
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not create a work item from the document")
      );
    }

    const data = (await response.json()) as CreateWorkItemFromDocumentResponse;
    await loadDocuments();
    await loadWorkItems();
    currentView = "work-items";
    renderCurrentView();
    await selectWorkItemById(data.workItem.id);
    setStatus("Work item created from document.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the work item.",
      "error"
    );
  }
}

async function loadWorkItems(): Promise<void> {
  if (!currentSessionUserId) {
    currentWorkItems = [];
    renderWorkItemList([]);
    currentAssignments = [];
    renderAssignmentsList([]);
    hideWorkItemDetail();
    renderOverview();
    renderReports();
    return;
  }

  try {
    const response = await fetch("/api/work-items", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load work items")
      );
    }

    const data = (await response.json()) as WorkItemsResponse;
    currentWorkItems = data.workItems;
    syncSelectedWorkItem();
    renderWorkItemList(currentWorkItems);
    renderOverview();
    renderReports();
  } catch (error: unknown) {
    currentWorkItems = [];
    selectedWorkItemId = null;
    renderWorkItemList([]);
    currentAssignments = [];
    renderAssignmentsList([]);
    hideWorkItemDetail();
    renderOverview();
    renderReports();
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading work items.",
      "error"
    );
  }
}

const ACTIVE_WORK_ITEM_STATUSES = new Set([
  "draft",
  "waiting_review",
  "waiting_assignment",
  "assigned",
  "on_hold",
  "in_review",
  "needs_supplement",
  "needs_rework",
  "late_explanation_required",
  "waiting_principal_approval"
]);

function renderWorkItemList(items: WorkItemListItem[]): void {
  const filteredItems = items.filter((item) => {
    // Status filter
    if (currentWorkItemStatusFilter === "active") {
      if (!ACTIVE_WORK_ITEM_STATUSES.has(item.workItem.status)) return false;
    } else if (currentWorkItemStatusFilter === "completed") {
      if (item.workItem.status !== "completed") return false;
    } else if (currentWorkItemStatusFilter === "archived") {
      if (item.workItem.status !== "archived") return false;
    }
    // Text search
    if (currentWorkItemSearch.length === 0) {
      return true;
    }

    const haystack = [
      item.workItem.title,
      item.workItem.description,
      item.workItem.createdByUserId,
      item.workItem.departmentId ?? "",
      item.workItem.intakeCode ?? ""
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(currentWorkItemSearch);
  });

  if (filteredItems.length === 0) {
    workItemList.innerHTML = `
      <div class="empty-state">
        Không có hồ sơ nào phù hợp.
      </div>
    `;
    return;
  }

  workItemList.innerHTML = filteredItems
    .map(
      (item) => {
        const assignment = currentAssignments.find(
          (currentItem) => currentItem.workItemId === item.workItem.id
        );

        const isOverdue = item.workItem.deadline
          ? new Date(item.workItem.deadline) < new Date() && ACTIVE_WORK_ITEM_STATUSES.has(item.workItem.status)
          : false;

        return `
        <article class="task-card list-row ${selectedWorkItemId === item.workItem.id ? "is-selected" : ""}">
          <div class="task-card-row list-row-header">
            <h3 class="list-row-title">${escapeHtml(item.workItem.title)}</h3>
            <span class="status-badge status-${escapeHtml(item.workItem.status)}">
              ${escapeHtml(getWorkItemStatusLabel(item.workItem.status))}
            </span>
          </div>
          <div class="list-row-meta">
            <span>${escapeHtml(item.workItem.intakeCode ?? item.workItem.departmentId ?? "—")}</span>
            <span>${escapeHtml(item.workItem.createdByUserId)}</span>
            ${
              item.workItem.deadline
                ? `<span style="color:${isOverdue ? "#cf222e" : "#57606a"}">${isOverdue ? "⚠ QUÁ HẠN" : "Hạn"}: ${new Date(item.workItem.deadline).toLocaleDateString("vi-VN")}</span>`
                : `<span>${formatDate(item.workItem.updatedAt)}</span>`
            }
          </div>
          <p class="workflow-inline-hint">${escapeHtml(getNextWorkItemAction(item.workItem.status))}</p>
          <div class="auth-actions">
            <button
              class="secondary-button task-detail-button"
              type="button"
              data-work-item-id="${escapeHtml(item.workItem.id)}"
            >
              ${selectedWorkItemId === item.workItem.id ? "Đóng" : "Mở hồ sơ"}
            </button>
            ${
              assignment
                ? `
                  <button
                    class="secondary-button task-detail-button"
                    type="button"
                    data-open-work-item-task-id="${escapeHtml(assignment.taskId)}"
                  >
                    Mở nhiệm vụ
                  </button>
                `
                : ""
            }
          </div>
        </article>
      `;
      }
    )
    .join("");

  workItemList
    .querySelectorAll<HTMLButtonElement>("[data-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await selectWorkItemById(button.dataset.workItemId ?? null);
      });
    });

  workItemList
    .querySelectorAll<HTMLButtonElement>("[data-open-work-item-task-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        currentView = "department-tasks";
        renderCurrentView();
        await focusTaskById(button.dataset.openWorkItemTaskId ?? null);
      });
    });
}

async function loadAssignments(): Promise<void> {
  if (!currentSessionUserId) {
    currentAssignments = [];
    renderAssignmentsList([]);
    return;
  }

  try {
    const response = await fetch("/api/assignments", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load assignments")
      );
    }

    const data = (await response.json()) as AssignmentsResponse;
    currentAssignments = data.assignments;
    renderAssignmentsList(currentAssignments);
    renderOverview();
    renderReports();
  } catch {
    currentAssignments = [];
    renderAssignmentsList([]);
    renderOverview();
    renderReports();
  }
}

async function loadNotifications(): Promise<void> {
  if (!currentSessionUserId) {
    currentNotifications = [];
    renderOverview();
    return;
  }

  try {
    const response = await fetch("/api/notifications", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load notifications")
      );
    }

    const data = (await response.json()) as NotificationsResponse;
    currentNotifications = data.notifications;
    renderOverview();
  } catch {
    currentNotifications = [];
    renderOverview();
  }
}

function renderAssignmentsList(assignments: Assignment[]): void {
  if (assignments.length === 0) {
    assignmentList.innerHTML = `
      <div class="empty-state">
        No assignments are visible for the current user.
      </div>
    `;
    renderAssignmentQueue();
    renderAssignmentWorkspace();
    renderApprovalsQueue();
    return;
  }

  renderAssignmentQueue();
  renderAssignmentWorkspace();

  assignmentList.innerHTML = assignments
    .map(
      (assignment) => `
        <article class="admin-item">
          <div class="task-card-row">
            <strong>${escapeHtml(assignment.workItemId)}</strong>
            <span class="status-badge status-running">${escapeHtml(assignment.priority)}</span>
          </div>
          <p><strong>Main Department:</strong> ${escapeHtml(assignment.mainDepartmentId)}</p>
          <p><strong>Status:</strong> ${escapeHtml(assignment.status)}</p>
          <p><strong>Task:</strong> ${escapeHtml(assignment.taskId)}</p>
          <p><strong>Deadline:</strong> ${escapeHtml(assignment.deadline ?? "—")}</p>
          <p><strong>Output:</strong> ${escapeHtml(assignment.outputRequirement ?? "—")}</p>
          <p><strong>Adjustment Reason:</strong> ${escapeHtml(assignment.adjustmentReason ?? "—")}</p>
          <p><strong>Created:</strong> ${formatDate(assignment.createdAt)}</p>
          <div class="auth-actions">
            <button
              class="secondary-button"
              type="button"
              data-open-assignment-work-item-id="${escapeHtml(assignment.workItemId)}"
            >
              Mở hồ sơ
            </button>
            <button
              class="secondary-button"
              type="button"
              data-open-assignment-task-id="${escapeHtml(assignment.taskId)}"
            >
              Open Task
            </button>
          </div>
        </article>
      `
    )
    .join("");

  assignmentList
    .querySelectorAll<HTMLButtonElement>("[data-open-assignment-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        currentView = "work-items";
        renderCurrentView();
        await selectWorkItemById(button.dataset.openAssignmentWorkItemId ?? null);
      });
    });

  assignmentList
    .querySelectorAll<HTMLButtonElement>("[data-open-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        currentView = "department-tasks";
        renderCurrentView();
        void focusTaskById(button.dataset.openAssignmentTaskId ?? null);
      });
    });

  renderApprovalsQueue();
  renderPrincipalReviewWorkspace();
}

function renderAssignmentQueue(): void {
  if (!isAdminLikeSession()) {
    assignmentQueue.innerHTML = `
      <div class="empty-state">
        Assignment tools are limited to principal or admin sessions.
      </div>
    `;
    return;
  }

  const waitingItems = currentWorkItems.filter(
    (item) => item.workItem.status === "waiting_assignment"
  );

  if (waitingItems.length === 0) {
    assignmentQueue.innerHTML = `
      <div class="empty-state">
        No work items are waiting for assignment.
      </div>
    `;
    return;
  }

  assignmentQueue.innerHTML = waitingItems
    .map(
      (item) => `
        <button
          class="queue-item-button"
          type="button"
          data-assignment-queue-work-item-id="${escapeHtml(item.workItem.id)}"
        >
          <strong>${escapeHtml(item.workItem.title)}</strong>
          <span>${escapeHtml(item.workItem.createdByUserId)}</span>
        </button>
      `
    )
    .join("");

  assignmentQueue
    .querySelectorAll<HTMLButtonElement>("[data-assignment-queue-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await selectWorkItemById(button.dataset.assignmentQueueWorkItemId ?? null);
        renderAssignmentWorkspace();
      });
    });
}

function renderAssignmentWorkspace(): void {
  if (!isAdminLikeSession()) {
    assignmentWorkspace.innerHTML = `
      <div class="empty-state">
        Không gian giao việc chỉ dành cho Hiệu trưởng hoặc quản trị viên.
      </div>
    `;
    return;
  }

  if (!selectedWorkItemId) {
    assignmentWorkspace.innerHTML = `
      <div class="empty-state">
        Chọn một hồ sơ từ hàng chờ để xem chi tiết và chuẩn bị phiếu giao việc.
      </div>
    `;
    return;
  }

  const selectedItem = currentWorkItems.find(
    (item) => item.workItem.id === selectedWorkItemId
  );
  const currentAssignment = currentWorkItemAssignments[0] ?? null;

  if (!selectedItem) {
    assignmentWorkspace.innerHTML = `
      <div class="empty-state">
        Hồ sơ đã chọn không còn hiển thị nữa.
      </div>
    `;
    return;
  }

  assignmentWorkspace.innerHTML = `
    <article class="admin-item">
      <div class="task-card-row">
        <strong>${escapeHtml(selectedItem.workItem.title)}</strong>
        <span class="status-badge status-${escapeHtml(selectedItem.workItem.status)}">
          ${escapeHtml(selectedItem.workItem.status)}
        </span>
      </div>
      <p><strong>Description:</strong> ${escapeHtml(selectedItem.workItem.description)}</p>
      <p><strong>Current assignment:</strong> ${escapeHtml(currentAssignment ? currentAssignment.mainDepartmentId : "none")}</p>
      <p><strong>Priority:</strong> ${escapeHtml(currentAssignment?.priority ?? "not assigned")}</p>
      <p><strong>Deadline:</strong> ${escapeHtml(currentAssignment?.deadline ?? "—")}</p>
      <p><strong>Assignment form:</strong> Use the Work Items detail panel to submit or revise the assignment for this record.</p>
      <div class="auth-actions">
        <button class="secondary-button" type="button" data-open-assignment-workspace-item="${escapeHtml(selectedItem.workItem.id)}">
          Mở trong Hồ sơ
        </button>
      </div>
    </article>
  `;

  assignmentWorkspace
    .querySelectorAll<HTMLButtonElement>("[data-open-assignment-workspace-item]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        currentView = "work-items";
        renderCurrentView();
        await selectWorkItemById(button.dataset.openAssignmentWorkspaceItem ?? null);
      });
    });
}

function renderApprovalsQueue(): void {
  if (!isAdminLikeSession()) {
    approvalsQueue.innerHTML = `
      <div class="empty-state">
        Principal review is only available to principal or admin sessions.
      </div>
    `;
    approvalsAssignmentList.innerHTML = `
      <div class="empty-state">
        Principal review is limited to principal or admin sessions.
      </div>
    `;
    return;
  }

  const waitingItems = currentWorkItems.filter(
    (item) =>
      item.workItem.status === "waiting_review" ||
      item.workItem.status === "draft"
  );

  if (waitingItems.length === 0) {
    approvalsQueue.innerHTML = `
      <div class="empty-state">
        No work items are currently waiting for principal review.
      </div>
    `;
  } else {
    approvalsQueue.innerHTML = waitingItems
      .map(
        (item) => `
          <button
            class="queue-item-button"
            type="button"
            data-principal-review-work-item-id="${escapeHtml(item.workItem.id)}"
          >
            <strong>${escapeHtml(item.workItem.title)}</strong>
            <span>${escapeHtml(item.workItem.createdByUserId)}</span>
          </button>
        `
      )
      .join("");

    approvalsQueue
      .querySelectorAll<HTMLButtonElement>("[data-principal-review-work-item-id]")
      .forEach((button) => {
        button.addEventListener("click", async () => {
          await selectWorkItemById(button.dataset.principalReviewWorkItemId ?? null);
          renderPrincipalReviewWorkspace();
        });
      });
  }

  renderPrincipalReviewWorkspace();
}

function renderPrincipalReviewWorkspace(): void {
  if (!isAdminLikeSession()) {
    approvalsAssignmentList.innerHTML = `
      <div class="empty-state">
        Principal review is limited to principal or admin sessions.
      </div>
    `;
    return;
  }

  if (!selectedWorkItemId) {
    approvalsAssignmentList.innerHTML = buildPrincipalWorkflowHtml(null);
    bindPrincipalWorkflowInteractions();
    return;
  }

  const selectedItem = currentWorkItems.find(
    (item) => item.workItem.id === selectedWorkItemId
  );
  const linkedDocument =
    currentDocuments.find(
      (documentItem) =>
        documentItem.document.createdWorkItemId === selectedWorkItemId
    ) ?? null;

  if (!selectedItem) {
    approvalsAssignmentList.innerHTML = buildPrincipalWorkflowHtml(null);
    bindPrincipalWorkflowInteractions();
    return;
  }

  const currentDecision = selectedItem.workItem.principalDecision ?? "assign";

  approvalsAssignmentList.innerHTML = `
    <article class="admin-item">
      <div class="task-card-row">
        <strong>${escapeHtml(selectedItem.workItem.title)}</strong>
        <span class="status-badge status-${escapeHtml(selectedItem.workItem.status)}">
          ${escapeHtml(selectedItem.workItem.status)}
        </span>
      </div>
      <p><strong>Description:</strong> ${escapeHtml(selectedItem.workItem.description)}</p>
      <p><strong>Source document:</strong> ${escapeHtml(linkedDocument?.document.filename ?? "—")}</p>
      <p><strong>Latest AI summary:</strong> ${escapeHtml(selectedItem.latestAnalysis?.summary ?? "No AI summary saved yet")}</p>
      <div class="admin-item-grid">
        <div class="field">
          <label for="principal-decision">Principal decision</label>
          <select id="principal-decision">
            <option value="assign" ${currentDecision === "assign" ? "selected" : ""}>Prepare for assignment</option>
            <option value="return_intake" ${currentDecision === "return_intake" ? "selected" : ""}>Return for intake completion</option>
            <option value="hold" ${currentDecision === "hold" ? "selected" : ""}>Put on hold</option>
          </select>
        </div>
        <div class="field">
          <label for="principal-lead-department">Lead department</label>
          <select id="principal-lead-department">
            <option value="">Choose department</option>
            ${currentDepartments
              .map(
                (department) => `
                  <option
                    value="${escapeHtml(department.id)}"
                    ${department.id === (selectedItem.workItem.leadDepartmentId ?? selectedItem.workItem.departmentId ?? "") ? "selected" : ""}
                  >
                    ${escapeHtml(department.name)}
                  </option>
                `
              )
              .join("")}
          </select>
        </div>
        <div class="field">
          <label for="principal-coordinating-departments">Coordinating departments</label>
          <input
            id="principal-coordinating-departments"
            type="text"
            value="${escapeHtml(selectedItem.workItem.coordinatingDepartmentIds.join(", "))}"
            placeholder="dept_admin, dept_academic"
          />
        </div>
        <div class="field">
          <label for="principal-priority">Priority</label>
          <select id="principal-priority">
            ${renderAssignmentPriorityOptions(selectedItem.workItem.routingPriority ?? "normal")}
          </select>
        </div>
        <div class="form-row-2col">
          <div class="field">
            <label for="principal-output-type">Loại đầu ra (Output type)</label>
            <select id="principal-output-type">
              <option value="" ${!selectedItem.workItem.outputType ? "selected" : ""}>-- Chọn loại đầu ra --</option>
              <option value="report" ${selectedItem.workItem.outputType === "report" ? "selected" : ""}>Báo cáo (Report)</option>
              <option value="plan_document" ${selectedItem.workItem.outputType === "plan_document" ? "selected" : ""}>Văn bản kế hoạch (Plan document)</option>
              <option value="minutes" ${selectedItem.workItem.outputType === "minutes" ? "selected" : ""}>Biên bản (Minutes)</option>
              <option value="list" ${selectedItem.workItem.outputType === "list" ? "selected" : ""}>Danh sách (List)</option>
              <option value="proposal" ${selectedItem.workItem.outputType === "proposal" ? "selected" : ""}>Đề xuất (Proposal)</option>
              <option value="evidence_files" ${selectedItem.workItem.outputType === "evidence_files" ? "selected" : ""}>Hồ sơ minh chứng (Evidence files)</option>
              <option value="other" ${selectedItem.workItem.outputType === "other" ? "selected" : ""}>Khác (Other)</option>
            </select>
          </div>
          <div class="field">
            <label for="principal-deadline">Thời hạn (Deadline)</label>
            <input
              id="principal-deadline"
              type="datetime-local"
              value="${selectedItem.workItem.deadline ? new Date(selectedItem.workItem.deadline).toISOString().slice(0, 16) : ""}"
            />
          </div>
        </div>
        <div class="field">
          <label for="principal-output-requirement">Yêu cầu đầu ra (Output requirement)</label>
          <textarea id="principal-output-requirement" rows="2" placeholder="Mô tả chi tiết yêu cầu kết quả">${escapeHtml(
            selectedItem.workItem.outputRequirement ?? ""
          )}</textarea>
        </div>
        <div class="field">
          <label for="principal-note">Ghi chú chỉ đạo (Principal note)</label>
          <textarea id="principal-note" rows="2" placeholder="Chỉ đạo điều phối hoặc ghi chú tiếp nhận">${escapeHtml(
            selectedItem.workItem.principalNote ?? ""
          )}</textarea>
        </div>
      </div>
      <div class="auth-actions">
        <button id="save-principal-review-button" class="primary-button" type="button">
          Save Routing Decision
        </button>
        <button id="open-principal-review-work-item-button" class="secondary-button" type="button">
          Mở hồ sơ
        </button>
        ${
          selectedItem.workItem.status === "waiting_assignment"
            ? `
              <button id="go-to-assignment-queue-button" class="secondary-button" type="button">
                Open Assignment Step
              </button>
            `
            : ""
        }
      </div>
      <p class="workflow-inline-hint workflow-inline-hint-strong">
        Lưu ở đây chỉ xác nhận quyết định phân luồng của HT. Việc giao cho đơn vị vẫn cần thực hiện ở bước tiếp theo.
      </p>
    </article>
    ${buildPrincipalWorkflowHtml(selectedItem)}
  `;

  approvalsAssignmentList
    .querySelector<HTMLButtonElement>("#save-principal-review-button")
    ?.addEventListener("click", async () => {
      await handlePrincipalReview(selectedItem.workItem.id);
    });

  approvalsAssignmentList
    .querySelector<HTMLButtonElement>("#open-principal-review-work-item-button")
    ?.addEventListener("click", async () => {
      currentView = "work-items";
      renderCurrentView();
      await selectWorkItemById(selectedItem.workItem.id);
    });

  approvalsAssignmentList
    .querySelector<HTMLButtonElement>("#go-to-assignment-queue-button")
    ?.addEventListener("click", () => {
      approvalsAssignmentList
        .querySelector<HTMLElement>("#workflow-assignment-panel")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

  bindPrincipalWorkflowInteractions();
}

function buildPrincipalWorkflowHtml(selectedItem: WorkItemListItem | null): string {
  const waitingAssignmentItems = currentWorkItems.filter(
    (item) => item.workItem.status === "waiting_assignment"
  );
  const assignmentFocusItem =
    selectedItem?.workItem.status === "waiting_assignment"
      ? selectedItem
      : waitingAssignmentItems[0] ?? null;
  const assignmentFocusRecord =
    assignmentFocusItem == null
      ? null
      : currentAssignments.find(
          (assignment) => assignment.workItemId === assignmentFocusItem.workItem.id
        ) ?? null;
  const assignmentFocusLeadDepartment =
    assignmentFocusItem?.workItem.leadDepartmentId ??
    assignmentFocusItem?.workItem.departmentId ??
    "not chosen";
  const handoffAttentionTitle = assignmentFocusItem
    ? assignmentFocusRecord
      ? "Đã giao việc cho đơn vị"
      : "Sẵn sàng giao việc cho hồ sơ này"
    : waitingAssignmentItems.length > 0
      ? "Chọn hồ sơ và tạo phiếu giao việc"
      : "Không có hồ sơ nào chờ giao việc";
  const handoffAttentionCopy = assignmentFocusItem
    ? assignmentFocusRecord
      ? "Quyết định phân luồng đã được lưu. Mở nhiệm vụ đơn vị để theo dõi tiếp nhận và thực hiện."
      : `Phân luồng hoàn tất. Bước tiếp theo: tạo phiếu giao cho ${assignmentFocusLeadDepartment}.`
    : waitingAssignmentItems.length > 0
      ? "Chọn hồ sơ đã phân luồng từ hàng chờ bên trái, xem tóm tắt rồi giao việc cho đơn vị."
      : "Sau khi HT phân luồng với quyết định 'Chuẩn bị giao việc', hồ sơ sẽ xuất hiện ở đây.";

  const waitingAssignmentHtml =
    waitingAssignmentItems.length > 0
      ? waitingAssignmentItems
          .map(
            (item) => `
              <button
                class="queue-item-button queue-item-button-compact"
                type="button"
                data-workflow-assignment-work-item-id="${escapeHtml(item.workItem.id)}"
              >
                <span class="queue-item-copy">
                  <strong>${escapeHtml(item.workItem.title)}</strong>
                  <span>${escapeHtml(getNextWorkItemAction(item.workItem.status))}</span>
                </span>
                <span class="queue-item-meta">
                  <span class="status-badge status-${escapeHtml(item.workItem.status)}">
                    ${escapeHtml(item.workItem.routingPriority ?? "normal")}
                  </span>
                </span>
              </button>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            No work items are waiting for formal assignment.
          </div>
        `;

  const assignmentFocusHtml = assignmentFocusItem
    ? `
        <article class="admin-item handoff-focus-card">
          <div class="handoff-focus-header">
            <div>
              <strong>${escapeHtml(assignmentFocusItem.workItem.title)}</strong>
              <p class="workflow-inline-hint">
                ${escapeHtml(getNextWorkItemAction(assignmentFocusItem.workItem.status))}
              </p>
            </div>
            <span class="status-badge status-${escapeHtml(assignmentFocusItem.workItem.status)}">
              ${escapeHtml(assignmentFocusItem.workItem.status)}
            </span>
          </div>
          <div class="handoff-focus-grid">
            <p><strong>Lead department:</strong> ${escapeHtml(assignmentFocusLeadDepartment)}</p>
            <p><strong>Priority:</strong> ${escapeHtml(
              assignmentFocusItem.workItem.routingPriority ?? "normal"
            )}</p>
            <p><strong>Output requirement:</strong> ${escapeHtml(
              assignmentFocusItem.workItem.outputRequirement ?? "not specified"
            )}</p>
            <p><strong>Current assignment:</strong> ${escapeHtml(
              assignmentFocusRecord?.mainDepartmentId ?? "not created yet"
            )}</p>
          </div>
          <div class="auth-actions compact-action-bar">
            <button
              class="primary-button"
              type="button"
              data-workflow-open-record-id="${escapeHtml(assignmentFocusItem.workItem.id)}"
            >
              Open Record Workspace
            </button>
            ${
              assignmentFocusRecord
                ? `
                    <button
                      class="secondary-button"
                      type="button"
                      data-workflow-open-task-id="${escapeHtml(assignmentFocusRecord.taskId)}"
                    >
                      Open Department Task
                    </button>
                  `
                : `
                    <span class="workflow-mini-note">
                      Dispatch the assignment in this workspace to create the department task.
                    </span>
                  `
            }
          </div>
        </article>
      `
    : `
        <div class="empty-state">
          Chọn hồ sơ đã phân luồng để chuẩn bị hoặc xem lại phiếu giao việc.
        </div>
      `;

  const assignmentLedgerHtml =
    currentAssignments.length > 0
      ? currentAssignments
          .slice(0, 6)
          .map(
            (assignment) => `
              <article class="admin-item">
                <div class="task-card-row">
                  <strong>${escapeHtml(assignment.workItemId)}</strong>
                  <span class="status-badge status-running">${escapeHtml(assignment.status)}</span>
                </div>
                <p><strong>Main Department:</strong> ${escapeHtml(assignment.mainDepartmentId)}</p>
                <p><strong>Deadline:</strong> ${escapeHtml(assignment.deadline ?? "—")}</p>
                <p><strong>Adjustment Reason:</strong> ${escapeHtml(
                  assignment.adjustmentReason ?? "none"
                )}</p>
                <div class="auth-actions">
                  <button
                    class="secondary-button"
                    type="button"
                    data-workflow-open-record-id="${escapeHtml(assignment.workItemId)}"
                  >
                    Open Record
                  </button>
                  <button
                    class="secondary-button"
                    type="button"
                    data-workflow-open-task-id="${escapeHtml(assignment.taskId)}"
                  >
                    Open Task
                  </button>
                </div>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            Chưa có phiếu giao việc nào được tạo.
          </div>
        `;

  return `
    <section id="workflow-assignment-panel" class="workflow-section">
      <div class="panel-header">
        <div>
          <p class="eyebrow">Giai đoạn 3</p>
          <h3>Giao việc cho đơn vị</h3>
        </div>
      </div>
      <p class="intro workflow-note">
        Sau khi HT lưu quyết định phân luồng, giao việc cho đơn vị tại đây và theo dõi việc tiếp nhận.
      </p>
      <article class="workflow-attention-card">
        <div>
          <p class="eyebrow">Bước tiếp theo</p>
          <h4>${escapeHtml(handoffAttentionTitle)}</h4>
          <p>${escapeHtml(handoffAttentionCopy)}</p>
        </div>
        ${
          assignmentFocusItem
            ? `
                <div class="workflow-attention-meta">
                  <span class="status-badge status-${escapeHtml(assignmentFocusItem.workItem.status)}">
                    ${escapeHtml(assignmentFocusItem.workItem.status)}
                  </span>
                  <span class="workflow-attention-tag">
                    Lead: ${escapeHtml(assignmentFocusLeadDepartment)}
                  </span>
                </div>
              `
            : ""
        }
      </article>
      <div class="workflow-columns">
        <div class="workflow-column">
          <div class="workflow-subhead">
            <p class="detail-label">Chờ giao việc</p>
            <span class="workflow-count-chip">${waitingAssignmentItems.length}</span>
          </div>
          <div class="work-item-queue">${waitingAssignmentHtml}</div>
        </div>
        <div class="workflow-column">
          <p class="detail-label">Hồ sơ đang được chọn giao</p>
          <div class="admin-list">${assignmentFocusHtml}</div>
        </div>
      </div>
      <div class="workflow-ledger">
        <div class="workflow-subhead">
          <p class="detail-label">Phiếu giao gần đây</p>
          <span class="workflow-mini-note">Phiếu giao mới nhất và trạng thái tiếp nhận</span>
        </div>
        <div class="admin-list">${assignmentLedgerHtml}</div>
      </div>
    </section>
  `;
}

function bindPrincipalWorkflowInteractions(): void {
  approvalsAssignmentList
    .querySelectorAll<HTMLButtonElement>("[data-workflow-assignment-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await selectWorkItemById(button.dataset.workflowAssignmentWorkItemId ?? null);
        renderPrincipalReviewWorkspace();
      });
    });

  approvalsAssignmentList
    .querySelectorAll<HTMLButtonElement>("[data-workflow-open-record-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        currentView = "work-items";
        renderCurrentView();
        await selectWorkItemById(button.dataset.workflowOpenRecordId ?? null);
      });
    });

  approvalsAssignmentList
    .querySelectorAll<HTMLButtonElement>("[data-workflow-open-task-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        currentView = "department-tasks";
        renderCurrentView();
        void focusTaskById(button.dataset.workflowOpenTaskId ?? null);
      });
    });
}

function renderOverview(): void {
  const now = Date.now();
  const documentCount = currentDocuments.length;
  const activeDepartmentTasks = currentTaskItems.filter(
    (item) =>
      item.task.taskType === "school_workflow" &&
      item.task.status !== "completed"
  );
  const queueCount = activeDepartmentTasks.length;
  const waitingCount = currentWorkItems.filter(
    (item) => item.workItem.status === "waiting_review"
  ).length;
  const newCount = currentWorkItems.filter((item) => item.workItem.status === "draft").length;
  const assignedCount = currentWorkItems.filter(
    (item) =>
      item.workItem.status === "assigned" ||
      item.workItem.status === "waiting_assignment"
  ).length;
  const inProgressCount = currentTaskItems.filter(
    (item) => item.task.status === "running"
  ).length;
  const waitingApprovalCount = currentWorkItems.filter(
    (item) => item.workItem.status === "waiting_principal_approval"
  ).length;
  const overdueWorkItems = currentWorkItems.filter((item) => {
    if (!item.workItem.deadline) return false;
    if (!ACTIVE_WORK_ITEM_STATUSES.has(item.workItem.status)) return false;
    return new Date(item.workItem.deadline).getTime() < now;
  }).length;
  const completedCount = currentWorkItems.filter(
    (item) => item.workItem.status === "completed" || item.workItem.status === "archived"
  ).length;

  overviewCards.innerHTML = [
    { label: "G1 – Chờ tiếp nhận", value: String(documentCount), alert: false },
    { label: "G2 – Chờ HT xem xét", value: String(waitingCount), alert: waitingCount > 0 },
    { label: "G3 – Chờ giao việc", value: String(assignedCount), alert: false },
    { label: "G4 – Đang thực hiện", value: String(inProgressCount), alert: false },
    { label: "G5 – Quá hạn", value: String(overdueWorkItems), alert: overdueWorkItems > 0 },
    { label: "G8 – Chờ HT duyệt", value: String(waitingApprovalCount), alert: waitingApprovalCount > 0 },
    { label: "Đang xử lý tổng", value: String(queueCount), alert: false },
    { label: "Hoàn thành / Lưu trữ", value: String(completedCount), alert: false }
  ]
    .map(
      (card) => `
        <article class="${card.alert ? "metric-card-alert" : "metric-card"}">
          <p class="metric-label">${escapeHtml(card.label)}</p>
          <strong class="metric-value">${escapeHtml(card.value)}</strong>
        </article>
      `
    )
    .join("");

  const actionableNotifications = currentNotifications.filter((notification) => {
    const linkedWorkItem = notification.workItemId
      ? currentWorkItems.find((item) => item.workItem.id === notification.workItemId) ?? null
      : null;
    const linkedAssignment = notification.assignmentId
      ? currentAssignments.find((assignment) => assignment.id === notification.assignmentId) ?? null
      : null;
    const linkedTask = linkedAssignment
      ? currentTaskItems.find((item) => item.task.id === linkedAssignment.taskId) ?? null
      : null;

    if (linkedWorkItem?.workItem.status === "completed" || linkedWorkItem?.workItem.status === "archived") {
      return false;
    }

    if (linkedTask?.task.status === "completed") {
      return false;
    }

    return true;
  });

  // Overdue work items from work item deadline field
  const overdueWorkItemList = currentWorkItems.filter((item) => {
    if (!item.workItem.deadline) return false;
    if (!ACTIVE_WORK_ITEM_STATUSES.has(item.workItem.status)) return false;
    return new Date(item.workItem.deadline).getTime() < now;
  });

  const needsAttentionItems: Array<{
    label: string;
    view: typeof currentView;
    workItemId?: string;
    taskId?: string;
  }> = [
    ...(documentCount > 0
      ? [
          {
            label: `📥 ${documentCount} văn bản chờ tiếp nhận và tạo hồ sơ.`,
            view: "documents" as const
          }
        ]
      : []),
    ...(waitingCount > 0
      ? [
          {
            label: `⚖️ ${waitingCount} hồ sơ chờ HT xem xét và phân luồng.`,
            view: "approvals" as const
          }
        ]
      : []),
    ...overdueWorkItemList.slice(0, 3).map((item) => ({
      label: `⚠ QUÁ HẠN: ${item.workItem.title} – hạn ${new Date(item.workItem.deadline!).toLocaleDateString("vi-VN")}`,
      view: "work-items" as const,
      workItemId: item.workItem.id
    })),
    ...(waitingApprovalCount > 0
      ? [
          {
            label: `✅ ${waitingApprovalCount} hồ sơ chờ HT phê duyệt kết quả.`,
            view: "department-tasks" as const
          }
        ]
      : []),
    ...(queueCount > 0
      ? [
          {
            label: `🏃 ${queueCount} nhiệm vụ đang được thực hiện tại các đơn vị.`,
            view: "department-tasks" as const
          }
        ]
      : []),
    ...actionableNotifications.slice(0, 3).map((notification) => {
      const linkedAssignment = notification.assignmentId
        ? currentAssignments.find((assignment) => assignment.id === notification.assignmentId) ?? null
        : null;

      return {
        label: notification.message,
        view: notification.workItemId || linkedAssignment ? ("approvals" as const) : ("overview" as const),
        workItemId: notification.workItemId ?? linkedAssignment?.workItemId,
        taskId: linkedAssignment?.taskId
      };
    })
  ];

  needsAttentionPanel.innerHTML =
    needsAttentionItems.length > 0
      ? needsAttentionItems
          .map((item) => {
            const dataWorkItemId = item.workItemId
              ? ` data-attention-work-item-id="${escapeHtml(item.workItemId)}"`
              : "";
            const dataTaskId = item.taskId
              ? ` data-attention-task-id="${escapeHtml(item.taskId)}"`
              : "";

            return `
              <button
                class="admin-item attention-item-button"
                type="button"
                data-attention-view="${escapeHtml(item.view)}"${dataWorkItemId}${dataTaskId}
              >
                <p class="detail-value">${escapeHtml(item.label)}</p>
              </button>
            `;
          })
          .join("")
      : `
          <div class="empty-state">
            Không có vấn đề cấp bách nào được phát hiện.
          </div>
        `;

  needsAttentionPanel
    .querySelectorAll<HTMLButtonElement>("[data-attention-view]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        void openAttentionTarget(
          button.dataset.attentionView as typeof currentView | undefined,
          button.dataset.attentionWorkItemId ?? null,
          button.dataset.attentionTaskId ?? null
        );
      });
    });

  const recentActivityEntries: Array<{ icon: string; label: string; time: string }> = [
    ...currentNotifications.slice(0, 2).map((n) => ({
      icon: "🔔",
      label: n.message,
      time: formatDate(n.createdAt)
    })),
    ...currentDocuments.slice(0, 2).map((d) => ({
      icon: "📄",
      label: `Văn bản: ${d.document.filename}`,
      time: formatDate(d.document.createdAt)
    })),
    ...currentWorkItems
      .filter((item) => ACTIVE_WORK_ITEM_STATUSES.has(item.workItem.status))
      .slice(0, 3)
      .map((item) => ({
        icon: "📂",
        label: `${item.workItem.title} — ${getWorkItemStatusLabel(item.workItem.status)}`,
        time: formatDate(item.workItem.updatedAt)
      })),
    ...currentTaskItems
      .filter((item) => item.task.taskType === "school_workflow")
      .slice(0, 2)
      .map((item) => ({
        icon: "🏃",
        label: `${item.task.title} — ${getTaskStatusLabel(item.task.status)}`,
        time: formatDate(item.task.createdAt)
      }))
  ].slice(0, 6);

  recentActivityPanel.innerHTML =
    recentActivityEntries.length > 0
      ? recentActivityEntries
          .map(
            (entry) => `
              <article class="admin-item">
                <div class="task-card-row">
                  <p class="detail-value">${entry.icon} ${escapeHtml(entry.label)}</p>
                  <span class="result-meta">${escapeHtml(entry.time)}</span>
                </div>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            Hoạt động gần đây sẽ xuất hiện ở đây khi dữ liệu thay đổi.
          </div>
        `;

  const departmentSummary = currentDepartments.map((department) => {
    const documentCountForDepartment = currentDocuments.filter((item) => {
      const sourceDepartment =
        typeof item.document.metadata?.departmentId === "string"
          ? item.document.metadata.departmentId
          : null;
      return sourceDepartment === department.id;
    }).length;
    const workItemCount = currentWorkItems.filter(
      (item) => item.workItem.departmentId === department.id
    ).length;
    const assignmentCount = currentAssignments.filter(
      (assignment) => assignment.mainDepartmentId === department.id
    ).length;

    return {
      name: department.name,
      documentCount: documentCountForDepartment,
      workItemCount,
      assignmentCount
    };
  });

  byDepartmentPanel.innerHTML =
    departmentSummary.length > 0
      ? departmentSummary
          .map(
            (item) => `
              <article class="admin-item">
                <div class="task-card-row">
                  <strong>${escapeHtml(item.name)}</strong>
                  <span class="status-badge">${escapeHtml(String(item.assignmentCount))} giao việc</span>
                </div>
                <p style="font-size:13px;color:#57606a">Văn bản: ${escapeHtml(String(item.documentCount))} &nbsp;|&nbsp; Hồ sơ: ${escapeHtml(String(item.workItemCount))}</p>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            Chưa có đơn vị nào được cấu hình.
          </div>
        `;
}

async function openAttentionTarget(
  nextView: typeof currentView | undefined,
  workItemId: string | null,
  taskId: string | null
): Promise<void> {
  if (!nextView) {
    return;
  }

  currentView = nextView === "assignments" ? "approvals" : nextView;
  renderCurrentView();

  if (workItemId) {
    if (currentView === "approvals" || currentView === "work-items") {
      await selectWorkItemById(workItemId);
      if (currentView === "approvals") {
        renderPrincipalReviewWorkspace();
      }
      return;
    }
  }

  if (taskId) {
    currentView = "department-tasks";
    renderCurrentView();
    await focusTaskById(taskId);
  }
}

function renderReports(): void {
  const completedTasks = currentTaskItems.filter(
    (item) => item.task.status === "completed"
  ).length;
  const inProgressTasks = currentTaskItems.filter(
    (item) => item.task.status === "running"
  ).length;
  const pendingTasks = currentTaskItems.filter(
    (item) => item.task.status === "pending"
  ).length;
  const waitingReviewItems = currentWorkItems.filter(
    (item) => item.workItem.status === "waiting_review"
  ).length;
  const waitingApprovalItems = currentWorkItems.filter(
    (item) => item.workItem.status === "waiting_principal_approval"
  ).length;
  const overdueAssignments = currentAssignments.filter(
    (a) => a.status === "overdue"
  ).length;

  reportCards.innerHTML = [
    { label: "Hoàn thành", value: String(completedTasks) },
    { label: "Đang thực hiện", value: String(inProgressTasks) },
    { label: "Chờ tiếp nhận", value: String(pendingTasks) },
    { label: "Chờ HT xem", value: String(waitingReviewItems) },
    { label: "Chờ HT phê duyệt", value: String(waitingApprovalItems) },
    { label: "Quá hạn", value: String(overdueAssignments) }
  ]
    .map(
      (card) => `
        <article class="metric-card ${card.label === "Quá hạn" && Number(card.value) > 0 ? "metric-card-alert" : ""}">
          <p class="detail-label">${escapeHtml(card.label)}</p>
          <strong class="metric-value">${escapeHtml(card.value)}</strong>
        </article>
      `
    )
    .join("");
}

async function loadAndRenderDailyReport(): Promise<void> {
  try {
    const response = await fetch("/api/agent/daily-report", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể tải báo cáo ngày"));
    }

    const data = (await response.json()) as { report: {
      date: string;
      totalWorkItems: number;
      byStatus: Record<string, number>;
      overdueAssignments: number;
      pendingReview: number;
      completedToday: number;
      byDepartment: Array<{ departmentName: string; total: number; overdue: number; completed: number }>;
      needsAttention: Array<{ workItemId: string; title: string; reason: string; deadline?: string }>;
    }};
    const report = data.report;
    const reportAttentionList = document.querySelector<HTMLDivElement>("#report-attention-list");
    const reportDeptTable = document.querySelector<HTMLDivElement>("#report-department-table");

    reportCards.innerHTML = [
      { label: "Tổng hồ sơ", value: String(report.totalWorkItems) },
      { label: "Hoàn thành hôm nay", value: String(report.completedToday) },
      { label: "Chờ xét duyệt", value: String(report.pendingReview) },
      { label: "Quá hạn", value: String(report.overdueAssignments) }
    ]
      .map(
        (card) => `
          <article class="metric-card ${card.label === "Quá hạn" && Number(card.value) > 0 ? "metric-card-alert" : ""}">
            <p class="detail-label">${escapeHtml(card.label)}</p>
            <strong class="metric-value">${escapeHtml(card.value)}</strong>
          </article>
        `
      )
      .join("");

    if (reportAttentionList && report.needsAttention.length > 0) {
      reportAttentionList.innerHTML = `
        <h4 style="margin:0 0 8px">⚠️ Cần xử lý ngay</h4>
        ${report.needsAttention.map((item) => `
          <article class="admin-item">
            <div class="admin-item-row">
              <strong>${escapeHtml(item.title)}</strong>
              <span class="status-badge status-alert">${escapeHtml(item.reason)}</span>
            </div>
            ${item.deadline ? `<p class="detail-label">Deadline: ${escapeHtml(new Date(item.deadline).toLocaleDateString("vi-VN"))}</p>` : ""}
          </article>
        `).join("")}
      `;
    } else if (reportAttentionList) {
      reportAttentionList.innerHTML = '<p class="empty-state">Không có mục nào cần xử lý khẩn cấp.</p>';
    }

    if (reportDeptTable && report.byDepartment.length > 0) {
      reportDeptTable.innerHTML = `
        <h4 style="margin:0 0 8px">📊 Theo đơn vị</h4>
        <table class="report-table">
          <thead>
            <tr><th>Đơn vị</th><th>Tổng</th><th>Quá hạn</th><th>Hoàn thành</th></tr>
          </thead>
          <tbody>
            ${report.byDepartment.map((row) => `
              <tr>
                <td>${escapeHtml(row.departmentName)}</td>
                <td>${row.total}</td>
                <td style="color:${row.overdue > 0 ? "#cf222e" : "inherit"}">${row.overdue}</td>
                <td style="color:#1a7f37">${row.completed}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    setStatus("Báo cáo ngày đã được tải.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi tải báo cáo ngày.",
      "error"
    );
  }
}

async function loadAndRenderWeeklyReport(): Promise<void> {
  try {
    const response = await fetch("/api/agent/weekly-report", {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể tải báo cáo tuần"));
    }

    const data = (await response.json()) as { report: {
      completionRate: number;
      topPerformingDepartments: string[];
      bottlenecks: Array<{ workItemId: string; title: string; stalledDays: number }>;
      weekStart: string;
      weekEnd: string;
      totalWorkItems: number;
      overdueAssignments: number;
      completedToday: number;
      byDepartment: Array<{ departmentName: string; total: number; overdue: number; completed: number }>;
      needsAttention: Array<{ workItemId: string; title: string; reason: string; deadline?: string }>;
    }};
    const report = data.report;
    const reportAttentionList = document.querySelector<HTMLDivElement>("#report-attention-list");
    const reportDeptTable = document.querySelector<HTMLDivElement>("#report-department-table");

    reportCards.innerHTML = [
      { label: "Tổng phát sinh", value: String(report.totalWorkItems) },
      { label: "Tỉ lệ hoàn thành", value: `${report.completionRate}%` },
      { label: "Quá hạn", value: String(report.overdueAssignments) }
    ]
      .map(
        (card) => `
          <article class="metric-card">
            <p class="detail-label">${escapeHtml(card.label)}</p>
            <strong class="metric-value">${escapeHtml(card.value)}</strong>
          </article>
        `
      )
      .join("");

    if (reportAttentionList) {
      reportAttentionList.innerHTML = `
        ${report.topPerformingDepartments.length > 0 ? `
          <h4 style="margin:0 0 8px">🏆 Đơn vị thực hiện tốt</h4>
          <p>${report.topPerformingDepartments.map(escapeHtml).join(", ")}</p>
        ` : ""}
        ${report.bottlenecks.length > 0 ? `
          <h4 style="margin:8px 0 8px">🚧 Ách tắc (không cập nhật > 3 ngày)</h4>
          ${report.bottlenecks.map((item) => `
            <article class="admin-item">
              <strong>${escapeHtml(item.title)}</strong>
              <span class="detail-label"> — ${item.stalledDays} ngày chưa cập nhật</span>
            </article>
          `).join("")}
        ` : '<p class="empty-state">Không phát hiện ách tắc trong tuần này.</p>'}
      `;
    }

    if (reportDeptTable && report.byDepartment.length > 0) {
      reportDeptTable.innerHTML = `
        <h4 style="margin:0 0 8px">📊 Theo đơn vị (tuần)</h4>
        <table class="report-table">
          <thead>
            <tr><th>Đơn vị</th><th>Tổng</th><th>Quá hạn</th><th>Hoàn thành</th></tr>
          </thead>
          <tbody>
            ${report.byDepartment.map((row) => `
              <tr>
                <td>${escapeHtml(row.departmentName)}</td>
                <td>${row.total}</td>
                <td style="color:${row.overdue > 0 ? "#cf222e" : "inherit"}">${row.overdue}</td>
                <td style="color:#1a7f37">${row.completed}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      `;
    }

    setStatus("Báo cáo tuần đã được tải.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi tải báo cáo tuần.",
      "error"
    );
  }

}

async function handleRunDeadlineReminders(): Promise<void> {
  try {
    setStatus("Đang chạy kiểm tra deadline...", "loading");
    const response = await fetch("/api/agent/deadline-reminders", {
      method: "POST",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể chạy deadline reminders"));
    }

    const data = (await response.json()) as { result: { checked: number; remindersCreated: number; overdue: number } };
    setStatus(
      `Đã kiểm tra ${data.result.checked} nhiệm vụ. Gửi ${data.result.remindersCreated} nhắc việc. Quá hạn: ${data.result.overdue}.`,
      "success"
    );
    await loadNotifications();
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi chạy deadline check.",
      "error"
    );
  }
}

function syncSelectedWorkItem(): void {
  if (!selectedWorkItemId) {
    hideWorkItemDetail();
    return;
  }

  const selected = currentWorkItems.find(
    (item) => item.workItem.id === selectedWorkItemId
  );

  if (!selected) {
    selectedWorkItemId = null;
    hideWorkItemDetail();
    return;
  }

  renderWorkItemDetail(selected);
}

async function selectWorkItemById(workItemId: string | null): Promise<void> {
  selectedWorkItemId = selectedWorkItemId === workItemId ? null : workItemId;

  if (!selectedWorkItemId) {
    hideWorkItemDetail();
    renderWorkItemList(currentWorkItems);
    return;
  }

  try {
    const response = await fetch(`/api/work-items/${encodeURIComponent(selectedWorkItemId)}`, {
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load the work item")
      );
    }

    const detail = (await response.json()) as WorkItemDetailResponse;
    currentWorkItemAssignments = await loadAssignmentsForWorkItem(detail.workItem.id);
    const index = currentWorkItems.findIndex(
      (item) => item.workItem.id === detail.workItem.id
    );

    if (index >= 0) {
      currentWorkItems[index] = detail;
    } else {
      currentWorkItems.unshift(detail);
    }

    renderWorkItemList(currentWorkItems);
    renderAssignmentWorkspace();
    renderPrincipalReviewWorkspace();
    renderWorkItemDetail(detail);
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading the work item.",
      "error"
    );
  }
}

async function openWorkItemWithTab(
  workItemId: string | null,
  tabName: string
): Promise<void> {
  if (!workItemId) {
    return;
  }

  currentView = "work-items";
  renderCurrentView();

  if (selectedWorkItemId === workItemId) {
    selectedWorkItemId = null;
  }

  await selectWorkItemById(workItemId);
  setActiveWorkItemDetailTab(tabName);
}

function renderWorkItemDetail(item: WorkItemListItem): void {
  const currentAssignment = currentWorkItemAssignments[0] ?? null;
  const linkedDocument =
    currentDocuments.find(
      (documentItem) => documentItem.document.createdWorkItemId === item.workItem.id
    ) ?? null;
  workItemDetail.classList.add("hidden");
  workItemDetailTitle.textContent = item.workItem.title;
  workItemDetailMeta.textContent = [
    `Status: ${item.workItem.status}`,
    `Created: ${formatDate(item.workItem.createdAt)}`,
    `Updated: ${formatDate(item.workItem.updatedAt)}`
  ].join(" | ");
  workItemModalTitle.textContent = item.workItem.title;
  workItemModalMeta.textContent = workItemDetailMeta.textContent;
  workItemModalBody.innerHTML = `
    <div class="detail-tabs">
      <button class="tab-button is-active" type="button" data-detail-tab="info">Info</button>
      <button class="tab-button" type="button" data-detail-tab="files">Files</button>
      <button class="tab-button" type="button" data-detail-tab="analysis">AI Analysis</button>
      <button class="tab-button" type="button" data-detail-tab="assignment">Assignment</button>
      <button class="tab-button" type="button" data-detail-tab="history">History</button>
    </div>
    <div class="task-actions compact-action-bar">
      <label class="field work-item-status-field">
        <span>Status</span>
        <select id="work-item-status-select">
          ${renderWorkItemStatusOptions(item.workItem.status)}
        </select>
      </label>
      <button
        id="save-work-item-button"
        class="secondary-button"
        type="button"
      >
        Save
      </button>
      <button
        id="trigger-work-item-file-input"
        class="secondary-button"
        type="button"
      >
        Upload
      </button>
      <input id="work-item-file-input" class="visually-hidden-file-input" type="file" multiple />
      <button
        id="analyze-work-item-button"
        class="secondary-button"
        type="button"
      >
        Analyze
      </button>
      ${
        !currentAssignment
          ? `
            <button
              id="delete-work-item-button"
              class="secondary-button danger-button"
              type="button"
            >
              Xóa
            </button>
          `
          : ""
      }
      ${
        item.workItem.status === "completed" && isAdminLikeSession()
          ? `
            <button
              id="archive-work-item-button"
              class="secondary-button"
              type="button"
              data-archive-work-item-id="${escapeHtml(item.workItem.id)}"
            >
              Lưu trữ (Giai đoạn 9)
            </button>
          `
          : ""
      }
    </div>
    <section class="tab-panel" data-detail-panel="info">
      <div class="task-detail-grid">
        <div>
          <p class="detail-label">Mô tả</p>
          <p class="detail-value">${escapeHtml(item.workItem.description)}</p>
        </div>
        <div>
          <p class="detail-label">Đơn vị</p>
          <p class="detail-value">${escapeHtml(item.workItem.departmentId ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Người tạo</p>
          <p class="detail-value">${escapeHtml(item.workItem.createdByUserId)}</p>
        </div>
        <div>
          <p class="detail-label">Giao cho</p>
          <p class="detail-value">${escapeHtml(item.workItem.assignedToUserId ?? "Chưa phân công")}</p>
        </div>
        <div>
          <p class="detail-label">Trạng thái giao việc</p>
          <p class="detail-value">${escapeHtml(
            currentAssignment ? `Đã giao (${currentAssignment.priority})` : "Chưa giao việc"
          )}</p>
        </div>
        <div>
          <p class="detail-label">Đơn vị chủ trì</p>
          <p class="detail-value">${escapeHtml(item.workItem.leadDepartmentId ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Độ ưu tiên</p>
          <p class="detail-value">${escapeHtml(item.workItem.routingPriority ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Mã hồ sơ (Intake Code)</p>
          <p class="detail-value">${escapeHtml(item.workItem.intakeCode ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Nguồn vào (Source Type)</p>
          <p class="detail-value">${escapeHtml(item.workItem.sourceType ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Loại đầu ra (Output Type)</p>
          <p class="detail-value">${escapeHtml(item.workItem.outputType ?? "—")}</p>
        </div>
        <div>
          <p class="detail-label">Thời hạn (Deadline)</p>
          <p class="detail-value">${
            item.workItem.deadline
              ? new Date(item.workItem.deadline).toLocaleString("vi-VN")
              : "—"
          }</p>
        </div>
        <div>
          <p class="detail-label">Văn bản nguồn</p>
          <div class="detail-value">
            <p>${escapeHtml(linkedDocument?.document.filename ?? "—")}</p>
            ${
              linkedDocument?.document.hasFileContent
                ? `
                  <div class="auth-actions">
                    <button
                      class="secondary-button task-action-button"
                      type="button"
                      data-open-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                    >
                      Mở văn bản nguồn
                    </button>
                    <button
                      class="secondary-button task-action-button"
                      type="button"
                      data-download-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                      data-download-linked-document-filename="${escapeHtml(linkedDocument.document.filename)}"
                    >
                      Tải văn bản nguồn
                    </button>
                  </div>
                `
                : ""
            }
          </div>
        </div>
      </div>
    </section>
    <section class="tab-panel hidden" data-detail-panel="assignment">
      <div class="task-output">
        <p class="detail-label">Phiếu giao hiện tại</p>
        <div class="detail-value">
          ${
            currentAssignment
              ? [
                  `Đơn vị chủ trì: ${escapeHtml(currentAssignment.mainDepartmentId)}`,
                  `Thời hạn: ${escapeHtml(currentAssignment.deadline ?? "—")}`,
                  `Độ ưu tiên: ${escapeHtml(currentAssignment.priority)}`,
                  `Yêu cầu đầu ra: ${escapeHtml(currentAssignment.outputRequirement ?? "—")}`,
                  `Ghi chú: ${escapeHtml(currentAssignment.note ?? "—")}`,
                  `Mã nhiệm vụ: ${escapeHtml(currentAssignment.taskId)}`
                ]
                  .map((line) => `<p>${line}</p>`)
                  .join("")
              : "<p>Chưa có phiếu giao việc nào cho hồ sơ này.</p>"
          }
        </div>
        ${
          currentAssignment
            ? `
              <div class="auth-actions">
                <button
                  id="open-linked-task-button"
                  class="secondary-button"
                  type="button"
                >
                  Mở nhiệm vụ liên kết
                </button>
                ${
                  isAdminLikeSession() &&
                  (item.workItem.status === "waiting_principal_approval" ||
                    item.workItem.status === "in_review")
                    ? `
                      <button
                        id="approve-response-button"
                        class="primary-button"
                        type="button"
                      >
                        Phê duyệt kết quả
                      </button>
                    `
                    : ""
                }
                ${
                  isAdminLikeSession()
                    ? `
                      <button
                        id="cancel-assignment-button"
                        class="secondary-button danger-button"
                        type="button"
                      >
                        Hủy giao việc
                      </button>
                      <span class="workflow-mini-note">
                        Chỉ dùng khi phiếu giao được tạo nhầm và đơn vị chưa bắt đầu thực hiện.
                      </span>
                    `
                    : ""
                }
              </div>
            `
            : ""
        }
      </div>
    </section>
    <section class="tab-panel hidden" data-detail-panel="files">
      <div class="task-output">
        <p class="detail-label">Files</p>
        <div class="work-item-files">
          ${
            linkedDocument
              ? `
                <div class="work-item-file-chip source-file-chip">
                  Source: ${escapeHtml(linkedDocument.document.filename)}
                  ${
                    linkedDocument.document.hasFileContent
                      ? `
                        <button
                          class="secondary-button task-action-button"
                          type="button"
                          data-download-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                          data-download-linked-document-filename="${escapeHtml(linkedDocument.document.filename)}"
                        >
                          Download
                        </button>
                      `
                      : ""
                  }
                </div>
              `
              : ""
          }
          ${
            item.files.length > 0
              ? item.files
                  .map(
                    (file) => `
                      <div class="work-item-file-chip">
                        ${escapeHtml(file.filename)}
                        ${
                          file.hasFileContent
                            ? `
                              <button
                                class="secondary-button task-action-button"
                                type="button"
                                data-download-work-item-file-id="${escapeHtml(file.id)}"
                                data-download-work-item-id="${escapeHtml(file.workItemId)}"
                                data-download-work-item-filename="${escapeHtml(file.filename)}"
                              >
                                Download
                              </button>
                            `
                            : ""
                        }
                      </div>
                    `
                  )
                  .join("")
              : linkedDocument
                ? '<p class="detail-value">No separate response files uploaded yet. The source document above is the current working attachment.</p>'
                : '<p class="detail-value">No files uploaded yet.</p>'
          }
        </div>
      </div>
    </section>
    <section class="tab-panel hidden" data-detail-panel="analysis">
      <div class="task-output">
        <p class="detail-label">Latest AI Analysis</p>
        <pre class="task-output-text">${escapeHtml(
          item.latestAnalysis?.rawOutput ?? "No analysis saved yet."
        )}</pre>
      </div>
    </section>
    <section class="tab-panel hidden" data-detail-panel="history">
      <div class="task-output">
        <p class="detail-label">History</p>
        <div class="detail-value">
          <p>Created: ${escapeHtml(formatDate(item.workItem.createdAt))}</p>
          <p>Updated: ${escapeHtml(formatDate(item.workItem.updatedAt))}</p>
          <p>Status: ${escapeHtml(item.workItem.status)}</p>
          <p>Files: ${escapeHtml(String(item.files.length))}</p>
          <p>Analyses: ${escapeHtml(item.latestAnalysis ? "1 latest result" : "0")}</p>
        </div>
      </div>
    </section>
    ${
      currentSessionUser?.role === "principal"
        ? `
          <div class="task-output assignment-form-card">
            <p class="detail-label">Luồng giao việc HT</p>
            <div class="admin-item-grid">
              <div class="field">
                <label for="assignment-main-department">Main department</label>
                <select id="assignment-main-department">
                  <option value="">Choose department</option>
                  ${currentDepartments
                    .map(
                      (department) => `
                        <option value="${escapeHtml(department.id)}">
                          ${escapeHtml(department.name)}
                        </option>
                      `
                    )
                    .join("")}
                </select>
              </div>
              <div class="field">
                <label for="assignment-coordinating-departments">Coordinating departments</label>
                <input
                  id="assignment-coordinating-departments"
                  type="text"
                  value="${escapeHtml(item.workItem.coordinatingDepartmentIds.join(", "))}"
                  placeholder="dept_admin, dept_academic"
                />
              </div>
              <div class="field">
                <label for="assignment-deadline">Deadline</label>
                <input id="assignment-deadline" type="datetime-local" />
              </div>
              <div class="field">
                <label for="assignment-priority">Priority</label>
                <select id="assignment-priority">
                  ${renderAssignmentPriorityOptions(item.workItem.routingPriority ?? "normal")}
                </select>
              </div>
              <div class="field">
                <label for="assignment-output-requirement">Output requirement</label>
                <textarea id="assignment-output-requirement" rows="2" placeholder="Expected report or deliverable">${escapeHtml(
                  item.workItem.outputRequirement ?? ""
                )}</textarea>
              </div>
              <div class="field">
                <label for="assignment-note">Note</label>
                <textarea id="assignment-note" rows="2" placeholder="Assignment note">${escapeHtml(
                  item.workItem.principalNote ?? ""
                )}</textarea>
              </div>
              <div class="auth-actions">
                <button id="assign-work-item-button" class="secondary-button" type="button">
                  Giao việc
                </button>
              </div>
            </div>
          </div>
        `
        : ""
    }
  `;

  const saveButton =
    workItemModalBody.querySelector<HTMLButtonElement>("#save-work-item-button");
  const analyzeButton =
    workItemModalBody.querySelector<HTMLButtonElement>("#analyze-work-item-button");
  const fileTriggerButton =
    workItemModalBody.querySelector<HTMLButtonElement>("#trigger-work-item-file-input");
  const fileInput =
    workItemModalBody.querySelector<HTMLInputElement>("#work-item-file-input");
  const assignButton =
    workItemModalBody.querySelector<HTMLButtonElement>("#assign-work-item-button");
  const deleteButton =
    workItemModalBody.querySelector<HTMLButtonElement>("#delete-work-item-button");

  saveButton?.addEventListener("click", async () => {
    await handleSaveWorkItem(item.workItem.id);
  });

  analyzeButton?.addEventListener("click", async () => {
    await handleAnalyzeWorkItem(item.workItem.id);
  });

  fileTriggerButton?.addEventListener("click", () => {
    fileInput?.click();
  });

  fileInput?.addEventListener("change", async () => {
    await handleUploadWorkItemFile(item.workItem.id, fileInput);
  });

  deleteButton?.addEventListener("click", async () => {
    await handleDeleteWorkItem(item.workItem.id);
  });

  workItemModalBody
    .querySelector<HTMLButtonElement>("[data-archive-work-item-id]")
    ?.addEventListener("click", async () => {
      await handleArchiveWorkItem(item.workItem.id);
    });

  assignButton?.addEventListener("click", async () => {
    await handleAssignWorkItem(item.workItem.id);
  });

  workItemModalBody
    .querySelector<HTMLButtonElement>("#open-linked-task-button")
    ?.addEventListener("click", async () => {
      currentView = "department-tasks";
      renderCurrentView();
      await focusTaskById(currentAssignment?.taskId ?? null);
    });

  workItemModalBody
    .querySelector<HTMLButtonElement>("#approve-response-button")
    ?.addEventListener("click", async () => {
      await handleApproveTaskResponse(currentAssignment?.taskId ?? null);
    });

  workItemModalBody
    .querySelector<HTMLButtonElement>("#cancel-assignment-button")
    ?.addEventListener("click", async () => {
      await handleCancelAssignment(currentAssignment?.id ?? null);
    });

  workItemModalBody
    .querySelectorAll<HTMLButtonElement>("[data-download-linked-document-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await downloadApiFile(
            `/api/documents/${encodeURIComponent(button.dataset.downloadLinkedDocumentId ?? "")}/download`,
            button.dataset.downloadLinkedDocumentFilename ?? "document.bin",
            "Document downloaded."
          );
        } catch (error: unknown) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Something went wrong while downloading the document.",
            "error"
          );
        }
      });
    });

  workItemModalBody
    .querySelectorAll<HTMLButtonElement>("[data-download-work-item-file-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        try {
          await downloadApiFile(
            `/api/work-items/${encodeURIComponent(button.dataset.downloadWorkItemId ?? "")}/files/${encodeURIComponent(button.dataset.downloadWorkItemFileId ?? "")}/download`,
            button.dataset.downloadWorkItemFilename ?? "attachment.bin",
            "Attachment downloaded."
          );
        } catch (error: unknown) {
          setStatus(
            error instanceof Error
              ? error.message
              : "Something went wrong while downloading the attachment.",
            "error"
          );
        }
      });
    });

  workItemModalBody
    .querySelectorAll<HTMLButtonElement>("[data-detail-tab]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        setActiveWorkItemDetailTab(button.dataset.detailTab ?? "info");
      });
    });

  openWorkItemModal();
  setActiveWorkItemDetailTab("info");
}

function hideWorkItemDetail(): void {
  currentWorkItemAssignments = [];
  workItemDetail.classList.add("hidden");
  workItemDetailTitle.textContent = "Chi tiết hồ sơ";
  workItemDetailMeta.textContent = "";
  workItemDetailBody.innerHTML = "";
  workItemModalTitle.textContent = "Chi tiết hồ sơ";
  workItemModalMeta.textContent = "";
  workItemModalBody.innerHTML = "";
  workItemModal.classList.add("hidden");
  workItemModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function setActiveWorkItemDetailTab(tabName: string): void {
  workItemModalBody
    .querySelectorAll<HTMLButtonElement>("[data-detail-tab]")
    .forEach((button) => {
      button.classList.toggle("is-active", button.dataset.detailTab === tabName);
    });

  workItemModalBody
    .querySelectorAll<HTMLElement>("[data-detail-panel]")
    .forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.detailPanel !== tabName);
    });
}

function openWorkItemModal(): void {
  workItemModal.classList.remove("hidden");
  workItemModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeWorkItemModal(): void {
  selectedWorkItemId = null;
  hideWorkItemDetail();
  renderWorkItemList(currentWorkItems);
}

function renderWorkItemStatusOptions(selectedStatus: WorkItemStatus): string {
  const statuses: WorkItemStatus[] = [
    "draft",
    "waiting_review",
    "waiting_assignment",
    "assigned",
    "on_hold",
    "in_review",
    "needs_supplement",
    "needs_rework",
    "late_explanation_required",
    "waiting_principal_approval",
    "completed",
    "archived"
  ];

  return statuses
    .map(
      (status) => `
        <option value="${escapeHtml(status)}" ${status === selectedStatus ? "selected" : ""}>
          ${escapeHtml(getWorkItemStatusLabel(status))}
        </option>
      `
    )
    .join("");
}

function renderAssignmentPriorityOptions(
  selectedPriority: AssignmentPriority
): string {
  const priorities: AssignmentPriority[] = ["low", "normal", "high", "urgent"];

  return priorities
    .map(
      (priority) => `
        <option value="${escapeHtml(priority)}" ${priority === selectedPriority ? "selected" : ""}>
          ${escapeHtml(priority)}
        </option>
      `
    )
    .join("");
}

function renderTaskExecutionStatusOptions(
  selectedStatus: TaskExecutionStatus
): string {
  const statuses: TaskExecutionStatus[] = [
    "pending",
    "running",
    "waiting_dependency",
    "needs_data",
    "internally_completed",
    "submitted"
  ];

  return statuses
    .map(
      (status) => `
        <option value="${escapeHtml(status)}" ${status === selectedStatus ? "selected" : ""}>
          ${escapeHtml(status)}
        </option>
      `
    )
    .join("");
}

function renderSubmissionReviewOutcomeOptions(
  selectedOutcome: SubmissionReviewOutcome
): string {
  const outcomes: SubmissionReviewOutcome[] = [
    "needs_supplement",
    "needs_rework",
    "late_explanation_required",
    "needs_reassignment",
    "ready_for_principal_approval"
  ];

  return outcomes
    .map(
      (outcome) => `
        <option value="${escapeHtml(outcome)}" ${outcome === selectedOutcome ? "selected" : ""}>
          ${escapeHtml(outcome)}
        </option>
      `
    )
    .join("");
}

function renderSubmissionReturnStageOptions(
  selectedStage: SubmissionReturnStage
): string {
  const stages: SubmissionReturnStage[] = [
    "submission",
    "execution",
    "execution_late",
    "principal_review"
  ];

  return stages
    .map(
      (stage) => `
        <option value="${escapeHtml(stage)}" ${stage === selectedStage ? "selected" : ""}>
          ${escapeHtml(stage)}
        </option>
      `
    )
    .join("");
}

async function loadAssignmentsForWorkItem(workItemId: string): Promise<Assignment[]> {
  try {
    const response = await fetch(
      `/api/assignments?work_item_id=${encodeURIComponent(workItemId)}`,
      {
        headers: buildApiHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not load assignments")
      );
    }

    const data = (await response.json()) as AssignmentsResponse;
    return data.assignments;
  } catch {
    return [];
  }
}

async function handleSaveWorkItem(workItemId: string): Promise<void> {
  const statusSelect =
    workItemDetailBody.querySelector<HTMLSelectElement>("#work-item-status-select");

  if (!statusSelect) {
    return;
  }

  try {
    const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}`, {
      method: "PATCH",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        status: statusSelect.value
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not update the work item")
      );
    }

    await loadWorkItems();
    await selectWorkItemById(workItemId);
    setStatus("Work item updated successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while updating the work item.",
      "error"
    );
  }
}

async function handleAssignWorkItem(workItemId: string): Promise<void> {
  const assignmentScope =
    !workItemModal.classList.contains("hidden") && workItemModalBody.childElementCount > 0
      ? workItemModalBody
      : workItemDetailBody;
  const mainDepartmentInput =
    assignmentScope.querySelector<HTMLSelectElement>("#assignment-main-department");
  const coordinatingDepartmentsInput =
    assignmentScope.querySelector<HTMLInputElement>(
      "#assignment-coordinating-departments"
    );
  const deadlineInput =
    assignmentScope.querySelector<HTMLInputElement>("#assignment-deadline");
  const priorityInput =
    assignmentScope.querySelector<HTMLSelectElement>("#assignment-priority");
  const outputRequirementInput =
    assignmentScope.querySelector<HTMLTextAreaElement>(
      "#assignment-output-requirement"
    );
  const noteInput =
    assignmentScope.querySelector<HTMLTextAreaElement>("#assignment-note");

  if (
    !mainDepartmentInput ||
    !coordinatingDepartmentsInput ||
    !deadlineInput ||
    !priorityInput ||
    !outputRequirementInput ||
    !noteInput
  ) {
    return;
  }

  if (mainDepartmentInput.value.length === 0) {
    setStatus("Main department is required for assignment.", "error");
    return;
  }

  try {
    const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}/assign`, {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        mainDepartmentId: mainDepartmentInput.value,
        coordinatingDepartmentIds: coordinatingDepartmentsInput.value
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
        deadline: deadlineInput.value || undefined,
        priority: priorityInput.value,
        outputRequirement: outputRequirementInput.value.trim() || undefined,
        note: noteInput.value.trim() || undefined
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not assign the work item")
      );
    }

    await loadTasks();
    await loadAssignments();
    await loadWorkItems();
    await selectWorkItemById(workItemId);
    setStatus("Work item assigned successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while assigning the work item.",
      "error"
    );
  }
}

async function handlePrincipalReview(workItemId: string): Promise<void> {
  const decisionInput =
    approvalsAssignmentList.querySelector<HTMLSelectElement>("#principal-decision");
  const leadDepartmentInput =
    approvalsAssignmentList.querySelector<HTMLSelectElement>(
      "#principal-lead-department"
    );
  const coordinatingDepartmentsInput =
    approvalsAssignmentList.querySelector<HTMLInputElement>(
      "#principal-coordinating-departments"
    );
  const priorityInput =
    approvalsAssignmentList.querySelector<HTMLSelectElement>("#principal-priority");
  const outputRequirementInput =
    approvalsAssignmentList.querySelector<HTMLTextAreaElement>(
      "#principal-output-requirement"
    );
  const principalNoteInput =
    approvalsAssignmentList.querySelector<HTMLTextAreaElement>("#principal-note");
  const principalOutputTypeInput =
    approvalsAssignmentList.querySelector<HTMLSelectElement>("#principal-output-type");
  const principalDeadlineInput =
    approvalsAssignmentList.querySelector<HTMLInputElement>("#principal-deadline");

  if (
    !decisionInput ||
    !leadDepartmentInput ||
    !coordinatingDepartmentsInput ||
    !priorityInput ||
    !outputRequirementInput ||
    !principalNoteInput
  ) {
    return;
  }

  if (
    decisionInput.value === "assign" &&
    leadDepartmentInput.value.trim().length === 0
  ) {
    setStatus(
      "Lead department is required when preparing a work item for assignment.",
      "error"
    );
    return;
  }

  try {
    const response = await fetch(
      `/api/work-items/${encodeURIComponent(workItemId)}/principal-review`,
      {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          decision: decisionInput.value,
          leadDepartmentId: leadDepartmentInput.value.trim() || undefined,
          coordinatingDepartmentIds: coordinatingDepartmentsInput.value
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean),
          priority: priorityInput.value,
          outputRequirement: outputRequirementInput.value.trim() || undefined,
          principalNote: principalNoteInput.value.trim() || undefined,
          outputType: principalOutputTypeInput?.value || undefined,
          deadline: principalDeadlineInput?.value
            ? new Date(principalDeadlineInput.value).toISOString()
            : undefined
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(
          response,
          "The API could not save the principal review decision"
        )
      );
    }

    await loadWorkItems();
    await loadNotifications();
    await selectWorkItemById(workItemId);
    renderApprovalsQueue();
    renderAssignmentsList(currentAssignments);
    setStatus(
      decisionInput.value === "assign"
        ? "Principal decision saved. Work item is ready for assignment."
        : decisionInput.value === "hold"
          ? "Principal decision saved. Work item is now on hold."
          : "Principal decision saved. Work item was returned for intake completion.",
      "success"
    );
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while saving the principal review decision.",
      "error"
    );
  }
}

async function handleUploadWorkItemFile(
  workItemId: string,
  input: HTMLInputElement
): Promise<void> {
  const files = Array.from(input.files ?? []);

  if (files.length === 0) {
    return;
  }

  setStatus(
    files.length === 1
      ? "Uploading response file..."
      : `Uploading ${files.length} response files...`,
    "loading"
  );

  try {
    for (const file of files) {
      const contentText = isInlineExtractableDocument(file)
        ? sanitizeUploadedText(await file.text())
        : undefined;
      const contentBase64 = await readFileAsBase64(file);
      const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}/files`, {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "text/plain",
          sizeBytes: file.size,
          contentText,
          contentBase64
        })
      });

      if (!response.ok) {
        throw new Error(
          await readApiError(response, "The API could not upload the file")
        );
      }
    }

    input.value = "";
    await loadWorkItems();
    if (
      selectedTaskId &&
      currentTaskItems.find((item) => item.task.id === selectedTaskId)?.task.workItemId === workItemId
    ) {
      await focusTaskById(selectedTaskId);
    } else {
      await selectWorkItemById(workItemId);
    }
    setStatus(
      files.length === 1
        ? "Response file uploaded successfully."
        : `${files.length} response files uploaded successfully.`,
      "success"
    );
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while uploading the file.",
      "error"
    );
  }
}

async function handleAnalyzeWorkItem(workItemId: string): Promise<void> {
  try {
    const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}/analyze`, {
      method: "POST",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not analyze the work item")
      );
    }

    await loadWorkItems();
    await selectWorkItemById(workItemId);
    setStatus("AI analysis completed.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while analyzing the work item.",
      "error"
    );
  }
}

async function handleAcceptAssignmentTask(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/accept`, {
      method: "POST",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not accept the assignment")
      );
    }

    await loadTasks();
    await loadAssignments();
    await loadNotifications();
    await focusTaskById(taskId);
    setStatus("Assignment accepted.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while accepting the assignment.",
      "error"
    );
  }
}

function getAssignmentStatusForTask(assignmentId: string | undefined): string {
  if (!assignmentId) {
    return "none";
  }

  const assignment = currentAssignments.find((item) => item.id === assignmentId);
  return assignment?.status ?? "unknown";
}

function getNextTaskAction(task: Task): string {
  if (task.status === "pending") {
    return "Accept the assignment or request an adjustment.";
  }

  if (task.status === "running") {
    return "Open the task, upload evidence, then mark the response submitted.";
  }

  if (task.status === "completed") {
    return "Wait for principal confirmation or archive review.";
  }

  if (task.status === "failed") {
    return "Open the task detail to review the blocker and decide the next move.";
  }

  return "Open the task detail to continue execution.";
}

function getTaskStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "Chờ tiếp nhận",
    running: "Đang thực hiện",
    completed: "Hoàn thành",
    failed: "Thất bại",
    report_submitted: "Đã nộp báo cáo",
    waiting_quality_check: "Chờ kiểm tra chất lượng",
    waiting_principal_approval: "Chờ HT phê duyệt"
  };
  return labels[status] ?? status;
}

function getWorkItemStatusLabel(status: WorkItemStatus): string {
  const labels: Record<WorkItemStatus, string> = {
    draft: "Nháp",
    waiting_review: "Chờ HT xem xét",
    waiting_assignment: "Chờ giao việc",
    assigned: "Đã giao",
    on_hold: "Tạm giữ",
    in_review: "Đang kiểm tra",
    needs_supplement: "Cần bổ sung",
    needs_rework: "Cần làm lại",
    late_explanation_required: "Cần giải trình trễ",
    waiting_principal_approval: "Chờ HT phê duyệt",
    completed: "Hoàn thành",
    archived: "Đã lưu trữ"
  };
  return labels[status] ?? status;
}

function getNextWorkItemAction(status: WorkItemStatus): string {
  switch (status) {
    case "draft":
      return "Analyze the intake and convert it into a routed record.";
    case "waiting_review":
      return "Principal should review and choose the routing direction.";
    case "waiting_assignment":
      return "Prepare and dispatch the assignment handoff.";
    case "assigned":
      return "Monitor department acceptance and linked task progress.";
    case "in_review":
      return "Check the submitted response and decide whether to approve it.";
    case "needs_supplement":
      return "Request missing files or evidence from the department.";
    case "needs_rework":
      return "Return the record for content revision.";
    case "late_explanation_required":
      return "Collect the late explanation before approval.";
    case "waiting_principal_approval":
      return "Principal approval is the next required action.";
    case "completed":
      return "This record is complete and ready for reporting or archive.";
    case "archived":
      return "Archived for lookup only.";
    default:
      return "Open the record to continue the workflow.";
  }
}

async function handleRejectAssignmentTask(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  const reason = window.prompt(
    "Explain why this assignment needs adjustment before the principal re-routes it:",
    ""
  );

  if (reason === null) {
    return;
  }

  try {
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/reject-assignment`, {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        reason: reason.trim() || undefined
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not reject the assignment")
      );
    }

    await loadTasks();
    await loadAssignments();
    await loadNotifications();
    hideDepartmentTaskDetail();
    setStatus("Adjustment request sent back to the principal review flow.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while rejecting the assignment.",
      "error"
    );
  }
}

async function handleSubmitTaskResponse(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(taskId)}/submit-response`,
      {
        method: "POST",
        headers: buildApiHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not submit the response")
      );
    }

    await loadTasks();
    await loadWorkItems();
    await loadNotifications();
    await focusTaskById(taskId);
    setStatus("Response submitted. Waiting for principal approval before completion.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while submitting the response.",
      "error"
    );
  }
}

async function handleApproveTaskResponse(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(taskId)}/approve-response`,
      {
        method: "POST",
        headers: buildApiHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not approve the response")
      );
    }

    await loadTasks();
    await loadWorkItems();
    await loadNotifications();
    await focusTaskById(taskId);
    setStatus("Response approved. Task is now completed.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while approving the response.",
      "error"
    );
  }
}

async function handleCancelAssignment(assignmentId: string | null): Promise<void> {
  if (!assignmentId) {
    setStatus("No assignment is linked to this record.", "error");
    return;
  }

  if (
    !window.confirm(
      "Cancel this assignment only if it was created by mistake and the department has not started execution. The work item will go back to waiting assignment."
    )
  ) {
    return;
  }

  try {
    const response = await fetch(
      `/api/assignments/${encodeURIComponent(assignmentId)}/cancel`,
      {
        method: "POST",
        headers: buildApiHeaders()
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The assignment could not be cancelled.")
      );
    }

    await Promise.all([
      loadAssignments(),
      loadTasks(),
      loadWorkItems(),
      loadNotifications()
    ]);
    setStatus("Assignment cancelled. The record is back in waiting assignment.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while cancelling the assignment.",
      "error"
    );
  }
}

async function handleSubmitTaskReport(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  const noteInput = document.querySelector<HTMLTextAreaElement>(
    `#task-report-note-${CSS.escape(taskId)}`
  );
  const reportNote = noteInput?.value.trim() ?? "";

  if (reportNote.length < 10) {
    setStatus("Vui lòng nhập nội dung báo cáo (ít nhất 10 ký tự).", "error");
    return;
  }

  try {
    setStatus("Đang nộp báo cáo kết quả...", "loading");
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/submit-report`, {
      method: "POST",
      headers: buildApiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ reportNote })
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể nộp báo cáo"));
    }

    await loadTasks();
    await loadWorkItems();
    await focusTaskById(taskId);
    setStatus("Báo cáo đã nộp thành công. AI Agent sẽ kiểm tra chất lượng.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi nộp báo cáo.",
      "error"
    );
  }
}

async function handleQualityCheck(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  try {
    setStatus("AI Agent đang kiểm tra chất lượng hồ sơ...", "loading");
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/quality-check`, {
      method: "POST",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể kiểm tra chất lượng"));
    }

    const data = (await response.json()) as {
      task: Task;
      checkResult: { passed: boolean; score: number; issues: string[]; recommendation: string };
    };

    await loadTasks();
    await loadWorkItems();
    await focusTaskById(taskId);

    if (data.checkResult.passed) {
      setStatus(`✅ Hồ sơ đạt yêu cầu (điểm: ${data.checkResult.score}/100). Sẵn sàng trình HT phê duyệt.`, "success");
    } else {
      setStatus(`⚠️ Hồ sơ chưa đạt (điểm: ${data.checkResult.score}/100): ${data.checkResult.issues.join(", ")}`, "error");
    }
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi kiểm tra chất lượng.",
      "error"
    );
  }
}

async function handlePrincipalApproveTask(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  const noteInput = document.querySelector<HTMLTextAreaElement>(
    `#principal-approval-note-${CSS.escape(taskId)}`
  );
  const approvalNote = noteInput?.value.trim() || "Phê duyệt hoàn thành";

  try {
    setStatus("Đang phê duyệt...", "loading");
    const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/principal-approve`, {
      method: "POST",
      headers: buildApiHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ approvalNote })
    });

    if (!response.ok) {
      throw new Error(await readApiError(response, "Không thể phê duyệt"));
    }

    await loadTasks();
    await loadWorkItems();
    await loadNotifications();
    await focusTaskById(taskId);
    setStatus("✅ Đã phê duyệt hoàn thành. Hồ sơ sẽ được lưu trữ.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi phê duyệt.",
      "error"
    );
  }
}

async function handleUploadTaskEvidenceFile(
  taskId: string | null,
  input: HTMLInputElement
): Promise<void> {
  if (!taskId) {
    return;
  }

  const files = Array.from(input.files ?? []);

  if (files.length === 0) {
    return;
  }

  setStatus(`Đang tải lên ${files.length} file minh chứng...`, "loading");

  try {
    for (const file of files) {
      const contentBase64 = await readFileAsBase64(file);
      const contentText = isInlineExtractableDocument(file)
        ? sanitizeUploadedText(await file.text())
        : undefined;

      const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}/files`, {
        method: "POST",
        headers: buildApiHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          contentBase64,
          contentText
        })
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Không thể tải file minh chứng"));
      }
    }

    input.value = "";
    await focusTaskById(taskId);
    setStatus(`${files.length} file minh chứng đã tải lên thành công.`, "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error ? error.message : "Lỗi tải file minh chứng.",
      "error"
    );
  }
}

async function handleCreateTaskUpdate(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  const statusInput = document.querySelector<HTMLSelectElement>(
    `#task-update-status-${CSS.escape(taskId)}`
  );
  const progressInput = document.querySelector<HTMLInputElement>(
    `#task-update-progress-${CSS.escape(taskId)}`
  );
  const noteInput = document.querySelector<HTMLTextAreaElement>(
    `#task-update-note-${CSS.escape(taskId)}`
  );

  if (!statusInput || !progressInput || !noteInput) {
    return;
  }

  const progressValue = Number(progressInput.value);

  if (
    Number.isNaN(progressValue) ||
    progressValue < 0 ||
    progressValue > 100
  ) {
    setStatus("Progress percent must be between 0 and 100.", "error");
    return;
  }

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(taskId)}/updates`,
      {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          executionStatus: statusInput.value,
          progressPercent: progressValue,
          note: noteInput.value.trim() || undefined
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not save the execution update")
      );
    }

    await loadTasks();
    await loadNotifications();
    await focusTaskById(taskId);
    setStatus("Execution update saved.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while saving the execution update.",
      "error"
    );
  }
}

async function handleCreateSubmissionReview(taskId: string | null): Promise<void> {
  if (!taskId) {
    return;
  }

  const outcomeInput = document.querySelector<HTMLSelectElement>(
    `#submission-review-outcome-${CSS.escape(taskId)}`
  );
  const stageInput = document.querySelector<HTMLSelectElement>(
    `#submission-review-stage-${CSS.escape(taskId)}`
  );
  const reasonCodeInput = document.querySelector<HTMLInputElement>(
    `#submission-review-reason-code-${CSS.escape(taskId)}`
  );
  const reasonTextInput = document.querySelector<HTMLTextAreaElement>(
    `#submission-review-reason-text-${CSS.escape(taskId)}`
  );

  if (!outcomeInput || !stageInput || !reasonCodeInput || !reasonTextInput) {
    return;
  }

  try {
    const response = await fetch(
      `/api/tasks/${encodeURIComponent(taskId)}/reviews`,
      {
        method: "POST",
        headers: buildApiHeaders({
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({
          reviewOutcome: outcomeInput.value,
          returnStage: stageInput.value,
          reasonCode: reasonCodeInput.value.trim() || undefined,
          reasonText: reasonTextInput.value.trim() || undefined
        })
      }
    );

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not save the submission review")
      );
    }

    await loadTasks();
    await loadWorkItems();
    await loadNotifications();
    await focusTaskById(taskId);
    setStatus("Submission review saved.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while saving the submission review.",
      "error"
    );
  }
}

async function handleSaveDepartment(departmentId: string | null): Promise<void> {
  if (!departmentId) {
    return;
  }

  const nameInput = departmentList.querySelector<HTMLInputElement>(
    `[data-department-field="name"][data-department-id="${CSS.escape(departmentId)}"]`
  );
  const codeInput = departmentList.querySelector<HTMLInputElement>(
    `[data-department-field="code"][data-department-id="${CSS.escape(departmentId)}"]`
  );

  if (!nameInput || !codeInput) {
    return;
  }

  try {
    const response = await fetch(`/api/departments/${encodeURIComponent(departmentId)}`, {
      method: "PUT",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        name: nameInput.value.trim(),
        code: codeInput.value.trim()
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not update the department")
      );
    }

    await loadAdminData();
    setStatus("Department updated successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while updating the department.",
      "error"
    );
  }
}

async function handleDeleteDepartment(departmentId: string | null): Promise<void> {
  if (!departmentId) {
    return;
  }

  try {
    const response = await fetch(`/api/departments/${encodeURIComponent(departmentId)}`, {
      method: "DELETE",
      headers: buildApiHeaders()
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not delete the department")
      );
    }

    await loadAdminData();
    setStatus("Department deleted successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while deleting the department.",
      "error"
    );
  }
}

async function handleSaveUserAssignment(userId: string | null): Promise<void> {
  if (!userId) {
    return;
  }

  const roleInput = userAdminList.querySelector<HTMLSelectElement>(
    `[data-user-field="role"][data-user-id="${CSS.escape(userId)}"]`
  );
  const departmentInput = userAdminList.querySelector<HTMLSelectElement>(
    `[data-user-field="department"][data-user-id="${CSS.escape(userId)}"]`
  );
  const positionInput = userAdminList.querySelector<HTMLInputElement>(
    `[data-user-field="position"][data-user-id="${CSS.escape(userId)}"]`
  );
  const activeInput = userAdminList.querySelector<HTMLInputElement>(
    `[data-user-field="active"][data-user-id="${CSS.escape(userId)}"]`
  );

  if (!roleInput || !departmentInput || !positionInput || !activeInput) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${encodeURIComponent(userId)}/assignment`, {
      method: "PUT",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        role: roleInput.value,
        departmentId: departmentInput.value || null,
        position: positionInput.value.trim() || null,
        isActive: activeInput.checked
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not update the user assignment")
      );
    }

    await loadAdminData();
    setStatus("User assignment updated successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while updating the user assignment.",
      "error"
    );
  }
}

async function loadSession(): Promise<void> {
  try {
    const response = await fetch("/api/auth/session");

    if (!response.ok) {
      throw new Error(await readApiError(response, "The API could not load the session"));
    }

    const data = (await response.json()) as SessionResponse;
    currentSessionUserId = data.userId;
    currentSessionUser = data.user;
    renderSessionUser();
  } catch {
    currentSessionUserId = null;
    currentSessionUser = null;
    renderSessionUser();
  }
}

function renderCurrentView(): void {
  const viewMap: Record<typeof currentView, HTMLElement> = {
    overview: overviewView,
    documents: documentsView,
    "work-items": workItemsView,
    assignments: assignmentsView,
    "department-tasks": departmentTasksView,
    approvals: approvalsView,
    reports: reportsView,
    admin: adminView,
    account: accountView,
    legacy: legacyView
  };

  Object.entries(viewMap).forEach(([view, element]) => {
    element.classList.toggle("hidden", view !== currentView);
  });

  navButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === currentView);
  });

  const titles: Record<typeof currentView, { eyebrow: string; title: string; description: string }> = {
    overview: {
      eyebrow: "Tổng quan",
      title: "Bảng điều khiển vận hành",
      description: "Xem áp lực tiếp nhận, tải phân luồng của HT, tiến độ thực hiện và các điểm tắc nghẽn trong một màn hình."
    },
    documents: {
      eyebrow: "Giai đoạn 1 – Tiếp nhận",
      title: "Hộp thư tiếp nhận văn bản",
      description: "Tiếp nhận văn bản, phân tích nội dung và chuẩn bị hồ sơ cho HT xem xét ngay trong luồng tiếp nhận."
    },
    "work-items": {
      eyebrow: "Hồ sơ",
      title: "Không gian quản lý hồ sơ",
      description: "Mở hồ sơ đầy đủ khi cần xem file gốc, trạng thái giao việc, lịch sử xét duyệt và phê duyệt."
    },
    assignments: {
      eyebrow: "Giao việc",
      title: "Theo dõi giao việc",
      description: "Quản lý giao việc — hiện đã tích hợp vào màn hình Phân luồng HT."
    },
    "department-tasks": {
      eyebrow: "Giai đoạn 4 – Thực hiện",
      title: "Thực hiện công việc tại đơn vị",
      description: "Mở nhiệm vụ, xem ngữ cảnh nguồn, đính kèm minh chứng, cập nhật tiến độ và nộp báo cáo kết quả."
    },
    approvals: {
      eyebrow: "Giai đoạn 2 & 3",
      title: "Phân luồng HT & Giao việc",
      description: "Phân luồng từng hồ sơ tiếp nhận, chọn đơn vị chủ trì, rồi ở lại cùng không gian để tạo và theo dõi việc giao."
    },
    reports: {
      eyebrow: "Báo cáo",
      title: "Tổng hợp vận hành",
      description: "Theo dõi hoàn thành, tồn đọng và luồng giao việc qua báo cáo ngày/tuần từ AI Agent."
    },
    admin: {
      eyebrow: "Quản trị",
      title: "Quản trị nhà trường",
      description: "Cấu hình đơn vị và phân công người dùng — chỉ dùng cho cài đặt ban đầu."
    },
    account: {
      eyebrow: "Tài khoản",
      title: "Phiên làm việc & Mật khẩu",
      description: "Quản lý đăng nhập, đổi mật khẩu và điều khiển phiên làm việc."
    },
    legacy: {
      eyebrow: "Cũ",
      title: "Công cụ cũ (Legacy)",
      description: "Các luồng công việc cũ vẫn khả dụng nhưng không ảnh hưởng đến luồng chính của nhà trường."
    }
  };

  const meta = titles[currentView];
  viewEyebrow.textContent = meta.eyebrow;
  viewTitle.textContent = meta.title;
  viewDescription.textContent = meta.description;

  if (currentView === "account") {
    viewDescription.textContent =
      currentSessionUser?.role && currentSessionUser?.departmentName
        ? `${meta.description} Current role: ${currentSessionUser.role}. Department: ${currentSessionUser.departmentName}.`
        : meta.description;
  }

  renderWorkflowChrome();
}

function renderWorkflowChrome(): void {
  const workflowSteps: Array<{
    key: "documents" | "approvals" | "department-tasks" | "work-items" | "reports";
    label: string;
    title: string;
  }> = [
    { key: "documents", label: "G1", title: "Tiếp nhận" },
    { key: "approvals", label: "G2-3", title: "HT phân luồng" },
    { key: "department-tasks", label: "G4", title: "Thực hiện" },
    { key: "work-items", label: "G6-8", title: "Báo cáo & Duyệt" },
    { key: "reports", label: "G9", title: "Theo dõi & Lưu trữ" }
  ];

  workflowStepper.innerHTML = workflowSteps
    .map((step) => {
      const isActive =
        currentView === step.key ||
        (step.key === "approvals" && currentView === "assignments");
      const isComplete =
        (step.key === "documents" && currentDocuments.length > 0) ||
        (step.key === "approvals" &&
          currentWorkItems.some(
            (item) =>
              item.workItem.status === "waiting_assignment" ||
              item.workItem.status === "assigned" ||
              item.workItem.status === "in_review" ||
              item.workItem.status === "completed"
          )) ||
        (step.key === "department-tasks" &&
          currentTaskItems.some((item) => item.task.taskType === "school_workflow")) ||
        (step.key === "work-items" && currentWorkItems.length > 0);

      return `
        <button
          class="workflow-step ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}"
          type="button"
          data-workflow-view="${escapeHtml(step.key)}"
        >
          <span class="workflow-step-index">${escapeHtml(step.label)}</span>
          <strong>${escapeHtml(step.title)}</strong>
        </button>
      `;
    })
    .join("");

  workflowStepper
    .querySelectorAll<HTMLButtonElement>("[data-workflow-view]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const nextView = button.dataset.workflowView as typeof currentView | undefined;
        if (!nextView) {
          return;
        }
        currentView = nextView;
        renderCurrentView();
      });
    });

  const actionsByView: Record<
    typeof currentView,
    Array<{ title: string; detail: string; targetView?: typeof currentView; kind?: "primary" | "secondary" }>
  > = {
    overview: [
      {
        title: "Bắt đầu với tiếp nhận văn bản mới",
        detail: "Mở Giai đoạn 1, xem tóm tắt AI, rồi tạo hồ sơ chuyển cho HT xem xét.",
        targetView: "documents",
        kind: "primary"
      },
      {
        title: "Xử lý quyết định phân luồng của HT",
        detail: "Phân luồng hồ sơ và tạo phiếu giao việc ngay trong cùng không gian làm việc.",
        targetView: "approvals"
      },
      {
        title: "Kiểm tra tiến độ thực hiện tại đơn vị",
        detail: "Mở nhiệm vụ đang chạy, xem vướng mắc và theo dõi báo cáo còn thiếu.",
        targetView: "department-tasks"
      }
    ],
    documents: [
      {
        title: "1. Tải lên hoặc xem văn bản nguồn",
        detail: "Dùng văn bản OCR/trích xuất làm xem trước tiếp nhận để hồ sơ được tạo có ngữ cảnh đầy đủ.",
        kind: "primary"
      },
      {
        title: "2. Phân tích văn bản",
        detail: "Chạy AI phân tích trước khi tạo hồ sơ nếu tóm tắt vẫn chưa rõ ràng."
      },
      {
        title: "3. Tạo hồ sơ công việc",
        detail: "Khi tiếp nhận xong, chuyển văn bản thành hồ sơ để HT xem xét phân luồng.",
        targetView: "approvals"
      }
    ],
    approvals: [
      {
        title: "1. Chọn hướng xử lý",
        detail: "Quyết định hồ sơ đi tiếp, trả lại bổ sung hay tạm giữ — ghi rõ lý do.",
        kind: "primary"
      },
      {
        title: "2. Đặt đơn vị chủ trì, mức độ ưu tiên và thời hạn",
        detail: "Toàn bộ quyết định phân luồng và chuẩn bị giao việc thực hiện trong cùng không gian này."
      },
      {
        title: "3. Giao việc cho đơn vị",
        detail: "Sau khi lưu quyết định HT, cuộn xuống phần Giao việc và theo dõi tiến độ tiếp nhận.",
        targetView: "department-tasks"
      }
    ],
    "department-tasks": [
      {
        title: "1. Tiếp nhận hoặc yêu cầu điều chỉnh",
        detail: "Nhiệm vụ đang chờ không được để im. Xác nhận tiếp nhận hoặc trả lại kèm lý do.",
        kind: "primary"
      },
      {
        title: "2. Cập nhật tiến độ và đính kèm minh chứng",
        detail: "Dùng chức năng tải file minh chứng, kiểm tra đính kèm ngay trong nhiệm vụ đang mở."
      },
      {
        title: "3. Nộp báo cáo kết quả (Giai đoạn 6)",
        detail: "Nộp báo cáo chuyển hồ sơ sang chờ HT phê duyệt — chưa hoàn thành cho đến khi HT duyệt."
      }
    ],
    "work-items": [
      {
        title: "1. Xem hồ sơ đầy đủ",
        detail: "Dùng màn hình này để xem file nguồn, trạng thái giao việc, lịch sử xét duyệt và hành động phê duyệt cuối.",
        kind: "primary"
      },
      {
        title: "2. Kiểm tra file và tab giao việc",
        detail: "Nếu đơn vị đã nộp báo cáo, kiểm tra đính kèm và mở nhiệm vụ liên kết khi cần."
      },
      {
        title: "3. Phê duyệt và lưu trữ",
        detail: "HT phê duyệt khi hồ sơ đã hoàn thành, sau đó lưu trữ vào kho (Giai đoạn 9)."
      }
    ],
    assignments: [
      {
        title: "Giao việc đã tích hợp vào Phân luồng HT",
        detail: "Dùng không gian phân luồng để tạo và theo dõi phiếu giao thay vì nhảy qua màn hình này.",
        targetView: "approvals",
        kind: "primary"
      }
    ],
    reports: [
      {
        title: "Xem tắc nghẽn và khối lượng công việc",
        detail: "Dùng Báo cáo để có bức tranh vận hành sau khi dữ liệu tiếp nhận, phân luồng và thực hiện đã di chuyển.",
        kind: "primary"
      },
      {
        title: "Lưu trữ hồ sơ hoàn thành (Giai đoạn 9)",
        detail: "Mở hồ sơ đã hoàn thành trong tab Hồ sơ và dùng nút Lưu trữ để chuyển sang kho lưu trữ.",
        targetView: "work-items"
      }
    ],
    admin: [
      {
        title: "Quản trị chỉ dùng cho cài đặt",
        detail: "Quản lý đơn vị và người dùng ở đây, sau đó quay lại màn hình vận hành để làm việc hàng ngày.",
        kind: "primary"
      }
    ],
    account: [
      {
        title: "Chỉ dùng điều khiển tài khoản",
        detail: "Đăng nhập, phiên làm việc và đổi mật khẩu ở đây để không làm gián đoạn màn hình vận hành.",
        kind: "primary"
      }
    ],
    legacy: [
      {
        title: "Công cụ cũ được tách biệt",
        detail: "Chỉ dùng cho các luồng công việc cũ không thuộc quy trình nhà trường.",
        kind: "primary"
      }
    ]
  };

  const currentActions = actionsByView[currentView];
  workflowGuidance.innerHTML = `
    <div class="panel-header">
      <div>
        <p class="eyebrow">Bước tiếp theo</p>
        <h3>Cần làm gì trong bước này</h3>
      </div>
    </div>
    <div class="workflow-actions-grid">
      ${currentActions
        .map(
          (action) => `
            <article class="workflow-action-card ${action.kind === "primary" ? "is-primary" : ""}">
              <strong>${escapeHtml(action.title)}</strong>
              <p>${escapeHtml(action.detail)}</p>
              ${
                action.targetView
                  ? `
                    <button
                      class="secondary-button workflow-action-button"
                      type="button"
                      data-guidance-view="${escapeHtml(action.targetView)}"
                    >
                      Mở: ${escapeHtml(titlesForView(action.targetView))}
                    </button>
                  `
                  : ""
              }
            </article>
          `
        )
        .join("")}
    </div>
  `;

  workflowGuidance
    .querySelectorAll<HTMLButtonElement>("[data-guidance-view]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const nextView = button.dataset.guidanceView as typeof currentView | undefined;
        if (!nextView) {
          return;
        }
        currentView = nextView;
        renderCurrentView();
      });
    });
}

function titlesForView(view: typeof currentView): string {
  switch (view) {
    case "documents":
      return "Tiếp nhận văn bản";
    case "approvals":
      return "Phân luồng HT";
    case "department-tasks":
      return "Thực hiện";
    case "work-items":
      return "Hồ sơ";
    case "reports":
      return "Báo cáo";
    case "admin":
      return "Quản trị";
    case "account":
      return "Tài khoản";
    case "legacy":
      return "Cũ (Legacy)";
    case "overview":
      return "Tổng quan";
    case "assignments":
      return "Giao việc";
  }
}

void (async () => {
  await loadSession();
  await loadAdminData();
  await loadDocuments();
  await loadWorkItems();
  await loadTasks();
  await loadAssignments();
  await loadNotifications();
})();
