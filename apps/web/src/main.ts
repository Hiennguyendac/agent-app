import "./styles.css";

/**
 * These types describe the JSON shape returned by the existing API.
 *
 * They are kept small and local so the beginner can understand
 * the data used by this page without needing a framework first.
 */
type TaskType = "growth";
type TaskStatus = "pending" | "running" | "completed" | "failed";
type AppUserRole = "admin" | "principal" | "department_head" | "staff" | "clerk";
type WorkItemStatus = "draft" | "waiting_review" | "in_review" | "completed";

interface Task {
  id: string;
  taskType: TaskType;
  title: string;
  goal: string;
  audience: string;
  notes?: string;
  ownerId?: string;
  status: TaskStatus;
  createdAt: string;
}

interface TaskResult {
  taskId: string;
  agentName: string;
  outputText: string;
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
let currentWorkItems: WorkItemListItem[] = [];
let selectedWorkItemId: string | null = null;

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
  <main class="page">
    <section class="panel">
      <div class="panel-header">
        <p class="eyebrow">Agent App</p>
        <h1>Growth Task Dashboard</h1>
        <p class="intro">
          Create one Growth task and see the saved tasks from the MVP API.
        </p>
      </div>

      <section class="mock-user-panel" aria-label="Current mock user">
        <div class="mock-user-header">
          <div>
            <p class="detail-label">Auth v1</p>
            <p id="session-user" class="mock-user-active">Session user: checking...</p>
            <p id="identity-source" class="identity-source-note">Active identity: checking...</p>
          </div>
        </div>
        <div class="auth-panel-row">
          <div class="field">
            <label for="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="alice"
            />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter password"
            />
          </div>
          <div class="auth-actions">
            <button id="login-button" class="primary-button" type="button">
              Log In
            </button>
            <button id="logout-button" class="secondary-button" type="button">
              Log Out
            </button>
          </div>
        </div>
        <div class="auth-panel-row">
          <div class="field">
            <label for="current-password">Current password</label>
            <input
              id="current-password"
              name="currentPassword"
              type="password"
              placeholder="Current password"
            />
          </div>
          <div class="field">
            <label for="new-password">New password</label>
            <input
              id="new-password"
              name="newPassword"
              type="password"
              placeholder="New password"
            />
          </div>
          <div class="auth-actions">
            <button id="change-password-button" class="secondary-button" type="button">
              Change Password
            </button>
          </div>
        </div>
      </section>

      <section class="mock-user-panel" aria-label="Mock user fallback">
        <div class="mock-user-header">
          <div>
            <p class="detail-label">Dev Fallback</p>
            <p id="active-user" class="mock-user-active"></p>
          </div>
        </div>
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
      </section>

      <section id="admin-panel" class="mock-user-panel hidden" aria-label="School admin">
        <div class="mock-user-header">
          <div>
            <p class="detail-label">School Admin</p>
            <p class="mock-user-active">Principal-only setup for departments and user assignment.</p>
          </div>
        </div>
        <div class="admin-section">
          <div class="admin-card">
            <h3>Departments</h3>
            <div class="admin-form-row">
              <div class="field">
                <label for="department-name">Department name</label>
                <input
                  id="department-name"
                  name="departmentName"
                  type="text"
                  placeholder="Academic Affairs"
                />
              </div>
              <div class="field">
                <label for="department-code">Department code</label>
                <input
                  id="department-code"
                  name="departmentCode"
                  type="text"
                  placeholder="ACADEMIC"
                />
              </div>
              <div class="auth-actions">
                <button id="create-department-button" class="secondary-button" type="button">
                  Add Department
                </button>
              </div>
            </div>
            <div id="department-list" class="admin-list"></div>
          </div>

          <div class="admin-card">
            <h3>User Assignment</h3>
            <div id="user-admin-list" class="admin-list"></div>
          </div>
        </div>
      </section>

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

        <button id="submit-button" class="primary-button" type="submit">
          Create Growth Task
        </button>
      </form>

      <p id="status-message" class="status-message" aria-live="polite"></p>

      <section id="latest-result" class="result-card hidden" aria-live="polite">
        <h2>Latest Growth Result</h2>
        <p id="result-meta" class="result-meta"></p>
        <pre id="result-text" class="result-text"></pre>
      </section>
    </section>

    <section class="panel">
      <div class="tasks-header">
        <div>
          <p class="eyebrow">Saved Tasks</p>
          <h2>Task List</h2>
        </div>
        <button id="refresh-button" class="secondary-button" type="button">
          Refresh List
        </button>
      </div>

      <div id="task-list" class="task-list"></div>
    </section>

    <section class="panel panel-wide">
      <div class="tasks-header">
        <div>
          <p class="eyebrow">School Workflow</p>
          <h2>Work Items</h2>
        </div>
        <button id="refresh-work-items-button" class="secondary-button" type="button">
          Refresh Work Items
        </button>
      </div>

      <form id="work-item-form" class="task-form" novalidate>
        <div class="field">
          <label for="work-item-title">Work item title</label>
          <input
            id="work-item-title"
            name="workItemTitle"
            type="text"
            placeholder="Teacher leave request review"
          />
        </div>
        <div class="field">
          <label for="work-item-description">Description</label>
          <textarea
            id="work-item-description"
            name="workItemDescription"
            rows="3"
            placeholder="Describe the school workflow item"
          ></textarea>
        </div>
        <div class="field">
          <label for="work-item-department">Department</label>
          <select id="work-item-department" name="workItemDepartment">
            <option value="">No department</option>
          </select>
        </div>
        <button id="create-work-item-button" class="primary-button" type="submit">
          Create Work Item
        </button>
      </form>

      <section id="principal-queue" class="result-card hidden">
        <h3>Waiting Review Queue</h3>
        <div id="principal-queue-list" class="work-item-queue"></div>
      </section>

      <div class="work-item-layout">
        <div id="work-item-list" class="task-list"></div>
        <section id="work-item-detail" class="result-card hidden">
          <h3 id="work-item-detail-title">Work Item Detail</h3>
          <p id="work-item-detail-meta" class="result-meta"></p>
          <div id="work-item-detail-body" class="work-item-detail-body"></div>
        </section>
      </div>
    </section>
  </main>
`;

const form = document.querySelector<HTMLFormElement>("#task-form")!;
const statusMessage = document.querySelector<HTMLParagraphElement>("#status-message")!;
const taskList = document.querySelector<HTMLDivElement>("#task-list")!;
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
const workItemList = document.querySelector<HTMLDivElement>("#work-item-list")!;
const workItemDetail = document.querySelector<HTMLElement>("#work-item-detail")!;
const workItemDetailTitle =
  document.querySelector<HTMLHeadingElement>("#work-item-detail-title")!;
const workItemDetailMeta =
  document.querySelector<HTMLParagraphElement>("#work-item-detail-meta")!;
const workItemDetailBody =
  document.querySelector<HTMLDivElement>("#work-item-detail-body")!;
const principalQueue = document.querySelector<HTMLElement>("#principal-queue")!;
const principalQueueList =
  document.querySelector<HTMLDivElement>("#principal-queue-list")!;
const loginButton = document.querySelector<HTMLButtonElement>("#login-button")!;
const logoutButton = document.querySelector<HTMLButtonElement>("#logout-button")!;
const changePasswordButton =
  document.querySelector<HTMLButtonElement>("#change-password-button")!;

if (
  !form ||
  !statusMessage ||
  !taskList ||
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
  !workItemForm ||
  !workItemTitleInput ||
  !workItemDescriptionInput ||
  !workItemDepartmentSelect ||
  !createWorkItemButton ||
  !refreshWorkItemsButton ||
  !workItemList ||
  !workItemDetail ||
  !workItemDetailTitle ||
  !workItemDetailMeta ||
  !workItemDetailBody ||
  !principalQueue ||
  !principalQueueList ||
  !loginButton ||
  !logoutButton ||
  !changePasswordButton
) {
  throw new Error("One or more required UI elements were not found");
}

renderActiveUser();
renderSessionUser();

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
  await loadWorkItems();
  await loadTasks();
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
    await loadWorkItems();
    await loadTasks();
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
    await loadWorkItems();
    await loadTasks();
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
  } catch (error: unknown) {
    currentTaskItems = [];
    currentTasks = [];
    resetUserScopedUiState();
    renderTaskList([]);
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading tasks.",
      "error"
    );
  }
}

/**
 * Draws the task list in the page.
 */
function renderTaskList(tasks: TaskListItem[]): void {
  if (tasks.length === 0) {
    taskList.innerHTML = `
      <div class="empty-state">
        No tasks yet. Create your first Growth task from the form above.
      </div>
    `;
    return;
  }

  taskList.innerHTML = tasks
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
            ${
              selectedTaskId === task.task.id ? "Hide Details" : "View Details"
            }
          </button>
          ${
            selectedTaskId === task.task.id
              ? renderTaskDetail(task)
              : ""
          }
        </article>
      `
    )
    .join("");

  const detailButtons = taskList.querySelectorAll<HTMLButtonElement>(
    "[data-task-id]"
  );

  detailButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectTaskById(button.dataset.taskId ?? null);
    });
  });

  const copyButtons = taskList.querySelectorAll<HTMLButtonElement>(
    "[data-copy-mode]"
  );

  copyButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleCopyAction(button);
    });
  });

  const retryButtons = taskList.querySelectorAll<HTMLButtonElement>(
    "[data-retry-task-id]"
  );

  retryButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleRetryTask(button.dataset.retryTaskId ?? null, button);
    });
  });

  const deleteButtons = taskList.querySelectorAll<HTMLButtonElement>(
    "[data-delete-task-id]"
  );

  deleteButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      await handleDeleteTask(button.dataset.deleteTaskId ?? null, button);
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

function selectTaskById(taskId: string | null): void {
  selectedTaskId = selectedTaskId === taskId ? null : taskId;
  syncSelectedTaskDetail(currentTaskItems);
  renderTaskList(currentTaskItems);
}

function syncSelectedTaskDetail(taskItems: TaskListItem[]): void {
  if (taskItems.length === 0) {
    selectedTaskId = null;
    return;
  }

  if (!selectedTaskId) {
    return;
  }

  const selectedTask =
    taskItems.find((item) => item.task.id === selectedTaskId) ?? null;

  if (!selectedTask) {
    selectedTaskId = null;
  }
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
  selectedWorkItemId = null;
  currentWorkItems = [];
  hideLatestResult();
  hideWorkItemDetail();
  renderWorkItemList([]);
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

function canUseWorkItems(): boolean {
  return (
    currentSessionUser?.role === "principal" ||
    currentSessionUser?.role === "admin" ||
    currentSessionUser?.role === "clerk"
  );
}

function renderAdminPanel(): void {
  if (!(currentSessionUser?.role === "principal" || currentSessionUser?.role === "admin")) {
    adminPanel.classList.add("hidden");
    departmentList.innerHTML = "";
    userAdminList.innerHTML = "";
    return;
  }

  adminPanel.classList.remove("hidden");
  renderDepartmentList();
  renderUserAdminList();
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
  if (currentUsers.length === 0) {
    userAdminList.innerHTML = `
      <div class="empty-state">
        No users available for assignment.
      </div>
    `;
    return;
  }

  userAdminList.innerHTML = currentUsers
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

  userAdminList
    .querySelectorAll<HTMLButtonElement>("[data-save-user-id]")
    .forEach((button) => {
      button.addEventListener("click", async () => {
        await handleSaveUserAssignment(button.dataset.saveUserId ?? null);
      });
    });
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
  } catch (error: unknown) {
    currentDepartments = [];
    currentUsers = [];
    renderWorkItemDepartmentOptions();
    renderAdminPanel();
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading admin data.",
      "error"
    );
  }
}

async function loadWorkItems(): Promise<void> {
  if (!currentSessionUserId) {
    currentWorkItems = [];
    renderWorkItemList([]);
    renderPrincipalQueue([]);
    hideWorkItemDetail();
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
    renderPrincipalQueue(currentWorkItems);
  } catch (error: unknown) {
    currentWorkItems = [];
    selectedWorkItemId = null;
    renderWorkItemList([]);
    renderPrincipalQueue([]);
    hideWorkItemDetail();
    setStatus(
      error instanceof Error
        ? error.message
        : "Something went wrong while loading work items.",
      "error"
    );
  }
}

function renderWorkItemList(items: WorkItemListItem[]): void {
  if (items.length === 0) {
    workItemList.innerHTML = `
      <div class="empty-state">
        No work items available for the current user.
      </div>
    `;
    return;
  }

  workItemList.innerHTML = items
    .map(
      (item) => `
        <article class="task-card">
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
        </article>
      `
    )
    .join("");

  workItemList
    .querySelectorAll<HTMLButtonElement>("[data-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectWorkItemById(button.dataset.workItemId ?? null);
      });
    });
}

function renderPrincipalQueue(items: WorkItemListItem[]): void {
  if (!isAdminLikeSession()) {
    principalQueue.classList.add("hidden");
    principalQueueList.innerHTML = "";
    return;
  }

  const waitingItems = items.filter(
    (item) => item.workItem.status === "waiting_review"
  );

  principalQueue.classList.remove("hidden");

  if (waitingItems.length === 0) {
    principalQueueList.innerHTML = `
      <div class="empty-state">
        No work items are currently waiting for review.
      </div>
    `;
    return;
  }

  principalQueueList.innerHTML = waitingItems
    .map(
      (item) => `
        <button
          class="queue-item-button"
          type="button"
          data-queue-work-item-id="${escapeHtml(item.workItem.id)}"
        >
          <strong>${escapeHtml(item.workItem.title)}</strong>
          <span>${escapeHtml(item.workItem.createdByUserId)}</span>
        </button>
      `
    )
    .join("");

  principalQueueList
    .querySelectorAll<HTMLButtonElement>("[data-queue-work-item-id]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        selectWorkItemById(button.dataset.queueWorkItemId ?? null);
      });
    });
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
    const index = currentWorkItems.findIndex(
      (item) => item.workItem.id === detail.workItem.id
    );

    if (index >= 0) {
      currentWorkItems[index] = detail;
    } else {
      currentWorkItems.unshift(detail);
    }

    renderWorkItemList(currentWorkItems);
    renderPrincipalQueue(currentWorkItems);
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

function renderWorkItemDetail(item: WorkItemListItem): void {
  workItemDetail.classList.remove("hidden");
  workItemDetailTitle.textContent = item.workItem.title;
  workItemDetailMeta.textContent = [
    `Status: ${item.workItem.status}`,
    `Created: ${formatDate(item.workItem.createdAt)}`,
    `Updated: ${formatDate(item.workItem.updatedAt)}`
  ].join(" | ");

  workItemDetailBody.innerHTML = `
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
    <div class="task-output">
      <p class="detail-label">Files</p>
      <div class="work-item-files">
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
            : '<p class="detail-value">No files uploaded yet.</p>'
        }
      </div>
    </div>
    <div class="task-output">
      <p class="detail-label">Latest AI Analysis</p>
      <pre class="task-output-text">${escapeHtml(
        item.latestAnalysis?.rawOutput ?? "No analysis saved yet."
      )}</pre>
    </div>
  `;

  const saveButton =
    workItemDetailBody.querySelector<HTMLButtonElement>("#save-work-item-button");
  const analyzeButton =
    workItemDetailBody.querySelector<HTMLButtonElement>("#analyze-work-item-button");
  const fileInput =
    workItemDetailBody.querySelector<HTMLInputElement>("#work-item-file-input");

  saveButton?.addEventListener("click", async () => {
    await handleSaveWorkItem(item.workItem.id);
  });

  analyzeButton?.addEventListener("click", async () => {
    await handleAnalyzeWorkItem(item.workItem.id);
  });

  fileInput?.addEventListener("change", async () => {
    await handleUploadWorkItemFile(item.workItem.id, fileInput);
  });
}

function hideWorkItemDetail(): void {
  workItemDetail.classList.add("hidden");
  workItemDetailTitle.textContent = "Work Item Detail";
  workItemDetailMeta.textContent = "";
  workItemDetailBody.innerHTML = "";
}

function renderWorkItemStatusOptions(selectedStatus: WorkItemStatus): string {
  const statuses: WorkItemStatus[] = [
    "draft",
    "waiting_review",
    "in_review",
    "completed"
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

async function handleUploadWorkItemFile(
  workItemId: string,
  input: HTMLInputElement
): Promise<void> {
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  try {
    const contentText = await file.text();
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
    setStatus("File uploaded successfully.", "success");
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

void (async () => {
  await loadSession();
  await loadAdminData();
  await loadWorkItems();
  await loadTasks();
})();
