# Orchestra MCP

A **planning + routing super-agent** for building websites with Cursor + MCPs. Orchestra automatically breaks down complex development tasks into smaller, parallelizable jobs and routes them to appropriate specialized MCPs.

## Features

- 🎭 **Intelligent Task Routing** - Automatically categorizes tasks by role (coder, debugger, designer, SEO, deploy, git)
- 📋 **Project Planning** - Breaks complex goals into manageable, trackable jobs
- 🌿 **Branch Management** - Auto-generates semantic branch names based on task type
- 🔄 **n8n Integration** - Seamlessly integrates with n8n workflows for automation
- 🛡️ **Quality Gates** - Enforces performance, accessibility, and SEO budgets
- 📊 **Progress Tracking** - Maintains job status and completion criteria

## Quick Start

### 1. Build the MCP Server

```bash
cd orchestra-mcp
npm install
npm run build
```

### 2. Test the Server

```bash
npm start
# Should output: "Orchestra MCP server running on stdio"
```

### 3. Register in Cursor

1. Open **Cursor → Settings → MCP**
2. Click **"New MCP Server"**
3. Configure:
   - **Name:** `orchestra-mcp`
   - **Command:** `/absolute/path/to/node`
   - **Args:** `["/absolute/path/to/orchestra-mcp/dist/server.js"]`
   - **Toggle:** Enabled

### 4. Import n8n Workflow

1. Open n8n at `http://localhost:5678`
2. Go to **Templates** or **Import**
3. Import the workflow from `../orchestra-mcp-n8n-template.json`
4. Configure credentials:
   - GitHub API token
   - Vercel API token  
   - Telegram bot token (optional)

## Available Tools

### `scaffold`
Creates the `.orchestra/` folder structure for project management.

```json
{
  "tool": "scaffold"
}
```

### `plan`
Creates a high-level project plan with goals and budgets.

```json
{
  "tool": "plan",
  "arguments": {
    "goal": "Build KTL marketing site with hero video and SEO",
    "budgets": {
      "lcp_ms": 2500,
      "cls": 0.05,
      "lighthouse_min": 85
    }
  }
}
```

### `split`
Breaks a plan into specific, actionable jobs.

```json
{
  "tool": "split", 
  "arguments": {
    "titles": [
      "Sticky header with mobile menu",
      "Hero section with video background",
      "SEO meta tags and schema markup"
    ],
    "constraints": ["no CLS > 0.05", "LCP <= 2.5s mobile", "a11y labels"]
  }
}
```

### `route`
Routes a single task to the appropriate role and creates a job file.

```json
{
  "tool": "route",
  "arguments": {
    "title": "Add RFID scanning interface with filters",
    "constraints": ["mobile-first", "real-time updates"],
    "copy": "Industrial design for textile tracking"
  }
}
```

### `pr`
Creates a branch, commits changes, and opens a GitHub PR.

```json
{
  "tool": "pr",
  "arguments": {
    "branch": "feature/rfid-scanning",
    "title": "feat: RFID scanning interface",
    "body": "Automated by Orchestra MCP. Meets performance budgets."
  }
}
```

## Role Routing Logic

Orchestra automatically infers the appropriate role based on task keywords:

| Role | Keywords | Branch Prefix |
|------|----------|---------------|
| **coder** | auth, db, migration, rfid, textiletrack | `feature/` |
| **debugger** | bug, error, fix, stack, trace | `fix/` |
| **designer** | logo, hero, figma, banner, image | `design/` |
| **seo** | meta, og, schema, sitemap, robots | `chore/` |
| **deploy** | vercel, production, release, ship | `deploy/` |
| **git** | tag, changelog, pr, merge | `chore/` |

## Project Structure

```
orchestra-mcp/
├── src/
│   ├── server.ts      # Main MCP server
│   ├── router.ts      # Role inference logic  
│   └── fs.ts          # File system utilities
├── dist/              # Compiled JavaScript
├── package.json       # Dependencies & scripts
└── README.md         # This file
```

## n8n Workflow Template

The included n8n workflow (`../orchestra-mcp-n8n-template.json`) provides:

1. **Webhook Endpoint** - `/cursor-job` for receiving tasks
2. **Job Router** - Applies Orchestra MCP logic to categorize tasks
3. **GitHub Integration** - Auto-creates PRs for each job
4. **Vercel Deployment** - Generates preview deployments
5. **Notifications** - Telegram alerts with job status
6. **Designer Support** - Special handling for design asset jobs

### Using the Webhook

Send POST requests to your n8n webhook:

```bash
curl -X POST "http://localhost:5678/webhook/cursor-job" \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Add user authentication with Clerk",
    "constraints": ["SSR compatible", "TypeScript strict"],
    "repository_owner": "your-username",
    "repository_name": "your-repo"
  }'
```

## Integration Examples

### Slash Commands (Cursor Chat)

```
/plan Build e-commerce site with Stripe integration
/build User dashboard with real-time analytics  
/fix Memory leak in data processing pipeline
/brand Generate STRYV logo with football nostalgia theme
/seo Audit homepage for Core Web Vitals
/deploy Ship v2.1.0 with new checkout flow
```

### TextileTrack/StitchOS Tasks

```
/rfid Add RFID tag scanning with batch processing
/db Create production_lines table with SMV tracking
/auth Implement operator login with role permissions
```

## Quality Gates

All jobs automatically include quality requirements:

- **Performance:** LCP ≤ 2.5s, CLS ≤ 0.05
- **Lighthouse Score:** ≥ 85 (mobile)
- **Accessibility:** 0 Pa11y violations
- **TypeScript:** Strict mode, no `any` types
- **Testing:** All tests must pass

## Development

```bash
# Watch mode for development
npm run dev

# Build for production  
npm run build

# Start the server
npm start
```

## License

ISC License - see LICENSE file for details.

---

**Orchestra MCP** - Orchestrating development workflows, one job at a time. 🎭
