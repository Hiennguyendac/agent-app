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
PORT=3001
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

The API depends on this schema file:

- `infra/sql/001_growth_mvp_schema.sql`

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

Production uses the same schema file, but `DATABASE_URL` should point at your production Postgres or Supabase Postgres before API start/restart.

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

Useful PM2 logs command:

```bash
npm run pm2:logs
```

Equivalent direct PM2 command:

```bash
pm2 restart agent-api
```

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
curl -sS http://localhost:3001/tasks
```

5. Task detail route responds:

Get one id from the task list, then query detail:

```bash
TASK_ID=$(curl -sS http://localhost:3001/tasks | jq -r '.tasks[0].task.id')
curl -sS "http://localhost:3001/tasks/$TASK_ID"
```

If there are no tasks yet, create one from the UI first, then rerun the detail check.

## Local Dev

Install dependencies:

```bash
npm install
```

Run API and web together:

```bash
npm run dev
```
