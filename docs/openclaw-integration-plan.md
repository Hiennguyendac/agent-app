# OpenClaw Integration Plan

This repo should integrate OpenClaw as an execution and orchestration layer, not as the system of record.

## Current Rule

Keep these responsibilities inside `agent-app`:

- auth and session cookies
- role and department access rules
- persistent storage in PostgreSQL
- work item, assignment, task, and document tables
- audit logging
- PM2 production runtime

Use OpenClaw only for agent-style processing.

## Recommended Sequence

### Phase 0: Fix The Intake Data Path

Before OpenClaw is connected, make document intake reliable:

- add real text extraction for `.pdf`
- add real text extraction for `.docx`
- store extracted text in `documents.extracted_text`
- set `documents.ocr_status` to `ready` only when extraction succeeds

Without this, OpenClaw only receives filename and metadata guesses.

### Phase 1: Add A Narrow OpenClaw Adapter In `apps/api`

Add a small server-side adapter, for example:

- `apps/api/src/openclaw.ts`

This file should own:

- base URL config
- API key config
- request timeout
- safe fallback behavior
- mapping from `agent-app` domain objects to OpenClaw inputs

Suggested env:

```env
OPENCLAW_ENABLED=false
OPENCLAW_BASE_URL=http://127.0.0.1:8080
OPENCLAW_API_KEY=replace_me
OPENCLAW_TIMEOUT_MS=45000
```

Fail closed for auth, fail soft for AI:

- if OpenClaw is unavailable, `agent-app` should keep working
- analysis endpoints should return local fallback results instead of breaking core workflows

### Phase 2: Use OpenClaw For Document Analysis First

First integration target:

- `POST /documents/:id/analyze`

Desired flow:

1. API loads document record
2. API reads `extracted_text`, metadata, filename
3. API sends a structured analyze request to OpenClaw
4. OpenClaw returns:
   - summary
   - likely workflow type
   - suggested department
   - risk notes
   - suggested next action
5. API stores the result in `document_analysis`

Do not let OpenClaw write directly to PostgreSQL in this phase.

### Phase 3: Add Assisted Work Item Creation

Second target:

- `POST /documents/:id/create-work-item`

Keep `agent-app` responsible for the actual database write.

OpenClaw may suggest:

- work item title
- work item description
- suggested department
- priority hint
- assignment note draft

But `apps/api` should still be the layer that:

- validates access
- writes `work_items`
- links `documents.created_work_item_id`
- emits audit logs

### Phase 4: Extend To Assignment Support

After document analysis is stable, OpenClaw can assist with:

- assignment recommendation
- coordinating department suggestion
- deadline suggestion
- output requirement draft

This should support, not replace, the current principal assignment flow.

### Phase 5: Reporting And Queue Summaries

After the operational path is stable, OpenClaw can help generate:

- overview summaries
- overdue queue summaries
- department backlog narratives
- operator-ready report drafts

This is lower priority than intake and assignment assistance.

## Safe Architecture

Recommended call path:

1. `apps/web` calls `apps/api`
2. `apps/api` authenticates and authorizes the request
3. `apps/api` loads and validates database records
4. `apps/api` calls OpenClaw server-to-server if enabled
5. `apps/api` stores the result back in PostgreSQL
6. `apps/web` reads the saved state from `apps/api`

This keeps OpenClaw out of:

- browser auth
- session handling
- direct database ownership
- role enforcement

## Initial OpenClaw Request Shape

For `POST /documents/:id/analyze`, a safe initial payload is:

```json
{
  "documentId": "doc_123",
  "filename": "incoming-request.pdf",
  "metadata": {
    "source": "front-office",
    "channel": "email"
  },
  "extractedText": "...",
  "requestedByUserId": "alice",
  "role": "clerk"
}
```

Expected response:

```json
{
  "summary": "Short intake summary",
  "workflowType": "school_workflow",
  "suggestedDepartmentId": "dept_academic",
  "riskNotes": [
    "Missing required approval signature"
  ],
  "suggestedNextAction": "Create a review work item for Academic Affairs.",
  "rawOutput": "Full agent response"
}
```

## Guardrails

Do not let OpenClaw:

- bypass session auth
- write directly into `tasks`, `work_items`, or `assignments`
- decide authorization
- become the only processing path

Always keep:

- timeout
- retry policy kept small
- structured audit logs in `agent-app`
- local fallback path

## Recommended First Delivery

The safest first implementation is:

1. add real `.pdf` / `.docx` extraction
2. add `apps/api/src/openclaw.ts`
3. wire only `POST /documents/:id/analyze`
4. store results in `document_analysis`
5. show OpenClaw-backed summary in the existing Documents detail panel

That gives useful operator value without redesigning the app.
