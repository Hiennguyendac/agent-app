import "dotenv/config";

const port = process.env.PORT || "3003";
const baseUrl =
  process.env.API_BASE_URL ||
  process.env.APP_API_BASE_URL ||
  process.env.HEALTHCHECK_URL?.replace(/\/health$/, "") ||
  `http://127.0.0.1:${port}`;

const createUserB = process.env.OWNERSHIP_SMOKE_SKIP_USER_B !== "true";
const suffix = Date.now().toString();

const createdTasks = {
  unowned: null,
  userA: null,
  userB: null
};

async function main() {
  console.log(`[ownership-smoke] API base URL: ${baseUrl}`);

  const healthOk = await checkHealth();

  if (!healthOk) {
    process.exit(1);
  }

  createdTasks.unowned = await createTask("smoke-unowned", null);
  createdTasks.userA = await createTask("smoke-user-a", "user-a");

  if (createUserB) {
    createdTasks.userB = await createTask("smoke-user-b", "user-b");
  } else {
    console.log("[ownership-smoke] INFO user-b creation skipped by env");
  }

  const listA = await listTasks("user-a");
  const listB = await listTasks("user-b");

  printOwnershipObservations(listA, listB);

  const requiredPassed =
    createdTasks.unowned?.ok === true &&
    createdTasks.userA?.ok === true &&
    (!createUserB || createdTasks.userB?.ok === true) &&
    listA.ok === true &&
    listB.ok === true;

  console.log(
    `[ownership-smoke] RESULT ${requiredPassed ? "PASS" : "FAIL"}`
  );

  process.exit(requiredPassed ? 0 : 1);
}

async function checkHealth() {
  const response = await safeFetch(`${baseUrl}/health`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    console.log(`[ownership-smoke] FAIL health ${response.message}`);
    return false;
  }

  const looksHealthy =
    response.data?.ok === true || response.data?.status === "ok";

  console.log(
    `[ownership-smoke] ${looksHealthy ? "PASS" : "FAIL"} health`,
    response.data
  );

  return looksHealthy;
}

async function createTask(kind, userId) {
  const title = `${kind}-${suffix}`;
  const response = await safeFetch(`${baseUrl}/tasks`, {
    method: "POST",
    headers: buildHeaders(userId, {
      "Content-Type": "application/json",
      Accept: "application/json"
    }),
    body: JSON.stringify({
      title,
      goal: `Ownership smoke test ${kind}`,
      audience: "operators",
      notes: "Created by scripts/ownership-smoke.mjs"
    })
  });

  if (!response.ok) {
    console.log(
      `[ownership-smoke] FAIL create ${kind}`,
      userId ? { userId, error: response.message } : { error: response.message }
    );
    return {
      ok: false,
      title,
      userId
    };
  }

  const taskId = response.data?.task?.id ?? null;
  const ownerId = response.data?.task?.ownerId ?? null;

  console.log(`[ownership-smoke] PASS create ${kind}`, {
    taskId,
    ownerId,
    userId
  });

  return {
    ok: true,
    title,
    taskId,
    ownerId,
    userId
  };
}

async function listTasks(userId) {
  const response = await safeFetch(`${baseUrl}/tasks`, {
    method: "GET",
    headers: buildHeaders(userId, {
      Accept: "application/json"
    })
  });

  if (!response.ok) {
    console.log(`[ownership-smoke] FAIL list`, {
      userId,
      error: response.message
    });
    return {
      ok: false,
      userId,
      titles: []
    };
  }

  const titles = (response.data?.tasks ?? [])
    .map((item) => item?.task?.title)
    .filter((value) => typeof value === "string");

  console.log(`[ownership-smoke] PASS list`, {
    userId,
    count: titles.length
  });

  return {
    ok: true,
    userId,
    titles
  };
}

function printOwnershipObservations(listA, listB) {
  const unownedTitle = createdTasks.unowned?.title;
  const userATitle = createdTasks.userA?.title;
  const userBTitle = createdTasks.userB?.title;

  const sees = (listResult, title) =>
    Boolean(title) && listResult.titles.includes(title);

  const summary = {
    userASeesUnowned: sees(listA, unownedTitle),
    userASeesUserA: sees(listA, userATitle),
    userASeesUserB: sees(listA, userBTitle),
    userBSeesUnowned: sees(listB, unownedTitle),
    userBSeesUserA: sees(listB, userATitle),
    userBSeesUserB: sees(listB, userBTitle)
  };

  console.log("[ownership-smoke] OBSERVE visibility", summary);

  const looksLikeEnforcementOn =
    summary.userASeesUnowned &&
    summary.userASeesUserA &&
    (!createUserB || !summary.userASeesUserB) &&
    summary.userBSeesUnowned &&
    (!createUserB || summary.userBSeesUserB) &&
    !summary.userBSeesUserA;

  const looksLikeEnforcementOff =
    summary.userASeesUnowned &&
    summary.userASeesUserA &&
    summary.userBSeesUnowned &&
    summary.userBSeesUserA &&
    (!createUserB || (summary.userASeesUserB && summary.userBSeesUserB));

  if (looksLikeEnforcementOn) {
    console.log(
      "[ownership-smoke] PASS ownership behavior looks consistent with ENFORCE_TASK_OWNERSHIP=true"
    );
    return;
  }

  if (looksLikeEnforcementOff) {
    console.log(
      "[ownership-smoke] PASS ownership behavior looks consistent with ENFORCE_TASK_OWNERSHIP=false"
    );
    return;
  }

  console.log(
    "[ownership-smoke] WARN visibility did not match a clean ON/OFF pattern; inspect API logs and current env"
  );
}

function buildHeaders(userId, extraHeaders = {}) {
  return userId
    ? {
        ...extraHeaders,
        "x-user-id": userId
      }
    : extraHeaders;
}

async function safeFetch(url, init) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    clearTimeout(timeout);

    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data,
      message: response.ok
        ? `HTTP ${response.status}`
        : `HTTP ${response.status} ${JSON.stringify(data)}`
    };
  } catch (error) {
    clearTimeout(timeout);

    return {
      ok: false,
      status: 0,
      data: null,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

await main();
