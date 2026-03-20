# Agent App

Monorepo for a small task dashboard and API.

## Apps

- `apps/web`: Vite frontend for creating and viewing Growth tasks
- `apps/api`: Node/TypeScript HTTP API
- `apps/orchestrator`: task routing logic
- `apps/agent-growth`: Growth content agent
- `packages/shared-types`: shared TypeScript types

## Local Run

Install dependencies from the repo root:

```bash
npm install
```

Start both web and API:

```bash
npm run dev
```

Start one app at a time:

```bash
npm run api
npm run web
```

## Required Env

Use `infra/env/.env.example` as the safe template for local env values.

Minimum variables used by the current task flow:

```env
DATABASE_URL=postgresql://postgres:postgres@db:5432/agentapp
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-5-mini
```

Notes:

- `OPENAI_API_KEY` is required only when you want real AI-generated Growth output.
- Never commit real secrets to `.env.example` or README files.
- The root `.env` is gitignored in this repo.

## Build

Build the API:

```bash
npm run build --prefix apps/api
```

Build the web app:

```bash
npm run build --prefix apps/web
```

## Start

Start the compiled API:

```bash
npm run start --prefix apps/api
```

For the web app in local development, use:

```bash
npm run dev --prefix apps/web
```

## Health

If the API is running locally on the default port:

```bash
curl http://localhost:3001/health
```

Expected response:

```json
{
  "ok": true
}
```
