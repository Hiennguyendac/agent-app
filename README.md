# Agent App

Monorepo for the current production task flow.

## Planning Docs

- [OpenClaw integration plan](./docs/openclaw-integration-plan.md)

## Production Apps

- `apps/api`: Node/TypeScript API, runs under PM2
- `apps/web`: Vite frontend, built to static assets in `apps/web/dist`

## Env

Use `infra/env/.env.example` as the safe template.

Minimum env for the current production flow:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/agentapp
PORT=3003
NODE_ENV=production
ALLOW_INMEMORY_FALLBACK=false
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Notes:

- Do not commit real secrets to `.env.example` or README files.
- The root `.env` is gitignored.

## Build

Build everything:

```bash
npm run build
```

Build one app:

```bash
npm run build:api
npm run build:web
```

## Database Bootstrap

The API depends on the SQL migrations in:

- `infra/sql/`

Prepare `DATABASE_URL`, then check connectivity:

```bash
npm run db:check
```

Apply the schema:

```bash
npm run db:apply-schema
```

Bootstrap from zero:

1. Set `DATABASE_URL`
2. Run `npm run db:check`
3. Run `npm run db:apply-schema`
4. Run `npm run start:api` or restart PM2

Local/dev usually points `DATABASE_URL` at local Postgres.

Production uses the same SQL migrations, but `DATABASE_URL` should point at your production Postgres or Supabase Postgres before API start/restart.

## Database Backup And Restore

Required tools:

- `pg_dump`
- `pg_restore`
- `DATABASE_URL`

Backup note:

- `npm run db:backup` tries local `pg_dump` first
- if the local client is missing or older than the server major version, it retries via Docker using `postgres:17`
- override the Docker image with `PG_DUMP_IMAGE=postgres:17`

Create a backup:

```bash
npm run db:backup
```

Default output:

- `backups/agent-app-YYYYMMDD-HHMMSS.dump`

Custom output path:

```bash
BACKUP_FILE=/safe/path/agent-app-prod.dump npm run db:backup
```

Restore from a dump:

```bash
CONFIRM_DB_RESTORE=true RESTORE_FILE=/safe/path/agent-app-prod.dump npm run db:restore
```

Restore safety:

- restore is destructive
- `CONFIRM_DB_RESTORE=true` is required on purpose
- verify `DATABASE_URL` before restore
- keep backups outside git

After restore:

```bash
npm run db:check
npm run verify:production
```

## Start

Start the compiled API directly:

```bash
npm run start:api
```

The web app is a static build. Serve `apps/web/dist` with your web server.

## PM2

Start the API with the included ecosystem file:

```bash
npm run pm2:start
```

Restart after deploy:

```bash
npm run pm2:restart
```

Check PM2 process status:

```bash
npm run pm2:status
```

Open the PM2 live monitor:

```bash
npm run pm2:monit
```

Useful PM2 logs command:

```bash
npm run pm2:logs
```

Equivalent direct PM2 command:

```bash
pm2 restart agent-api
```

Recommended PM2 production settings in this repo:

- `fork` mode with `instances: 1`
- `autorestart: true`
- `watch: false`
- `max_memory_restart: 300M`

Use cluster mode only if you intentionally redesign state/runtime expectations around multiple API processes.

## Health Check

Quick API health check on the default port:

```bash
npm run health
```

Expected response:

```json
{
  "ok": true
}
```

## Production Verify

Run the production verification script:

```bash
npm run verify:production
```

It checks:

- API health
- unauthenticated `/auth/session` behavior
- unauthenticated `GET /tasks` returns `401`
- PM2 `agent-api` is online
- runtime env flags include:
  - `NODE_ENV=production`
  - `PORT=3003`
  - `ALLOW_INMEMORY_FALLBACK=false`
  - `ENFORCE_TASK_OWNERSHIP=true`

## Auth V1

The current v1 auth path is a minimal server-side session with an HttpOnly cookie.

Auth endpoints:

- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/session`
- `POST /auth/change-password`

Auth sessions are now stored in PostgreSQL so login state survives API restarts in production.

Login is now DB-backed:

- only users present in `app_users` with `is_active = true` may log in
- `password_hash` must be set for the user
- login requires `{ "username": "...", "password": "..." }`
- repeated failed logins are rate-limited per `source + username` bucket
- current baseline: 5 failed attempts in 15 minutes, then `429 Too many login attempts`
- wrong password returns `403`
- unknown users return `403`
- inactive users return `403`
- usernames are normalized to lowercase during login

To add an internal user:

```sql
INSERT INTO app_users (id, username, display_name, is_active)
VALUES ('carol', 'carol', 'Carol', true);
```

To set or reset a password hash:

```bash
APP_USER_PASSWORD='replace-me' npm run user:set-password -- carol
```

Auth audit events are logged to PM2/stdout for:

- login success
- login failure: unknown user
- login failure: inactive user
- login failure: invalid password
- password change success
- password change failure: wrong current password

## School Workflow Phase 1

Phase 1 adds the first school-domain layer without replacing the existing task flow:

- `departments` table for school departments
- `app_users.role` with:
  - `principal`
  - `department_head`
  - `staff`
  - `clerk`
- `app_users.department_id`
- `app_users.position`

Task access now remains ownership-based, with role-aware widening when ownership enforcement is on:

- `principal`: all tasks
- `department_head`: tasks owned by users in the same department, plus legacy unowned tasks
- `staff`: own tasks, plus legacy unowned tasks
- `clerk`: own tasks, plus legacy unowned tasks

Admin endpoints:

- `GET /departments`
- `POST /departments`
- `PUT /departments/:id`
- `DELETE /departments/:id`
- `GET /users`
- `PUT /users/:id/assignment`

The new admin UI is intentionally small and appears only for a logged-in `principal`.

## School Workflow Phase 2

Phase 2 adds a first-class Work Item domain without changing the existing task
tables or task routes.

New tables:

- `work_items`
- `work_item_files`
- `ai_analysis`

New routes:

- `POST /work-items`
- `GET /work-items`
- `GET /work-items/:id`
- `PATCH /work-items/:id`
- `POST /work-items/:id/files`
- `POST /work-items/:id/analyze`

Current access rules:

- `principal`: view all work items and review the waiting queue
- `admin`: view all work items
- `clerk`: create work items and view work items they created or are assigned to
- other roles: assigned work items only

Work item audit events:

- `work_item.created`
- `work_item.updated`
- `work_item.file_uploaded`
- `work_item.ai_analyzed`
- login blocked by rate limit
- logout
- password change success
- password change failure: wrong current password

Authenticated self-service password change:

- requires a valid session
- request body:

```json
{
  "currentPassword": "current-password",
  "newPassword": "new-password"
}
```

- current password must match
- new password must be at least 10 characters

Request user resolution priority:

Production:

1. session cookie
2. no other auth fallback

In production, task routes require a valid session:

- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `DELETE /tasks/:id`

Without a valid session, these routes return:

```json
{ "error": "Authentication required" }
```

with `401`.

Local/dev:

1. session cookie
2. `x-user-id` header for dev/testing
3. `MOCK_USER_ID` or `DEFAULT_USER_ID`

Local test flow:

```bash
curl -i -c /tmp/agent-app.cookies -H 'Content-Type: application/json' \
  -d '{"username":"alice"}' http://127.0.0.1:3003/auth/login
curl -b /tmp/agent-app.cookies http://127.0.0.1:3003/auth/session
curl -b /tmp/agent-app.cookies http://127.0.0.1:3003/tasks
curl -i -b /tmp/agent-app.cookies -X POST http://127.0.0.1:3003/auth/logout
```

Session/ownership smoke test:

```bash
npm run smoke:session-ownership
```

To also verify session persistence across a PM2 restart:

```bash
SMOKE_RESTART_COMMAND="pm2 restart ecosystem.config.js --only agent-api --update-env" \
  npm run smoke:session-ownership
```

Task creation is now reliable once the task row is persisted:

- `POST /tasks` returns success when the task is created
- if downstream AI processing fails, the task is stored with `status: "failed"`
- the response still includes a `result` payload that explains the failure

In production, dev identity fallbacks are disabled:

- `x-user-id` does not act as production auth
- `MOCK_USER_ID` and `DEFAULT_USER_ID` do not silently authenticate production requests
- session cookie is the only real production identity path

## Smoke Test

Run these checks after deploy:

1. API health:

```bash
npm run health
```

1. Production verify:

```bash
npm run verify:production
```

2. Web build exists:

```bash
test -f apps/web/dist/index.html && echo "web build ok"
```

3. PM2 process is up:

```bash
npm run pm2:status
```

4. Task list route responds:

```bash
curl -sS "http://localhost:${PORT:-3003}/tasks"
```

5. Task detail route responds:

Get one id from the task list, then query detail:

```bash
TASK_ID=$(curl -sS "http://localhost:${PORT:-3003}/tasks" | jq -r '.tasks[0].task.id')
curl -sS "http://localhost:${PORT:-3003}/tasks/$TASK_ID"
```

If there are no tasks yet, create one from the UI first, then rerun the detail check.

6. Ownership smoke test:

```bash
npm run smoke:ownership
```

This creates a small set of test tasks without deleting data, then lists tasks as `user-a` and `user-b` and prints whether the current behavior looks like ownership enforcement is on or off.

## Monitoring

Minimal production monitoring loop:

1. Check the API health endpoint regularly:

```bash
npm run health
```

2. Check the PM2 process state:

```bash
npm run pm2:status
```

3. Inspect logs when health fails or requests error:

```bash
npm run pm2:logs
```

4. Use the PM2 monitor for live CPU and memory:

```bash
npm run pm2:monit
```

How to recognize common failures:

- health check fails but PM2 is `online`: app is up but request handling or DB connectivity is failing
- PM2 shows frequent restarts or unstable uptime: startup is failing or the process is crashing repeatedly
- memory keeps rising until restart: inspect logs around the `max_memory_restart` event
- logs mention PostgreSQL startup check or fallback policy: likely DB or env issue rather than web/UI

Safe recovery steps:

1. Run `npm run pm2:status`
2. Run `npm run health`
3. Run `npm run pm2:logs`
4. Fix env or DB issue if logs point to startup/storage failure
5. Run `npm run pm2:restart`

## Local Dev

Install dependencies:

```bash
npm install
```

Run API and web together:

```bash
npm run dev
```
