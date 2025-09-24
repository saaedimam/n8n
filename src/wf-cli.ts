#!/usr/bin/env node
/**
 * WorkflowLoader CLI
 * Usage: /wf import folder=.workflows tags=cursor,auto,release
 */

import { spawn } from "node:child_process";
import path from "path";
import { glob } from "glob";
import { readFile, writeFile, ensureDir } from "./fs.js";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(_exec);

type ImportReportEntry = {
  file: string;
  workflowId: string;
  action: "imported" | "updated" | "error";
  activated: boolean;
  tags: string[];
  error?: string;
};

type MCPConfig = {
  server: string;
  tools: {
    importTool: string;
    activateTool: string;
    tagTool: string;
  };
};

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] !== "import") {
    console.log("Usage: /wf import folder=<path> tags=<tags> [options]");
    console.log("Options:");
    console.log("  --server=<name>     MCP server name (default: n8n-mcp)");
    console.log("  --import-tool=<name> Import tool name (default: workflows.import)");
    console.log("  --activate-tool=<name> Activate tool name (default: workflows.activate)");
    console.log("  --tag-tool=<name>   Tag tool name (default: workflows.tag)");
    process.exit(1);
  }
  
  // Parse arguments
  const config: MCPConfig = {
    server: "n8n-mcp",
    tools: {
      importTool: "workflows.import",
      activateTool: "workflows.activate",
      tagTool: "workflows.tag"
    }
  };
  
  let folder = "";
  let tags = "";
  
  for (const arg of args.slice(1)) {
    if (arg.startsWith("folder=")) {
      folder = arg.split("=")[1];
    } else if (arg.startsWith("tags=")) {
      tags = arg.split("=")[1];
    } else if (arg.startsWith("--server=")) {
      config.server = arg.split("=")[1];
    } else if (arg.startsWith("--import-tool=")) {
      config.tools.importTool = arg.split("=")[1];
    } else if (arg.startsWith("--activate-tool=")) {
      config.tools.activateTool = arg.split("=")[1];
    } else if (arg.startsWith("--tag-tool=")) {
      config.tools.tagTool = arg.split("=")[1];
    }
  }
  
  if (!folder || !tags) {
    console.error("Error: folder and tags are required");
    process.exit(1);
  }
  
  const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);
  const reportPath = path.join(process.cwd(), ".workflows", "_import-report.json");
  
  try {
    // Ensure report directory exists
    await ensureDir(path.dirname(reportPath));
    await writeFile(reportPath, JSON.stringify([], null, 2));
    
    // Verify folder exists
    const folderPath = path.join(process.cwd(), folder);
    try {
      await exec(`test -d "${folderPath}"`);
    } catch {
      console.log("__WF_FOLDER_MISSING__");
      process.exit(1);
    }
    
    // Find all JSON files
    const pattern = path.join(folderPath, "**", "*.json");
    const files = await glob(pattern);
    
    if (files.length === 0) {
      console.log("No JSON files found in the specified folder");
      process.exit(0);
    }
    
    // Limit to 200 files
    const limitedFiles = files.slice(0, 200);
    
    let importedCount = 0;
    let activatedCount = 0;
    const report: ImportReportEntry[] = [];
    
    for (const file of limitedFiles) {
      try {
        // Read workflow content
        const content = await readFile(file, 'utf8');
        
        // Import/upsert workflow
        const importResult = await callMCPTool(config.server, config.tools.importTool, {
          payload: content,
          mode: "upsert"
        });
        
        const workflowId = importResult.id;
        const action = importResult.status;
        
        // Activate workflow
        let activated = false;
        try {
          const activateResult = await callMCPTool(config.server, config.tools.activateTool, {
            id: workflowId
          });
          
          activated = activateResult.activated || activateResult.already_active || false;
        } catch (error: any) {
          console.warn(`Failed to activate workflow ${workflowId}:`, error.message);
        }
        
        // Tag workflow
        try {
          await callMCPTool(config.server, config.tools.tagTool, {
            id: workflowId,
            tags: tagsArray
          });
        } catch (error: any) {
          console.warn(`Failed to tag workflow ${workflowId}:`, error.message);
        }
        
        // Record result
        const entry: ImportReportEntry = {
          file: path.relative(process.cwd(), file),
          workflowId,
          action,
          activated,
          tags: tagsArray
        };
        
        report.push(entry);
        
        if (action === "imported" || action === "updated") {
          importedCount++;
        }
        if (activated) {
          activatedCount++;
        }
        
      } catch (error: any) {
        // Record error and continue
        const entry: ImportReportEntry = {
          file: path.relative(process.cwd(), file),
          workflowId: "",
          action: "error",
          activated: false,
          tags: [],
          error: error.message
        };
        report.push(entry);
      }
    }
    
    // Write final report
    await writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Print summary
    console.log(`Imported/updated: ${importedCount}, activated: ${activatedCount}, tags: [${tagsArray.join(', ')}]`);
    
  } catch (error: any) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Helper function to call MCP tools
async function callMCPTool(server: string, tool: string, args: any): Promise<any> {
  // This is a placeholder - in a real implementation, you would need to
  // establish a connection to the MCP server and call the tool
  // For now, we'll simulate the response structure
  
  if (tool.includes("import")) {
    return {
      id: `workflow-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: "imported"
    };
  }
  
  if (tool.includes("activate")) {
    return {
      id: args.id,
      activated: true,
      already_active: false
    };
  }
  
  if (tool.includes("tag")) {
    return {
      id: args.id,
      tags: args.tags
    };
  }
  
  throw new Error(`Unknown MCP tool: ${tool}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
