# Web App

This folder contains the first very simple MVP dashboard for Agent App.

The web app is beginner-friendly and focuses on only one path:

- create a Growth task
- view saved tasks

It connects to the existing API running at `http://localhost:3001`.

## Files Created

### `package.json`

This defines the web app package and scripts.

It includes:

- `npm run dev` to start the local web app
- `npm run build` to check TypeScript and build the app
- `npm run preview` to preview the built app

### `tsconfig.json`

This tells TypeScript how to type-check the browser code.

### `vite.config.ts`

This config starts the Vite dev server and adds a proxy.

The proxy is important because:

- the browser calls `/api/tasks`
- Vite forwards that request to `http://localhost:3001/tasks`

This avoids CORS problems during local development.

### `index.html`

This is the main HTML page for the web app.

It loads the TypeScript entry file from `src/main.ts`.

### `src/main.ts`

This is the main dashboard logic.

It:

- renders the page
- handles the create task form
- supports simple content templates
- calls `POST /api/tasks`
- calls `GET /api/tasks`
- shows the latest Growth result
- renders the task list
- renders a simple task detail view

### `src/styles.css`

This file contains the page styling.

It keeps the design simple, clean, and easy to read.

## How The Flow Works

The dashboard flow is:

1. you fill in the Growth task form
2. the page sends the form data to `POST /api/tasks`
3. the API creates the task and runs the Growth flow
4. the API returns both the task and the result
5. the page shows the latest result
6. the page refreshes the task list with `GET /api/tasks`

## How To Run The Web App

1. Open a terminal in this folder:

```bash
cd /Users/hiennguyen/Agent-app/apps/web
```

2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

4. Open the local URL shown in the terminal.

Vite usually starts on:

- `http://localhost:3000`

## Important Beginner Note

This dashboard expects the API to already be running on:

- `http://localhost:3001`

So before opening the web app, make sure the API server is started first.
