# PostgreSQL Plan

## Goal

This document explains the simplest way to move the current Growth MVP
from in-memory storage to PostgreSQL.

It is written for a beginner.

This is only a plan.
It does not implement the database yet.

## Current Storage Approach

Right now, the API stores data only in memory.

In `apps/api/src/store.ts`, there are two in-memory structures:

- `tasks: Task[]`
- `taskResults: Map<string, TaskResult>`

This means:

- tasks disappear when the server restarts
- results disappear when the server restarts
- the app works for learning, but not for real persistence

## Simplest PostgreSQL Design

The easiest database design for the current MVP is:

1. one `tasks` table
2. one `task_results` table

This matches the current code very well:

- `Task` becomes one database row in `tasks`
- `TaskResult` becomes one database row in `task_results`

That is simple, clear, and scalable enough for the current Growth-only MVP.

## Tables We Need First

### 1. `tasks`

This table stores the main task data.

Suggested fields:

- `id`
- `task_type`
- `title`
- `goal`
- `audience`
- `notes`
- `status`
- `created_at`

### 2. `task_results`

This table stores the result returned by the agent.

Suggested fields:

- `id`
- `task_id`
- `agent_name`
- `output_text`
- `created_at`

## Suggested Field Details

### `tasks` table

#### `id`

- type: `text` or `uuid`
- purpose: unique task ID

For a beginner MVP, `text` is acceptable because the app already uses string IDs.
Later, you can move to `uuid`.

#### `task_type`

- type: `text`
- example: `growth`
- purpose: tells the system what kind of task this is

#### `title`

- type: `text`
- purpose: task name shown in the UI

#### `goal`

- type: `text`
- purpose: main business goal

#### `audience`

- type: `text`
- purpose: target audience for the task

#### `notes`

- type: `text`
- nullable: yes
- purpose: optional extra notes

#### `status`

- type: `text`
- examples:
  - `pending`
  - `processing`
  - `completed`
  - `failed`
- purpose: current task state

#### `created_at`

- type: `timestamptz`
- purpose: when the task was created

### `task_results` table

#### `id`

- type: `text` or `uuid`
- purpose: unique result ID

This is useful even if there is only one result per task today.
It gives the table a clean primary key and makes future changes easier.

#### `task_id`

- type: `text` or `uuid`
- purpose: link the result to the task

This should reference `tasks.id`.

#### `agent_name`

- type: `text`
- example: `growth-agent`
- purpose: which agent created the result

#### `output_text`

- type: `text`
- purpose: the Growth output shown in the UI

#### `created_at`

- type: `timestamptz`
- purpose: when the result was created

## How Task And TaskResult Should Be Stored

### Task

When the user submits the form:

1. the API creates a new row in `tasks`
2. the row starts with status `pending`
3. the orchestrator runs the Growth flow
4. if successful, the API updates the task status to `completed`
5. if something fails, the API updates the task status to `failed`

### TaskResult

After the Growth agent returns output:

1. the API creates a new row in `task_results`
2. `task_results.task_id` points to the correct task
3. the UI can then fetch task + result together

## Relationship Between The Tables

For the current MVP, the simplest rule is:

- one task has zero or one result

That means:

- a task may exist before a result exists
- a result should belong to exactly one task

This can later grow into:

- one task has many results

But you do not need that yet.

## Simplest Query Shape For The UI

The current UI wants to show:

- task information
- result text if available

So the API should continue returning a combined shape like:

- `{ task, result }`

That means the backend will likely:

1. read from `tasks`
2. left join `task_results`
3. map database rows into the same response shape the web app already understands

## Files That Will Likely Need To Change

### `apps/api/src/store.ts`

This is the most important file to change first.

Right now it contains in-memory arrays and maps.
Later, it should call PostgreSQL queries instead.

Likely changes:

- replace `tasks: Task[]`
- replace `taskResults: Map<string, TaskResult>`
- replace helper functions with database reads and writes

### `apps/api/src/http.ts`

This file may need only small changes.

The route structure can stay mostly the same.
It will still:

- validate input
- create task
- run orchestrator
- save result
- return response

The main difference is that it will call async database functions.

### `packages/shared-types/task.ts`

Maybe no change is needed at first.

The current `Task` shape is already a good application-level shape.

### `packages/shared-types/task-result.ts`

Maybe no change is needed at first.

The current `TaskResult` shape is already a good application-level shape.

### `infra/docker-compose.yml`

This will likely need to add a PostgreSQL service later.

That is a clean place to run the database locally.

### `infra/env/.env.example`

This will likely need a database connection variable later.

For example:

- `DATABASE_URL=...`

## Recommended Beginner Implementation Order

When you are ready to implement PostgreSQL, the safest order is:

1. Add PostgreSQL to local infrastructure
2. Add a simple connection config in the API
3. Create the `tasks` table
4. Create the `task_results` table
5. Replace `createTask()` with an insert query
6. Replace `updateTaskStatus()` with an update query
7. Replace `saveTaskResult()` with an insert query
8. Replace `listTaskItems()` with a select query plus join
9. Test the web flow again

## Suggested First SQL Model

This is the simplest mental model, not a final migration:

### `tasks`

- primary key: `id`
- important columns:
  - `task_type`
  - `title`
  - `goal`
  - `audience`
  - `notes`
  - `status`
  - `created_at`

### `task_results`

- primary key: `id`
- foreign key: `task_id -> tasks.id`
- important columns:
  - `agent_name`
  - `output_text`
  - `created_at`

## Keep It Simple

For this MVP, do not start with:

- multiple agent result versions
- audit tables
- event sourcing
- advanced retry tables
- billing tables
- user permission tables

Start with:

- one task table
- one task result table

That is enough for the current Growth MVP.

## Final Recommendation

The current project is already structured in a way that makes PostgreSQL migration straightforward.

The storage logic is mostly isolated in `apps/api/src/store.ts`.
That is good.

The safest next step later is not to redesign the whole project.
Just replace the in-memory store functions with database-backed functions while keeping the current API flow the same.
