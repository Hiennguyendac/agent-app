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

interface WorkItem {
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

interface WorkItemFile {
  id: string;
  workItemId: string;
  filename: string;
  contentType?: string;
  sizeBytes?: number;
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
        <p class="eyebrow">School Workflow App</p>
        <h1>Internal Operations</h1>
        <p class="intro">Document intake, work items, assignments, and department execution from one place.</p>
      </div>
      <nav class="sidebar-nav" aria-label="Primary">
        <button class="nav-button" type="button" data-view="overview">Overview</button>
        <button class="nav-button" type="button" data-view="documents">Documents</button>
        <button class="nav-button" type="button" data-view="work-items">Work Items</button>
        <button class="nav-button" type="button" data-view="approvals">Principal Review</button>
        <button class="nav-button" type="button" data-view="assignments">Assignments</button>
        <button class="nav-button" type="button" data-view="department-tasks">Department Tasks</button>
        <button class="nav-button" type="button" data-view="reports">Reports</button>
        <button class="nav-button" type="button" data-view="admin">Admin</button>
        <button class="nav-button" type="button" data-view="account">Account</button>
        <button class="nav-button" type="button" data-view="legacy">Legacy</button>
      </nav>
      <section class="sidebar-account">
        <p class="detail-label">Active Identity</p>
        <p id="session-user" class="mock-user-active">Session user: checking...</p>
        <p id="identity-source" class="identity-source-note">Active identity: checking...</p>
        <p id="active-user" class="identity-source-note"></p>
      </section>
    </aside>

    <section class="app-main">
      <header class="topbar panel">
        <div class="topbar-copy">
          <p id="view-eyebrow" class="eyebrow">Overview</p>
          <h2 id="view-title">Document Intake Overview</h2>
          <p id="view-description" class="intro">
            Upload school documents, review extracted intake, and create work items from verified records.
          </p>
        </div>
        <section class="account-card" aria-label="Current account">
          <p class="detail-label">User Console</p>
          <p class="detail-value">Session, password, and dev fallback controls now live in the dedicated Account view.</p>
          <div class="auth-actions">
            <button class="secondary-button" type="button" data-view="account">Open Account</button>
          </div>
        </section>
      </header>

      <p id="status-message" class="status-message" aria-live="polite"></p>

      <section id="overview-view" class="content-view">
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Overview</p>
              <h3>Operational KPIs</h3>
            </div>
            <div id="overview-cards" class="overview-cards"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Attention</p>
              <h3>Needs Attention</h3>
            </div>
            <div id="needs-attention-panel" class="admin-list"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Activity</p>
              <h3>Recent Activity</h3>
            </div>
            <div id="recent-activity-panel" class="admin-list"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Departments</p>
              <h3>By Department</h3>
            </div>
            <div id="by-department-panel" class="admin-list"></div>
          </section>
        </div>
      </section>

      <section id="documents-view" class="content-view hidden">
        <div class="panel">
          <div class="tasks-header">
            <div>
              <p class="eyebrow">Intake</p>
              <h3>Documents</h3>
            </div>
            <button id="refresh-documents-button" class="secondary-button" type="button">Refresh Documents</button>
          </div>

          <div class="toolbar-row">
            <div class="field">
              <label for="document-search">Search documents</label>
              <input id="document-search" type="text" placeholder="Search filename, extracted text, uploader" />
            </div>
          </div>

          <form id="document-form" class="task-form" novalidate>
            <div class="field">
              <label for="document-file">Upload school document</label>
              <input id="document-file" name="documentFile" type="file" />
            </div>
            <div class="field">
              <label for="document-title">Document note</label>
              <input id="document-title" name="documentTitle" type="text" placeholder="Incoming request from parent or department" />
            </div>
            <div class="field">
              <label for="document-metadata">Metadata JSON</label>
              <textarea id="document-metadata" name="documentMetadata" rows="3" placeholder='{"source":"front-office","channel":"email"}'></textarea>
            </div>
            <button id="create-document-button" class="primary-button" type="submit">Upload Document</button>
          </form>

          <div class="work-item-layout">
            <div id="document-list" class="task-list"></div>
            <section id="document-detail" class="result-card hidden">
              <h3 id="document-detail-title">Document Detail</h3>
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
              <p class="eyebrow">School Workflow</p>
              <h3>Work Items</h3>
            </div>
            <button id="refresh-work-items-button" class="secondary-button" type="button">Refresh Work Items</button>
          </div>

          <div class="toolbar-row">
            <div class="field">
              <label for="work-item-search">Search work items</label>
              <input id="work-item-search" type="text" placeholder="Search title, description, creator" />
            </div>
          </div>

          <form id="work-item-form" class="task-form" novalidate>
            <div class="field">
              <label for="work-item-title">Work item title</label>
              <input id="work-item-title" name="workItemTitle" type="text" placeholder="Teacher leave request review" />
            </div>
            <div class="field">
              <label for="work-item-description">Description</label>
              <textarea id="work-item-description" name="workItemDescription" rows="3" placeholder="Describe the school workflow item"></textarea>
            </div>
            <div class="field">
              <label for="work-item-department">Department</label>
              <select id="work-item-department" name="workItemDepartment">
                <option value="">No department</option>
              </select>
            </div>
            <button id="create-work-item-button" class="primary-button" type="submit">Create Work Item</button>
          </form>

          <section id="department-task-queue" class="result-card hidden">
            <h3>Department Task Queue</h3>
            <div id="department-task-queue-list" class="work-item-queue"></div>
          </section>

          <div class="work-item-layout">
            <div id="work-item-list" class="task-list"></div>
            <section id="work-item-detail" class="result-card hidden">
              <h3 id="work-item-detail-title">Work Item Detail</h3>
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
              <p class="eyebrow">Assignments</p>
              <h3>Waiting Assignment Queue</h3>
            </div>
            <div id="assignment-queue" class="work-item-queue"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Assignments</p>
              <h3>Assignment Workspace</h3>
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
              <p class="eyebrow">Execution</p>
              <h3>Department Tasks</h3>
            </div>
            <button id="refresh-button" class="secondary-button" type="button">Refresh Tasks</button>
          </div>
          <div class="toolbar-row">
            <div class="status-filter-tabs" id="department-task-status-tabs">
              <button class="tab-button is-active" type="button" data-status-filter="all">All</button>
              <button class="tab-button" type="button" data-status-filter="pending">Pending</button>
              <button class="tab-button" type="button" data-status-filter="running">Running</button>
              <button class="tab-button" type="button" data-status-filter="completed">Completed</button>
              <button class="tab-button" type="button" data-status-filter="failed">Failed</button>
            </div>
            <select id="department-task-status-filter" class="hidden">
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div class="work-item-layout">
            <div id="task-list" class="task-list"></div>
            <section id="department-task-detail" class="result-card hidden">
              <h3 id="department-task-detail-title">Task Detail</h3>
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
              <p class="eyebrow">Principal Review</p>
              <h3>Items Waiting Principal Decision</h3>
            </div>
            <div id="approvals-queue" class="work-item-queue"></div>
          </section>
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Principal Review</p>
              <h3>Decision Workspace</h3>
            </div>
            <div id="approvals-assignment-list" class="admin-list"></div>
          </section>
        </div>
      </section>

      <section id="reports-view" class="content-view hidden">
        <div class="panel">
          <div class="panel-header">
            <p class="eyebrow">Reports</p>
            <h3>Operational Summary</h3>
          </div>
          <div id="report-cards" class="overview-cards"></div>
        </div>
      </section>

      <section id="admin-view" class="content-view hidden">
        <section id="admin-panel" class="panel hidden" aria-label="School admin">
          <div class="panel-header">
            <p class="eyebrow">Admin</p>
            <h3>Departments & User Assignment</h3>
            <p class="intro">Principal-only setup for departments and user assignment.</p>
          </div>
          <div class="detail-tabs">
            <button class="tab-button is-active" type="button" data-admin-tab="departments">Departments</button>
            <button class="tab-button" type="button" data-admin-tab="users">Users</button>
          </div>
          <div class="admin-section">
            <div class="admin-card" data-admin-panel="departments">
              <h3>Departments</h3>
              <div class="admin-form-row">
                <div class="field">
                  <label for="department-name">Department name</label>
                  <input id="department-name" name="departmentName" type="text" placeholder="Academic Affairs" />
                </div>
                <div class="field">
                  <label for="department-code">Department code</label>
                  <input id="department-code" name="departmentCode" type="text" placeholder="ACADEMIC" />
                </div>
                <div class="auth-actions">
                  <button id="create-department-button" class="secondary-button" type="button">Add Department</button>
                </div>
              </div>
              <div id="department-list" class="admin-list"></div>
            </div>

            <div class="admin-card hidden" data-admin-panel="users">
              <h3>User Assignment</h3>
              <article class="admin-item">
                <div class="admin-user-header">
                  <strong>Add user</strong>
                  <span>Create a new internal account</span>
                </div>
                <div class="admin-item-grid">
                  <div class="field">
                    <label for="create-user-username">Username</label>
                    <input id="create-user-username" type="text" placeholder="new.user" />
                  </div>
                  <div class="field">
                    <label for="create-user-display-name">Display name</label>
                    <input id="create-user-display-name" type="text" placeholder="New User" />
                  </div>
                  <div class="field">
                    <label for="create-user-password">Password</label>
                    <input id="create-user-password" type="password" placeholder="At least 10 characters" />
                  </div>
                  <div class="field">
                    <label for="create-user-role">Role</label>
                    <select id="create-user-role">
                      <option value="admin">admin</option>
                      <option value="principal">principal</option>
                      <option value="department_head">department_head</option>
                      <option value="staff" selected>staff</option>
                      <option value="clerk">clerk</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="create-user-department">Department</label>
                    <select id="create-user-department">
                      <option value="">No department</option>
                    </select>
                  </div>
                  <div class="field">
                    <label for="create-user-position">Position</label>
                    <input id="create-user-position" type="text" placeholder="Coordinator" />
                  </div>
                  <label class="checkbox-field">
                    <input id="create-user-active" type="checkbox" checked />
                    Active
                  </label>
                  <div class="auth-actions">
                    <button id="create-user-button" class="secondary-button" type="button">
                      Add User
                    </button>
                  </div>
                </div>
              </article>
              <div id="user-admin-list" class="admin-list"></div>
            </div>
          </div>
        </section>
      </section>

      <section id="account-view" class="content-view hidden">
        <div class="overview-grid">
          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Account</p>
              <h3>Session Access</h3>
            </div>
            <div id="account-summary" class="admin-item"></div>
            <div class="account-grid">
              <div class="field">
                <label for="username">Username</label>
                <input id="username" name="username" type="text" placeholder="alice" />
              </div>
              <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" placeholder="Enter password" />
              </div>
              <div class="auth-actions">
                <button id="login-button" class="primary-button" type="button">Log In</button>
                <button id="logout-button" class="secondary-button" type="button">Log Out</button>
              </div>
            </div>
          </section>

          <section class="panel">
            <div class="panel-header">
              <p class="eyebrow">Account</p>
              <h3>Password & Dev Fallback</h3>
            </div>
            <div class="auth-panel-row">
              <div class="field">
                <label for="current-password">Current password</label>
                <input id="current-password" name="currentPassword" type="password" placeholder="Current password" />
              </div>
              <div class="field">
                <label for="new-password">New password</label>
                <input id="new-password" name="newPassword" type="password" placeholder="New password" />
              </div>
              <div class="auth-actions">
                <button id="change-password-button" class="secondary-button" type="button">Change Password</button>
              </div>
            </div>
            <div class="auth-panel-row">
              <div class="field">
                <label for="mock-user-id">Mock user id</label>
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
              <p class="eyebrow">Legacy</p>
              <h3>Growth Tasks</h3>
              <p class="intro">Legacy growth tooling is still available, but no longer drives the main layout.</p>
            </div>
            <form id="task-form" class="task-form" novalidate>
              <div class="field">
                <label for="template">Template</label>
                <select id="template" name="template">
                  <option value="">Choose a content template</option>
                  <option value="blogSeo">Blog SEO</option>
                  <option value="facebookPost">Facebook Post</option>
                  <option value="salesEmail">Sales Email</option>
                  <option value="landingPageCopy">Landing Page Copy</option>
                </select>
              </div>
              <div class="field">
                <label for="title">Task title</label>
                <input id="title" name="title" type="text" placeholder="Write blog ideas" required />
                <p id="title-error" class="field-error hidden" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="goal">Goal</label>
                <textarea id="goal" name="goal" rows="3" placeholder="Create content ideas for a small agency" required></textarea>
                <p id="goal-error" class="field-error hidden" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="audience">Audience</label>
                <input id="audience" name="audience" type="text" placeholder="Small business owners" required />
                <p id="audience-error" class="field-error hidden" aria-live="polite"></p>
              </div>
              <div class="field">
                <label for="notes">Notes</label>
                <textarea id="notes" name="notes" rows="3" placeholder="Optional extra notes"></textarea>
              </div>
              <button id="submit-button" class="primary-button" type="submit">Create Growth Task</button>
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
  </main>
`;

const form = document.querySelector<HTMLFormElement>("#task-form")!;
const statusMessage = document.querySelector<HTMLParagraphElement>("#status-message")!;
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

if (
  !form ||
  !statusMessage ||
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

workItemSearchInput.addEventListener("input", () => {
  currentWorkItemSearch = workItemSearchInput.value.trim().toLowerCase();
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

  createWorkItemButton.disabled = true;
  setStatus("Creating work item...", "loading");

  try {
    const response = await fetch("/api/work-items", {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        title,
        description,
        departmentId: departmentId || undefined
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not create the work item")
      );
    }

    const data = (await response.json()) as WorkItemResponse;
    workItemForm.reset();
    workItemDepartmentSelect.value = "";
    await loadWorkItems();
    selectWorkItemById(data.workItem.id);
    setStatus("Work item created successfully.", "success");
  } catch (error: unknown) {
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while creating the work item.",
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
        No department assignment tasks are visible for the current user.
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
          <p><strong>Department:</strong> ${escapeHtml(item.task.ownerDepartmentId ?? "none")}</p>
          <p><strong>Assignment Status:</strong> ${escapeHtml(getAssignmentStatusForTask(item.task.assignmentId))}</p>
          <p><strong>Progress:</strong> ${escapeHtml(String(item.task.progressPercent ?? 0))}%</p>
          <p><strong>Linked Work Item:</strong> ${escapeHtml(item.task.workItemId ?? "none")}</p>
          <div class="auth-actions">
            <button
              class="secondary-button"
              type="button"
              data-open-assignment-task-id="${escapeHtml(item.task.id)}"
            >
              Open Task Detail
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
        No department tasks match the current filter.
      </div>
    `;
    hideDepartmentTaskDetail();
    return;
  }

  taskList.innerHTML = filteredTasks
    .map(
      (task) => `
        <article class="task-card ${selectedTaskId === task.task.id ? "is-selected" : ""}">
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
            ${selectedTaskId === task.task.id ? "Hide Task Detail" : "Open Task Detail"}
          </button>
        </article>
      `
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
            ${selectedTaskId === task.task.id ? "Hide Details" : "View Details"}
          </button>
          ${selectedTaskId === task.task.id ? renderTaskDetail(task) : ""}
        </article>
      `
    )
    .join("");
  bindTaskListInteractions(legacyTaskList);
}

function renderDepartmentTaskDetail(taskItem: TaskListItem): void {
  departmentTaskDetail.classList.remove("hidden");
  departmentTaskDetailTitle.textContent = taskItem.task.title;
  departmentTaskDetailMeta.textContent = [
    `Status: ${taskItem.task.status}`,
    `Department: ${taskItem.task.ownerDepartmentId ?? "none"}`,
    `Assignment: ${taskItem.task.assignmentId ?? "none"}`
  ].join(" | ");
  departmentTaskDetailBody.innerHTML = renderTaskDetail(taskItem);
  bindTaskListInteractions(departmentTaskDetailBody);
}

function hideDepartmentTaskDetail(): void {
  departmentTaskDetail.classList.add("hidden");
  departmentTaskDetailTitle.textContent = "Task Detail";
  departmentTaskDetailMeta.textContent = "";
  departmentTaskDetailBody.innerHTML = "";
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
  await refreshSelectedTaskContext();
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
  departmentTaskDetail.scrollIntoView({
    behavior: "smooth",
    block: "start"
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
          <p class="detail-label">Title</p>
          <p class="detail-value">${escapeHtml(taskItem.task.title)}</p>
        </div>
        <div>
          <p class="detail-label">Status</p>
          <p class="detail-value">${escapeHtml(taskItem.task.status)}</p>
        </div>
        <div>
          <p class="detail-label">Goal</p>
          <p class="detail-value">${escapeHtml(taskItem.task.goal)}</p>
        </div>
        <div>
          <p class="detail-label">Audience</p>
          <p class="detail-value">${escapeHtml(taskItem.task.audience)}</p>
        </div>
        <div>
          <p class="detail-label">Notes</p>
          <p class="detail-value">${escapeHtml(taskItem.task.notes ?? "No notes")}</p>
        </div>
        <div>
          <p class="detail-label">Created Time</p>
          <p class="detail-value">${formatDate(taskItem.task.createdAt)}</p>
        </div>
        <div>
          <p class="detail-label">Owner</p>
          <p class="detail-value owner-badge">${escapeHtml(getOwnerLabel(taskItem.task.ownerId))}</p>
        </div>
        <div>
          <p class="detail-label">Department</p>
          <p class="detail-value">${escapeHtml(taskItem.task.ownerDepartmentId ?? "none")}</p>
        </div>
        <div>
          <p class="detail-label">Assignment</p>
          <p class="detail-value">${escapeHtml(taskItem.task.assignmentId ?? "none")}</p>
        </div>
        <div>
          <p class="detail-label">Assignment State</p>
          <p class="detail-value">${escapeHtml(getAssignmentStatusForTask(taskItem.task.assignmentId))}</p>
        </div>
        <div>
          <p class="detail-label">Progress</p>
          <p class="detail-value">${escapeHtml(String(taskItem.task.progressPercent ?? 0))}%</p>
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Linked Work Context</p>
        <div class="detail-value">
          <p><strong>Work Item:</strong> ${escapeHtml(linkedWorkItem?.workItem.title ?? taskItem.task.workItemId ?? "none")}</p>
          <p><strong>Work Item Status:</strong> ${escapeHtml(linkedWorkItem?.workItem.status ?? "not loaded")}</p>
          <p><strong>Source Document:</strong> ${escapeHtml(linkedDocument?.document.filename ?? "none")}</p>
          ${
            linkedWorkItem?.workItem.id
              ? `
                <div class="auth-actions">
                  <button
                    class="secondary-button task-action-button"
                    type="button"
                    data-open-linked-work-item-id="${escapeHtml(linkedWorkItem.workItem.id)}"
                  >
                    Open Work Item
                  </button>
                  ${
                    linkedDocument?.document.id
                      ? `
                        <button
                          class="secondary-button task-action-button"
                          type="button"
                          data-open-linked-document-id="${escapeHtml(linkedDocument.document.id)}"
                        >
                          Open Source Document
                        </button>
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
        <p class="detail-label">Attachments</p>
        <div class="detail-value">
          ${
            linkedWorkItem && linkedWorkItem.files.length > 0
              ? linkedWorkItem.files
                  .map(
                    (file) => `
                      <p>${escapeHtml(file.filename)}${file.contentType ? ` (${escapeHtml(file.contentType)})` : ""}</p>
                    `
                  )
                  .join("")
              : linkedDocument
                ? `<p>${escapeHtml(linkedDocument.document.filename)} (source document)</p>`
                : "<p>No files attached to this task yet.</p>"
          }
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Execution Update</p>
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
        <p class="detail-label">Submit Response</p>
        <div class="detail-value">
          ${
            linkedWorkItem?.workItem.id
              ? `
                <p>Upload the department response file, then submit it for principal review. The task is not completed until the principal approves it.</p>
                <div class="auth-actions">
                  <label class="secondary-button work-item-file-label" for="task-response-file-${escapeHtml(taskItem.task.id)}">
                    Upload Response File
                  </label>
                  <input
                    id="task-response-file-${escapeHtml(taskItem.task.id)}"
                    class="hidden"
                    type="file"
                    data-response-work-item-id="${escapeHtml(linkedWorkItem.workItem.id)}"
                  />
                  <button
                    class="secondary-button task-action-button"
                    type="button"
                    data-open-linked-work-item-id="${escapeHtml(linkedWorkItem.workItem.id)}"
                    data-open-work-item-tab="files"
                  >
                    Open Work Item Files
                  </button>
                  ${
                    taskItem.task.status === "running" ||
                    taskItem.task.status === "pending"
                      ? `
                        <button
                          class="primary-button task-action-button"
                          type="button"
                          data-submit-task-response-id="${escapeHtml(taskItem.task.id)}"
                        >
                          Mark Response Submitted
                        </button>
                      `
                      : ""
                  }
                </div>
              `
              : `
                <p>No linked work item is available yet, so there is nowhere to submit a response file.</p>
              `
          }
        </div>
      </div>

      <div class="task-output">
        <p class="detail-label">Execution Timeline</p>
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
              <p class="detail-label">Submission Review</p>
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
              <p class="detail-label">Submission Review Timeline</p>
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
                              <p><strong>Reason code:</strong> ${escapeHtml(review.reasonCode ?? "none")}</p>
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
          taskItem.result?.outputText ?? "No result saved yet."
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
    `Notes: ${taskItem.task.notes ?? "No notes"}`,
    `Created Time: ${formatDate(taskItem.task.createdAt)}`,
    "",
    "Result Content:",
    taskItem.result?.outputText ?? "No result saved yet."
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
        : taskItem.result?.outputText ?? "No result saved yet.";

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
    return "No result saved yet.";
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

  if (currentMockUserId.length > 0) {
    headers["x-user-id"] = currentMockUserId;
  }

  return headers;
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
      ? `Session user: ${currentSessionUserId}${roleLabel}`
      : "Session user: not logged in";
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
        ? `Active identity: ${currentSessionUserId} (session). Dev fallback ${currentMockUserId} is ignored while the session is active.`
        : `Active identity: ${currentSessionUserId} (session).`;
    return;
  }

  if (currentMockUserId.length > 0) {
    identitySource.textContent =
      `Active identity: ${currentMockUserId} (dev fallback header). No active session.`;
    return;
  }

  identitySource.textContent = "Active identity: none. No active session.";
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
      "work-items",
      "assignments",
      "department-tasks",
      "approvals",
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

  if (!allowedViews.has(currentView)) {
    currentView = allowedViews.has("documents")
      ? "documents"
      : allowedViews.has("work-items")
        ? "work-items"
        : "overview";
  }
}

function renderAccountSummary(): void {
  accountSummary.innerHTML = `
    <div class="admin-item-grid">
      <div>
        <p class="detail-label">Session</p>
        <p class="detail-value">${escapeHtml(currentSessionUserId ?? "Not logged in")}</p>
      </div>
      <div>
        <p class="detail-label">Role</p>
        <p class="detail-value">${escapeHtml(currentSessionUser?.role ?? "guest")}</p>
      </div>
      <div>
        <p class="detail-label">Department</p>
        <p class="detail-value">${escapeHtml(currentSessionUser?.departmentName ?? currentSessionUser?.departmentId ?? "none")}</p>
      </div>
      <div>
        <p class="detail-label">Position</p>
        <p class="detail-value">${escapeHtml(currentSessionUser?.position ?? "not set")}</p>
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
        <article class="task-card ${selectedDocumentId === item.document.id ? "is-selected" : ""}">
          <div class="task-card-row">
            <h3>${escapeHtml(item.document.filename)}</h3>
            <span class="status-badge status-${escapeHtml(item.document.ocrStatus)}">
              ${escapeHtml(item.document.ocrStatus)}
            </span>
          </div>
          <p><strong>Uploaded By:</strong> ${escapeHtml(item.document.uploadedByUserId)}</p>
          <p><strong>Work Item:</strong> ${escapeHtml(item.document.createdWorkItemId ?? "not created")}</p>
          <p><strong>Created:</strong> ${formatDate(item.document.createdAt)}</p>
          <button
            class="secondary-button task-detail-button"
            type="button"
            data-document-id="${escapeHtml(item.document.id)}"
          >
            ${selectedDocumentId === item.document.id ? "Hide Details" : "Open Document"}
          </button>
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
  documentDetail.classList.remove("hidden");
  documentDetailTitle.textContent = item.document.filename;
  documentDetailMeta.textContent = [
    `OCR: ${item.document.ocrStatus}`,
    `Uploaded: ${formatDate(item.document.createdAt)}`,
    `Work Item: ${item.document.createdWorkItemId ?? "not created"}`
  ].join(" | ");

  documentDetailBody.innerHTML = `
    <div class="detail-tabs">
      <button class="tab-button is-active" type="button" data-document-tab="summary">Summary</button>
      <button class="tab-button" type="button" data-document-tab="metadata">Metadata</button>
      <button class="tab-button" type="button" data-document-tab="text">Extracted Text</button>
    </div>
    <div class="task-actions">
      <button id="analyze-document-button" class="secondary-button" type="button">Analyze Intake</button>
      <button id="create-document-work-item-button" class="secondary-button" type="button">
        Create Work Item
      </button>
    </div>
    <section class="tab-panel" data-document-panel="summary">
      <div class="task-output">
        <p class="detail-label">Extracted Summary</p>
        <pre class="task-output-text">${escapeHtml(
          item.latestAnalysis?.rawOutput ??
            item.document.extractedText?.slice(0, 2400) ??
            "No analysis or extracted text is available yet."
        )}</pre>
      </div>
    </section>
    <section class="tab-panel hidden" data-document-panel="metadata">
      <div class="task-detail-grid">
        <div>
          <p class="detail-label">Uploader</p>
          <p class="detail-value">${escapeHtml(item.document.uploadedByUserId)}</p>
        </div>
        <div>
          <p class="detail-label">Content Type</p>
          <p class="detail-value">${escapeHtml(item.document.contentType ?? "unknown")}</p>
        </div>
        <div>
          <p class="detail-label">Size</p>
          <p class="detail-value">${escapeHtml(
            item.document.sizeBytes !== undefined ? `${item.document.sizeBytes} bytes` : "unknown"
          )}</p>
        </div>
        <div>
          <p class="detail-label">Linked Work Item</p>
          <p class="detail-value">${escapeHtml(item.document.createdWorkItemId ?? "not created")}</p>
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
        <p class="detail-label">Extracted Text</p>
        <pre class="task-output-text">${escapeHtml(
          item.document.extractedText ?? "No extracted text was stored for this document."
        )}</pre>
      </div>
    </section>
  `;

  documentDetailBody
    .querySelectorAll<HTMLButtonElement>("[data-document-tab]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        setActiveDocumentDetailTab(button.dataset.documentTab ?? "summary");
      });
    });

  documentDetailBody
    .querySelector<HTMLButtonElement>("#analyze-document-button")
    ?.addEventListener("click", async () => {
      await handleAnalyzeDocument(item.document.id);
    });

  documentDetailBody
    .querySelector<HTMLButtonElement>("#create-document-work-item-button")
    ?.addEventListener("click", async () => {
      await handleCreateWorkItemFromDocument(item.document.id);
    });

  setActiveDocumentDetailTab("summary");
}

function hideDocumentDetail(): void {
  documentDetail.classList.add("hidden");
  documentDetailTitle.textContent = "Document Detail";
  documentDetailMeta.textContent = "";
  documentDetailBody.innerHTML = "";
}

function setActiveDocumentDetailTab(tabName: string): void {
  documentDetailBody
    .querySelectorAll<HTMLButtonElement>("[data-document-tab]")
    .forEach((button) => {
      button.classList.toggle("is-active", button.dataset.documentTab === tabName);
    });

  documentDetailBody
    .querySelectorAll<HTMLElement>("[data-document-panel]")
    .forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.documentPanel !== tabName);
    });
}

async function handleCreateDocument(): Promise<void> {
  if (!canUseDocumentIntake()) {
    setStatus("You must be logged in to upload a document.", "error");
    return;
  }

  const file = documentFileInput.files?.[0];

  if (!file) {
    setStatus("A document file is required.", "error");
    return;
  }

  let metadata: Record<string, unknown> = {};

  if (documentMetadataInput.value.trim().length > 0) {
    try {
      const parsed = JSON.parse(documentMetadataInput.value) as unknown;

      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error("Metadata JSON must be an object.");
      }

      metadata = parsed as Record<string, unknown>;
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Metadata JSON is invalid.",
        "error"
      );
      return;
    }
  }

  if (documentTitleInput.value.trim().length > 0) {
    metadata.note = documentTitleInput.value.trim();
  }

  createDocumentButton.disabled = true;
  setStatus("Uploading document...", "loading");

  try {
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

    metadata.originalFilename = file.name;
    metadata.inlineTextExtraction = canInlineExtractText;

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
    documentForm.reset();
    documentMetadataInput.value = "";
    documentTitleInput.value = "";
    await loadDocuments();
    await selectDocumentById(data.document.id);
    setStatus("Document uploaded successfully.", "success");
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

function renderWorkItemList(items: WorkItemListItem[]): void {
  const filteredItems = items.filter((item) => {
    if (currentWorkItemSearch.length === 0) {
      return true;
    }

    const haystack = [
      item.workItem.title,
      item.workItem.description,
      item.workItem.createdByUserId,
      item.workItem.departmentId ?? ""
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(currentWorkItemSearch);
  });

  if (filteredItems.length === 0) {
    workItemList.innerHTML = `
      <div class="empty-state">
        No work items match the current search.
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

        return `
        <article class="task-card ${selectedWorkItemId === item.workItem.id ? "is-selected" : ""}">
          <div class="task-card-row">
            <h3>${escapeHtml(item.workItem.title)}</h3>
            <span class="status-badge status-${escapeHtml(item.workItem.status)}">
              ${escapeHtml(item.workItem.status)}
            </span>
          </div>
          <p><strong>Created By:</strong> ${escapeHtml(item.workItem.createdByUserId)}</p>
          <p><strong>Department:</strong> ${escapeHtml(item.workItem.departmentId ?? "none")}</p>
          <p><strong>Updated:</strong> ${formatDate(item.workItem.updatedAt)}</p>
          <button
            class="secondary-button task-detail-button"
            type="button"
            data-work-item-id="${escapeHtml(item.workItem.id)}"
          >
            ${selectedWorkItemId === item.workItem.id ? "Hide Details" : "View Details"}
          </button>
          ${
            assignment
              ? `
                <button
                  class="secondary-button task-detail-button"
                  type="button"
                  data-open-work-item-task-id="${escapeHtml(assignment.taskId)}"
                >
                  Open Linked Task
                </button>
              `
              : ""
          }
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
    approvalsAssignmentList.innerHTML = assignmentList.innerHTML;
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
          <p><strong>Deadline:</strong> ${escapeHtml(assignment.deadline ?? "none")}</p>
          <p><strong>Output:</strong> ${escapeHtml(assignment.outputRequirement ?? "none")}</p>
          <p><strong>Adjustment Reason:</strong> ${escapeHtml(assignment.adjustmentReason ?? "none")}</p>
          <p><strong>Created:</strong> ${formatDate(assignment.createdAt)}</p>
          <div class="auth-actions">
            <button
              class="secondary-button"
              type="button"
              data-open-assignment-work-item-id="${escapeHtml(assignment.workItemId)}"
            >
              Open Work Item
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

  approvalsAssignmentList.innerHTML = assignmentList.innerHTML;
  approvalsAssignmentList
    .querySelectorAll<HTMLButtonElement>("[data-open-assignment-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        currentView = "work-items";
        renderCurrentView();
        await selectWorkItemById(button.dataset.openAssignmentWorkItemId ?? null);
      });
    });

  approvalsAssignmentList
    .querySelectorAll<HTMLButtonElement>("[data-open-assignment-task-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        currentView = "department-tasks";
        renderCurrentView();
        void focusTaskById(button.dataset.openAssignmentTaskId ?? null);
      });
    });

  renderApprovalsQueue();
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
        Assignment workspace is only available to principal or admin sessions.
      </div>
    `;
    return;
  }

  if (!selectedWorkItemId) {
    assignmentWorkspace.innerHTML = `
      <div class="empty-state">
        Select a work item from the waiting queue to review assignment details and prepare handoff.
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
        The selected work item is no longer visible.
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
      <p><strong>Deadline:</strong> ${escapeHtml(currentAssignment?.deadline ?? "none")}</p>
      <p><strong>Assignment form:</strong> Use the Work Items detail panel to submit or revise the assignment for this record.</p>
      <div class="auth-actions">
        <button class="secondary-button" type="button" data-open-assignment-workspace-item="${escapeHtml(selectedItem.workItem.id)}">
          Open in Work Items
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
    approvalsAssignmentList.innerHTML = `
      <div class="empty-state">
        Select an intake record from the queue to set the routing direction, lead department, and principal note.
      </div>
    `;
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
    approvalsAssignmentList.innerHTML = `
      <div class="empty-state">
        The selected work item is no longer visible.
      </div>
    `;
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
      <p><strong>Source document:</strong> ${escapeHtml(linkedDocument?.document.filename ?? "none")}</p>
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
        <div class="field">
          <label for="principal-output-requirement">Output requirement</label>
          <textarea id="principal-output-requirement" rows="2" placeholder="Required report or deliverable">${escapeHtml(
            selectedItem.workItem.outputRequirement ?? ""
          )}</textarea>
        </div>
        <div class="field">
          <label for="principal-note">Principal note</label>
          <textarea id="principal-note" rows="2" placeholder="Routing instruction or intake note">${escapeHtml(
            selectedItem.workItem.principalNote ?? ""
          )}</textarea>
        </div>
      </div>
      <div class="auth-actions">
        <button id="save-principal-review-button" class="primary-button" type="button">
          Save Principal Decision
        </button>
        <button id="open-principal-review-work-item-button" class="secondary-button" type="button">
          Open Work Item
        </button>
        ${
          selectedItem.workItem.status === "waiting_assignment"
            ? `
              <button id="go-to-assignment-queue-button" class="secondary-button" type="button">
                Go To Assignment Queue
              </button>
            `
            : ""
        }
      </div>
    </article>
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
      currentView = "assignments";
      renderCurrentView();
    });
}

function renderOverview(): void {
  const now = Date.now();
  const documentCount = currentDocuments.length;
  const queueCount = currentTaskItems.filter(
    (item) => item.task.taskType === "school_workflow"
  ).length;
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
    (item) => item.workItem.status === "in_review"
  ).length;
  const overdueCount = currentAssignments.filter((assignment) => {
    if (!assignment.deadline) {
      return false;
    }

    return new Date(assignment.deadline).getTime() < now;
  }).length;

  overviewCards.innerHTML = [
    { label: "New", value: String(newCount) },
    { label: "Waiting Review", value: String(waitingCount) },
    { label: "Assigned", value: String(assignedCount) },
    { label: "In Progress", value: String(inProgressCount) },
    { label: "Overdue", value: String(overdueCount) },
    { label: "Waiting Approval", value: String(waitingApprovalCount) }
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

  const needsAttentionItems = [
    documentCount > 0 ? `${documentCount} intake documents are currently visible.` : null,
    overdueCount > 0 ? `${overdueCount} assignments are overdue.` : null,
    waitingCount > 0 ? `${waitingCount} work items are still waiting review.` : null,
    queueCount > 0 ? `${queueCount} department tasks are visible in the queue.` : null,
    ...currentNotifications.slice(0, 4).map((notification) => notification.message)
  ].filter(Boolean) as string[];

  needsAttentionPanel.innerHTML =
    needsAttentionItems.length > 0
      ? needsAttentionItems
          .map(
            (item) => `
              <article class="admin-item">
                <p class="detail-value">${escapeHtml(item)}</p>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            No urgent issues are detected from the current visible data.
          </div>
        `;

  const recentActivity = [
    ...currentNotifications
      .slice(0, 2)
      .map((notification) => `Notification: ${notification.message}`),
    ...currentDocuments.slice(0, 2).map(
      (item) => `Document uploaded: ${item.document.filename}`
    ),
    ...currentWorkItems.slice(0, 3).map(
      (item) => `Work item updated: ${item.workItem.title}`
    ),
    ...currentAssignments.slice(0, 2).map(
      (assignment) => `Assignment created for ${assignment.workItemId}`
    ),
    ...currentTaskItems
      .filter((item) => item.task.taskType === "school_workflow")
      .slice(0, 2)
      .map((item) => `Task ${item.task.status}: ${item.task.title}`)
  ].slice(0, 5);

  recentActivityPanel.innerHTML =
    recentActivity.length > 0
      ? recentActivity
          .map(
            (item) => `
              <article class="admin-item">
                <p class="detail-value">${escapeHtml(item)}</p>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            Recent activity will appear here as work items, assignments, and department tasks move.
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
                  <span>${escapeHtml(String(item.assignmentCount))} assignments</span>
                </div>
                <p><strong>Documents:</strong> ${escapeHtml(String(item.documentCount))}</p>
                <p><strong>Work items:</strong> ${escapeHtml(String(item.workItemCount))}</p>
              </article>
            `
          )
          .join("")
      : `
          <div class="empty-state">
            Department summary will appear once departments are configured.
          </div>
        `;
}

function renderReports(): void {
  const completedTasks = currentTaskItems.filter(
    (item) => item.task.status === "completed"
  ).length;
  const failedTasks = currentTaskItems.filter(
    (item) => item.task.status === "failed"
  ).length;
  const assignedWorkItems = currentWorkItems.filter(
    (item) => item.workItem.status === "assigned"
  ).length;

  reportCards.innerHTML = [
    { label: "Completed Tasks", value: String(completedTasks) },
    { label: "Failed Tasks", value: String(failedTasks) },
    { label: "Assigned Work Items", value: String(assignedWorkItems) },
    { label: "Active Session", value: currentSessionUserId ? "Yes" : "No" }
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

  reportCards.innerHTML += `
    <article class="admin-item">
      <p class="detail-label">Reporting Direction</p>
      <p class="detail-value">
        This reporting module is a live scaffold, not an error state. It already surfaces operational counts from the current API and is ready for richer analytics once aggregated reporting endpoints arrive.
      </p>
    </article>
  `;
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
  workItemDetail.classList.remove("hidden");
  workItemDetailTitle.textContent = item.workItem.title;
  workItemDetailMeta.textContent = [
    `Status: ${item.workItem.status}`,
    `Created: ${formatDate(item.workItem.createdAt)}`,
    `Updated: ${formatDate(item.workItem.updatedAt)}`
  ].join(" | ");

  workItemDetailBody.innerHTML = `
    <div class="detail-tabs">
      <button class="tab-button is-active" type="button" data-detail-tab="info">Info</button>
      <button class="tab-button" type="button" data-detail-tab="files">Files</button>
      <button class="tab-button" type="button" data-detail-tab="analysis">AI Analysis</button>
      <button class="tab-button" type="button" data-detail-tab="assignment">Assignment</button>
      <button class="tab-button" type="button" data-detail-tab="history">History</button>
    </div>
    <div class="task-actions">
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
        Save Work Item
      </button>
      <label class="secondary-button work-item-file-label" for="work-item-file-input">
        Upload File
      </label>
      <input id="work-item-file-input" class="hidden" type="file" />
      <button
        id="analyze-work-item-button"
        class="secondary-button"
        type="button"
      >
        AI Analyze
      </button>
    </div>
    <section class="tab-panel" data-detail-panel="info">
      <div class="task-detail-grid">
        <div>
          <p class="detail-label">Description</p>
          <p class="detail-value">${escapeHtml(item.workItem.description)}</p>
        </div>
        <div>
          <p class="detail-label">Department</p>
          <p class="detail-value">${escapeHtml(item.workItem.departmentId ?? "none")}</p>
        </div>
        <div>
          <p class="detail-label">Created By</p>
          <p class="detail-value">${escapeHtml(item.workItem.createdByUserId)}</p>
        </div>
        <div>
          <p class="detail-label">Assigned To</p>
          <p class="detail-value">${escapeHtml(item.workItem.assignedToUserId ?? "unassigned")}</p>
        </div>
        <div>
          <p class="detail-label">Assignment Status</p>
          <p class="detail-value">${escapeHtml(
            currentAssignment ? `Assigned (${currentAssignment.priority})` : "Not assigned yet"
          )}</p>
        </div>
        <div>
          <p class="detail-label">Lead Department</p>
          <p class="detail-value">${escapeHtml(item.workItem.leadDepartmentId ?? "none")}</p>
        </div>
        <div>
          <p class="detail-label">Routing Priority</p>
          <p class="detail-value">${escapeHtml(item.workItem.routingPriority ?? "none")}</p>
        </div>
        <div>
          <p class="detail-label">Source Document</p>
          <p class="detail-value">${escapeHtml(linkedDocument?.document.filename ?? "none")}</p>
        </div>
      </div>
    </section>
    <section class="tab-panel hidden" data-detail-panel="assignment">
      <div class="task-output">
        <p class="detail-label">Current Assignment</p>
        <div class="detail-value">
          ${
            currentAssignment
              ? [
                  `Main Department: ${escapeHtml(currentAssignment.mainDepartmentId)}`,
                  `Deadline: ${escapeHtml(currentAssignment.deadline ?? "none")}`,
                  `Priority: ${escapeHtml(currentAssignment.priority)}`,
                  `Output: ${escapeHtml(currentAssignment.outputRequirement ?? "none")}`,
                  `Note: ${escapeHtml(currentAssignment.note ?? "none")}`,
                  `Task ID: ${escapeHtml(currentAssignment.taskId)}`
                ]
                  .map((line) => `<p>${line}</p>`)
                  .join("")
              : "<p>No assignment exists for this work item yet.</p>"
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
                  Open Linked Task
                </button>
                ${
                  isAdminLikeSession() &&
                  item.workItem.status === "waiting_principal_approval"
                    ? `
                      <button
                        id="approve-response-button"
                        class="primary-button"
                        type="button"
                      >
                        Approve Response
                      </button>
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
            <p class="detail-label">Principal Assignment Flow</p>
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
                  Assign Work Item
                </button>
              </div>
            </div>
          </div>
        `
        : ""
    }
  `;

  const saveButton =
    workItemDetailBody.querySelector<HTMLButtonElement>("#save-work-item-button");
  const analyzeButton =
    workItemDetailBody.querySelector<HTMLButtonElement>("#analyze-work-item-button");
  const fileInput =
    workItemDetailBody.querySelector<HTMLInputElement>("#work-item-file-input");
  const assignButton =
    workItemDetailBody.querySelector<HTMLButtonElement>("#assign-work-item-button");

  saveButton?.addEventListener("click", async () => {
    await handleSaveWorkItem(item.workItem.id);
  });

  analyzeButton?.addEventListener("click", async () => {
    await handleAnalyzeWorkItem(item.workItem.id);
  });

  fileInput?.addEventListener("change", async () => {
    await handleUploadWorkItemFile(item.workItem.id, fileInput);
  });

  assignButton?.addEventListener("click", async () => {
    await handleAssignWorkItem(item.workItem.id);
  });

  workItemDetailBody
    .querySelector<HTMLButtonElement>("#open-linked-task-button")
    ?.addEventListener("click", async () => {
      currentView = "department-tasks";
      renderCurrentView();
      await focusTaskById(currentAssignment?.taskId ?? null);
    });

  workItemDetailBody
    .querySelector<HTMLButtonElement>("#approve-response-button")
    ?.addEventListener("click", async () => {
      await handleApproveTaskResponse(currentAssignment?.taskId ?? null);
    });

  workItemDetailBody
    .querySelectorAll<HTMLButtonElement>("[data-detail-tab]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        setActiveWorkItemDetailTab(button.dataset.detailTab ?? "info");
      });
    });

  setActiveWorkItemDetailTab("info");
}

function hideWorkItemDetail(): void {
  currentWorkItemAssignments = [];
  workItemDetail.classList.add("hidden");
  workItemDetailTitle.textContent = "Work Item Detail";
  workItemDetailMeta.textContent = "";
  workItemDetailBody.innerHTML = "";
}

function setActiveWorkItemDetailTab(tabName: string): void {
  workItemDetailBody
    .querySelectorAll<HTMLButtonElement>("[data-detail-tab]")
    .forEach((button) => {
      button.classList.toggle("is-active", button.dataset.detailTab === tabName);
    });

  workItemDetailBody
    .querySelectorAll<HTMLElement>("[data-detail-panel]")
    .forEach((panel) => {
      panel.classList.toggle("hidden", panel.dataset.detailPanel !== tabName);
    });
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
          ${escapeHtml(status)}
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
  const mainDepartmentInput =
    workItemDetailBody.querySelector<HTMLSelectElement>("#assignment-main-department");
  const coordinatingDepartmentsInput =
    workItemDetailBody.querySelector<HTMLInputElement>(
      "#assignment-coordinating-departments"
    );
  const deadlineInput =
    workItemDetailBody.querySelector<HTMLInputElement>("#assignment-deadline");
  const priorityInput =
    workItemDetailBody.querySelector<HTMLSelectElement>("#assignment-priority");
  const outputRequirementInput =
    workItemDetailBody.querySelector<HTMLTextAreaElement>(
      "#assignment-output-requirement"
    );
  const noteInput =
    workItemDetailBody.querySelector<HTMLTextAreaElement>("#assignment-note");

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
          principalNote: principalNoteInput.value.trim() || undefined
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
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    const contentText = isInlineExtractableDocument(file)
      ? sanitizeUploadedText(await file.text())
      : undefined;
    const response = await fetch(`/api/work-items/${encodeURIComponent(workItemId)}/files`, {
      method: "POST",
      headers: buildApiHeaders({
        "Content-Type": "application/json"
      }),
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || "text/plain",
        sizeBytes: file.size,
        contentText
      })
    });

    if (!response.ok) {
      throw new Error(
        await readApiError(response, "The API could not upload the file")
      );
    }

    input.value = "";
    await loadWorkItems();
    await selectWorkItemById(workItemId);
    setStatus(
      contentText
        ? "Response file uploaded successfully."
        : "Response file metadata uploaded. Binary preview/download is not available in the current workflow yet.",
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
      eyebrow: "Overview",
      title: "Document Intake Overview",
      description: "Track incoming documents, review pressure, assignment load, and department execution."
    },
    documents: {
      eyebrow: "Documents",
      title: "Document Intake",
      description: "Uploaded school documents are the primary intake object before they become tracked work items."
    },
    "work-items": {
      eyebrow: "Work Items",
      title: "Operational Work Items",
      description: "Work items are now the main domain view, with detail and assignment actions side by side."
    },
    assignments: {
      eyebrow: "Assignments",
      title: "Assignment Tracking",
      description: "Review work items that are already approved for assignment and create the formal department handoff."
    },
    "department-tasks": {
      eyebrow: "Department Tasks",
      title: "Execution Queue",
      description: "Review the current department task queue and accept or reject assignments quickly."
    },
    approvals: {
      eyebrow: "Principal Review",
      title: "Principal Routing Workspace",
      description: "Review intake, choose the routing direction, and prepare work items for formal assignment."
    },
    reports: {
      eyebrow: "Reports",
      title: "Operational Summary",
      description: "Use a lightweight reporting view to monitor completion, backlog, and assignment flow."
    },
    admin: {
      eyebrow: "Admin",
      title: "School Administration",
      description: "School admin tools are isolated in their own view instead of the main dashboard."
    },
    account: {
      eyebrow: "Account",
      title: "Session & Password Controls",
      description: "Manage login, password change, and dev fallback controls in a dedicated account area."
    },
    legacy: {
      eyebrow: "Legacy",
      title: "Legacy Growth Tools",
      description: "Legacy growth-task workflows remain available without taking over the main school workflow layout."
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
