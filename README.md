# Agent App

Monorepo for the current production task flow.

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

Create a manual backup with `pg_dump` in custom format:

```bash
npm run db:backup
```

That writes to `backups/agent-app-YYYYMMDD-HHMMSS.dump` by default.

To choose a file path explicitly:

```bash
BACKUP_FILE=/safe/path/agent-app-prod.dump npm run db:backup
```

Equivalent direct command:

```bash
pg_dump "$DATABASE_URL" -Fc -f backups/agent-app-$(date +%Y%m%d-%H%M%S).dump
```

Restore from a dump file:

```bash
RESTORE_FILE=/safe/path/agent-app-prod.dump npm run db:restore
```

Equivalent direct command:

```bash
pg_restore --clean --if-exists --no-owner --no-privileges -d "$DATABASE_URL" /safe/path/agent-app-prod.dump
```

Important warnings:

- restore can overwrite existing data
- point `DATABASE_URL` at the correct database before restore
- do not commit backup files into git
- store production backups outside the repo when possible

After restore:

```bash
npm run db:check
npm run health
curl -sS "http://localhost:${PORT:-3003}/tasks"
```

Local/dev:

- backing up local Postgres is useful before destructive testing
- restoring locally is the safest way to rehearse recovery steps

Production:

- take backups before schema or infrastructure changes
- store backups in a secure location outside the app repo
- restore to the intended database only after confirming the target `DATABASE_URL`

Supabase Postgres:

- use the same `pg_dump` and `pg_restore` flow with the Supabase Postgres `DATABASE_URL`
- network access and DB permissions must allow dump/restore operations
- for high-risk restores, prefer restoring into a separate database first when your environment allows it

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

## Smoke Test

Run these checks after deploy:

1. API health:

```bash
npm run health
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
