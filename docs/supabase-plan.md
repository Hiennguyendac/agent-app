# Supabase Plan

## Goal

This document explains the simplest way to adapt the current Growth MVP
to use Supabase as the PostgreSQL database.

It keeps the current app architecture the same:

- web app stays the same
- API stays the same shape
- orchestrator stays the same
- growth agent stays the same

For now, the in-memory fallback should stay in place.

This is only a plan.
It does not implement the migration yet.

## What You Need From Supabase Dashboard

To use Supabase as your PostgreSQL database, you need a Supabase project first.

From the Supabase Dashboard, you will need:

1. A project
2. Your database password
3. A PostgreSQL connection string
4. The SQL Editor

## What To Create In Supabase First

The simplest path is:

1. create a new Supabase project
2. open the SQL Editor
3. run your schema SQL for:
   - `tasks`
   - `task_results`
4. copy the correct PostgreSQL connection string
5. place that connection string into `DATABASE_URL`

## Where To Get `DATABASE_URL`

Supabase gives you database connection strings in the Dashboard.

The simplest place to find them is:

1. open your Supabase project
2. click **Connect**
3. copy a PostgreSQL connection string

Supabase provides more than one connection type.

## Which Connection String To Use

For this project, the API is a persistent backend service.

The simplest recommendation is:

- use the **Direct connection** if your environment supports IPv6
- otherwise use the **Session pooler** connection string

Why:

- direct connection is best for long-running backend services
- session pooler is a good fallback when IPv6 is not available

You do **not** need the frontend URL or API keys for this migration step,
because this plan is only about replacing PostgreSQL storage in the API.

## What The Supabase `DATABASE_URL` Will Look Like

Examples from Supabase docs:

- Direct connection:
  `postgresql://postgres:[YOUR-PASSWORD]@db.<project-ref>.supabase.co:5432/postgres`
- Session pooler:
  `postgres://postgres.<project-ref>:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres`

You will put that value into:

- `infra/env/.env.example`
- your real local `.env` file later

## How To Apply Your SQL Schema To Supabase

The easiest beginner-friendly path is the SQL Editor in the Dashboard.

Steps:

1. open your Supabase project
2. go to **SQL Editor**
3. click **New Query**
4. copy the SQL from your schema file
5. click **Run**

For this project, the schema you want to apply is:

- `infra/sql/001_growth_mvp_schema.sql`

That file creates:

- `tasks`
- `task_results`

## What Each Table Will Store

### `tasks`

This table stores the main Growth task data.

Important fields:

- `id`
- `task_type`
- `title`
- `goal`
- `audience`
- `notes`
- `status`
- `created_at`

### `task_results`

This table stores the output returned by the Growth agent.

Important fields:

- `id`
- `task_id`
- `agent_name`
- `output_text`
- `created_at`

## How `Task` And `TaskResult` Map To Supabase Postgres

The app-level TypeScript shapes can stay the same.

The database will use SQL-style column names:

- `taskType` -> `task_type`
- `createdAt` -> `created_at`
- `outputText` -> `output_text`
- `taskId` -> `task_id`
- `agentName` -> `agent_name`

That means the API storage layer will need to map:

- app shape -> database shape when writing
- database shape -> app shape when reading

## What Files In This Repo Will Need To Change Later

### `infra/env/.env.example`

This file will need the Supabase PostgreSQL connection string example.

Later, your real environment file should point `DATABASE_URL` to Supabase.

### `apps/api/src/db.ts`

This file already reads `DATABASE_URL`.

Later, it will use the Supabase PostgreSQL connection string instead of local Docker Postgres.

### `apps/api/src/store.ts`

This is the main file that will change.

Later, it will:

- insert tasks into Supabase Postgres
- update task status in Supabase Postgres
- save task results in Supabase Postgres
- read tasks and results from Supabase Postgres

### `apps/api/src/http.ts`

This file may need only small updates.

The routes can stay the same.

### `infra/sql/001_growth_mvp_schema.sql`

This file is the schema you will apply to Supabase.

You may keep using it as your first migration source.

### `infra/docker-compose.yml`

This file becomes less important if you stop using local Docker Postgres.

You do not need to delete it now.
You can simply stop depending on it for database storage later.

## Simplest Next Steps For You

If you want to move forward carefully, do these next:

1. Create a Supabase project
2. Save your database password
3. Open **Connect** in the Dashboard
4. Copy the correct PostgreSQL connection string
5. Open **SQL Editor**
6. Run the SQL from `infra/sql/001_growth_mvp_schema.sql`
7. Put the Supabase connection string into `DATABASE_URL`
8. Only after that, update the API storage layer step by step

## Important Beginner Rule

Do not migrate everything at once.

The safest path is:

1. keep the current API routes
2. keep the current web app contract
3. keep the in-memory fallback for now
4. replace storage functions one by one

## Final Recommendation

Use Supabase only as the PostgreSQL provider.

You do **not** need to redesign the app around Supabase client libraries.
Your current backend can keep using PostgreSQL through `DATABASE_URL`.

That is the simplest way to keep the current architecture unchanged.
