# Implementation Checklist

## Goal Of This Checklist

This checklist is for building the first simple version of Agent App.

It is written for a beginner.
It focuses on only one full path:

- Growth task

This means the first version should do only this:

1. user creates a Growth task
2. API receives it
3. orchestrator routes it
4. Growth agent returns a simple result
5. web app shows that result

Do not build all agents first.
Make one path work end to end.

## Phase 1: Clarify The First Working Flow

### Step 1: Write the exact Growth task flow

- What to create:
  A short written flow for how one Growth task moves through the system.
- Which folder/file to create or edit:
  Edit `docs/tasks.md` or add a short section to `docs/codex-understanding.md`.
- Why this step matters:
  If the flow is unclear, coding becomes confusing very quickly.
  A beginner needs one clear story before building anything.
- What success looks like:
  You can explain the flow in one minute, like this:
  "The user submits a Growth task in the web app, the API stores it, the orchestrator sends it to the Growth agent, and the result comes back to the dashboard."

### Step 2: Define the first task type clearly

- What to create:
  A simple description of what a Growth task means in this project.
- Which folder/file to create or edit:
  Edit `docs/mvp-scope.md`.
- Why this step matters:
  You need to know what input the system expects before making forms, APIs, or agents.
- What success looks like:
  The doc clearly says what fields a Growth task should have, for example:
  `title`, `goal`, `audience`, `notes`, `taskType`.

## Phase 2: Define Shared Data Shapes

### Step 3: Plan the main data objects

- What to create:
  A written list of the main data objects for the MVP.
- Which folder/file to create or edit:
  Add a new section in `docs/architecture.md` or `docs/implementation-checklist.md`.
- Why this step matters:
  The web app, API, orchestrator, and agent all need to agree on the same task structure.
- What success looks like:
  You have a clear list like:
  `Task`, `TaskResult`, and `TaskStatus`.

### Step 4: Define the Task shape

- What to create:
  A beginner-friendly draft of the fields inside a `Task`.
- Which folder/file to create or edit:
  Plan for `packages/shared-types`
  and write the draft in `docs/implementation-checklist.md` first.
- Why this step matters:
  This is the object that moves through almost the whole system.
- What success looks like:
  You can say a `Task` contains:
  `id`, `taskType`, `title`, `goal`, `status`, `createdAt`.

### Step 5: Define the TaskResult shape

- What to create:
  A beginner-friendly draft of the fields inside a `TaskResult`.
- Which folder/file to create or edit:
  Plan for `packages/shared-types`
  and write the draft in `docs/implementation-checklist.md` first.
- Why this step matters:
  The system needs a consistent output format when an agent finishes work.
- What success looks like:
  You can say a `TaskResult` contains:
  `taskId`, `agentName`, `outputText`, `createdAt`.

## Phase 3: Prepare The Shared Package Plan

### Step 6: Decide what belongs in shared-types

- What to create:
  A small list of the files that will later live in `packages/shared-types`.
- Which folder/file to create or edit:
  Write the plan in `docs/implementation-checklist.md`.
- Why this step matters:
  It prevents random type definitions from being duplicated across apps.
- What success looks like:
  You know that later you will likely create files such as:
  `packages/shared-types/task.ts`
  and `packages/shared-types/task-result.ts`.

### Step 7: Decide what does not belong in shared-types

- What to create:
  A short rule for what should stay out of the shared package.
- Which folder/file to create or edit:
  Add the rule in `docs/implementation-checklist.md`.
- Why this step matters:
  Beginners often put too much into shared folders.
  Shared code should stay simple.
- What success looks like:
  You understand that only common types go there, not web pages, not API handlers, and not agent logic.

## Phase 4: Plan The API First

### Step 8: Decide the first API action

- What to create:
  A written description of the first API action for the MVP.
- Which folder/file to create or edit:
  Add this plan to `docs/tasks.md` or `docs/implementation-checklist.md`.
- Why this step matters:
  The API is the first system entry point after the dashboard.
- What success looks like:
  You have one simple API action:
  "Create a Growth task and return the created task."

### Step 9: Decide the first API input

- What to create:
  A simple example of the request body for a Growth task.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  It helps connect the future web form with the future backend.
- What success looks like:
  You have a small example payload with fields like:
  `taskType`, `title`, `goal`, `audience`.

### Step 10: Decide the first API output

- What to create:
  A simple example of what the API returns after task creation.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  A clear API response makes the next web and orchestrator steps much easier.
- What success looks like:
  You have an example response containing at least:
  `id`, `taskType`, `status`, and the input fields.

## Phase 5: Plan The Orchestrator

### Step 11: Write the routing rule for MVP

- What to create:
  One simple rule for how the orchestrator chooses an agent.
- Which folder/file to create or edit:
  Add it to `docs/architecture.md` or `docs/implementation-checklist.md`.
- Why this step matters:
  The orchestrator is the main idea of this project.
- What success looks like:
  The rule is very simple:
  "If taskType is `growth`, send it to the Growth agent."

### Step 12: Define the orchestrator input

- What to create:
  A short note describing what the orchestrator receives.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  The orchestrator needs a clear contract from the API.
- What success looks like:
  It is clear that the orchestrator receives a `Task`.

### Step 13: Define the orchestrator output

- What to create:
  A short note describing what the orchestrator returns.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  The next system part needs a stable result shape.
- What success looks like:
  It is clear that the orchestrator returns a `TaskResult`.

## Phase 6: Plan The Growth Agent

### Step 14: Define the exact responsibility of the Growth agent

- What to create:
  A small description of the Growth agent's first job.
- Which folder/file to create or edit:
  Edit `docs/mvp-scope.md` or write it in `docs/implementation-checklist.md`.
- Why this step matters:
  A narrow job keeps the first implementation small and realistic.
- What success looks like:
  The Growth agent has one first responsibility, such as:
  "Return a simple blog draft based on the task goal."

### Step 15: Decide the first mock output

- What to create:
  One example of the fake result the Growth agent will return in the MVP.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  The first version does not need real AI logic yet.
  A mock result is enough to prove the system flow works.
- What success looks like:
  You have a short sample output like:
  "Blog draft: 5 ways small businesses can improve online growth."

## Phase 7: Plan The Web App

### Step 16: Decide the first screen

- What to create:
  A description of the first page the beginner should build.
- Which folder/file to create or edit:
  Add the plan to `docs/tasks.md` or `docs/implementation-checklist.md`.
- Why this step matters:
  The web app should begin with the simplest useful screen.
- What success looks like:
  You choose one first screen:
  "Create Growth task form."

### Step 17: Decide the minimum form fields

- What to create:
  A small list of fields for the first form.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  Beginners often make forms too large too early.
  The first form should stay small.
- What success looks like:
  The form uses only a few fields, such as:
  `title`, `goal`, `audience`, `notes`.

### Step 18: Decide the first result screen

- What to create:
  A short description of how the result should be shown.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  The system needs a visible end result, not just backend flow.
- What success looks like:
  The dashboard can show:
  task title, task type, status, and Growth output text.

## Phase 8: Plan Temporary Storage

### Step 19: Decide how to store MVP data at first

- What to create:
  A simple storage decision for the first version.
- Which folder/file to create or edit:
  Add this note to `docs/implementation-checklist.md`.
- Why this step matters:
  A beginner should not start with complex persistence if not needed.
- What success looks like:
  You choose one simple approach for the first version, such as:
  in-memory storage or a very simple local data store.

### Step 20: Decide what task states exist

- What to create:
  A short list of task statuses for the MVP.
- Which folder/file to create or edit:
  Write it in `docs/implementation-checklist.md`.
- Why this step matters:
  Status values help the UI and backend stay consistent.
- What success looks like:
  You have a short list like:
  `pending`, `processing`, `completed`, `failed`.

## Phase 9: Plan Logging And Debugging

### Step 21: Decide what should be logged

- What to create:
  A simple list of important events to log.
- Which folder/file to create or edit:
  Add it to `docs/implementation-checklist.md`.
- Why this step matters:
  Logs help beginners understand whether the system flow is working.
- What success looks like:
  You know you want logs for:
  task received, task routed, agent started, agent finished, result returned.

## Phase 10: Define The First Real Build Order

### Step 22: Build shared types first

- What to create:
  The first actual implementation task on your future coding list.
- Which folder/file to create or edit:
  Later in `packages/shared-types/*`.
- Why this step matters:
  Shared types give the rest of the system a stable foundation.
- What success looks like:
  The task and result shapes are defined and understandable.

### Step 23: Build one API endpoint next

- What to create:
  One endpoint that accepts a Growth task.
- Which folder/file to create or edit:
  Later in `apps/api/*`.
- Why this step matters:
  This creates the entry point for the whole system.
- What success looks like:
  The API can accept the task and return a valid task object.

### Step 24: Build the orchestrator after that

- What to create:
  One small routing function for Growth tasks.
- Which folder/file to create or edit:
  Later in `apps/orchestrator/*`.
- Why this step matters:
  This is the core behavior that makes the app multi-agent.
- What success looks like:
  A Growth task is always routed to the Growth agent.

### Step 25: Build the Growth agent mock

- What to create:
  One mock Growth agent that returns sample text.
- Which folder/file to create or edit:
  Later in `apps/agent-growth/*`.
- Why this step matters:
  This proves the full system can produce output without waiting for advanced AI integration.
- What success looks like:
  The agent returns a simple blog draft result.

### Step 26: Build the web form last for the first loop

- What to create:
  One very simple page to submit a Growth task.
- Which folder/file to create or edit:
  Later in `apps/web/*`.
- Why this step matters:
  Once the backend path exists, the UI becomes much easier to connect.
- What success looks like:
  You can submit a Growth task from the browser and get a visible result.

## Final MVP Success Definition

The first MVP is successful when all of these are true:

- a user can create a Growth task
- the API accepts it
- the orchestrator routes it correctly
- the Growth agent returns a mock result
- the result is shown in the web app

If these five things work, the project has a real end-to-end foundation.

## Important Beginner Rule

Do not start with:

- all four agents
- advanced AI logic
- real publishing
- billing
- advanced security

Start with one simple Growth path.
Then repeat the same pattern for the other agents later.
