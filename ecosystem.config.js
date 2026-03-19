module.exports = {
  apps: [
    {
      name: "agent-api",
      cwd: "/var/www/agent-app",
      script: "apps/api/dist/apps/api/src/index.js",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
