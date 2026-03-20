module.exports = {
  apps: [
    {
      name: "agent-api",
      cwd: "/var/www/agent-app",
      script: "apps/api/dist/apps/api/src/index.js",
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "300M",
      min_uptime: "10s",
      max_restarts: 10,
      env: {
        NODE_ENV: "production",
        ALLOW_INMEMORY_FALLBACK: "false"
      }
    }
  ]
};
