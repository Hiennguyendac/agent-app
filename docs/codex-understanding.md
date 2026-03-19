# Codex Understanding

## Project Summary

Agent App is a multi-agent business system.

The simple idea is:

1. A human user creates a task in the dashboard.
2. The API receives that task.
3. The orchestrator decides which agent should do the work.
4. The selected agent creates a result.
5. The dashboard shows that result back to the user.

This means the project is not "one app that does everything directly".
It is a small system where different parts have different jobs.

## Folder Guide

### apps/

This folder is for the main runnable applications.

#### apps/web

This is the dashboard for the human operator.

It will likely contain:
- a form to create a task
- a page to see all tasks
- a page to see task details and outputs

#### apps/api

This is the backend API.

It will likely:
- receive requests from the web app
- save task data
- return task data back to the web app

#### apps/orchestrator

This is the brain that routes tasks.

Its job is:
- read the task type
- decide which agent should handle it
- send the task to that agent

#### apps/agent-growth

This agent is for growth work.

Examples:
- blog ideas
- content drafts

#### apps/agent-ops

This agent is for operations work.

Examples:
- system health checks
- ops status reports

#### apps/agent-optimizer

This agent is for optimization work.

Examples:
- landing page suggestions
- conversion improvement ideas

#### apps/agent-sales

This agent is for sales work.

Examples:
- outreach drafts
- sales email drafts

### packages/

This folder is for shared code that many apps can reuse.

#### packages/shared-types

This should hold common TypeScript types or data shapes.

Example:
- what a `Task` looks like
- what an `AgentResult` looks like

#### packages/shared-prompts

This should hold reusable prompts for agents.

Example:
- prompt template for the growth agent
- prompt template for the sales agent

#### packages/shared-utils

This should hold helper functions used in multiple places.

Example:
- formatting helpers
- logging helpers
- validation helpers

### docs/

This folder explains the project in writing.

Current files:

- `architecture.md`: explains how the system parts connect
- `mvp-scope.md`: explains what the first simple version should include
- `tasks.md`: explains the work in phases
- `codex-understanding.md`: this beginner-friendly summary

### infra/

This folder is for environment setup and local development infrastructure.

#### infra/env/.env.example

This is usually a sample environment file.

It shows which environment variables the apps may need later.

#### infra/docker-compose.yml

This is usually used to run local services together.

For example:
- database
- API
- web app

### Root files

#### README.md

This is the short introduction to the whole project.

#### package.json

This will likely manage workspace scripts and dependencies for the monorepo.

#### .gitignore

This tells Git which files should not be committed.

## What The Project Does In Simple Words

You can think of Agent App like this:

- the web app is the control panel
- the API is the receptionist
- the orchestrator is the manager
- each agent is a specialist worker

The operator says, "I need something done."
The system then sends that job to the correct specialist.

## What Is Already Defined

From the docs, these things are already clear:

- the project goal
- the main components
- the four main task types
- the MVP boundary
- the rough implementation phases

## What Is Not Built Yet

Based on the current repository, the project is still in planning/setup stage.

The docs describe the system, but the actual implementation is still mostly empty.

That is normal for an early project.

## Recommended Next Steps

For a beginner, the safest order is:

1. Define the shared data types first.
   Create a simple `Task` type and `TaskResult` type in `packages/shared-types`.

2. Decide the task flow clearly.
   Example:
   - user submits task
   - API stores task
   - orchestrator reads task type
   - matching agent returns mock output
   - web app shows result

3. Build only one full happy path first.
   Start with one task type, such as Growth.
   This keeps the first version small and easier to understand.

4. Build the API before building all agents.
   The API should accept a task and return a result shape.

5. Build a very simple orchestrator.
   At first, it can just use `if/else` or a simple switch on task type.

6. Build mock agents, not real AI logic yet.
   Each agent can return hard-coded sample text first.

7. Build the web dashboard last for the first loop.
   It only needs:
   - create task form
   - task list
   - task detail/result view

8. Add storage after the flow works.
   First make the system work end-to-end, then save data properly.

## Simple MVP Build Order

If I were implementing this repo from scratch, I would do it in this order:

1. `packages/shared-types`
2. `apps/api`
3. `apps/orchestrator`
4. one mock agent such as `apps/agent-growth`
5. `apps/web`
6. then add the other agents

## Good First Deliverable

A very good first milestone would be:

- user opens dashboard
- user creates a Growth task
- API receives it
- orchestrator sends it to Growth Agent
- Growth Agent returns a fake blog draft
- dashboard shows the result

If that works, the system direction is correct.

## Final Note For A Beginner

Do not try to build all agents at once.

First make one simple path work from beginning to end.
After that, copy the pattern for the other agents.
