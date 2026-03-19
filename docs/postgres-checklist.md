# PostgreSQL Checklist

## Goal

This checklist breaks the PostgreSQL migration into small beginner-friendly steps.

It is based on the current Growth MVP only.

This is only a checklist.
It does not implement PostgreSQL yet.

## Step 1: Confirm local PostgreSQL setup

- What to change:
  Review the local database setup and decide how the API will connect to PostgreSQL.
- Which files will change:
  Likely:
  - `infra/docker-compose.yml`
  - `infra/env/.env.example`
- Why this step matters:
  The API cannot use PostgreSQL until local database settings are clear and stable.
- What success looks like:
  You know:
  - which Postgres container will run
  - which database name is used
  - which `DATABASE_URL` the API should use

## Step 2: Decide the first database schema

- What to change:
  Write down the first two tables for the MVP.
- Which files will change:
  Likely:
  - a future SQL migration file
  - `docs/postgres-plan.md`
  - `docs/postgres-checklist.md`
- Why this step matters:
  You should know the database shape before writing any API query code.
- What success looks like:
  The MVP schema is clear:
  - `tasks`
  - `task_results`

## Step 3: Define the `tasks` table

- What to change:
  Plan the columns for the `tasks` table.
- Which files will change:
  Likely:
  - a future SQL migration file
- Why this step matters:
  The `Task` object is the main object in the whole flow.
- What success looks like:
  The table has clear columns such as:
  - `id`
  - `task_type`
  - `title`
  - `goal`
  - `audience`
  - `notes`
  - `status`
  - `created_at`

## Step 4: Define the `task_results` table

- What to change:
  Plan the columns for the `task_results` table.
- Which files will change:
  Likely:
  - a future SQL migration file
- Why this step matters:
  The Growth output should be stored separately but linked to the correct task.
- What success looks like:
  The table has clear columns such as:
  - `id`
  - `task_id`
  - `agent_name`
  - `output_text`
  - `created_at`

## Step 5: Decide the task-to-result relationship

- What to change:
  Define the first relationship rule between `tasks` and `task_results`.
- Which files will change:
  Likely:
  - a future SQL migration file
  - `docs/postgres-plan.md`
- Why this step matters:
  The API and UI need a predictable data shape.
- What success looks like:
  The project clearly uses:
  - one task has zero or one result

## Step 6: Add a simple database access layer in the API

- What to change:
  Add one small place in the API to create a PostgreSQL connection or client.
- Which files will change:
  Likely:
  - a new API database file
  - `apps/api/src/store.ts`
- Why this step matters:
  The API needs one clean way to talk to PostgreSQL.
- What success looks like:
  The API has one simple database access point instead of database code being scattered everywhere.

## Step 7: Replace `createTask()` with a database insert

- What to change:
  Update the task creation logic so it inserts into PostgreSQL instead of pushing into an array.
- Which files will change:
  Likely:
  - `apps/api/src/store.ts`
- Why this step matters:
  This is the first real persistence step.
- What success looks like:
  Creating a task inserts one row into the `tasks` table and returns a normal `Task` object.

## Step 8: Replace `updateTaskStatus()` with a database update

- What to change:
  Update task status changes so they write to PostgreSQL.
- Which files will change:
  Likely:
  - `apps/api/src/store.ts`
- Why this step matters:
  The Growth flow currently changes task status from `pending` to `completed` or `failed`.
- What success looks like:
  The task status is updated in the database and returned correctly to the API.

## Step 9: Replace `saveTaskResult()` with a database insert

- What to change:
  Store the Growth output in the `task_results` table instead of the in-memory map.
- Which files will change:
  Likely:
  - `apps/api/src/store.ts`
- Why this step matters:
  Without this step, task output will still disappear when the server restarts.
- What success looks like:
  A successful Growth task creates one linked row in `task_results`.

## Step 10: Replace `listTaskItems()` with a database query

- What to change:
  Read tasks and results from PostgreSQL instead of from memory.
- Which files will change:
  Likely:
  - `apps/api/src/store.ts`
- Why this step matters:
  The web app needs one response that includes:
  - task info
  - result text if available
- What success looks like:
  `GET /tasks` returns the same UI-friendly shape as before, but from the database.

## Step 11: Keep the API response shape stable

- What to change:
  Make sure the API still returns the same contract the web app already understands.
- Which files will change:
  Likely:
  - `apps/api/src/http.ts`
  - `apps/api/src/store.ts`
- Why this step matters:
  A stable response shape reduces frontend breakage.
- What success looks like:
  The web app does not need major changes after PostgreSQL is added.

## Step 12: Test the full Growth flow again

- What to change:
  Run the current Growth MVP end to end using PostgreSQL-backed storage.
- Which files will change:
  Maybe none, if everything works
- Why this step matters:
  The migration is only successful if the whole flow still works:
  API -> orchestrator -> growth agent -> API response -> web app
- What success looks like:
  You can:
  - create a Growth task
  - refresh the page
  - still see the task
  - still see the Growth output

## Most Important Beginner Rule

Do not redesign the whole app during the database migration.

The safest path is:

1. keep the current API routes
2. keep the current response shape
3. replace only the storage logic step by step
