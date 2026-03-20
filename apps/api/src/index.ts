import { createServer } from "node:http";
import { ensureStorageReadyForStartup } from "./db.js";
import { handleRequest } from "./http.js";
import { logError, logInfo } from "./log.js";

/**
 * This is the entry point for the small MVP API.
 * It starts an HTTP server and forwards each request
 * to the request handler.
 */

const port = Number(process.env.PORT || 3001);

async function startServer(): Promise<void> {
  logInfo("Starting API server", {
    port,
    nodeEnv: process.env.NODE_ENV ?? "development"
  });

  await ensureStorageReadyForStartup();

  const server = createServer((req, res) => {
    if (req.url === "/" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(
        JSON.stringify(
          {
            ok: true,
            service: "agent-api"
          },
          null,
          2
        )
      );
      return;
    }

    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, {
        "Content-Type": "application/json"
      });
      res.end(
        JSON.stringify(
          {
            ok: true
          },
          null,
          2
        )
      );
      return;
    }

    handleRequest(req, res).catch((error: unknown) => {
      logError("Unhandled request error", {
        method: req.method ?? "GET",
        path: req.url ?? "/",
        error: error instanceof Error ? error.message : String(error)
      });

      res.writeHead(500, {
        "Content-Type": "application/json"
      });
      res.end(
        JSON.stringify(
          {
            error: "Internal server error"
          },
          null,
          2
        )
      );
    });
  });

  server.listen(port, () => {
    logInfo("API server is ready", {
      url: `http://localhost:${port}`
    });
  });
}

startServer().catch((error: unknown) => {
  logError("Startup failed", {
    error: error instanceof Error ? error.message : String(error)
  });
  process.exit(1);
});
