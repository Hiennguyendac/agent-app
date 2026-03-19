# Orchestrator

This folder contains a very small MVP orchestrator.

The orchestrator is the part of the system that decides which agent should handle a task.

## Files Created

### `src/index.ts`

This file contains the `routeTask` function.

It:

- accepts a `Task`
- checks the `taskType`
- sends Growth tasks to the Growth agent
- returns a `TaskResult`

## How The Flow Works

The flow in this folder is:

1. the orchestrator receives a `Task`
2. it checks `task.taskType`
3. if the type is `growth`, it calls the Growth agent
4. the Growth agent returns a `TaskResult`
5. the orchestrator returns that result to the caller, such as the API

## Important Beginner Note

Right now, the orchestrator supports only one route:

- `growth` -> Growth agent

Later, more task types can be added using the same pattern.
