import "./styles.css";

/**
 * These types describe the JSON shape returned by the existing API.
 *
 * They are kept small and local so the beginner can understand
 * the data used by this page without needing a framework first.
 */
type TaskType = "growth";
type TaskStatus = "pending" | "running" | "completed" | "failed";

interface Task {
  id: string;
  taskType: TaskType;
  title: string;
  goal: string;
  audience: string;
  notes?: string;
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

interface TaskTemplate {
  label: string;
  title: string;
  goal: string;
  audience: string;
  notes: string;
}

let currentTasks: Task[] = [];
let currentTaskItems: TaskListItem[] = [];
let selectedTaskId: string | null = null;
let currentMockUserId = loadMockUserId();

const MOCK_USER_STORAGE_KEY = "agent-app.mock-user-id";
const DEFAULT_MOCK_USER_ID = "user-a";

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
            <p class="detail-label">Current User</p>
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
  !activeUser
) {
  throw new Error("One or more required UI elements were not found");
}

renderActiveUser();

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
  await loadTasks();
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
    showLatestResult(data.result);
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
    renderTaskList(taskItems);
  } catch (error: unknown) {
    currentTaskItems = [];
    currentTasks = [];
    selectedTaskId = null;
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
function showLatestResult(result: TaskResult): void {
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
    showLatestResult(data.result);
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
      ? `Active mock user: ${currentMockUserId}`
      : "Active mock user: none";
}

function normalizeMockUserId(value: string): string {
  return value.trim();
}

void loadTasks();
