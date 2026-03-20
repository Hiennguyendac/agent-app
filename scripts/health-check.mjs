import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadRootEnv();

const port = process.env.PORT || "3001";
const url = `http://localhost:${port}/health`;

try {
  const response = await fetch(url);

  if (!response.ok) {
    console.error(`[health] Request failed with status ${response.status}: ${url}`);
    process.exit(1);
  }

  const body = await response.text();
  console.log(body);
} catch (error) {
  console.error(`[health] Request failed: ${url}`);
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

function loadRootEnv() {
  const rootEnvPath = resolve(process.cwd(), ".env");

  if (existsSync(rootEnvPath)) {
    loadEnv({ path: rootEnvPath });
  }
}
