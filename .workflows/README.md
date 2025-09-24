# n8n Workflows

This directory contains n8n workflow definitions for the Orchestra MCP project.

## Available Workflows

### Cursor Deploy Pipeline (`cursor-deploy-pipeline.json`)

A comprehensive deployment pipeline that:
1. **Webhook Trigger** - Receives deployment requests
2. **GitHub Integration** - Pushes branches and creates PRs
3. **Vercel Deployment** - Deploys preview environments
4. **Telegram Notifications** - Sends deployment status updates

## Setup Instructions

### 1. Import Workflow to n8n
1. Open n8n at `http://localhost:5678`
2. Click "Import" in the top menu
3. Select "Import from File"
4. Choose `cursor-deploy-pipeline.json`
5. Click "Import"

### 2. Configure Credentials

#### GitHub API Credentials
- **Name**: `YOUR_GITHUB_CRED_ID`
- **Type**: GitHub API
- **Token**: Your GitHub Personal Access Token
- **Required Scopes**: `repo`, `workflow`

#### Vercel Credentials
- **Name**: `YOUR_VERCEL_CRED_ID`
- **Type**: HTTP Basic Auth
- **Username**: Your Vercel email
- **Password**: Your Vercel Access Token

#### Telegram Credentials
- **Name**: `YOUR_TELEGRAM_CRED_ID`
- **Type**: Telegram API
- **Token**: Your Telegram Bot Token

### 3. Update Configuration

Replace the following placeholders in the workflow:

- `YOUR_GITHUB_USER_OR_ORG` → Your GitHub username or organization
- `YOUR_REPO_NAME` → Your repository name
- `YOUR_GITHUB_CRED_ID` → Your GitHub credentials ID
- `YOUR_VERCEL_CRED_ID` → Your Vercel credentials ID
- `YOUR_TELEGRAM_CRED_ID` → Your Telegram credentials ID

### 4. Environment Variables

Set these environment variables in n8n:
- `TELEGRAM_CHAT_ID` → Your Telegram chat ID for notifications

### 5. Activate Workflow

1. In n8n, find your imported workflow
2. Click the toggle switch to activate it
3. The webhook will be available at: `http://localhost:5678/webhook/cursor-deploy`

## Usage

Send a POST request to the webhook with:

```json
{
  "branch": "feature/your-feature-branch",
  "title": "Deploy: Your Feature",
  "body": "Description of your deployment"
}
```

## Workflow Flow

```
Webhook → GitHub Push → GitHub PR → Vercel Deploy → Telegram Notify
```

Each step passes data to the next, creating a complete deployment pipeline.
