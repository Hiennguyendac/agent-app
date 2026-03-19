import { createServer } from "node:http";
import { handleRequest } from "./http.js";

/**
 * This is the entry point for the small MVP API.
 * It starts an HTTP server and forwards each request
 * to the request handler.
 */

const port = Number(process.env.PORT || 3001);

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
    console.error("Unexpected API error:", error);

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
  console.log(`API server is running on http://localhost:${port}`);
});
