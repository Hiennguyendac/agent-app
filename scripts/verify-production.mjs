import "dotenv/config";
import { execFileSync, execSync } from "node:child_process";

const port = process.env.PORT || "3003";
const baseUrl =
  process.env.API_BASE_URL ||
  process.env.APP_API_BASE_URL ||
  process.env.HEALTHCHECK_URL?.replace(/\/health$/, "") ||
  `http://127.0.0.1:${port}`;

async function main() {
  const checks = [];

  checks.push(await checkHealth());
  checks.push(await checkUnauthenticatedSession());
  checks.push(await checkUnauthenticatedTaskList());
  checks.push(checkPm2Status());
  checks.push(checkRuntimeEnvFlags());

  const failedChecks = checks.filter((check) => !check.ok);

  console.log("[verify:production] SUMMARY");
  for (const check of checks) {
    console.log(`- ${check.ok ? "PASS" : "FAIL"} ${check.name}: ${check.message}`);
  }

  process.exit(failedChecks.length === 0 ? 0 : 1);
}

async function checkHealth() {
  const response = await safeFetch(`${baseUrl}/health`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const ok =
    response.ok &&
    (response.data?.ok === true || response.data?.status === "ok");

  return {
    ok,
    name: "health",
    message: ok ? `${baseUrl}/health` : response.message
  };
}

async function checkUnauthenticatedSession() {
  const response = await safeFetch(`${baseUrl}/auth/session`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const ok =
    response.ok &&
    response.data?.authenticated === false &&
    response.data?.userId === null;

  return {
    ok,
    name: "auth-session",
    message: ok ? "unauthenticated session reports false/null" : response.message
  };
}

async function checkUnauthenticatedTaskList() {
  const response = await safeFetch(`${baseUrl}/tasks`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });

  const ok =
    response.status === 401 &&
    response.data?.error === "Authentication required";

  return {
    ok,
    name: "task-auth-guard",
    message: ok ? "GET /tasks unauthenticated returns 401" : response.message
  };
}

function checkPm2Status() {
  try {
    const output = execFileSync("pm2", ["status", "agent-api"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });

    return {
      ok: output.includes("agent-api") && output.includes("online"),
      name: "pm2-status",
      message: output.includes("online")
        ? "agent-api online"
        : "agent-api not online"
    };
  } catch (error) {
    return {
      ok: false,
      name: "pm2-status",
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

function checkRuntimeEnvFlags() {
  try {
    const pid = execFileSync("pm2", ["pid", "agent-api"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();

    if (!pid || pid === "0") {
      return {
        ok: false,
        name: "runtime-env",
        message: "agent-api PID not found"
      };
    }

    const output = execSync(
      `tr '\\0' '\\n' < /proc/${pid}/environ | egrep 'NODE_ENV|ENFORCE_TASK_OWNERSHIP|ALLOW_INMEMORY_FALLBACK|PORT'`,
      {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
        shell: "/bin/bash"
      }
    );

    const ok =
      output.includes("NODE_ENV=production") &&
      output.includes("PORT=3003") &&
      output.includes("ALLOW_INMEMORY_FALLBACK=false") &&
      output.includes("ENFORCE_TASK_OWNERSHIP=true");

    return {
      ok,
      name: "runtime-env",
      message: ok ? "production env flags present" : output.trim()
    };
  } catch (error) {
    return {
      ok: false,
      name: "runtime-env",
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

async function safeFetch(url, init) {
  try {
    const response = await fetch(url, init);
    const data = await response.json().catch(() => null);

    return {
      ok: response.ok,
      status: response.status,
      data,
      message: data?.error ?? `HTTP ${response.status}`
    };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      message: error instanceof Error ? error.message : String(error)
    };
  }
}

await main();
