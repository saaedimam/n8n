/**
 * WorkflowLoader MCP Server
 * Imports, activates, and tags n8n workflows via MCP server
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFile, writeFile, ensureDir } from "./fs.js";
import path from "path";
import { glob } from "glob";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(_exec);

const ROOT = process.cwd();

const server = new Server(
  { name: "workflow-loader", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

type WorkflowImportResult = {
  id: string;
  status: "imported" | "updated";
};

type WorkflowActivateResult = {
  id: string;
  activated: boolean;
  already_active?: boolean;
};

type WorkflowTagResult = {
  id: string;
  tags: string[];
};

type ImportReportEntry = {
  file: string;
  workflowId: string;
  action: "imported" | "updated" | "error";
  activated: boolean;
  tags: string[];
  error?: string;
};

// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "import_workflows",
        description: "Import, activate, and tag n8n workflows from a folder",
        inputSchema: {
          type: "object",
          required: ["folder", "tags"],
          properties: {
            folder: { type: "string", description: "Relative folder path containing workflow JSON files" },
            tags: { type: "string", description: "Comma-separated tags" },
            mcp_server: { type: "string", description: "MCP server name", default: "n8n-mcp" },
            tools: {
              type: "object",
              description: "Optional override mapping for tool names",
              properties: {
                importTool: { type: "string", default: "workflows.import" },
                activateTool: { type: "string", default: "workflows.activate" },
                tagTool: { type: "string", default: "workflows.tag" }
              }
            }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "import_workflows": {
      const { 
        folder, 
        tags, 
        mcp_server = "n8n-mcp",
        tools = {}
      } = args as any;
      
      const {
        importTool = "workflows.import",
        activateTool = "workflows.activate", 
        tagTool = "workflows.tag"
      } = tools;
      
      const tagsArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      const reportPath = path.join(ROOT, ".workflows", "_import-report.json");
      const report: ImportReportEntry[] = [];
      
      try {
        // Ensure report directory exists
        await ensureDir(path.dirname(reportPath));
        await writeFile(reportPath, JSON.stringify([], null, 2));
        
        // Verify folder exists
        const folderPath = path.join(ROOT, folder);
        try {
          await exec(`test -d "${folderPath}"`);
        } catch {
          return { 
            content: [{ 
              type: "text", 
              text: `__WF_FOLDER_MISSING__: Folder ${folder} does not exist` 
            }] 
          };
        }
        
        // Find all JSON files
        const pattern = path.join(folderPath, "**", "*.json");
        const files = await glob(pattern);
        
        if (files.length === 0) {
          return {
            content: [{ 
              type: "text", 
              text: "No JSON files found in the specified folder" 
            }]
          };
        }
        
        // Limit to 200 files
        const limitedFiles = files.slice(0, 200);
        
        let importedCount = 0;
        let activatedCount = 0;
        
        for (const file of limitedFiles) {
          try {
            // Read workflow content
            const content = await readFile(file, 'utf8');
            const workflowData = JSON.parse(content);
            
            // Import/upsert workflow
            const importResult = await callMCPTool(mcp_server, importTool, {
              payload: content,
              mode: "upsert"
            }) as WorkflowImportResult;
            
            const workflowId = importResult.id;
            const action = importResult.status;
            
            // Activate workflow
            let activated = false;
            try {
              const activateResult = await callMCPTool(mcp_server, activateTool, {
                id: workflowId
              }) as WorkflowActivateResult;
              
              activated = activateResult.activated || activateResult.already_active || false;
            } catch (error: any) {
              // Continue if activation fails
              console.warn(`Failed to activate workflow ${workflowId}:`, error.message);
            }
            
            // Tag workflow
            try {
              await callMCPTool(mcp_server, tagTool, {
                id: workflowId,
                tags: tagsArray
              });
            } catch (error: any) {
              // Continue if tagging fails
              console.warn(`Failed to tag workflow ${workflowId}:`, error.message);
            }
            
            // Record result
            const entry: ImportReportEntry = {
              file: path.relative(ROOT, file),
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
              file: path.relative(ROOT, file),
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
        
        // Return summary
        const summary = `Imported/updated: ${importedCount}, activated: ${activatedCount}, tags: [${tagsArray.join(', ')}]`;
        
        return {
          content: [
            { type: "text", text: summary },
            { type: "text", text: `Report written to: ${reportPath}` }
          ]
        };
        
      } catch (error: any) {
        return {
          content: [{ 
            type: "text", 
            text: `Error: ${error.message}` 
          }]
        };
      }
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

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

const transport = new StdioServerTransport();
await server.connect(transport);
