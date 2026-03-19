import { defineConfig } from "vite";

/**
 * This proxy lets the browser call the local API without CORS problems.
 *
 * The web app will call /api/tasks
 * and Vite will forward that request to http://localhost:3001/tasks
 */
export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, "")
      }
    }
  }
});
