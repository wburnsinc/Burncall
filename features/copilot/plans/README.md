# Copilot Plans Feature

This directory contains the Copilot Plans feature for BurnCall.

## Overview

The Copilot Plans feature provides AI-powered planning and scheduling capabilities for the BurnCall application.

## Directory Structure

```
features/copilot/plans/
├── README.md                 # This file
├── config.json              # Feature configuration
├── plans.json               # Default plans templates
└── api/                     # API endpoints for plans
    ├── list.js
    ├── create.js
    ├── update.js
    └── delete.js
```

## Features

- AI-powered plan generation
- Plan templates
- Plan management (CRUD operations)
- Integration with BurnCall scheduling system

## API Endpoints

### GET `/api/copilot/plans`
List all available plans

### POST `/api/copilot/plans`
Create a new plan

### PUT `/api/copilot/plans/:id`
Update an existing plan

### DELETE `/api/copilot/plans/:id`
Delete a plan

## Configuration

See `config.json` for feature configuration options.

## Usage

```javascript
import { CopilotPlans } from './features/copilot/plans';

const plans = new CopilotPlans();
await plans.initialize();
```

## Status

🚀 **In Development**
