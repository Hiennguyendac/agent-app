<<<<<<< HEAD
# Agent App

Agent App is a multi-agent business system.

## Goal

Build an app where one operator can send tasks to a central orchestrator, and the orchestrator can route work to specialized agents.

## Main Parts

- Operator
- Orchestrator
- Growth Agent
- Ops Agent
- Optimizer Agent
- Sales Agent

## Main Outputs

- Blog draft
- Landing page suggestions
- Sales email draft
- Ops health report

## Folder Structure

- apps/web: dashboard
- apps/api: backend API
- apps/orchestrator: central routing logic
- apps/agent-growth: content agent
- apps/agent-ops: operations agent
- apps/agent-optimizer: landing page optimization agent
- apps/agent-sales: sales email agent
- packages: shared code
- docs: project documents
- infra: environment and docker setup

## Local Development

Run both the API and web app together from the project root:

```bash
npm install
npm run dev
```

Useful individual commands:

```bash
npm run api
npm run web
```
=======