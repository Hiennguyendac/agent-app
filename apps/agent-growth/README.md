# Growth Agent

This folder contains a very small MVP Growth agent.

It is not a real AI system yet.
It only returns a mock result so the full project flow is easier to understand.

## Files Created

### `src/index.ts`

This file contains the `runGrowthAgent` function.

It:

- accepts a `Task`
- creates a simple mock blog draft
- returns a `TaskResult`

## How The Flow Works

The flow in this folder is:

1. the Growth agent receives a `Task`
2. it reads the task title, goal, and audience
3. it creates a short mock blog draft text
4. it returns that text inside a `TaskResult` back to the orchestrator

## Important Beginner Note

This file is intentionally simple.

The goal right now is not to build real AI logic.
The goal is to prove that one task can move through the system and return a result.
