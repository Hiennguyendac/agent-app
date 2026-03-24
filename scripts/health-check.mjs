import "dotenv/config";

const port = process.env.PORT || "3003";
const url = process.env.HEALTHCHECK_URL || `http://127.0.0.1:${port}/health`;

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetch(url, {
    method: "GET",
    signal: controller.signal,
    headers: {
      Accept: "application/json"
    }
  });

  clearTimeout(timeout);

  if (!response.ok) {
    console.error(`[health] Non-OK response: ${response.status} ${response.statusText}`);
    process.exit(1);
  }

  const data = await response.json().catch(() => ({}));

  const looksHealthy =
    data?.ok === true ||
    data?.status === "ok";

  if (!looksHealthy) {
    console.error(`[health] Unexpected payload from ${url}`);
    console.error(data);
    process.exit(1);
  }

  console.log(`[health] OK: ${url}`);
  process.exit(0);
} catch (error) {
  clearTimeout(timeout);
  console.error(`[health] Request failed: ${url}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
