# API App

This folder contains a very small MVP API for the Growth task flow.

It does not include:

- web app
- database

It only provides a simple API to:

- create a task
- list tasks

## Files Created

### `package.json`

This defines the API package name and basic scripts.

It includes:

- a `build` script for TypeScript
- a `start` script for the compiled server

### `tsconfig.json`

This tells TypeScript how to compile the API code.

It also includes the shared types from `packages/shared-types`.

### `src/index.ts`

This is the API entry point.

It starts the HTTP server on port `3001`.

### `src/http.ts`

This file handles the HTTP routes.

Right now it supports:

- `GET /tasks`
- `POST /tasks`

It also:

- reads JSON request bodies
- validates input
- calls the orchestrator for Growth tasks
- returns JSON responses

### `src/store.ts`

This file contains the in-memory task storage.

It keeps tasks in a simple array while the server is running.

It also:

- creates new `Task` objects using the shared types
- updates task status after processing

## Shared Types Used

This API uses the shared types from:

- `packages/shared-types`

Important types used here:

- `Task`
- `TaskStatus`

## API Flow

The current MVP flow is very simple:

1. A client sends `POST /tasks`
2. The API validates the input
3. The API creates a new Growth task
4. The task is stored in memory
5. The API sends the task to the orchestrator
6. The orchestrator routes the task to the Growth agent
7. The Growth agent returns a mock `TaskResult`
8. The API updates the task status to `completed`
9. The API returns both the task and the result

For listing tasks:

1. A client sends `GET /tasks`
2. The API reads the in-memory task list
3. The API returns all tasks as JSON

## Current Task Rules

For now, every created task is automatically:

- a `growth` task
- first given status `pending`
- then updated to `completed` if the Growth flow succeeds

This keeps the MVP very small and focused.

## Important Beginner Note

Because this API uses in-memory storage, data is temporary.

If the server restarts, the tasks disappear.

That is acceptable for the first MVP because the goal is to understand the full flow before adding a real database.
