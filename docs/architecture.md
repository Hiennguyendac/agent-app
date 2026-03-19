# Architecture

## Overview

This project is a multi-agent application.

A human operator creates a task.
The API receives the task.
The orchestrator decides which agent should handle it.
The selected agent returns an output.
The result is shown in the dashboard.

## Components

### Operator
The user who submits a request.

### API
Receives requests and stores task data.

### Orchestrator
Reads tasks and routes them to the correct agent.

### Growth Agent
Creates blog ideas and content drafts.

### Ops Agent
Checks system health and operations status.

### Optimizer Agent
Suggests landing page improvements.

### Sales Agent
Creates outreach and sales email drafts.

## Outputs

- blog draft
- ops report
- landing page recommendation
- sales email draft
