# School Workflow Blueprint v1

This document turns the current production-safe `agent-app` into a document-first school workflow system without breaking the existing auth, session, task safety, and ownership foundations.

## 1. Product Goal

The system should support five core outcomes:

1. central intake of documents and work requests
2. fast principal routing by explicit selection
3. AI agent orchestration for assignment, reminders, and tracking
4. department execution with structured reporting
5. agent review before principal approval and archive

This means the app should stop behaving like a generic task dashboard and instead behave like a controlled school operations system.

## 2. Current Foundation To Preserve

These parts are already stable and should remain the backbone:

- session-cookie authentication
- DB-backed users, roles, departments, and password hashes
- production-only session auth path
- PostgreSQL-backed persistence
- document, work item, assignment, notification, and task domain models
- audit logging
- PM2 + production verify flow

Do not redesign these foundations in the next phases. Extend them.

## 3. Core Domain Model

The business flow should be modeled through five layers.

### 3.1 Documents

`documents` are the intake source of truth.

Purpose:

- incoming official documents
- internal directives
- ad hoc requests
- plans and schedules
- attached source files

Required fields:

- `id`
- `code`
- `title`
- `document_type`
- `received_at`
- `created_by_user_id`
- `priority`
- `preliminary_deadline`
- `metadata`
- `file source`
- `extracted_text`
- `ocr_status`

Current app status:

- partially present
- missing stronger intake metadata and numbering

### 3.2 Work Items

`work_items` are the operational case record that the principal reviews and routes.

Purpose:

- bridge between intake and execution
- hold principal decisions
- hold assignment context
- hold review and approval readiness

Current app status:

- present
- should become the main operational record for leadership and departments

### 3.3 Assignments

`assignments` represent the principal decision layer.

Purpose:

- main department
- coordinating departments
- deadline
- priority
- output requirement
- principal note
- acceptance state

Current app status:

- present
- missing a fuller acceptance / adjustment loop

### 3.4 Tasks

`tasks` represent execution units for departments and possibly internal assignees.

Purpose:

- department action queue
- execution progress
- reminders
- response submission
- completion after approval

Current app status:

- present
- still carries legacy growth-task DNA
- should become cleaner school-execution tasks

### 3.5 Reviews And Archive

This is the missing layer.

Purpose:

- agent review of submitted output
- classify failure type
- return to the right stage
- principal final approval
- historical archive

Current app status:

- mostly missing
- should be the next major workflow layer

## 4. Role Model

### 4.1 Principal

Main capabilities:

- review intake
- choose routing path
- assign lead and coordinating departments
- set deadline and priority
- review final output
- approve completion
- monitor full-school reports

UI views:

- Overview
- Principal Review
- Assignments
- Approvals
- Reports
- Admin
- Account

### 4.2 Clerk / Intake Operator

Main capabilities:

- create intake documents
- upload files
- fill initial metadata
- pass cases to principal review

UI views:

- Intake
- Account
- limited Overview

### 4.3 AI Agent

This is not a human UI role. It is a service capability layer.

Responsibilities:

- intake analysis
- routing suggestion
- assignment generation support
- reminder schedules
- deadline tracking
- review of submitted output
- daily and weekly summaries
- bottleneck detection

### 4.4 Department Head

Main capabilities:

- accept or request assignment adjustment
- organize internal execution
- update progress
- submit department response
- answer supplement requests

UI views:

- Overview
- Department Tasks
- Work Items related to their department
- Reports limited to their scope
- Account

### 4.5 Staff

Main capabilities:

- execute assigned work
- update progress
- upload evidence
- report internally to the department head

UI views:

- My Tasks
- Related Work Items
- Account

## 5. Target Workflow

The target workflow should be implemented as nine stages.

### Stage 1. Intake

Input sources:

- incoming official document
- internal directive
- plan
- emergent task
- department request
- work calendar item

System actions:

- clerk creates or uploads intake
- agent extracts text and summarizes
- agent suggests type, urgency, deadline, and department

State after stage:

- `new_intake`
- or `waiting_principal_review`

### Stage 2. Principal Review

Principal sees:

- original file
- extracted summary
- AI suggestions
- deadline suggestion
- output requirement suggestion

Principal actions:

- assign to department
- assign to multiple departments
- assign lead + coordinating units
- return to clerk for more intake data
- hold

State after stage:

- `waiting_assignment`
- or `intake_returned`
- or `on_hold`

### Stage 3. Assignment Orchestration

When principal confirms assignment:

- create assignment record
- create one main execution task
- optionally create coordinating tasks
- notify departments
- request explicit acceptance

State after stage:

- `assigned`
- `waiting_acceptance`

### Stage 4. Department Acceptance

Receiving unit must choose:

- `accepted`
- or `adjustment_requested`

If delayed:

- agent reminder 1
- reminder 2
- escalation to principal

### Stage 5. Department Execution

Department workflow:

- review requirements
- split internal work if needed
- upload evidence
- update progress
- flag waiting coordination or missing data

Task status examples:

- `pending`
- `accepted`
- `running`
- `waiting_dependency`
- `submitted`

### Stage 6. Monitoring And Anti-Stall

Agent should run periodic checks for:

- not accepted yet
- near deadline
- overdue
- stale progress
- waiting coordination
- missing response package

Outputs:

- in-app notifications
- daily department summary
- weekly principal summary
- bottleneck panel

### Stage 7. Submission

Department submits:

- response report
- evidence files
- explanation if delayed
- completion confirmation

Work item moves to:

- `agent_review`

### Stage 8. Agent Review

Agent review must not be a single pass/fail flag. It should classify the return path.

Possible outcomes:

1. `needs_supplement`
   - missing file
   - missing evidence
   - missing form

2. `needs_rework`
   - content does not answer the request
   - wrong scope
   - incomplete result

3. `late_requires_explanation`
   - deadline missed
   - explanation required

4. `needs_reassignment`
   - wrong department
   - extra coordinating unit needed

5. `ready_for_principal_approval`
   - sufficient for final review

This is the most important logic rule:

Do not return all failures to the beginning.
Return to the exact failing stage.

### Stage 9. Principal Approval And Archive

Principal receives a final review package containing:

- source document
- assignment context
- department execution history
- uploaded result files
- agent assessment
- deadline status
- review history

Principal may choose:

- approve completion
- request revision
- continue processing
- archive

Archived record must retain:

- source document
- assignment
- reminders
- progress history
- submitted results
- agent review
- principal decision

## 6. Recommended State Machines

Use separate state machines instead of overloading one status field.

### 6.1 Document Status

Recommended:

- `new`
- `processing`
- `ready_for_review`
- `converted`
- `archived`

### 6.2 Work Item Status

Recommended:

- `new_intake`
- `waiting_principal_review`
- `waiting_assignment`
- `assigned`
- `waiting_acceptance`
- `in_progress`
- `waiting_submission`
- `agent_review`
- `needs_supplement`
- `needs_rework`
- `late_explanation_required`
- `waiting_principal_approval`
- `completed`
- `archived`

### 6.3 Assignment Status

Recommended:

- `draft`
- `sent`
- `waiting_acceptance`
- `accepted`
- `adjustment_requested`
- `overdue`
- `closed`

### 6.4 Task Status

Recommended:

- `pending`
- `accepted`
- `running`
- `waiting_dependency`
- `submitted`
- `returned_for_fix`
- `completed`

## 7. Where Agent Logic Should Attach

The AI/Agent layer should be attached at seven operational points.

1. intake analysis
2. principal pre-assignment suggestions
3. task and reminder orchestration after assignment
4. execution monitoring during department work
5. submission package validation
6. pre-principal review classification
7. daily and weekly reporting

OpenClaw or any future orchestration layer should support these steps, but `agent-app` must remain the system of record.

## 8. Required New Backend Capabilities

These are the most important backend additions to align the current repo to the target workflow.

### 8.1 Principal Review Layer

Add a new principal review action model on top of work items:

- `principal_action`
- `principal_note`
- `lead_department_id`
- `coordinating_department_ids`
- `final_deadline`
- `output_requirement`
- `assignment_decision_at`
- `assigned_by_user_id`

This may be stored either in `assignments` plus a work item status transition, or in a new principal review table if history is needed.

### 8.2 Acceptance / Adjustment Loop

Extend assignment tracking with:

- `accepted_at`
- `accepted_by_user_id`
- `adjustment_requested_at`
- `adjustment_requested_by_user_id`
- `adjustment_reason`

### 8.3 Progress Updates

Add a dedicated `task_updates` or `execution_updates` table:

- `id`
- `task_id`
- `updated_by_user_id`
- `status`
- `progress_percent`
- `note`
- `created_at`

This is better than overloading the main task row for all history.

### 8.4 Submission Package

Add a dedicated response/submission table:

- `id`
- `task_id`
- `work_item_id`
- `submitted_by_user_id`
- `submitted_at`
- `summary`
- `explanation_if_late`
- `status`

Response files can continue to use `work_item_files`, but should be tagged by category:

- `source_document`
- `evidence`
- `response_report`
- `internal_note`

### 8.5 Agent Review Table

Add `submission_reviews`:

- `id`
- `submission_id`
- `reviewed_at`
- `review_outcome`
- `return_stage`
- `reason_code`
- `reason_text`
- `review_payload`

### 8.6 Principal Approval Table

Add `principal_approvals`:

- `id`
- `work_item_id`
- `approved_by_user_id`
- `decision`
- `note`
- `decided_at`

### 8.7 Archive Metadata

Add archive fields to `work_items`:

- `archived_at`
- `archived_by_user_id`
- `archive_label`
- `archive_year`
- `archive_month`

## 9. Required UI Restructure

The current app shell is good enough, but the internal views should now map to the real workflow.

### 9.1 Intake

Primary users:

- clerk
- principal

Functions:

- upload and register document
- intake metadata
- extracted text
- AI summary
- send to principal review

### 9.2 Principal Review

Primary users:

- principal

Functions:

- intake summary
- source file
- AI suggestion
- lead department selection
- coordinating department selection
- deadline
- output requirement
- principal decision buttons

This should become the main principal workspace.

### 9.3 Assignments

Primary users:

- principal
- admin

Functions:

- waiting acceptance queue
- accepted queue
- adjustment requests
- reassignment controls

### 9.4 Department Execution

Primary users:

- department head
- staff

Functions:

- queue of assigned tasks
- acceptance
- internal updates
- evidence upload
- response submission
- reminder history

### 9.5 Agent Review

Primary users:

- principal
- admin
- possibly agent operator

Functions:

- submissions waiting review
- fail classification
- return to exact stage
- explain why

### 9.6 Principal Approval

Primary users:

- principal

Functions:

- final packet review
- approve
- reject
- send back
- archive

### 9.7 Reports

Functions:

- daily department report
- weekly principal report
- overdue list
- no-update list
- bottleneck list
- completion ranking by department

### 9.8 Admin

Functions:

- users
- departments
- reminder thresholds
- output templates
- rule engine configuration

## 10. Recommended Delivery Roadmap

To avoid breaking production, implement in phases.

### Phase A. Principal Review

Target:

- make principal routing explicit and complete

Deliver:

- new principal review screen
- principal decision model
- stronger work item statuses

### Phase B. Assignment Acceptance

Target:

- stop silent assignments

Deliver:

- accept / adjustment request workflow
- reminders for not-yet-accepted assignments

### Phase C. Department Execution History

Target:

- make progress tracking auditable

Deliver:

- execution updates table
- department progress timeline
- evidence categories

### Phase D. Submission Review

Target:

- classify fail reasons correctly

Deliver:

- submission package
- agent review table
- return-to-stage workflow

### Phase E. Principal Approval And Archive

Target:

- make completion official

Deliver:

- principal approval screen
- archive transitions
- archived case browsing

### Phase F. Reporting And Alerts

Target:

- make the app proactive

Deliver:

- daily report
- weekly report
- overdue alerts
- bottleneck dashboard

## 11. Implementation Principles

Keep these rules fixed across all phases:

1. do not let work go silent
2. do not reset a case to the beginning unless absolutely necessary
3. every case must have one lead department
4. maximize automatic reminders and summaries
5. keep `agent-app` as the system of record
6. keep auth, session, ownership, and audit behavior production-safe

## 12. Practical Next Step

The next implementation step should be:

### Build Phase A: Principal Review

This is the highest leverage missing layer because it sits between intake and assignment and directly matches the business process.

The next concrete technical deliverable should include:

- a migration for richer work item principal-routing fields
- principal review routes
- a dedicated principal review view in the web app
- work item state transitions from intake to assignment

This phase should be completed before building deeper agent review or archive logic.
