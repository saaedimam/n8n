# WorkflowLoader - n8n Workflow Management

WorkflowLoader is a routing agent that imports, activates, and tags n8n workflows via an MCP server.

## What it does

- Reads workflow files from a local folder (e.g., `.workflows/`)
- For each file: calls the MCP server to import, activate, and tag the workflow
- Be idempotent: updates if exists, skips re-activation if already active, merges tags
- Summarizes results

## Usage

### Basic Usage

```bash
# Using the CLI
/wf import folder=.workflows tags=cursor,auto,release

# Using the MCP server
mcp workflow-loader import_workflows {"folder": ".workflows", "tags": "cursor,auto,release"}
```

### Advanced Usage

```bash
# Custom MCP server and tool names
/wf import folder=ops/n8n tags=prod --server=n8n-mcp --import-tool=flows.upsert --activate-tool=flows.enable --tag-tool=flows.tag

# Using MCP server with custom tools
mcp workflow-loader import_workflows {
  "folder": "ops/n8n",
  "tags": "prod",
  "mcp_server": "n8n-mcp",
  "tools": {
    "importTool": "flows.upsert",
    "activateTool": "flows.enable", 
    "tagTool": "flows.tag"
  }
}
```

## Parameters

- `folder`: Relative folder path containing workflow JSON files
- `tags`: Comma-separated tags to apply to workflows
- `mcp_server`: MCP server name (default: "n8n-mcp")
- `tools`: Optional override mapping for tool names:
  - `importTool` (default: "workflows.import")
  - `activateTool` (default: "workflows.activate")
  - `tagTool` (default: "workflows.tag")

## Output

### Console Output
- Summary: `Imported/updated: N, activated: M, tags: [tag1, tag2, ...]`
- Error messages for failed operations

### Report File
Creates `.workflows/_import-report.json` with detailed results:

```json
[
  {
    "file": "workflows/example-workflow.json",
    "workflowId": "workflow-1234567890-abc123",
    "action": "imported",
    "activated": true,
    "tags": ["cursor", "auto", "release"],
    "error": null
  }
]
```

## Safety Features

- Never commits secrets
- Continues processing if individual files fail
- Limits batch to 200 files per run
- Records errors in report for debugging

## Installation

1. Install dependencies:
```bash
npm install
```

2. Build the project:
```bash
npm run build
```

3. Use the CLI:
```bash
# Make executable
chmod +x dist/wf-cli.js

# Run workflow import
./dist/wf-cli.js import folder=.workflows tags=cursor,auto,release
```

## MCP Server Integration

The WorkflowLoader can be used as an MCP server:

```bash
# Start the MCP server
node dist/workflow-loader.js
```

Then call it from other MCP clients:

```json
{
  "method": "tools/call",
  "params": {
    "name": "import_workflows",
    "arguments": {
      "folder": ".workflows",
      "tags": "cursor,auto,release"
    }
  }
}
```

## Error Handling

- If folder doesn't exist: fails fast with `__WF_FOLDER_MISSING__`
- If MCP calls fail: records error in report, continues with next file
- If workflow already active: skips activation, records as already active
- If tagging fails: continues processing, logs warning

## Examples

### Example 1: Default Configuration
```bash
/wf import folder=.workflows tags=cursor,auto,release
```

### Example 2: Custom Server and Tools
```bash
/wf import folder=ops/n8n tags=prod --server=n8n-mcp --import-tool=flows.upsert --activate-tool=flows.enable --tag-tool=flows.tag
```

### Example 3: Using MCP Server
```bash
mcp workflow-loader import_workflows {"folder": ".workflows", "tags": "cursor,auto,release"}
```
