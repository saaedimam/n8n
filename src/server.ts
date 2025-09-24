/**
 * Orchestra MCP — the switchboard.
 * Tools:
 *  - plan: turns a goal into a plan.json
 *  - split: explodes plan into job JSON files
 *  - route: quick single-task -> job JSON (role + branch)
 *  - scaffold: ensures .orchestra/ structure
 *  - pr: (optional) make branch + commit + open PR (gh required)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { writeJSON, ensureDir } from "./fs.js";
import { inferRole, branchFor, JobRole } from "./router.js";
import path from "path";
import { exec as _exec } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(_exec);

const ROOT = process.cwd();
const ORCH = path.join(ROOT, ".orchestra");
const JOBS = path.join(ORCH, "jobs");

const server = new Server(
  { name: "orchestra-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

type Plan = {
  version: number;
  goal: string;
  budgets?: { lcp_ms?: number; cls?: number; lighthouse_min?: number };
  created_at: string;
};


// Set up request handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "scaffold",
        description: "Ensure .orchestra/ folders exist",
        inputSchema: { type: "object", properties: {}, additionalProperties: false }
      },
      {
        name: "plan",
        description: "Create or overwrite .orchestra/plan.json from a goal string",
        inputSchema: {
          type: "object",
          required: ["goal"],
          properties: {
            goal: { type: "string" },
            budgets: {
              type: "object",
              properties: {
                lcp_ms: { type: "number" },
                cls: { type: "number" },
                lighthouse_min: { type: "number" }
              }
            }
          }
        }
      },
      {
        name: "split",
        description: "Split a plan into jobs. Input: array of titles; optional constraints/copy per index.",
        inputSchema: {
          type: "object",
          required: ["titles"],
          properties: {
            titles: { type: "array", items: { type: "string" }, minItems: 1 },
            constraints: { type: "array", items: { type: "string" } },
            copy: { type: "array", items: { type: "string" } }
          }
        }
      },
      {
        name: "route",
        description: "Route a single task title -> role + branch and emit a job file",
        inputSchema: {
          type: "object",
          required: ["title"],
          properties: {
            title: { type: "string" },
            constraints: { type: "array", items: { type: "string" } },
            copy: { type: "string" }
          }
        }
      },
      {
        name: "pr",
        description: "Optional. Create branch, commit staged changes, and open a PR with GitHub CLI.",
        inputSchema: {
          type: "object",
          required: ["branch", "title"],
          properties: {
            branch: { type: "string" },
            title: { type: "string" },
            body: { type: "string" }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  switch (name) {
    case "scaffold":
      await ensureDir(JOBS);
      return { content: [{ type: "text", text: "ok: .orchestra ready" }] };
      
    case "plan": {
      const { goal, budgets } = args as any;
      const plan: Plan = {
        version: 1,
        goal,
        budgets,
        created_at: new Date().toISOString()
      };
      await writeJSON(path.join(ORCH, "plan.json"), plan);
      return { content: [{ type: "text", text: "ok: plan.json written" }] };
    }
    
    case "split": {
      const { titles, constraints = [], copy = [] } = args as any;
      await ensureDir(JOBS);
      const out: string[] = [];
      for (let i = 0; i < titles.length; i++) {
        const title = titles[i];
        const role: JobRole = inferRole(title);
        const branch = branchFor(title, role);
        const job = {
          id: `job-${Date.now()}-${i}`,
          role,
          title,
          inputs: {
            files: [],
            constraints: constraints.filter(Boolean),
            copy: copy[i] || "",
            assets: []
          },
          done_when: [
            "tests pass",
            "lighthouse ok",
            "review checklist ticked"
          ],
          branch
        };
        const p = path.join(JOBS, `${branch}.json`);
        await writeJSON(p, job);
        out.push(p);
      }
      return { content: [{ type: "text", text: `ok: ${out.length} job(s) created\n` + out.join("\n") }] };
    }
    
    case "route": {
      const { title, constraints = [], copy = "" } = args as any;
      const role = inferRole(title);
      const branch = branchFor(title, role);
      const job = {
        id: `job-${Date.now()}`,
        role,
        title,
        inputs: { files: [], constraints, copy, assets: [] },
        done_when: ["tests pass", "lighthouse ok", "review checklist ticked"],
        branch
      };
      const p = path.join(JOBS, `${branch}.json`);
      await writeJSON(p, job);
      return {
        content: [
          { type: "text", text: `ok: ${p}` },
          { type: "text", text: JSON.stringify({ role, branch }, null, 2) }
        ]
      };
    }
    
    case "pr": {
      const { branch, title, body = "" } = args as any;
      try {
        await exec(`git checkout -b ${branch}`);
      } catch { /* branch may exist */ }
      try {
        await exec(`git add -A`);
        await exec(`git commit -m "${title.replace(/"/g, '\\"')}" || true`);
        const { stdout } = await exec(
          `gh pr create -B main -H ${branch} -t "${title.replace(/"/g, '\\"')}" -b "${body.replace(/"/g, '\\"')}" --fill || true`
        );
        return { content: [{ type: "text", text: `ok: PR attempted\n${stdout || ""}` }] };
      } catch (e: any) {
        return { content: [{ type: "text", text: `err: ${e.message}` }] };
      }
    }
    
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);