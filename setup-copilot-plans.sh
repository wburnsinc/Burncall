#!/bin/bash

# BurnCall Copilot Plans - Complete Setup Script
# This script creates all necessary files and directories for the Copilot Plans feature

echo "🚀 BurnCall Copilot Plans Setup Script"
echo "======================================"
echo ""

# Create directory structure
echo "📁 Creating directory structure..."
mkdir -p features/copilot/plans/api
mkdir -p .github/workflows
echo "✅ Directories created"
echo ""

# Create features/copilot/plans/README.md
echo "📝 Creating features/copilot/plans/README.md..."
cat > features/copilot/plans/README.md << 'EOF'
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
EOF
echo "✅ README.md created"
echo ""

# Create features/copilot/plans/config.json
echo "📝 Creating features/copilot/plans/config.json..."
cat > features/copilot/plans/config.json << 'EOF'
{
  "feature": "copilot-plans",
  "version": "1.0.0",
  "enabled": true,
  "description": "AI-powered planning and scheduling for BurnCall",
  "settings": {
    "maxPlansPerUser": 50,
    "enableAIGeneration": true,
    "enableTemplates": true,
    "cachePlans": true,
    "cacheDuration": 3600
  },
  "api": {
    "baseUrl": "/api/copilot/plans",
    "timeout": 30000,
    "retries": 3
  },
  "features": [
    "plan-creation",
    "plan-templates",
    "ai-suggestions",
    "scheduling-integration",
    "analytics"
  ]
}
EOF
echo "✅ config.json created"
echo ""

# Create features/copilot/plans/plans.json
echo "📝 Creating features/copilot/plans/plans.json..."
cat > features/copilot/plans/plans.json << 'EOF'
{
  "templates": [
    {
      "id": "quick-burn-plan",
      "name": "Quick Burn Plan",
      "description": "Fast execution plan for urgent scheduling",
      "duration": 30,
      "tasks": [
        {
          "id": 1,
          "title": "Assess Requirements",
          "duration": 5,
          "priority": "high"
        },
        {
          "id": 2,
          "title": "Execute Plan",
          "duration": 20,
          "priority": "high"
        },
        {
          "id": 3,
          "title": "Review & Optimize",
          "duration": 5,
          "priority": "medium"
        }
      ]
    },
    {
      "id": "detailed-burn-plan",
      "name": "Detailed Burn Plan",
      "description": "Comprehensive planning with detailed steps",
      "duration": 120,
      "tasks": [
        {
          "id": 1,
          "title": "Analysis Phase",
          "duration": 30,
          "priority": "high"
        },
        {
          "id": 2,
          "title": "Planning Phase",
          "duration": 40,
          "priority": "high"
        },
        {
          "id": 3,
          "title": "Execution Phase",
          "duration": 40,
          "priority": "high"
        },
        {
          "id": 4,
          "title": "Review Phase",
          "duration": 10,
          "priority": "medium"
        }
      ]
    },
    {
      "id": "strategic-burn-plan",
      "name": "Strategic Burn Plan",
      "description": "Long-term strategic planning and optimization",
      "duration": 240,
      "tasks": [
        {
          "id": 1,
          "title": "Strategy Definition",
          "duration": 60,
          "priority": "high"
        },
        {
          "id": 2,
          "title": "Resource Allocation",
          "duration": 40,
          "priority": "high"
        },
        {
          "id": 3,
          "title": "Implementation",
          "duration": 100,
          "priority": "high"
        },
        {
          "id": 4,
          "title": "Monitoring & Adjustment",
          "duration": 40,
          "priority": "medium"
        }
      ]
    }
  ]
}
EOF
echo "✅ plans.json created"
echo ""

# Create API endpoints
echo "📝 Creating API endpoints..."

cat > features/copilot/plans/api/list.js << 'EOF'
/**
 * List Plans API Endpoint
 * GET /api/copilot/plans
 * 
 * Returns a list of all available plans for the current user
 */

export default async function handler(req, res) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // TODO: Implement database query to fetch user's plans
    const plans = [
      {
        id: 'plan-1',
        name: 'Q1 Execution Plan',
        template: 'quick-burn-plan',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active'
      }
    ];

    return res.status(200).json({
      success: true,
      data: plans,
      count: plans.length
    });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch plans'
    });
  }
}
EOF
echo "✅ list.js created"

cat > features/copilot/plans/api/create.js << 'EOF'
/**
 * Create Plan API Endpoint
 * POST /api/copilot/plans
 * 
 * Creates a new plan based on provided template or custom configuration
 */

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { name, template, tasks, duration } = req.body;

    // Validate required fields
    if (!name || !template) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, template'
      });
    }

    // TODO: Validate template exists
    // TODO: Generate plan ID
    // TODO: Save to database

    const newPlan = {
      id: `plan-${Date.now()}`,
      name,
      template,
      tasks: tasks || [],
      duration: duration || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'draft'
    };

    return res.status(201).json({
      success: true,
      data: newPlan,
      message: 'Plan created successfully'
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create plan'
    });
  }
}
EOF
echo "✅ create.js created"

cat > features/copilot/plans/api/update.js << 'EOF'
/**
 * Update Plan API Endpoint
 * PUT /api/copilot/plans/:id
 * 
 * Updates an existing plan
 */

export default async function handler(req, res) {
  // Only allow PUT requests
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { name, tasks, duration, status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // TODO: Validate plan exists
    // TODO: Update plan in database
    // TODO: Validate user has permission to update

    const updatedPlan = {
      id,
      name: name || 'Updated Plan',
      tasks: tasks || [],
      duration: duration || 0,
      status: status || 'active',
      updatedAt: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      data: updatedPlan,
      message: 'Plan updated successfully'
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update plan'
    });
  }
}
EOF
echo "✅ update.js created"

cat > features/copilot/plans/api/delete.js << 'EOF'
/**
 * Delete Plan API Endpoint
 * DELETE /api/copilot/plans/:id
 * 
 * Deletes a plan
 */

export default async function handler(req, res) {
  // Only allow DELETE requests
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID is required'
      });
    }

    // TODO: Validate plan exists
    // TODO: Delete plan from database
    // TODO: Validate user has permission to delete
    // TODO: Handle cascade deletes if needed

    return res.status(200).json({
      success: true,
      message: `Plan ${id} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete plan'
    });
  }
}
EOF
echo "✅ delete.js created"
echo ""

# Create GitHub Actions workflow
echo "📝 Creating .github/workflows/deploy-vercel.yml..."
cat > .github/workflows/deploy-vercel.yml << 'EOF'
name: Deploy BurnCall to Vercel

on:
  push:
    branches: [main, feature/copilot-plans]
  pull_request:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      # Checkout code
      - name: Checkout code
        uses: actions/checkout@v3
      
      # Setup Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      # Install dependencies
      - name: Install dependencies
        run: npm ci
      
      # Run linting
      - name: Run linting
        run: npm run lint --if-present
      
      # Run tests
      - name: Run tests
        run: npm run test --if-present
      
      # Build project
      - name: Build project
        run: npm run build
      
      # Deploy to Vercel (Preview)
      - name: Deploy to Vercel (Preview)
        if: github.event_name == 'pull_request'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
      
      # Deploy to Vercel (Production)
      - name: Deploy to Vercel (Production)
        if: github.ref == 'refs/heads/main' && github.event_name == 'push'
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          github-token: ${{ secrets.GITHUB_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./
          vercel-args: '--prod'
      
      # Comment on PR with deployment URL
      - name: Comment PR
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '🚀 Vercel deployment preview ready!\n\nCheck your deployment at the preview URL.'
            })
EOF
echo "✅ deploy-vercel.yml created"
echo ""

# Create vercel.json
echo "📝 Creating vercel.json..."
cat > vercel.json << 'EOF'
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "nodeVersion": "18.x"
}
EOF
echo "✅ vercel.json created"
echo ""

# Create .env.example if it doesn't exist
echo "📝 Creating .env.example..."
cat > .env.example << 'EOF'
# Environment Variables Template

# API Configuration
NEXT_PUBLIC_API_URL=https://burncall.vercel.app

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/burncall_db

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Feature Flags
COPILOT_PLANS_ENABLED=true

# Node Environment
NODE_ENV=production

# Vercel Deployment
VERCEL_ENV=production
VERCEL_URL=burncall.vercel.app

# Optional: Third-party services
# STRIPE_SECRET_KEY=sk_live_...
# SENDGRID_API_KEY=SG...
# GITHUB_TOKEN=ghp_...
EOF
echo "✅ .env.example created"
echo ""

# Git commands
echo "🔧 Staging changes for git..."
git add features/copilot/plans/
git add .github/workflows/deploy-vercel.yml
git add vercel.json
git add .env.example
echo "✅ Files staged"
echo ""

echo "📊 Summary of Created Files:"
echo "============================"
echo "✅ features/copilot/plans/README.md"
echo "✅ features/copilot/plans/config.json"
echo "✅ features/copilot/plans/plans.json"
echo "✅ features/copilot/plans/api/list.js"
echo "✅ features/copilot/plans/api/create.js"
echo "✅ features/copilot/plans/api/update.js"
echo "✅ features/copilot/plans/api/delete.js"
echo "✅ .github/workflows/deploy-vercel.yml"
echo "✅ vercel.json"
echo "✅ .env.example"
echo ""

echo "🎯 Next Steps:"
echo "=============="
echo "1. Review the changes: git status"
echo "2. Commit the changes: git commit -m 'feat: Add Copilot Plans feature with Vercel deployment'"
echo "3. Push to feature branch: git push origin feature/copilot-plans"
echo "4. Create a pull request on GitHub"
echo "5. Merge to main when ready"
echo ""

echo "✨ Setup complete! 🚀"
EOF
