# Shared Types

This folder contains simple TypeScript types for the MVP.

These types are shared so every part of the system can use the same data shape.

## Types In This Folder

### `TaskType`

This tells the system what kind of task it is.

For now, the MVP supports only one real task type:

- `growth`

### `TaskStatus`

This tells the system what state a task is in.

The MVP uses four simple states:

- `pending`
- `processing`
- `completed`
- `failed`

### `Task`

This is the main object created by the user.

It contains the basic task information, such as:

- task ID
- task type
- title
- goal
- audience
- notes
- status
- created time

### `TaskResult`

This is the output returned by an agent after the task is processed.

It contains:

- which task the result belongs to
- which agent created the result
- the output text
- the created time

## Why This Folder Matters

If the web app, API, orchestrator, and agents all use the same types,
the project stays easier to understand and easier to maintain.

For a beginner, this also reduces confusion because the same data names
are reused across the whole system.
