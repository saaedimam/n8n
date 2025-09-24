# WorkflowLoader - n8n Workflow Management

WorkflowLoader is a routing agent that imports, activates, and tags n8n workflows via an MCP server.

## What it does

- Reads workflow files from a local folder (e.g., `.workflows/`)
- For each file: calls the MCP server to import, activate, and tag the workflow
- Be idempotent: updates if exists, skips re-activation if already active, merges tags
- Summarizes results

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build
```

### Basic Usage

```bash
# Import workflows with tags
node dist/wf-cli.js import folder=.workflows tags=cursor,auto,release

# Using the MCP server
node dist/workflow-loader.js
```

### Example Commands

```bash
# Default configuration
node dist/wf-cli.js import folder=.workflows tags=cursor,auto,release

# Custom MCP server and tool names
node dist/wf-cli.js import folder=ops/n8n tags=prod --server=n8n-mcp --import-tool=flows.upsert --activate-tool=flows.enable --tag-tool=flows.tag
```

## Features

### CLI Tool (`wf-cli.js`)

- **Import workflows**: `import folder=<path> tags=<tags> [options]`
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Batch processing**: Handles up to 200 files per run
- **Error handling**: Continues processing if individual files fail
- **Report generation**: Creates detailed import reports

### MCP Server (`workflow-loader.js`)

- **Tool**: `import_workflows`
- **Input**: `{folder, tags, mcp_server?, tools?}`
- **Output**: Summary and detailed report

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
```
Imported/updated: 2, activated: 2, tags: [cursor, auto, release]
```

### Report File
Creates `.workflows/_import-report.json` with detailed results:

```json
[
  {
    "file": ".workflows\\example-workflow.json",
    "workflowId": "workflow-1234567890-abc123",
    "action": "imported",
    "activated": true,
    "tags": ["cursor", "auto", "release"]
  }
]
```

## Safety Features

- **Idempotent**: Updates existing workflows, skips already active ones
- **Error resilient**: Continues processing if individual files fail
- **Batch limits**: Maximum 200 files per run
- **Report filtering**: Excludes report file from processing
- **Cross-platform**: Works on all operating systems

## File Structure

```
src/
├── workflow-loader.ts    # MCP server implementation
├── wf-cli.ts            # CLI tool implementation
├── fs.ts                # File system utilities
└── ...

dist/
├── workflow-loader.js   # Compiled MCP server
├── wf-cli.js           # Compiled CLI tool
└── ...

.workflows/
├── example-workflow.json
├── cursor-deploy-pipeline.json
└── _import-report.json  # Generated report
```

## MCP Integration

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

- **Missing folder**: Fails fast with `__WF_FOLDER_MISSING__`
- **MCP call failures**: Records error in report, continues processing
- **Already active workflows**: Skips activation, records as already active
- **Tagging failures**: Continues processing, logs warning
- **File processing errors**: Records error in report, continues with next file

## Examples

### Example 1: Basic Import
```bash
node dist/wf-cli.js import folder=.workflows tags=cursor,auto,release
```

### Example 2: Custom Tools
```bash
node dist/wf-cli.js import folder=ops/n8n tags=prod --server=n8n-mcp --import-tool=flows.upsert --activate-tool=flows.enable --tag-tool=flows.tag
```

### Example 3: MCP Server Usage
```bash
# Start server
node dist/workflow-loader.js

# In another terminal or MCP client
mcp workflow-loader import_workflows {"folder": ".workflows", "tags": "cursor,auto,release"}
```

## Development

### Building
```bash
npm run build
```

### Running in Development
```bash
# CLI
node dist/wf-cli.js import folder=.workflows tags=test

# MCP Server
node dist/workflow-loader.js
```

## Dependencies

- `@modelcontextprotocol/sdk`: MCP server framework
- `glob`: File pattern matching
- `typescript`: TypeScript compilation
- `tsx`: TypeScript execution

## License

Private - Part of the Orchestra MCP project
