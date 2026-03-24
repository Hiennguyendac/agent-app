# API App

Small Node/TypeScript API for the current Growth task flow.

## Current Storage Path

The API now uses PostgreSQL as the primary data store through `DATABASE_URL`.

It does not use a Supabase client library directly. If you use Supabase, the API still talks to it as plain Postgres through the `pg` driver and a normal connection string.

There is still an in-memory fallback in `src/store.ts`, but it is now controlled explicitly by runtime environment.

That fallback is useful for local recovery, but it is not a stable production store because:

- data is process-local
- data disappears on restart
- multiple API instances would diverge

## Runtime Behavior

Local and dev:

- in-memory fallback is allowed by default
- if PostgreSQL is available, the API still uses PostgreSQL first
- if PostgreSQL fails, the API can continue with in-memory storage

Production:

- in-memory fallback is disabled by default
- `DATABASE_URL` must be set
- PostgreSQL must be reachable during startup
- if PostgreSQL is unavailable, the API exits instead of silently serving degraded data

## Logs

The API writes compact runtime logs to stdout/stderr.

Useful log categories:

- startup: server start, storage mode, PostgreSQL startup check
- request: method, path, status code, duration, and `taskId` when relevant
- error: startup failure, DB/storage failure, task processing failure

In production with PM2:

```bash
npm run pm2:logs
```

Or directly:

```bash
pm2 logs agent-api
```

Other useful PM2 commands:

```bash
npm run pm2:status
npm run pm2:monit
npm run pm2:restart
```

How to read common failures:

- startup fails with `DATABASE_URL is required`: production env is incomplete
- startup fails after PostgreSQL check: DB is unreachable or credentials are wrong
- `falling back to in-memory storage`: fallback is active, usually local/dev only
- `in-memory fallback is disabled`: production tried to use Postgres and failed
- PM2 shows frequent restarts with low uptime: startup failure or crash loop
- PM2 process is `online` but `/health` fails: app process is up, but request path or DB dependency is unhealthy

## PM2 Runtime

The included ecosystem config is intentionally simple:

- `fork` mode
- `instances: 1`
- `autorestart: true`
- `watch: false`
- `max_memory_restart: 300M`

This is the safer default for the current API because it avoids accidental multi-process drift while still letting PM2 restart a bad process.

You can override the fallback policy explicitly:

```env
ALLOW_INMEMORY_FALLBACK=true
ALLOW_INMEMORY_FALLBACK=false
```

## Required Env

Minimum env for stable production behavior:

```env
DATABASE_URL=postgresql://...
PORT=3001
NODE_ENV=production
ALLOW_INMEMORY_FALLBACK=false
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Notes:

- `DATABASE_URL` is required for the production persisted data path.
- `NODE_ENV=production` disables fallback by default even if `ALLOW_INMEMORY_FALLBACK` is omitted.
- `ALLOW_INMEMORY_FALLBACK=false` makes the production requirement explicit.
- `OPENAI_API_KEY` is required when the Growth agent should generate real output.
- `PORT` controls the API HTTP server and defaults to `3001`.

## Schema Bootstrap

Source schema file:

- `infra/sql/001_growth_mvp_schema.sql`

Apply it with the API package script:

```bash
npm run apply-schema --prefix apps/api
```

Or from the repo root:

```bash
npm run db:apply-schema
```

Check database connectivity first:

```bash
npm run check-db --prefix apps/api
```

Or from the repo root:

```bash
npm run db:check
```

Local/dev:

- point `DATABASE_URL` at your local Postgres
- apply `infra/sql/001_growth_mvp_schema.sql`
- start the API

Production:

- point `DATABASE_URL` at your production Postgres or Supabase Postgres
- apply the same schema before starting or restarting the API
- keep `NODE_ENV=production`
- keep `ALLOW_INMEMORY_FALLBACK=false`

## Backup And Restore

Use the root wrapper scripts:

```bash
npm run db:backup
BACKUP_FILE=/safe/path/agent-app.dump npm run db:backup
CONFIRM_DB_RESTORE=true RESTORE_FILE=/safe/path/agent-app.dump npm run db:restore
```

Requirements:

- `DATABASE_URL`
- `pg_dump`
- `pg_restore`

Operational notes:

- backups should be stored outside git
- restore is destructive and intentionally requires `CONFIRM_DB_RESTORE=true`
- after restore, run `npm run db:check` and `npm run verify:production`

## Tables In Use

Schema file:

- `infra/sql/001_growth_mvp_schema.sql`
- `infra/sql/002_add_task_owner.sql`
- `infra/sql/003_add_auth_sessions.sql`

Current tables:

- `tasks`
- `task_results`
- `auth_sessions`

`tasks` stores the main task row:

- `id`
- `task_type`
- `title`
- `goal`
- `audience`
- `notes`
- `status`
- `created_at`

`task_results` stores one result row per task:

- `id`
- `task_id`
- `agent_name`
- `output_text`
- `created_at`

## Request Flow

Main API routes:

- `GET /health`
- `GET /auth/session`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /tasks`
- `GET /tasks/:id`
- `POST /tasks`
- `DELETE /tasks/:id`

## Auth V1

Auth v1 is a minimal server-side session using an HttpOnly cookie and a PostgreSQL-backed session store.

Request user resolution priority:

Production:

1. session cookie
2. no header/env identity fallback

In production, task routes also require a valid session. Without one, the API returns `401` with:

```json
{ "error": "Authentication required" }
```

Local/dev:

1. session cookie
2. `x-user-id` header
3. `MOCK_USER_ID` or `DEFAULT_USER_ID`

This keeps session-backed identity as the only real production auth path while preserving mock-user fallback for local testing and debugging outside production.

`auth_sessions` stores:

- `id`
- `user_id`
- `expires_at`
- `created_at`

This lets session-backed login survive API or PM2 restarts as long as PostgreSQL is available.

Flow by operation:

1. Create
   `src/http.ts` validates the request, then `src/store.ts` inserts the task into Postgres, updates status, saves the result row, and returns `{ task, result }`. If downstream processing fails after the task row is created, the API now marks the task as `failed`, stores a failure result message, and still returns a successful create response so the client is not left in an ambiguous partial-create state.
2. List
   `src/http.ts` calls `listTaskItems()` in `src/store.ts`, which reads `tasks` and `task_results`, then returns the UI-friendly `{ task, result? }` shape.
3. Detail
   `src/http.ts` calls `getTaskItemById()` in `src/store.ts`, which reads one task row plus its latest result row.
4. Delete
   `src/store.ts` deletes from `task_results` and `tasks` in one transaction, then clears the in-memory mirror.
5. Retry
   Retry is not a separate backend route. The frontend retries by sending a new `POST /tasks`, which creates a new task row and a new result row.

## Files To Know

- `src/index.ts`: starts the HTTP server
- `src/http.ts`: route handling and request validation
- `src/db.ts`: loads env and creates the shared `pg` pool
- `src/store.ts`: Postgres queries plus in-memory fallback

Useful root scripts:

- `npm run db:backup`
- `npm run db:restore`
- `npm run health`
- `npm run verify:production`
- `npm run pm2:status`
- `npm run pm2:logs`

## Operational Risk To Know

If PostgreSQL is unreachable and fallback is allowed, the API falls back to in-memory storage in `src/store.ts`.

That means the API may still answer requests, but the behavior is degraded:

- created tasks are not durably persisted
- data is lost on restart
- data is not shared across multiple processes

For production, treat `DATABASE_URL`, database connectivity, and fallback policy as required startup conditions.
