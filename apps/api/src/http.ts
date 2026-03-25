import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  AppUserProfile,
  AppUserRole,
  AiAnalysis,
  AssignmentPriority,
  Department,
  Document,
  DocumentAnalysis,
  Task,
  TaskResult,
  WorkItem,
  WorkItemFile,
  WorkItemStatus
} from "../../../packages/shared-types/index.js";
import { routeTask } from "../../orchestrator/src/index.js";
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
  updateDepartment
} from "./departments.js";
import { logAuthEvent, logError, logInfo, logRequest } from "./log.js";
import { logAuditEvent } from "./log.js";
import {
  clearFailedLoginAttempts,
  getLoginRateLimitStatus,
  getLoginSourceIdentifier,
  recordFailedLoginAttempt
} from "./login-rate-limit.js";
import { getPasswordValidationError } from "./password.js";
import {
  canManageSchoolAdmin,
  isProductionIdentityRuntime,
  resolveTaskAccessContext
} from "./request-user.js";
import {
  buildClearedSessionCookieHeader,
  buildSessionCookieHeader,
  clearSession,
  createSession,
  getSessionUserId
} from "./session.js";
import {
  approveTaskResponse,
  createTask,
  deleteTaskWithAccess,
  getTaskItemById,
  listTaskItems,
  saveTaskResult,
  submitTaskResponse,
  updateTaskWithAssignmentLink,
  updateTaskStatus,
  type CreateTaskInput
} from "./store.js";
import {
  acceptAssignedTask,
  rejectAssignedTask
} from "./store.js";
import {
  createAssignment,
  createAssignmentNotification,
  getAssignmentById,
  listAssignments,
  listNotifications
} from "./assignments.js";
import {
  addWorkItemFile,
  analyzeWorkItem,
  canCreateWorkItems,
  createWorkItem,
  getWorkItemById,
  listWorkItems,
  markWorkItemAssigned,
  updateWorkItem,
  type CreateWorkItemFileInput,
  type CreateWorkItemInput,
  type UpdateWorkItemInput,
  type WorkItemListItem
} from "./work-items.js";
import {
  analyzeDocument,
  canCreateDocuments,
  createDocument,
  createWorkItemFromDocument,
  getDocumentById,
  listDocuments,
  type CreateDocumentInput
} from "./documents.js";
import {
  createUser,
  changeUserPassword,
  findUserById,
  findUserByUsername,
  listUsers,
  updateUserAssignment,
  verifyUserCredentials
} from "./users.js";

/**
 * This file contains the basic HTTP logic for the API.
 *
 * It handles:
 * - GET /health
 * - GET /tasks
 * - GET /tasks/:id
 * - POST /tasks
 * - DELETE /tasks/:id
 */

export async function handleRequest(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const method = req.method ?? "GET";
  const url = req.url ?? "/";
  const parsedUrl = new URL(url, "http://127.0.0.1");
  const pathname = parsedUrl.pathname;
  const startedAtMs = Date.now();
  const taskId = getTaskIdFromUrl(url);
  const departmentId = getDepartmentIdFromUrl(url);
  const assignmentUserId = getUserAssignmentIdFromUrl(url);
  const workItemId = getWorkItemIdFromUrl(url);
  const workItemFileTargetId = getWorkItemFileTargetIdFromUrl(url);
  const workItemAnalyzeTargetId = getWorkItemAnalyzeTargetIdFromUrl(url);
  const workItemAssignTargetId = getWorkItemAssignTargetIdFromUrl(url);
  const documentId = getDocumentIdFromUrl(url);
  const documentAnalyzeTargetId = getDocumentAnalyzeTargetIdFromUrl(url);
  const documentCreateWorkItemTargetId =
    getDocumentCreateWorkItemTargetIdFromUrl(url);
  const assignmentId = getAssignmentIdFromUrl(url);
  const taskAcceptId = getTaskAcceptIdFromUrl(url);
  const taskRejectId = getTaskRejectIdFromUrl(url);
  const taskSubmitResponseId = getTaskSubmitResponseIdFromUrl(url);
  const taskApproveResponseId = getTaskApproveResponseIdFromUrl(url);
  const accessContext = await resolveTaskAccessContext(req);
  const sessionUserId = await getSessionUserId(req);
  const sessionUser = sessionUserId ? await findUserById(sessionUserId) : null;

  if (method === "GET" && url === "/health") {
    sendJson(res, 200, {
      status: "ok"
    }, startedAtMs, method, url);
    return;
  }

  if (method === "GET" && url === "/auth/session") {
    sendJson(
      res,
      200,
      {
        authenticated: sessionUserId !== null,
        userId: sessionUserId,
        user: sessionUser ? mapAppUserProfileForResponse(sessionUser) : null
      },
      startedAtMs,
      method,
      url,
      {
        userId: sessionUserId
      }
    );
    return;
  }

  if (method === "POST" && url === "/auth/login") {
    const body = await readJsonBody(req);
    const credentials = getLoginCredentials(body);
    const username = credentials.username;
    const password = credentials.password;
    const sourceId = getLoginSourceIdentifier(req);

    if (!username) {
      sendJson(
        res,
        400,
        {
          error: "Field 'username' is required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null
        }
      );
      return;
    }

    if (!password) {
      sendJson(
        res,
        400,
        {
          error: "Field 'password' is required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null
        }
      );
      return;
    }

    const rateLimitStatus = getLoginRateLimitStatus(sourceId, username);

    if (rateLimitStatus.limited) {
      logAuthEvent(
        "login.blocked",
        {
          username,
          outcome: "rate-limited",
          sourceId,
          retryAfterSeconds: rateLimitStatus.retryAfterSeconds
        },
        "WARN"
      );

      sendJson(
        res,
        429,
        {
          error: "Too many login attempts"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null,
          username,
          sourceId
        },
        {
          "Retry-After": String(rateLimitStatus.retryAfterSeconds)
        }
      );
      return;
    }

    const authResult = await verifyUserCredentials(username, password);

    if (!authResult.ok && authResult.reason === "unknown-user") {
      recordFailedLoginAttempt(sourceId, username);
      logAuthEvent(
        "login.failed",
        {
          username,
          outcome: "unknown-user",
          sourceId
        },
        "WARN"
      );
      logInfo("Login rejected", {
        username,
        reason: "unknown-user"
      });

      sendJson(
        res,
        403,
        {
          error: "Unknown user"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null
        }
      );
      return;
    }

    if (!authResult.ok && authResult.reason === "inactive-user") {
      recordFailedLoginAttempt(sourceId, username);
      logAuthEvent(
        "login.failed",
        {
          username,
          outcome: "inactive-user",
          sourceId
        },
        "WARN"
      );
      logInfo("Login rejected", {
        username,
        reason: "inactive-user"
      });

      sendJson(
        res,
        403,
        {
          error: "User is inactive"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null
        }
      );
      return;
    }

    if (!authResult.ok) {
      recordFailedLoginAttempt(sourceId, username);
      logAuthEvent(
        "login.failed",
        {
          username,
          outcome: "invalid-password",
          sourceId
        },
        "WARN"
      );
      logInfo("Login rejected", {
        username,
        reason: "invalid-password"
      });

      sendJson(
        res,
        403,
        {
          error: "Invalid credentials"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null
        }
      );
      return;
    }

    clearFailedLoginAttempts(sourceId, username);
    const sessionId = await createSession(authResult.user.id);

    logAuthEvent("login.succeeded", {
      username,
      userId: authResult.user.id,
      outcome: "success",
      sourceId
    });
    logInfo("User logged in", {
      userId: authResult.user.id
    });

    sendJson(
      res,
      200,
      {
        authenticated: true,
        userId: authResult.user.id,
        user: mapAppUserProfileForResponse(authResult.user)
      },
      startedAtMs,
      method,
      url,
      {
        userId: authResult.user.id
      },
      {
        "Set-Cookie": buildSessionCookieHeader(sessionId)
      }
    );
    return;
  }

  if (method === "POST" && url === "/auth/logout") {
    await clearSession(req);
    logAuthEvent("logout", {
      userId: sessionUserId,
      sourceId: getLoginSourceIdentifier(req),
      outcome: "logout"
    });

    logInfo("User logged out", {
      userId: sessionUserId
    });

    sendJson(
      res,
      200,
      {
        authenticated: false,
        userId: null,
        user: null
      },
      startedAtMs,
      method,
      url,
      {
        userId: sessionUserId
      },
      {
        "Set-Cookie": buildClearedSessionCookieHeader()
      }
    );
    return;
  }

  if (method === "POST" && url === "/auth/change-password") {
    if (!sessionUserId) {
      sendJson(
        res,
        401,
        {
          error: "Authentication required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: null
        }
      );
      return;
    }

    const body = await readJsonBody(req);
    const passwordChangeInput = getPasswordChangeInput(body);

    if (!passwordChangeInput.currentPassword) {
      sendJson(
        res,
        400,
        {
          error: "Field 'currentPassword' is required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: sessionUserId
        }
      );
      return;
    }

    if (!passwordChangeInput.newPassword) {
      sendJson(
        res,
        400,
        {
          error: "Field 'newPassword' is required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: sessionUserId
        }
      );
      return;
    }

    const passwordValidationError = getPasswordValidationError(
      passwordChangeInput.newPassword
    );

    if (passwordValidationError) {
      sendJson(
        res,
        400,
        {
          error: passwordValidationError
        },
        startedAtMs,
        method,
        url,
        {
          userId: sessionUserId
        }
      );
      return;
    }

    const changeResult = await changeUserPassword(
      sessionUserId,
      passwordChangeInput.currentPassword,
      passwordChangeInput.newPassword
    );

    if (!changeResult.ok && changeResult.reason === "invalid-current-password") {
      logAuthEvent(
        "password-change.failed",
        {
          userId: sessionUserId,
          outcome: "invalid-current-password",
          sourceId: getLoginSourceIdentifier(req)
        },
        "WARN"
      );

      sendJson(
        res,
        403,
        {
          error: "Current password is incorrect"
        },
        startedAtMs,
        method,
        url,
        {
          userId: sessionUserId
        }
      );
      return;
    }

    if (!changeResult.ok && changeResult.reason === "inactive-user") {
      sendJson(
        res,
        403,
        {
          error: "User is inactive"
        },
        startedAtMs,
        method,
        url,
        {
          userId: sessionUserId
        }
      );
      return;
    }

    if (!changeResult.ok) {
      sendJson(
        res,
        404,
        {
          error: "User not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: sessionUserId
        }
      );
      return;
    }

    logAuthEvent("password-change.succeeded", {
      userId: sessionUserId,
      outcome: "success",
      sourceId: getLoginSourceIdentifier(req)
    });

    sendJson(
      res,
      200,
      {
        success: true
      },
      startedAtMs,
      method,
      url,
      {
        userId: sessionUserId
      }
    );
    return;
  }

  const requiresAuthenticatedAdminSession =
    method === "POST" && url === "/departments" ||
    method === "PUT" && departmentId !== null ||
    method === "DELETE" && departmentId !== null ||
    method === "POST" && url === "/users" ||
    method === "GET" && url === "/users" ||
    method === "PUT" && assignmentUserId !== null;

  const requiresAuthenticatedSchoolRead =
    method === "GET" && url === "/departments";

  if (
    (requiresAuthenticatedAdminSession || requiresAuthenticatedSchoolRead) &&
    isProductionIdentityRuntime() &&
    sessionUserId === null
  ) {
    sendJson(
      res,
      401,
      {
        error: "Authentication required"
      },
      startedAtMs,
      method,
      url,
      {
        userId: null
      }
    );
    return;
  }

  if (
    (requiresAuthenticatedAdminSession || requiresAuthenticatedSchoolRead) &&
    !accessContext.userId
  ) {
    sendJson(
      res,
      401,
      {
        error: "Authentication required"
      },
      startedAtMs,
      method,
      url,
      {
        userId: null
      }
    );
    return;
  }

  if (method === "GET" && url === "/departments") {
    sendJson(
      res,
      200,
      {
        departments: await listDepartments()
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId
      }
    );
    return;
  }

  if (requiresAuthenticatedAdminSession && !canManageSchoolAdmin(accessContext)) {
    sendJson(
      res,
      403,
      {
        error: "Principal access required"
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId
      }
    );
    return;
  }

  if (method === "POST" && url === "/departments") {
    const body = await readJsonBody(req);
    const input = getDepartmentInput(body);

    if (input.error) {
      sendJson(
        res,
        400,
        {
          error: input.error
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId
        }
      );
      return;
    }

    const department = await createDepartment(input.value);
    sendJson(
      res,
      201,
      {
        department
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        departmentId: department.id
      }
    );
    return;
  }

  if (method === "PUT" && departmentId) {
    const body = await readJsonBody(req);
    const input = getDepartmentInput(body);

    if (input.error) {
      sendJson(
        res,
        400,
        {
          error: input.error
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          departmentId
        }
      );
      return;
    }

    const department = await updateDepartment(departmentId, input.value);

    if (!department) {
      sendJson(
        res,
        404,
        {
          error: "Department not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          departmentId
        }
      );
      return;
    }

    sendJson(
      res,
      200,
      {
        department
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        departmentId
      }
    );
    return;
  }

  if (method === "DELETE" && departmentId) {
    const deleted = await deleteDepartment(departmentId);

    if (!deleted) {
      sendJson(
        res,
        404,
        {
          error: "Department not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          departmentId
        }
      );
      return;
    }

    sendJson(
      res,
      200,
      {
        success: true
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        departmentId
      }
    );
    return;
  }

  if (method === "GET" && url === "/users") {
    sendJson(
      res,
      200,
      {
        users: await listUsers()
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId
      }
    );
    return;
  }

  if (method === "POST" && url === "/users") {
    const body = await readJsonBody(req);
    const input = getCreateUserInput(body);

    if (input.error) {
      sendJson(
        res,
        400,
        {
          error: input.error
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId
        }
      );
      return;
    }

    const existingUser = await findUserByUsername(input.value.username);

    if (existingUser) {
      sendJson(
        res,
        409,
        {
          error: "User already exists"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          username: input.value.username
        }
      );
      return;
    }

    const user = await createUser(input.value);

    sendJson(
      res,
      201,
      {
        user
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        username: user.username
      }
    );
    return;
  }

  if (method === "PUT" && assignmentUserId) {
    const body = await readJsonBody(req);
    const input = getUserAssignmentInput(body);

    if (input.error) {
      sendJson(
        res,
        400,
        {
          error: input.error
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          assignmentUserId
        }
      );
      return;
    }

    const updatedUser = await updateUserAssignment(assignmentUserId, input.value);

    if (!updatedUser) {
      sendJson(
        res,
        404,
        {
          error: "User not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          assignmentUserId
        }
      );
      return;
    }

    sendJson(
      res,
      200,
      {
        user: updatedUser
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        assignmentUserId
      }
    );
    return;
  }

  const isWorkItemRoute =
    (method === "GET" && url === "/notifications") ||
    (method === "POST" && url === "/documents") ||
    (method === "GET" && url === "/documents") ||
    (method === "GET" && documentId !== null) ||
    (method === "POST" && documentAnalyzeTargetId !== null) ||
    (method === "POST" && documentCreateWorkItemTargetId !== null) ||
    (method === "POST" && url === "/work-items") ||
    (method === "GET" && url === "/work-items") ||
    (method === "GET" && workItemId !== null) ||
    (method === "PATCH" && workItemId !== null) ||
    (method === "POST" && workItemFileTargetId !== null) ||
    (method === "POST" && workItemAnalyzeTargetId !== null) ||
    (method === "POST" && workItemAssignTargetId !== null) ||
    (method === "GET" && assignmentId !== null) ||
    (method === "GET" && pathname === "/assignments");

  if (isWorkItemRoute && !accessContext.userId) {
    sendJson(
      res,
      401,
      {
        error: "Authentication required"
      },
      startedAtMs,
      method,
      url,
      {
        userId: null
      }
    );
    return;
  }

  if (method === "POST" && url === "/work-items") {
    if (!canCreateWorkItems(accessContext)) {
      sendJson(
        res,
        403,
        {
          error: "You are not allowed to create work items"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId
        }
      );
      return;
    }

    const body = await readJsonBody(req);

    if (!isCreateWorkItemInput(body)) {
      sendJson(
        res,
        400,
        {
          error: getCreateWorkItemInputError(body)
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId
        }
      );
      return;
    }

    const workItem = await createWorkItem(body, accessContext.userId as string);
    logAuditEvent("work_item.created", {
      userId: accessContext.userId,
      workItemId: workItem.id,
      status: workItem.status
    });

    sendJson(
      res,
      201,
      {
        workItem
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId: workItem.id
      }
    );
    return;
  }

  if (method === "POST" && url === "/documents") {
    if (!(await canCreateDocuments(accessContext))) {
      sendJson(
        res,
        403,
        {
          error: "You are not allowed to create documents"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId
        }
      );
      return;
    }

    const body = await readJsonBody(req);

    if (!isCreateDocumentInput(body)) {
      sendJson(
        res,
        400,
        {
          error: getCreateDocumentInputError(body)
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId
        }
      );
      return;
    }

    const document = await createDocument(body, accessContext.userId as string);
    logAuditEvent("document.created", {
      userId: accessContext.userId,
      documentId: document.id,
      ocrStatus: document.ocrStatus
    });

    sendJson(
      res,
      201,
      {
        document
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        documentId: document.id
      }
    );
    return;
  }

  if (method === "GET" && url === "/documents") {
    sendJson(
      res,
      200,
      {
        documents: await listDocuments(accessContext)
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId
      }
    );
    return;
  }

  if (method === "GET" && documentId) {
    const document = await getDocumentById(documentId, accessContext);

    if (!document) {
      sendJson(
        res,
        404,
        {
          error: "Document not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          documentId
        }
      );
      return;
    }

    sendJson(
      res,
      200,
      document,
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        documentId
      }
    );
    return;
  }

  if (method === "POST" && documentAnalyzeTargetId) {
    const analysis = await analyzeDocument(
      documentAnalyzeTargetId,
      accessContext.userId as string,
      accessContext
    );

    if (!analysis) {
      sendJson(
        res,
        404,
        {
          error: "Document not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          documentId: documentAnalyzeTargetId
        }
      );
      return;
    }

    logAuditEvent("document.analyzed", {
      userId: accessContext.userId,
      documentId: documentAnalyzeTargetId,
      model: analysis.model ?? null
    });

    sendJson(
      res,
      201,
      {
        analysis
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        documentId: documentAnalyzeTargetId
      }
    );
    return;
  }

  if (method === "POST" && documentCreateWorkItemTargetId) {
    const detail = await getDocumentById(documentCreateWorkItemTargetId, accessContext);

    if (!detail) {
      sendJson(
        res,
        404,
        {
          error: "Document not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          documentId: documentCreateWorkItemTargetId
        }
      );
      return;
    }

    if (!canCreateWorkItems(accessContext)) {
      sendJson(
        res,
        403,
        {
          error: "You are not allowed to create work items from documents"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          documentId: documentCreateWorkItemTargetId
        }
      );
      return;
    }

    const body = await readJsonBody(req);
    const workItemInput = getCreateWorkItemFromDocumentInput(body, detail.document);

    if (workItemInput.error) {
      sendJson(
        res,
        400,
        {
          error: workItemInput.error
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          documentId: documentCreateWorkItemTargetId
        }
      );
      return;
    }

    const created = await createWorkItemFromDocument(
      documentCreateWorkItemTargetId,
      workItemInput.value,
      accessContext
    );

    if (!created) {
      sendJson(
        res,
        404,
        {
          error: "Document not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          documentId: documentCreateWorkItemTargetId
        }
      );
      return;
    }

    logAuditEvent("document.work_item_created", {
      userId: accessContext.userId,
      documentId: created.document.id,
      workItemId: created.workItem.id
    });

    sendJson(
      res,
      201,
      created,
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        documentId: created.document.id,
        workItemId: created.workItem.id
      }
    );
    return;
  }

  if (method === "GET" && url === "/work-items") {
    sendJson(
      res,
      200,
      {
        workItems: await listWorkItems(accessContext)
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId
      }
    );
    return;
  }

  if (method === "GET" && workItemId) {
    const workItem = await getWorkItemById(workItemId, accessContext);

    if (!workItem) {
      sendJson(
        res,
        404,
        {
          error: "Work item not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId
        }
      );
      return;
    }

    sendJson(
      res,
      200,
      workItem,
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId
      }
    );
    return;
  }

  if (method === "PATCH" && workItemId) {
    const body = await readJsonBody(req);

    if (!isUpdateWorkItemInput(body)) {
      sendJson(
        res,
        400,
        {
          error: getUpdateWorkItemInputError(body)
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId
        }
      );
      return;
    }

    const updatedWorkItem = await updateWorkItem(workItemId, body, accessContext);

    if (!updatedWorkItem) {
      sendJson(
        res,
        404,
        {
          error: "Work item not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId
        }
      );
      return;
    }

    logAuditEvent("work_item.updated", {
      userId: accessContext.userId,
      workItemId: updatedWorkItem.id,
      status: updatedWorkItem.status
    });

    sendJson(
      res,
      200,
      {
        workItem: updatedWorkItem
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId: updatedWorkItem.id
      }
    );
    return;
  }

  if (method === "POST" && workItemFileTargetId) {
    const existingWorkItem = await getWorkItemById(
      workItemFileTargetId,
      accessContext
    );

    if (!existingWorkItem) {
      sendJson(
        res,
        404,
        {
          error: "Work item not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId: workItemFileTargetId
        }
      );
      return;
    }

    const body = await readJsonBody(req);

    if (!isCreateWorkItemFileInput(body)) {
      sendJson(
        res,
        400,
        {
          error: getCreateWorkItemFileInputError(body)
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId: workItemFileTargetId
        }
      );
      return;
    }

    const file = await addWorkItemFile(
      workItemFileTargetId,
      body,
      accessContext.userId as string
    );

    if (
      accessContext.role === "department_head" ||
      accessContext.role === "staff" ||
      accessContext.role === "clerk"
    ) {
      await updateWorkItem(
        workItemFileTargetId,
        {
          status: "in_review"
        },
        accessContext
      );
    }

    await createAssignmentNotification({
      message: `Response file uploaded for ${existingWorkItem.workItem.title}`,
      recipientDepartmentId: existingWorkItem.workItem.departmentId,
      workItemId: existingWorkItem.workItem.id
    });

    logAuditEvent("work_item.file_uploaded", {
      userId: accessContext.userId,
      workItemId: workItemFileTargetId,
      filename: file.filename
    });

    sendJson(
      res,
      201,
      {
        file
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId: workItemFileTargetId
      }
    );
    return;
  }

  if (method === "POST" && workItemAnalyzeTargetId) {
    const analysis = await analyzeWorkItem(
      workItemAnalyzeTargetId,
      accessContext.userId as string,
      accessContext
    );

    if (!analysis) {
      sendJson(
        res,
        404,
        {
          error: "Work item not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId: workItemAnalyzeTargetId
        }
      );
      return;
    }

    logAuditEvent("work_item.ai_analyzed", {
      userId: accessContext.userId,
      workItemId: workItemAnalyzeTargetId,
      model: analysis.model ?? null
    });

    sendJson(
      res,
      201,
      {
        analysis
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId: workItemAnalyzeTargetId
      }
    );
    return;
  }

  if (method === "POST" && workItemAssignTargetId) {
    if (accessContext.role !== "principal") {
      sendJson(
        res,
        403,
        {
          error: "Principal access required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId: workItemAssignTargetId
        }
      );
      return;
    }

    const detail = await getWorkItemById(workItemAssignTargetId, accessContext);

    if (!detail) {
      sendJson(
        res,
        404,
        {
          error: "Work item not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId: workItemAssignTargetId
        }
      );
      return;
    }

    const body = await readJsonBody(req);
    const assignmentInput = getCreateAssignmentInput(body);

    if (assignmentInput.error) {
      sendJson(
        res,
        400,
        {
          error: assignmentInput.error
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          workItemId: workItemAssignTargetId
        }
      );
      return;
    }

    const task = await createTask(
      {
        taskType: "school_workflow",
        title: `Assignment: ${detail.workItem.title}`,
        goal: assignmentInput.value.outputRequirement ?? detail.workItem.description,
        audience: assignmentInput.value.mainDepartmentId,
        notes: assignmentInput.value.note,
        workItemId: detail.workItem.id,
        ownerDepartmentId: assignmentInput.value.mainDepartmentId,
        progressPercent: 0
      },
      null
    );

    const assignment = await createAssignment({
      workItemId: detail.workItem.id,
      mainDepartmentId: assignmentInput.value.mainDepartmentId,
      coordinatingDepartmentIds: assignmentInput.value.coordinatingDepartmentIds,
      deadline: assignmentInput.value.deadline,
      priority: assignmentInput.value.priority,
      outputRequirement: assignmentInput.value.outputRequirement,
      note: assignmentInput.value.note,
      taskId: task.id,
      createdByUserId: accessContext.userId as string
    });

    await updateTaskWithAssignmentLink(task.id, assignment.id);
    await updateWorkItem(
      detail.workItem.id,
      {
        departmentId: assignment.mainDepartmentId,
        status: "assigned"
      },
      accessContext
    );

    await createAssignmentNotification({
      message: `New assignment for work item ${detail.workItem.title}`,
      recipientDepartmentId: assignment.mainDepartmentId,
      assignmentId: assignment.id,
      workItemId: detail.workItem.id
    });

    for (const departmentId of assignment.coordinatingDepartmentIds) {
      await createAssignmentNotification({
        message: `Coordinating department requested for ${detail.workItem.title}`,
        recipientDepartmentId: departmentId,
        assignmentId: assignment.id,
        workItemId: detail.workItem.id
      });
    }

    logAuditEvent("work_item.assigned", {
      userId: accessContext.userId,
      workItemId: detail.workItem.id,
      assignmentId: assignment.id,
      taskId: task.id
    });

    sendJson(
      res,
      201,
      {
        assignment,
        task
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId: detail.workItem.id,
        assignmentId: assignment.id,
        taskId: task.id
      }
    );
    return;
  }

  if (method === "GET" && assignmentId) {
    const assignment = await getAssignmentById(assignmentId, accessContext);

    if (!assignment) {
      sendJson(
        res,
        404,
        {
          error: "Assignment not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          assignmentId
        }
      );
      return;
    }

    sendJson(
      res,
      200,
      assignment,
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        assignmentId
      }
    );
    return;
  }

  if (method === "GET" && pathname === "/assignments") {
    const workItemIdFilter =
      parsedUrl.searchParams.get("work_item_id")?.trim() || undefined;

    sendJson(
      res,
      200,
      {
        assignments: await listAssignments(accessContext, {
          workItemId: workItemIdFilter
        })
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        workItemId: workItemIdFilter
      }
    );
    return;
  }

  if (method === "GET" && url === "/notifications") {
    sendJson(
      res,
      200,
      {
        notifications: await listNotifications(accessContext)
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId
      }
    );
    return;
  }

  if (method === "POST" && taskAcceptId) {
    const existingTask = await getTaskItemById(taskAcceptId, accessContext);

    if (!existingTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskAcceptId
        }
      );
      return;
    }

    const updatedTask = await acceptAssignedTask(taskAcceptId);

    if (!updatedTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskAcceptId
        }
      );
      return;
    }

    logAuditEvent("task.assignment_accepted", {
      userId: accessContext.userId,
      taskId: updatedTask.id,
      assignmentId: updatedTask.assignmentId ?? null
    });

    if (updatedTask.assignmentId) {
      const assignmentDetail = await getAssignmentById(
        updatedTask.assignmentId,
        accessContext
      );

      await createAssignmentNotification({
        message: `Task accepted: ${updatedTask.title}`,
        recipientDepartmentId:
          assignmentDetail?.assignment.mainDepartmentId ??
          updatedTask.ownerDepartmentId,
        recipientUserId: assignmentDetail?.assignment.createdByUserId,
        assignmentId: updatedTask.assignmentId,
        workItemId: updatedTask.workItemId
      });
    }

    sendJson(
      res,
      200,
      {
        task: updatedTask
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        taskId: updatedTask.id
      }
    );
    return;
  }

  if (method === "POST" && taskRejectId) {
    const existingTask = await getTaskItemById(taskRejectId, accessContext);

    if (!existingTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskRejectId
        }
      );
      return;
    }

    const updatedTask = await rejectAssignedTask(taskRejectId);

    if (!updatedTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskRejectId
        }
      );
      return;
    }

    logAuditEvent("task.assignment_rejected", {
      userId: accessContext.userId,
      taskId: updatedTask.id,
      assignmentId: updatedTask.assignmentId ?? null
    });

    if (updatedTask.assignmentId) {
      const assignmentDetail = await getAssignmentById(
        updatedTask.assignmentId,
        accessContext
      );

      await createAssignmentNotification({
        message: `Task rejected: ${updatedTask.title}`,
        recipientDepartmentId:
          assignmentDetail?.assignment.mainDepartmentId ??
          updatedTask.ownerDepartmentId,
        recipientUserId: assignmentDetail?.assignment.createdByUserId,
        assignmentId: updatedTask.assignmentId,
        workItemId: updatedTask.workItemId
      });
    }

    sendJson(
      res,
      200,
      {
        task: updatedTask
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        taskId: updatedTask.id
      }
    );
    return;
  }

  if (method === "POST" && taskSubmitResponseId) {
    const existingTask = await getTaskItemById(taskSubmitResponseId, accessContext);

    if (!existingTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskSubmitResponseId
        }
      );
      return;
    }

    const updatedTask = await submitTaskResponse(taskSubmitResponseId);

    if (!updatedTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskSubmitResponseId
        }
      );
      return;
    }

    if (updatedTask.workItemId) {
      await updateWorkItem(
        updatedTask.workItemId,
        {
          status: "in_review"
        },
        accessContext
      );
    }

    logAuditEvent("task.response_submitted", {
      userId: accessContext.userId,
      taskId: updatedTask.id,
      assignmentId: updatedTask.assignmentId ?? null,
      workItemId: updatedTask.workItemId ?? null
    });

    if (updatedTask.assignmentId) {
      const assignmentDetail = await getAssignmentById(
        updatedTask.assignmentId,
        accessContext
      );

      await createAssignmentNotification({
        message: `Department response submitted: ${updatedTask.title}`,
        recipientDepartmentId:
          assignmentDetail?.assignment.mainDepartmentId ??
          updatedTask.ownerDepartmentId,
        recipientUserId: assignmentDetail?.assignment.createdByUserId,
        assignmentId: updatedTask.assignmentId,
        workItemId: updatedTask.workItemId
      });
    }

    sendJson(
      res,
      200,
      {
        task: updatedTask
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        taskId: updatedTask.id
      }
    );
    return;
  }

  if (method === "POST" && taskApproveResponseId) {
    if (!(accessContext.role === "principal" || accessContext.role === "admin")) {
      sendJson(
        res,
        403,
        {
          error: "Principal or admin access required"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskApproveResponseId
        }
      );
      return;
    }

    const existingTask = await getTaskItemById(taskApproveResponseId, accessContext);

    if (!existingTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskApproveResponseId
        }
      );
      return;
    }

    const updatedTask = await approveTaskResponse(taskApproveResponseId);

    if (!updatedTask) {
      sendJson(
        res,
        404,
        {
          error: "Task not found"
        },
        startedAtMs,
        method,
        url,
        {
          userId: accessContext.userId,
          taskId: taskApproveResponseId
        }
      );
      return;
    }

    if (updatedTask.workItemId) {
      await updateWorkItem(
        updatedTask.workItemId,
        {
          status: "completed"
        },
        accessContext
      );
    }

    logAuditEvent("task.response_approved", {
      userId: accessContext.userId,
      taskId: updatedTask.id,
      assignmentId: updatedTask.assignmentId ?? null,
      workItemId: updatedTask.workItemId ?? null
    });

    if (updatedTask.assignmentId) {
      const assignmentDetail = await getAssignmentById(
        updatedTask.assignmentId,
        accessContext
      );

      await createAssignmentNotification({
        message: `Response approved: ${updatedTask.title}`,
        recipientDepartmentId:
          assignmentDetail?.assignment.mainDepartmentId ??
          updatedTask.ownerDepartmentId,
        assignmentId: updatedTask.assignmentId,
        workItemId: updatedTask.workItemId
      });
    }

    sendJson(
      res,
      200,
      {
        task: updatedTask
      },
      startedAtMs,
      method,
      url,
      {
        userId: accessContext.userId,
        taskId: updatedTask.id
      }
    );
    return;
  }

  const requiresAuthenticatedTaskSession =
    (method === "GET" && url === "/tasks") ||
    (method === "POST" && url === "/tasks") ||
    (method === "GET" && taskId !== null) ||
    (method === "DELETE" && taskId !== null) ||
    (method === "POST" && taskAcceptId !== null) ||
    (method === "POST" && taskRejectId !== null) ||
    (method === "POST" && taskSubmitResponseId !== null) ||
    (method === "POST" && taskApproveResponseId !== null);

  if (
    requiresAuthenticatedTaskSession &&
    isProductionIdentityRuntime() &&
    sessionUserId === null
  ) {
    sendJson(
      res,
      401,
      {
        error: "Authentication required"
      },
      startedAtMs,
      method,
      url,
      {
        userId: null
      }
    );
    return;
  }

  if (method === "GET" && url === "/tasks") {
    logInfo("Listing tasks", {
      userId: accessContext.userId
    });
    sendJson(res, 200, {
      tasks: await listTaskItems(accessContext)
    }, startedAtMs, method, url, {
      userId: accessContext.userId
    });
    return;
  }

  if (method === "POST" && url === "/tasks") {
    const body = await readJsonBody(req);
    logInfo("Received task creation request", {
      userId: accessContext.userId
    });

    if (!isCreateTaskInput(body)) {
      sendJson(res, 400, {
        error: getCreateTaskInputError(body)
      }, startedAtMs, method, url);
      return;
    }

    const task = await createTask(body, accessContext.userId);

    try {
      await updateTaskStatus(task.id, "running");
      const result = await routeTask(task);
      await saveTaskResult(result);
      const updatedTask = (await updateTaskStatus(task.id, "completed")) ?? task;

      logInfo("Task completed", {
        taskId: updatedTask.id,
        status: updatedTask.status
      });

      sendJson(res, 201, {
        task: updatedTask,
        result
      }, startedAtMs, method, url, {
        taskId: updatedTask.id,
        userId: accessContext.userId
      });
    } catch (error: unknown) {
      const failedTask = (await updateTaskStatus(task.id, "failed")) ?? {
        ...task,
        status: "failed"
      };
      const failureMessage =
        error instanceof Error ? error.message : "Failed to process task";
      const failureResult = buildFailureTaskResult(failedTask, failureMessage);

      logError("Task processing failed", {
        taskId: failedTask.id,
        error: failureMessage
      });

      try {
        await saveTaskResult(failureResult);
      } catch (saveError: unknown) {
        logError("Failed to persist task failure result", {
          taskId: failedTask.id,
          error: saveError instanceof Error ? saveError.message : String(saveError)
        });
      }

      sendJson(
        res,
        201,
        {
          task: failedTask,
          result: failureResult,
          error: failureMessage
        },
        startedAtMs,
        method,
        url,
        {
          taskId: failedTask.id,
          userId: accessContext.userId
        }
      );
    }
    return;
  }

  if (method === "GET" && taskId) {
    const taskItem = await getTaskItemById(taskId, accessContext);

    if (!taskItem) {
      sendJson(res, 404, {
        error: "Task not found"
      }, startedAtMs, method, url, {
        taskId,
        userId: accessContext.userId
      });
      return;
    }

    sendJson(res, 200, taskItem, startedAtMs, method, url, {
      taskId,
      userId: accessContext.userId
    });
    return;
  }

  if (method === "DELETE" && taskId) {
    const deleted = await deleteTaskWithAccess(taskId, accessContext);

    if (!deleted) {
      sendJson(res, 404, {
        error: "Task not found"
      }, startedAtMs, method, url, {
        taskId,
        userId: accessContext.userId
      });
      return;
    }

    logInfo("Task deleted", {
      taskId,
      userId: accessContext.userId
    });

    sendJson(res, 200, {
      success: true
    }, startedAtMs, method, url, {
      taskId,
      userId: accessContext.userId
    });
    return;
  }

  sendJson(res, 404, {
    error: "Route not found"
  }, startedAtMs, method, url);
}

function getTaskIdFromUrl(url: string): string | null {
  const match = /^\/tasks\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

function getWorkItemIdFromUrl(url: string): string | null {
  const match = /^\/work-items\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

function getDocumentIdFromUrl(url: string): string | null {
  const match = /^\/documents\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

function getDocumentAnalyzeTargetIdFromUrl(url: string): string | null {
  const match = /^\/documents\/([^/]+)\/analyze$/.exec(url);
  return match?.[1] ?? null;
}

function getDocumentCreateWorkItemTargetIdFromUrl(url: string): string | null {
  const match = /^\/documents\/([^/]+)\/create-work-item$/.exec(url);
  return match?.[1] ?? null;
}

function getWorkItemFileTargetIdFromUrl(url: string): string | null {
  const match = /^\/work-items\/([^/]+)\/files$/.exec(url);
  return match?.[1] ?? null;
}

function getWorkItemAnalyzeTargetIdFromUrl(url: string): string | null {
  const match = /^\/work-items\/([^/]+)\/analyze$/.exec(url);
  return match?.[1] ?? null;
}

function getWorkItemAssignTargetIdFromUrl(url: string): string | null {
  const match = /^\/work-items\/([^/]+)\/assign$/.exec(url);
  return match?.[1] ?? null;
}

function getAssignmentIdFromUrl(url: string): string | null {
  const match = /^\/assignments\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

function getTaskAcceptIdFromUrl(url: string): string | null {
  const match = /^\/tasks\/([^/]+)\/accept$/.exec(url);
  return match?.[1] ?? null;
}

function getTaskRejectIdFromUrl(url: string): string | null {
  const match = /^\/tasks\/([^/]+)\/reject-assignment$/.exec(url);
  return match?.[1] ?? null;
}

function getTaskSubmitResponseIdFromUrl(url: string): string | null {
  const match = /^\/tasks\/([^/]+)\/submit-response$/.exec(url);
  return match?.[1] ?? null;
}

function getTaskApproveResponseIdFromUrl(url: string): string | null {
  const match = /^\/tasks\/([^/]+)\/approve-response$/.exec(url);
  return match?.[1] ?? null;
}

function getDepartmentIdFromUrl(url: string): string | null {
  const match = /^\/departments\/([^/]+)$/.exec(url);
  return match?.[1] ?? null;
}

function getUserAssignmentIdFromUrl(url: string): string | null {
  const match = /^\/users\/([^/]+)\/assignment$/.exec(url);
  if (!match?.[1]) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return match[1];
  }
}

function buildFailureTaskResult(task: Task, message: string): TaskResult {
  return {
    taskId: task.id,
    agentName: "growth-agent",
    outputText: [
      "## Task Processing Failed",
      message,
      "",
      "This task was created successfully, but downstream processing did not complete.",
      "You can review the task and retry it later."
    ].join("\n"),
    createdAt: new Date().toISOString()
  };
}

function getCreateWorkItemInputError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const input = body as Partial<CreateWorkItemInput>;

  if (!isNonEmptyString(input.title)) {
    return "Field 'title' is required";
  }

  if (!isNonEmptyString(input.description)) {
    return "Field 'description' is required";
  }

  if (input.departmentId !== undefined && typeof input.departmentId !== "string") {
    return "Field 'departmentId' must be a string if provided";
  }

  return null;
}

function getCreateDocumentInputError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const input = body as Partial<CreateDocumentInput>;

  if (!isNonEmptyString(input.filename)) {
    return "Field 'filename' is required";
  }

  if (input.contentType !== undefined && typeof input.contentType !== "string") {
    return "Field 'contentType' must be a string if provided";
  }

  if (input.sizeBytes !== undefined && typeof input.sizeBytes !== "number") {
    return "Field 'sizeBytes' must be a number if provided";
  }

  if (
    input.metadata !== undefined &&
    (!input.metadata || typeof input.metadata !== "object" || Array.isArray(input.metadata))
  ) {
    return "Field 'metadata' must be an object if provided";
  }

  if (input.extractedText !== undefined && typeof input.extractedText !== "string") {
    return "Field 'extractedText' must be a string if provided";
  }

  if (input.contentBase64 !== undefined && typeof input.contentBase64 !== "string") {
    return "Field 'contentBase64' must be a string if provided";
  }

  if (
    input.ocrStatus !== undefined &&
    input.ocrStatus !== "pending" &&
    input.ocrStatus !== "ready" &&
    input.ocrStatus !== "failed"
  ) {
    return "Field 'ocrStatus' is invalid";
  }

  return null;
}

function isCreateDocumentInput(body: unknown): body is CreateDocumentInput {
  return getCreateDocumentInputError(body) === null;
}

function getCreateWorkItemFromDocumentInput(
  body: unknown,
  document: Document
): { value: CreateWorkItemInput; error: string | null } {
  if (!body || typeof body !== "object") {
    return {
      value: buildDefaultWorkItemInputFromDocument(document),
      error: null
    };
  }

  const title = (body as { title?: unknown }).title;
  const description = (body as { description?: unknown }).description;
  const departmentId = (body as { departmentId?: unknown }).departmentId;

  if (title !== undefined && !isNonEmptyString(title)) {
    return {
      value: buildDefaultWorkItemInputFromDocument(document),
      error: "Field 'title' must be a non-empty string if provided"
    };
  }

  if (description !== undefined && !isNonEmptyString(description)) {
    return {
      value: buildDefaultWorkItemInputFromDocument(document),
      error: "Field 'description' must be a non-empty string if provided"
    };
  }

  if (
    departmentId !== undefined &&
    departmentId !== null &&
    typeof departmentId !== "string"
  ) {
    return {
      value: buildDefaultWorkItemInputFromDocument(document),
      error: "Field 'departmentId' must be a string if provided"
    };
  }

  return {
    value: {
      title:
        typeof title === "string" && title.trim().length > 0
          ? title.trim()
          : buildDefaultWorkItemInputFromDocument(document).title,
      description:
        typeof description === "string" && description.trim().length > 0
          ? description.trim()
          : buildDefaultWorkItemInputFromDocument(document).description,
      departmentId:
        typeof departmentId === "string" && departmentId.trim().length > 0
          ? departmentId.trim()
          : undefined
    },
    error: null
  };
}

function buildDefaultWorkItemInputFromDocument(document: Document): CreateWorkItemInput {
  return {
    title: `Document Intake: ${document.filename}`,
    description:
      document.extractedText?.trim().slice(0, 1200) ||
      `Review uploaded document ${document.filename} and determine the next school workflow action.`,
    departmentId: undefined
  };
}

function getCreateAssignmentInput(
  body: unknown
): {
  value: {
    mainDepartmentId: string;
    coordinatingDepartmentIds: string[];
    deadline?: string;
    priority: AssignmentPriority;
    outputRequirement?: string;
    note?: string;
  };
  error: string | null;
} {
  const defaultValue = {
    mainDepartmentId: "",
    coordinatingDepartmentIds: [],
    priority: "normal" as AssignmentPriority
  };

  if (!body || typeof body !== "object") {
    return {
      value: defaultValue,
      error: "Request body must be a JSON object"
    };
  }

  const mainDepartmentId = (body as { mainDepartmentId?: unknown }).mainDepartmentId;
  const coordinatingDepartmentIds =
    (body as { coordinatingDepartmentIds?: unknown }).coordinatingDepartmentIds;
  const deadline = (body as { deadline?: unknown }).deadline;
  const priority = (body as { priority?: unknown }).priority;
  const outputRequirement =
    (body as { outputRequirement?: unknown }).outputRequirement;
  const note = (body as { note?: unknown }).note;

  if (typeof mainDepartmentId !== "string" || mainDepartmentId.trim().length === 0) {
    return {
      value: defaultValue,
      error: "Field 'mainDepartmentId' is required"
    };
  }

  if (
    coordinatingDepartmentIds !== undefined &&
    !(
      Array.isArray(coordinatingDepartmentIds) &&
      coordinatingDepartmentIds.every((value) => typeof value === "string")
    )
  ) {
    return {
      value: defaultValue,
      error: "Field 'coordinatingDepartmentIds' must be a string array if provided"
    };
  }

  if (deadline !== undefined && deadline !== null && typeof deadline !== "string") {
    return {
      value: defaultValue,
      error: "Field 'deadline' must be a string if provided"
    };
  }

  if (!isAssignmentPriority(priority)) {
    return {
      value: defaultValue,
      error: "Field 'priority' is invalid"
    };
  }

  if (
    outputRequirement !== undefined &&
    outputRequirement !== null &&
    typeof outputRequirement !== "string"
  ) {
    return {
      value: defaultValue,
      error: "Field 'outputRequirement' must be a string if provided"
    };
  }

  if (note !== undefined && note !== null && typeof note !== "string") {
    return {
      value: defaultValue,
      error: "Field 'note' must be a string if provided"
    };
  }

  return {
    value: {
      mainDepartmentId: mainDepartmentId.trim(),
      coordinatingDepartmentIds:
        coordinatingDepartmentIds?.map((value) => value.trim()).filter(Boolean) ?? [],
      deadline:
        typeof deadline === "string" && deadline.trim().length > 0
          ? deadline.trim()
          : undefined,
      priority,
      outputRequirement:
        typeof outputRequirement === "string" && outputRequirement.trim().length > 0
          ? outputRequirement.trim()
          : undefined,
      note:
        typeof note === "string" && note.trim().length > 0
          ? note.trim()
          : undefined
    },
    error: null
  };
}

function isCreateWorkItemInput(body: unknown): body is CreateWorkItemInput {
  return getCreateWorkItemInputError(body) === null;
}

function getUpdateWorkItemInputError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const input = body as Partial<UpdateWorkItemInput>;

  if (
    input.title === undefined &&
    input.description === undefined &&
    input.departmentId === undefined &&
    input.assignedToUserId === undefined &&
    input.status === undefined
  ) {
    return "At least one field must be provided";
  }

  if (input.title !== undefined && !isNonEmptyString(input.title)) {
    return "Field 'title' must be a non-empty string";
  }

  if (input.description !== undefined && !isNonEmptyString(input.description)) {
    return "Field 'description' must be a non-empty string";
  }

  if (
    input.departmentId !== undefined &&
    input.departmentId !== null &&
    typeof input.departmentId !== "string"
  ) {
    return "Field 'departmentId' must be a string or null";
  }

  if (
    input.assignedToUserId !== undefined &&
    input.assignedToUserId !== null &&
    typeof input.assignedToUserId !== "string"
  ) {
    return "Field 'assignedToUserId' must be a string or null";
  }

  if (input.status !== undefined && !isWorkItemStatus(input.status)) {
    return "Field 'status' is invalid";
  }

  return null;
}

function isUpdateWorkItemInput(body: unknown): body is UpdateWorkItemInput {
  return getUpdateWorkItemInputError(body) === null;
}

function getCreateWorkItemFileInputError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const input = body as Partial<CreateWorkItemFileInput>;

  if (!isNonEmptyString(input.filename)) {
    return "Field 'filename' is required";
  }

  if (input.contentType !== undefined && typeof input.contentType !== "string") {
    return "Field 'contentType' must be a string if provided";
  }

  if (input.sizeBytes !== undefined && typeof input.sizeBytes !== "number") {
    return "Field 'sizeBytes' must be a number if provided";
  }

  if (input.contentText !== undefined && typeof input.contentText !== "string") {
    return "Field 'contentText' must be a string if provided";
  }

  return null;
}

function isCreateWorkItemFileInput(
  body: unknown
): body is CreateWorkItemFileInput {
  return getCreateWorkItemFileInputError(body) === null;
}

function getLoginCredentials(body: unknown): { username: string | null; password: string | null } {
  if (!body || typeof body !== "object") {
    return {
      username: null,
      password: null
    };
  }

  const username = (body as { username?: unknown }).username;
  const password = (body as { password?: unknown }).password;

  const normalizedUsername =
    typeof username === "string" && username.trim().length > 0
      ? username.trim().toLowerCase().slice(0, 64)
      : null;

  const normalizedPassword =
    typeof password === "string" && password.length > 0 ? password : null;

  return {
    username: normalizedUsername,
    password: normalizedPassword
  };
}

function getDepartmentInput(
  body: unknown
): { value: { name: string; code?: string }; error: string | null } {
  if (!body || typeof body !== "object") {
    return {
      value: { name: "" },
      error: "Request body must be a JSON object"
    };
  }

  const name = (body as { name?: unknown }).name;
  const code = (body as { code?: unknown }).code;

  if (typeof name !== "string" || name.trim().length === 0) {
    return {
      value: { name: "" },
      error: "Field 'name' is required"
    };
  }

  if (code !== undefined && code !== null && typeof code !== "string") {
    return {
      value: { name: "" },
      error: "Field 'code' must be a string if provided"
    };
  }

  return {
    value: {
      name: name.trim(),
      code: typeof code === "string" && code.trim().length > 0 ? code.trim() : undefined
    },
    error: null
  };
}

function getUserAssignmentInput(
  body: unknown
): {
  value: {
    role: AppUserRole;
    departmentId: string | null;
    position: string | null;
    isActive: boolean;
  };
  error: string | null;
} {
  const defaultValue = {
    role: "staff" as AppUserRole,
    departmentId: null,
    position: null,
    isActive: true
  };

  if (!body || typeof body !== "object") {
    return {
      value: defaultValue,
      error: "Request body must be a JSON object"
    };
  }

  const role = (body as { role?: unknown }).role;
  const departmentId = (body as { departmentId?: unknown }).departmentId;
  const position = (body as { position?: unknown }).position;
  const isActive = (body as { isActive?: unknown }).isActive;

  if (!isAppUserRole(role)) {
    return {
      value: defaultValue,
      error: "Field 'role' is invalid"
    };
  }

  if (
    departmentId !== undefined &&
    departmentId !== null &&
    typeof departmentId !== "string"
  ) {
    return {
      value: defaultValue,
      error: "Field 'departmentId' must be a string or null"
    };
  }

  if (position !== undefined && position !== null && typeof position !== "string") {
    return {
      value: defaultValue,
      error: "Field 'position' must be a string or null"
    };
  }

  if (typeof isActive !== "boolean") {
    return {
      value: defaultValue,
      error: "Field 'isActive' must be a boolean"
    };
  }

  return {
    value: {
      role,
      departmentId:
        typeof departmentId === "string" && departmentId.trim().length > 0
          ? departmentId.trim()
          : null,
      position:
        typeof position === "string" && position.trim().length > 0
          ? position.trim()
          : null,
      isActive
    },
    error: null
  };
}

function getCreateUserInput(
  body: unknown
): {
  value: {
    username: string;
    password: string;
    displayName: string | null;
    role: AppUserRole;
    departmentId: string | null;
    position: string | null;
    isActive: boolean;
  };
  error: string | null;
} {
  const defaultValue = {
    username: "",
    password: "",
    displayName: null,
    role: "staff" as AppUserRole,
    departmentId: null,
    position: null,
    isActive: true
  };

  if (!body || typeof body !== "object") {
    return {
      value: defaultValue,
      error: "Request body must be a JSON object"
    };
  }

  const username = (body as { username?: unknown }).username;
  const password = (body as { password?: unknown }).password;
  const displayName = (body as { displayName?: unknown }).displayName;
  const role = (body as { role?: unknown }).role;
  const departmentId = (body as { departmentId?: unknown }).departmentId;
  const position = (body as { position?: unknown }).position;
  const isActive = (body as { isActive?: unknown }).isActive;

  if (typeof username !== "string" || username.trim().length === 0) {
    return {
      value: defaultValue,
      error: "Field 'username' is required"
    };
  }

  if (typeof password !== "string" || password.length === 0) {
    return {
      value: defaultValue,
      error: "Field 'password' is required"
    };
  }

  const passwordError = getPasswordValidationError(password);

  if (passwordError) {
    return {
      value: defaultValue,
      error: passwordError
    };
  }

  if (
    displayName !== undefined &&
    displayName !== null &&
    typeof displayName !== "string"
  ) {
    return {
      value: defaultValue,
      error: "Field 'displayName' must be a string if provided"
    };
  }

  if (!isAppUserRole(role)) {
    return {
      value: defaultValue,
      error: "Field 'role' is invalid"
    };
  }

  if (
    departmentId !== undefined &&
    departmentId !== null &&
    typeof departmentId !== "string"
  ) {
    return {
      value: defaultValue,
      error: "Field 'departmentId' must be a string or null"
    };
  }

  if (position !== undefined && position !== null && typeof position !== "string") {
    return {
      value: defaultValue,
      error: "Field 'position' must be a string or null"
    };
  }

  if (typeof isActive !== "boolean") {
    return {
      value: defaultValue,
      error: "Field 'isActive' must be a boolean"
    };
  }

  return {
    value: {
      username: username.trim().toLowerCase(),
      password,
      displayName:
        typeof displayName === "string" && displayName.trim().length > 0
          ? displayName.trim()
          : null,
      role,
      departmentId:
        typeof departmentId === "string" && departmentId.trim().length > 0
          ? departmentId.trim()
          : null,
      position:
        typeof position === "string" && position.trim().length > 0
          ? position.trim()
          : null,
      isActive
    },
    error: null
  };
}

function getPasswordChangeInput(
  body: unknown
): { currentPassword: string | null; newPassword: string | null } {
  if (!body || typeof body !== "object") {
    return {
      currentPassword: null,
      newPassword: null
    };
  }

  const currentPassword = (body as { currentPassword?: unknown }).currentPassword;
  const newPassword = (body as { newPassword?: unknown }).newPassword;

  return {
    currentPassword:
      typeof currentPassword === "string" && currentPassword.length > 0
        ? currentPassword
        : null,
    newPassword:
      typeof newPassword === "string" && newPassword.length > 0
        ? newPassword
        : null
  };
}

function isAppUserRole(value: unknown): value is AppUserRole {
  return (
    value === "admin" ||
    value === "principal" ||
    value === "department_head" ||
    value === "staff" ||
    value === "clerk"
  );
}

function isWorkItemStatus(value: unknown): value is WorkItemStatus {
  return (
    value === "draft" ||
    value === "waiting_review" ||
    value === "assigned" ||
    value === "in_review" ||
    value === "completed"
  );
}

function isAssignmentPriority(value: unknown): value is AssignmentPriority {
  return (
    value === "low" ||
    value === "normal" ||
    value === "high" ||
    value === "urgent"
  );
}

function mapAppUserProfileForResponse(user: AppUserProfile): AppUserProfile {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.departmentName,
    position: user.position,
    isActive: user.isActive
  };
}

/**
 * Reads the request body and converts it from JSON into a JavaScript object.
 */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (chunks.length === 0) {
    return {};
  }

  const rawBody = Buffer.concat(chunks).toString("utf8");

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    return {};
  }
}

/**
 * Validates the body for creating a Growth task.
 *
 * If the data is valid, this function returns null.
 * If the data is invalid, it returns an error message.
 */
function getCreateTaskInputError(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Request body must be a JSON object";
  }

  const input = body as Partial<CreateTaskInput>;

  if (!isNonEmptyString(input.title)) {
    return "Field 'title' is required";
  }

  if (!isNonEmptyString(input.goal)) {
    return "Field 'goal' is required";
  }

  if (!isNonEmptyString(input.audience)) {
    return "Field 'audience' is required";
  }

  if (input.notes !== undefined && typeof input.notes !== "string") {
    return "Field 'notes' must be a string if provided";
  }

  return null;
}

/**
 * TypeScript needs a type guard to understand that the request body
 * is safe to use as CreateTaskInput after validation.
 */
function isCreateTaskInput(body: unknown): body is CreateTaskInput {
  return getCreateTaskInputError(body) === null;
}

/**
 * Helper for simple string validation.
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Sends a JSON response with the correct headers.
 */
function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: unknown,
  startedAtMs?: number,
  method?: string,
  path?: string,
  metadata?: Record<string, unknown>,
  extraHeaders?: Record<string, string>
): void {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    ...extraHeaders
  });
  res.end(JSON.stringify(payload, null, 2));

  if (startedAtMs !== undefined && method && path) {
    logRequest(method, path, statusCode, startedAtMs, metadata);
  }
}
