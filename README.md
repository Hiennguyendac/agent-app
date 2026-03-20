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
curl http://localhost:3001/health
```

Expected response:

```json
{
  "ok": true
}
```

## Local Dev

Install dependencies:

```bash
npm install
```

Run API and web together:

```bash
npm run dev
```
