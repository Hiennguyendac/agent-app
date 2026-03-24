import "dotenv/config";
import { execSync } from "node:child_process";

const port = process.env.PORT || "3003";
const baseUrl =
  process.env.API_BASE_URL ||
  process.env.APP_API_BASE_URL ||
  process.env.HEALTHCHECK_URL?.replace(/\/health$/, "") ||
  `http://127.0.0.1:${port}`;
const restartCommand = process.env.SMOKE_RESTART_COMMAND?.trim() ?? "";
const waitAfterRestartMs = Number(process.env.SMOKE_WAIT_AFTER_RESTART_MS || "3000");
const suffix = Date.now().toString();

async function main() {
  console.log(`[session-smoke] API base URL: ${baseUrl}`);

  const healthOk = await checkHealth();

  if (!healthOk) {
    process.exit(1);
  }

  const aliceLogin = await login("alice");
  const bobLogin = await login("bob");

  if (!aliceLogin.ok || !bobLogin.ok) {
    process.exit(1);
  }

  const aliceTask = await createTask(aliceLogin.cookie, {
    username: "alice",
    title: `sprint1-alice-${suffix}`,
    conflictingHeaderUserId: "user-a"
  });
  const bobTask = await createTask(bobLogin.cookie, {
    username: "bob",
    title: `sprint1-bob-${suffix}`
  });

  if (!aliceTask.ok || !bobTask.ok) {
    process.exit(1);
  }

  if (restartCommand.length > 0) {
    console.log(`[session-smoke] INFO restarting API with: ${restartCommand}`);
    execSync(restartCommand, {
      stdio: "inherit",
      cwd: process.cwd()
    });
    await sleep(waitAfterRestartMs);
  } else {
    console.log("[session-smoke] INFO no restart command provided; skipping restart simulation");
  }

  const aliceSession = await getSession(aliceLogin.cookie);
  const aliceList = await listTasks(aliceLogin.cookie);
  const bobList = await listTasks(bobLogin.cookie);
  const aliceReadsBobDetail = await getTaskDetail(aliceLogin.cookie, bobTask.taskId);
  const aliceDeletesBobTask = await deleteTask(aliceLogin.cookie, bobTask.taskId);

  const summary = {
    sessionPersistsAfterRestart:
      aliceSession.ok &&
      aliceSession.data?.authenticated === true &&
      aliceSession.data?.userId === "alice",
    aliceTaskOwnerIsAlice: aliceTask.ownerId === "alice",
    bobTaskOwnerIsBob: bobTask.ownerId === "bob",
    aliceSeesAliceTask: aliceList.taskIds.includes(aliceTask.taskId),
    aliceDoesNotSeeBobTask: !aliceList.taskIds.includes(bobTask.taskId),
    bobSeesBobTask: bobList.taskIds.includes(bobTask.taskId),
    bobDoesNotSeeAliceTask: !bobList.taskIds.includes(aliceTask.taskId),
    aliceGetsNotFoundForBobDetail: aliceReadsBobDetail.status === 404,
    aliceGetsNotFoundForBobDelete: aliceDeletesBobTask.status === 404
  };

  console.log("[session-smoke] SUMMARY", summary);

  const passed = Object.values(summary).every(Boolean);
  console.log(`[session-smoke] RESULT ${passed ? "PASS" : "FAIL"}`);
  process.exit(passed ? 0 : 1);
}

async function checkHealth() {
  const response = await safeFetch(`${baseUrl}/health`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const healthy = response.ok && (response.data?.ok === true || response.data?.status === "ok");
  console.log(`[session-smoke] ${healthy ? "PASS" : "FAIL"} health`, response.data ?? response.message);
  return healthy;
}

async function login(username) {
  const response = await safeFetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({ username })
  });

  const cookie = response.setCookie;
  const ok = response.ok && typeof cookie === "string" && cookie.length > 0;

  console.log(`[session-smoke] ${ok ? "PASS" : "FAIL"} login`, {
    username,
    status: response.status
  });

  return {
    ok,
    cookie
  };
}

async function getSession(cookie) {
  const response = await safeFetch(`${baseUrl}/auth/session`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: cookie
    }
  });

  console.log(`[session-smoke] ${response.ok ? "PASS" : "FAIL"} session`, response.data ?? response.message);
  return response;
}

async function createTask(cookie, options) {
  const response = await safeFetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: cookie,
      ...(options.conflictingHeaderUserId
        ? { "x-user-id": options.conflictingHeaderUserId }
        : {})
    },
    body: JSON.stringify({
      title: options.title,
      goal: `Sprint 1 smoke task for ${options.username}`,
      audience: "internal-ops",
      notes: "Created by session ownership smoke script"
    })
  });

  const taskId = response.data?.task?.id ?? "";
  const ownerId = response.data?.task?.ownerId ?? null;
  const ok = taskId.length > 0;

  console.log(`[session-smoke] ${ok ? "PASS" : "FAIL"} create`, {
    username: options.username,
    taskId,
    ownerId,
    status: response.status
  });

  return {
    ok,
    taskId,
    ownerId
  };
}

async function listTasks(cookie) {
  const response = await safeFetch(`${baseUrl}/tasks`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: cookie
    }
  });

  const taskIds = Array.isArray(response.data?.tasks)
    ? response.data.tasks
        .map((item) => item?.task?.id ?? item?.id ?? "")
        .filter((value) => typeof value === "string" && value.length > 0)
    : [];

  console.log(`[session-smoke] ${response.ok ? "PASS" : "FAIL"} list`, {
    count: taskIds.length
  });

  return {
    ok: response.ok,
    taskIds
  };
}

async function getTaskDetail(cookie, taskId) {
  const response = await safeFetch(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Cookie: cookie
    }
  });

  console.log(`[session-smoke] ${response.status === 404 ? "PASS" : response.ok ? "WARN" : "FAIL"} detail-cross-access`, {
    taskId,
    status: response.status
  });

  return response;
}

async function deleteTask(cookie, taskId) {
  const response = await safeFetch(`${baseUrl}/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    headers: {
      Accept: "application/json",
      Cookie: cookie
    }
  });

  console.log(`[session-smoke] ${response.status === 404 ? "PASS" : response.ok ? "WARN" : "FAIL"} delete-cross-access`, {
    taskId,
    status: response.status
  });

  return response;
}

async function safeFetch(url, init) {
  const response = await fetchWithRetry(url, init);

  const data = await response.json().catch(() => null);
  const setCookie = response.headers.get("set-cookie") ?? undefined;
  const cookie = setCookie?.split(";")[0];

  return {
    ok: response.ok,
    status: response.status,
    data,
    setCookie: cookie,
    message: data?.error ?? `HTTP ${response.status}`
  };
}

async function fetchWithRetry(url, init) {
  let lastError = null;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fetch(url, init);
    } catch (error) {
      lastError = error;
      await sleep(1000);
    }
  }

  return {
    ok: false,
    status: 0,
    headers: new Headers(),
    json: async () => ({
      error: lastError instanceof Error ? lastError.message : String(lastError)
    })
  };
}

function sleep(durationMs) {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

await main();
