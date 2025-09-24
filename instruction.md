You are Orchestra, a planning + routing super-agent for building websites with Cursor + MCPs.

Mission

I (the user) chat strategy with you.

You explode the ask into small, parallelizable jobs.

You dispatch each job to the correct MCP and open PRs.

You enforce budgets (perf + a11y + SEO) before anything ships.

Output Rules

Return only these actions:

cursor run <shell>

cursor new <path> then full file content

cursor edit <path> then unified diff (---/+++/@@)

cursor note <one short actionable line>

No prose outside cursor note. No emojis.

Repo Defaults

Web: Next.js 14 (App Router) + TypeScript strict + Tailwind + shadcn/ui

Data: Postgres (Supabase) optional

CI: GitHub Actions (typecheck, build, ESLint, Lighthouse CI mobile, Pa11y)

Auth: Clerk (stub okay)

Deploy: Vercel (PR previews mandatory)

Budgets (gate PRs)

Mobile Lighthouse (Moto G): Perf ≥ 85, LCP ≤ 2.5s, CLS ≤ 0.05

Pa11y: 0 serious violations

TypeScript: no any, no errors

Terminals Discipline

Open only 3: dev, lint, test. Reuse them.

MCP Role Map (route tasks)

coder → vibe-coder, supabase, railway (code features, DB)

debugger → MCP_DOCKER, context7-mcp (logs, stack traces, hotfix diffs)

designer → Figma, Magic MCP (logos, hero images, UI mocks)

seo → firecrawl (crawl), on-repo SEO fixes (meta/OG/schema/alt)

deploy → vercel, railway (previews & prod)

git → GitKraken (branch/PR/tag/changelog)

Planner → Router Protocol

When I ask for something, first emit a plan file (.orchestra/plan.json) and a routing file (.orchestra/jobs/*.json). Each job JSON:

{
  "id": "job-hero-001",
  "role": "coder|debugger|designer|seo|deploy|git",
  "title": "Short task name",
  "inputs": { "files": [], "constraints": [], "copy": "", "assets": [] },
  "done_when": ["tests pass", "lighthouse ok", "review checklist ticked"],
  "branch": "feature/slug"
}


Then perform the work by creating branches, files, and PRs. Never push to main.

Slash Commands (from user)

/plan <goal> → create plan.json + job stubs

/build <feature> → route to coder (+designer if UI)

/fix <bug> → route to debugger

/seo <scope> → route to seo (crawl + patch)

/test → run CI locally + report

/ship <version> <notes> → merge green PRs + tag + deploy

Reviewer Checklist (apply before PR)

A11y labels + contrast

Image weights, next/image, lazy

Meta + OG + schema.org JSON-LD

No unguarded secrets

Error boundaries present

If budgets fail: edit the diff to fix; re-run checks.

▶️ One-Shot Bootstrap (paste in Cursor chat to scaffold the router)
cursor note Bootstrap Orchestra router + guardrails
cursor new .orchestra/plan.json
{
  "version": 1,
  "governance": {
    "pr_only": true,
    "budgets": { "lcp_ms": 2500, "cls": 0.05, "lighthouse_min": 85 }
  },
  "mcp_roles": ["coder","debugger","designer","seo","deploy","git"],
  "terminals": ["dev","lint","test"]
}
cursor new .github/workflows/ci.yml
name: ci
on:
  pull_request:
  push:
    branches: [feature/**]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: pnpm i --frozen-lockfile || npm i
      - run: npm run typecheck
      - run: npm run lint --if-present
      - run: npm run build
      - run: npx -y @lhci/cli autorun --upload.target=temporary-public-storage || true
      - run: npx -y pa11y-ci || true
cursor new package.json
{
  "name": "orchestra",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "lint": "eslint . --max-warnings=0",
    "typecheck": "tsc --noEmit",
    "lighthouse": "lhci autorun",
    "a11y": "pa11y-ci"
  }
}
cursor new .orchestra/jobs/README.md
# Jobs folder
Place router-generated job JSON files here. Each job creates a branch, commits a diff, opens a PR, runs CI, posts preview.

🧠 Example: ask the agent to plan + split

You say:

/plan Build KTL homepage with sticky header, hero video, investor section, SEO + OG, deploy preview


Agent should respond with:

cursor new .orchestra/jobs/…json (one per subtask)

branches like feature/home-sticky-header, feature/hero-video, feature/ir-section, chore/seo-pass

diffs, PRs, and a note summarizing previews.

🧱 Routing Templates (the agent generates these per job)
Coder job template
cursor note Create feature branch and code diff
cursor run git checkout -b feature/hero-video
cursor edit src/app/page.tsx
--- a/src/app/page.tsx
+++ b/src/app/page.tsx
@@
 // add minimal, no-CLS hero with video + fallback poster...

Designer job template (assets)
cursor note Request Figma/Magic MCP for hero poster + logo variants

SEO job template
cursor edit src/lib/seo.ts
--- a/src/lib/seo.ts
+++ b/src/lib/seo.ts
@@
 // add title, description, OG/Twitter, JSON-LD

Deploy job template
cursor run gh pr create -B main -H feature/hero-video -t "feat: hero video" -b "Automated by Orchestra"
cursor run vercel --prod --confirm || true

🧯 Safety rails (hard rules)

Never commit secrets. Use env placeholders and .env.example.

No binary blobs in diffs; save assets to /public or a bucket.

If any budget fails, block merge and emit a fix-up diff.


Heard. Here’s a tiny, no-BS Orchestrator MCP you can drop into Cursor. It plans, splits, and writes job JSONs under .orchestra/jobs/, names branches, and (optionally) fires basic git + gh commands. Think of it as the switchboard that routes work to your other MCPs.

🗂 File tree (minimal)
orchestra-mcp/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ server.ts         # MCP server: exposes tools
│  ├─ router.ts         # role router + branch slugs
│  └─ fs.ts             # tiny file helpers
└─ README.md

📦 package.json
{
  "name": "orchestra-mcp",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "bin": {
    "orchestra-mcp": "dist/server.js"
  },
  "scripts": {
    "build": "tsc -p .",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}

⚙️ tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2020",
    "lib": ["ES2022"],
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}

🪵 src/fs.ts
import { promises as fs } from "fs";
import path from "path";

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function writeJSON(p: string, data: unknown) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

🧭 src/router.ts (role mapping + branch names)
// graffiti notes:
// - small router: turns "sticky header" -> {role:"coder", branch:"feature/sticky-header"}
// - you can expand with regex/keywords per your stack.

import { slugify } from "./fs.js";

export type JobRole = "coder" | "debugger" | "designer" | "seo" | "deploy" | "git";

export function inferRole(title: string): JobRole {
  const t = title.toLowerCase();
  if (/(bug|error|stack|trace|fix|exception)/.test(t)) return "debugger";
  if (/(logo|image|hero|poster|figma|banner|thumbnail)/.test(t)) return "designer";
  if (/(seo|og|schema|meta|sitemap|robots)/.test(t)) return "seo";
  if (/(deploy|vercel|release|ship|production)/.test(t)) return "deploy";
  if (/(tag|changelog|pr|merge)/.test(t)) return "git";
  return "coder";
}

export function branchFor(title: string, role: JobRole) {
  const base =
    role === "coder" ? "feature" :
    role === "debugger" ? "fix" :
    role === "designer" ? "design" :
    role === "seo" ? "chore" :
    role === "deploy" ? "deploy" :
    "chore";
  return `${base}/${slugify(title)}`;
}

🧠 src/server.ts (MCP server)
/**
 * Orchestra MCP — the switchboard.
 * Tools:
 *  - plan: turns a goal into a plan.json
 *  - split: explodes plan into job JSON files
 *  - route: quick single-task -> job JSON (role + branch)
 *  - scaffold: ensures .orchestra/ structure
 *  - pr: (optional) make branch + commit + open PR (gh required)
 */

import { Server, Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

const scaffold: Tool = {
  name: "scaffold",
  description: "Ensure .orchestra/ folders exist",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  async invoke() {
    await ensureDir(JOBS);
    return { content: [{ type: "text", text: "ok: .orchestra ready" }] };
  }
};

const planTool: Tool = {
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
  },
  async invoke({ goal, budgets }: any) {
    const plan: Plan = {
      version: 1,
      goal,
      budgets,
      created_at: new Date().toISOString()
    };
    await writeJSON(path.join(ORCH, "plan.json"), plan);
    return { content: [{ type: "text", text: "ok: plan.json written" }] };
  }
};

const splitTool: Tool = {
  name: "split",
  description:
    "Split a plan into jobs. Input: array of titles; optional constraints/copy per index.",
  inputSchema: {
    type: "object",
    required: ["titles"],
    properties: {
      titles: { type: "array", items: { type: "string" }, minItems: 1 },
      constraints: { type: "array", items: { type: "string" } },
      copy: { type: "array", items: { type: "string" } }
    }
  },
  async invoke({ titles, constraints = [], copy = [] }: any) {
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
};

const routeTool: Tool = {
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
  },
  async invoke({ title, constraints = [], copy = "" }: any) {
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
};

const prTool: Tool = {
  name: "pr",
  description:
    "Optional. Create branch, commit staged changes, and open a PR with GitHub CLI.",
  inputSchema: {
    type: "object",
    required: ["branch", "title"],
    properties: {
      branch: { type: "string" },
      title: { type: "string" },
      body: { type: "string" }
    }
  },
  async invoke({ branch, title, body = "" }: any) {
    // cheap guardrails: fail quietly if gh/git not present
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
};

server.tool(scaffold);
server.tool(planTool);
server.tool(splitTool);
server.tool(routeTool);
server.tool(prTool);

const transport = new StdioServerTransport();
await server.connect(transport);

📝 README.md (quick and dirty)
# Orchestra MCP

Tiny router MCP for Cursor:
- `scaffold`: makes `.orchestra/` and `.orchestra/jobs/`
- `plan`: writes `.orchestra/plan.json`
- `split`: makes multiple job JSONs
- `route`: one-shot task -> `{role, branch}` + job file
- `pr`: optional git/gh helper

## Install
pnpm i
pnpm build

## Run (manual)
node dist/server.js

🔌 Register in Cursor (Custom MCP)

Cursor → Settings → MCP → “New MCP Server”

Name: orchestra-mcp

Command: absolute path to node

Args: ["/absolute/path/to/orchestra-mcp/dist/server.js"]

Toggle: Enabled

(If Cursor supports JSON config, add a server that runs orchestra-mcp.)

🧪 How you use it (inside Cursor)

Scaffold the control folders

Use MCP: orchestra-mcp → tool: scaffold


Plan the build

Use MCP: orchestra-mcp → tool: plan
Input:
{
  "goal": "Build KTL marketing site: sticky header, hero video, investor section, SEO, deploy preview",
  "budgets": { "lcp_ms": 2500, "cls": 0.05, "lighthouse_min": 85 }
}


Split into jobs

Use MCP: orchestra-mcp → tool: split
Input:
{
  "titles": [
    "Sticky header + mobile menu + safe-area",
    "Hero section with video background + poster fallback",
    "Investor Relations section with KPIs and PDF links",
    "SEO pass: meta, OG, JSON-LD, sitemap, robots",
    "Deploy preview to Vercel with PR checks"
  ],
  "constraints": ["no CLS > 0.05", "LCP <= 2.5s mobile", "a11y labels", "no secrets in code"]
}


This writes one JSON per job under .orchestra/jobs/*.json with role and branch prefilled:

feature/sticky-header-mobile-menu → coder

design/hero-section-with-video-background-poster-fallback → designer

feature/investor-relations-section-with-kpis-and-pdf-links → coder

chore/seo-pass-meta-og-json-ld-sitemap-robots → seo

deploy/deploy-preview-to-vercel-with-pr-checks → deploy

(Optional) Open PR immediately for one job

Use MCP: orchestra-mcp → tool: pr
Input:
{
  "branch": "feature/sticky-header-mobile-menu",
  "title": "feat: sticky header + mobile menu",
  "body": "Automated by Orchestra MCP. Budgets: LCP<=2.5s, CLS<=0.05."
}


Let your other MCPs pick up by role

coder jobs → vibe-coder or your code MCP

designer jobs → Figma / Magic MCP

seo jobs → firecrawl + repo edits

deploy jobs → vercel

git jobs → GitKraken

Tip: In your main Cursor agent prompt, read .orchestra/jobs/*.json, then fan out: for each job, checkout the branch, generate diffs, open PR, run CI. That keeps your “3 terminals only” rule intact.

🧱 Quick “Conductor” prompt to pair with this MCP (paste into your Cursor agent)

Read .orchestra/jobs/*.json. For each job:

git checkout -B <job.branch>

If role=designer, create /public/assets/ placeholders + TODOs; else write code diffs.

Open a PR; rely on CI budgets (typecheck, Lighthouse, Pa11y).

If budgets fail, push a fix-up commit.
Only output: cursor run, cursor new, cursor edit, cursor note.
🗂 File tree (minimal)
orchestra-mcp/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ server.ts         # MCP server: exposes tools
│  ├─ router.ts         # role router + branch slugs
│  └─ fs.ts             # tiny file helpers
└─ README.md

📦 package.json
{
  "name": "orchestra-mcp",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "bin": {
    "orchestra-mcp": "dist/server.js"
  },
  "scripts": {
    "build": "tsc -p .",
    "start": "node dist/server.js",
    "dev": "tsx watch src/server.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "^0.6.0"
  },
  "devDependencies": {
    "tsx": "^4.19.2",
    "typescript": "^5.6.3"
  }
}

⚙️ tsconfig.json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2020",
    "lib": ["ES2022"],
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}

🪵 src/fs.ts
import { promises as fs } from "fs";
import path from "path";

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function writeJSON(p: string, data: unknown) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}

🧭 src/router.ts (role mapping + branch names)
// graffiti notes:
// - small router: turns "sticky header" -> {role:"coder", branch:"feature/sticky-header"}
// - you can expand with regex/keywords per your stack.

import { slugify } from "./fs.js";

export type JobRole = "coder" | "debugger" | "designer" | "seo" | "deploy" | "git";

export function inferRole(title: string): JobRole {
  const t = title.toLowerCase();
  if (/(bug|error|stack|trace|fix|exception)/.test(t)) return "debugger";
  if (/(logo|image|hero|poster|figma|banner|thumbnail)/.test(t)) return "designer";
  if (/(seo|og|schema|meta|sitemap|robots)/.test(t)) return "seo";
  if (/(deploy|vercel|release|ship|production)/.test(t)) return "deploy";
  if (/(tag|changelog|pr|merge)/.test(t)) return "git";
  return "coder";
}

export function branchFor(title: string, role: JobRole) {
  const base =
    role === "coder" ? "feature" :
    role === "debugger" ? "fix" :
    role === "designer" ? "design" :
    role === "seo" ? "chore" :
    role === "deploy" ? "deploy" :
    "chore";
  return `${base}/${slugify(title)}`;
}

🧠 src/server.ts (MCP server)
/**
 * Orchestra MCP — the switchboard.
 * Tools:
 *  - plan: turns a goal into a plan.json
 *  - split: explodes plan into job JSON files
 *  - route: quick single-task -> job JSON (role + branch)
 *  - scaffold: ensures .orchestra/ structure
 *  - pr: (optional) make branch + commit + open PR (gh required)
 */

import { Server, Tool } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
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

const scaffold: Tool = {
  name: "scaffold",
  description: "Ensure .orchestra/ folders exist",
  inputSchema: { type: "object", properties: {}, additionalProperties: false },
  async invoke() {
    await ensureDir(JOBS);
    return { content: [{ type: "text", text: "ok: .orchestra ready" }] };
  }
};

const planTool: Tool = {
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
  },
  async invoke({ goal, budgets }: any) {
    const plan: Plan = {
      version: 1,
      goal,
      budgets,
      created_at: new Date().toISOString()
    };
    await writeJSON(path.join(ORCH, "plan.json"), plan);
    return { content: [{ type: "text", text: "ok: plan.json written" }] };
  }
};

const splitTool: Tool = {
  name: "split",
  description:
    "Split a plan into jobs. Input: array of titles; optional constraints/copy per index.",
  inputSchema: {
    type: "object",
    required: ["titles"],
    properties: {
      titles: { type: "array", items: { type: "string" }, minItems: 1 },
      constraints: { type: "array", items: { type: "string" } },
      copy: { type: "array", items: { type: "string" } }
    }
  },
  async invoke({ titles, constraints = [], copy = [] }: any) {
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
};

const routeTool: Tool = {
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
  },
  async invoke({ title, constraints = [], copy = "" }: any) {
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
};

const prTool: Tool = {
  name: "pr",
  description:
    "Optional. Create branch, commit staged changes, and open a PR with GitHub CLI.",
  inputSchema: {
    type: "object",
    required: ["branch", "title"],
    properties: {
      branch: { type: "string" },
      title: { type: "string" },
      body: { type: "string" }
    }
  },
  async invoke({ branch, title, body = "" }: any) {
    // cheap guardrails: fail quietly if gh/git not present
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
};

server.tool(scaffold);
server.tool(planTool);
server.tool(splitTool);
server.tool(routeTool);
server.tool(prTool);

const transport = new StdioServerTransport();
await server.connect(transport);

📝 README.md (quick and dirty)
# Orchestra MCP

Tiny router MCP for Cursor:
- `scaffold`: makes `.orchestra/` and `.orchestra/jobs/`
- `plan`: writes `.orchestra/plan.json`
- `split`: makes multiple job JSONs
- `route`: one-shot task -> `{role, branch}` + job file
- `pr`: optional git/gh helper

## Install
pnpm i
pnpm build

## Run (manual)
node dist/server.js

🔌 Register in Cursor (Custom MCP)

Cursor → Settings → MCP → “New MCP Server”

Name: orchestra-mcp

Command: absolute path to node

Args: ["/absolute/path/to/orchestra-mcp/dist/server.js"]

Toggle: Enabled

(If Cursor supports JSON config, add a server that runs orchestra-mcp.)

🧪 How you use it (inside Cursor)

Scaffold the control folders

Use MCP: orchestra-mcp → tool: scaffold


Plan the build

Use MCP: orchestra-mcp → tool: plan
Input:
{
  "goal": "Build KTL marketing site: sticky header, hero video, investor section, SEO, deploy preview",
  "budgets": { "lcp_ms": 2500, "cls": 0.05, "lighthouse_min": 85 }
}


Split into jobs

Use MCP: orchestra-mcp → tool: split
Input:
{
  "titles": [
    "Sticky header + mobile menu + safe-area",
    "Hero section with video background + poster fallback",
    "Investor Relations section with KPIs and PDF links",
    "SEO pass: meta, OG, JSON-LD, sitemap, robots",
    "Deploy preview to Vercel with PR checks"
  ],
  "constraints": ["no CLS > 0.05", "LCP <= 2.5s mobile", "a11y labels", "no secrets in code"]
}


This writes one JSON per job under .orchestra/jobs/*.json with role and branch prefilled:

feature/sticky-header-mobile-menu → coder

design/hero-section-with-video-background-poster-fallback → designer

feature/investor-relations-section-with-kpis-and-pdf-links → coder

chore/seo-pass-meta-og-json-ld-sitemap-robots → seo

deploy/deploy-preview-to-vercel-with-pr-checks → deploy

(Optional) Open PR immediately for one job

Use MCP: orchestra-mcp → tool: pr
Input:
{
  "branch": "feature/sticky-header-mobile-menu",
  "title": "feat: sticky header + mobile menu",
  "body": "Automated by Orchestra MCP. Budgets: LCP<=2.5s, CLS<=0.05."
}


Let your other MCPs pick up by role

coder jobs → vibe-coder or your code MCP

designer jobs → Figma / Magic MCP

seo jobs → firecrawl + repo edits

deploy jobs → vercel

git jobs → GitKraken

Tip: In your main Cursor agent prompt, read .orchestra/jobs/*.json, then fan out: for each job, checkout the branch, generate diffs, open PR, run CI. That keeps your “3 terminals only” rule intact.

🧱 Quick “Conductor” prompt to pair with this MCP (paste into your Cursor agent)

Read .orchestra/jobs/*.json. For each job:

git checkout -B <job.branch>

If role=designer, create /public/assets/ placeholders + TODOs; else write code diffs.

Open a PR; rely on CI budgets (typecheck, Lighthouse, Pa11y).

If budgets fail, push a fix-up commit.
Only output: cursor run, cursor new, cursor edit, cursor note.
🧭 Extra Router Rules (keywords → MCP roles)

Add this inside router.ts (extend inferRole):

if (/(supabase|prisma|migration|db|schema)/.test(t)) return "coder"; // DB jobs
if (/(auth|clerk|login|signup|token)/.test(t)) return "coder"; // auth jobs
if (/(rfid|stitchos|weft|textiletrack|iot|serial)/.test(t)) return "coder"; // your textile/IOT stack
if (/(logo|brand|eco|stryv|eman|design|color|palette|typography)/.test(t)) return "designer";
if (/(seo|meta|og|schema|json-ld|crawl|ranking)/.test(t)) return "seo";
if (/(release|deploy|vercel|railway|production|env)/.test(t)) return "deploy";
if (/(merge|branch|tag|changelog|version)/.test(t)) return "git";
if (/(bug|error|trace|stack|exception|fix|debug)/.test(t)) return "debugger";


This way, your Orchestrator instantly knows:

“Supabase migration” → coder

“Add Clerk login page” → coder

“Generate STRYV logo mock” → designer

“SEO audit KTL site” → seo

“Ship v0.3.0” → deploy/git

🚀 New Slash Commands (extend your prompt)

/db <action> → route to coder MCP with Supabase context

/auth <action> → Clerk/Auth tasks

/brand <asset> → Figma/Designer MCP for Iori, STRYV, EMAN, EcoTenna

/rfid <task> → coder MCP (TextileTrack/StitchOS specific)

/lang <task> → coder MCP but with Weft repo context

/release <version> → orchestrator calls Git + Deploy MCP

📑 Example: ask for a DB migration

You:

/db Add new table `production_lines` with fields: id, name, smv, operator_count


Orchestrator MCP → generates job JSON:

{
  "id": "job-...-1",
  "role": "coder",
  "title": "Add Supabase migration: production_lines table",
  "inputs": {
    "files": ["supabase/migrations/*"],
    "constraints": ["no breaking changes", "id as uuid", "timestamps default"],
    "copy": ""
  },
  "branch": "feature/add-production-lines"
}


Then your coder MCP (vibe-coder) runs the diff:

create table production_lines (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  smv numeric,
  operator_count int,
  created_at timestamptz default now()
);

📑 Example: ask for a brand asset

You:

/brand Generate STRYV logo mock (oversized football nostalgia style, 2-color max)


Orchestrator MCP → routes job to designer MCP (Figma/Magic).
Designer MCP → gives you SVG/PNG in /public/assets/stryv-logo.svg.

🛡️ Guardrails (specific for your world)

No schema drift: coder MCP must always generate .sql + update supabase/schema.graphql.

Textile jobs: any rfid|stitchos|textiletrack keyword → coder MCP but force branch naming: iot/<slug>.

Brand jobs: assets saved under /public/assets/{brand}/.

Language (Weft): enforce repo name weft and branch lang/<slug>.

You are **Orchestra**, the Planner + Router super-agent.

## Mission
- I (the user) describe a feature, bug, or asset.
- You split it into jobs and route to the correct MCP:
  - coder → code features, DB, auth, textile/Weft
  - debugger → errors, stack traces, hotfixes
  - designer → logos, hero images, UI/brand assets
  - seo → meta, OG, JSON-LD, sitemap
  - deploy → Vercel/Railway previews + prod
  - git → branching, PRs, tags, changelogs

## Slash Commands
- `/plan <goal>` → make `.orchestra/plan.json` + job stubs
- `/build <feature>` → route to coder/designer
- `/fix <bug>` → debugger
- `/brand <asset>` → designer
- `/seo <scope>` → SEO
- `/db <task>` → Supabase/Prisma migrations
- `/auth <task>` → Clerk/Auth
- `/rfid <task>` → TextileTrack/StitchOS
- `/lang <task>` → Weft repo
- `/ship <version>` → git + deploy

## Output Format
Only:
- `cursor run <shell>`
- `cursor new <path>` with full file
- `cursor edit <path>` with unified diff
- `cursor note <short actionable line>`

No prose outside `cursor note`.

## Defaults
- Next.js 14 (App Router) + TS strict + Tailwind + shadcn/ui
- CI: GH Actions with typecheck, build, ESLint, Lighthouse, Pa11y
- Deploy: Vercel PR previews required
- Budget gates: CLS ≤ 0.05, LCP ≤ 2.5s, Lighthouse ≥ 85
- 3 terminals only: dev, lint, test

## Flow
1. Read `.orchestra/jobs/*.json`
2. Checkout branch
3. Generate diffs / assets
4. Open PR
5. Run CI + budgets
6. If fail → fix-up commit
This makes Cursor the “brain,” and your Orchestrator MCP (the one we coded) just generates job JSONs + routes.

🔗 2. Hooking This into n8n
Think of n8n as the external traffic cop — it triggers jobs and sends context back into Cursor.

Setup Steps
In n8n, create a new workflow.

Add a Webhook node (/cursor-job).

Add OpenAI node (or your LLM of choice) to format the request as a job JSON.

Add a Function node to drop the job JSON into .orchestra/jobs/ via your repo (GitHub API or local FS).

Add GitHub node → commit + PR.

Add Vercel node → create deploy preview.

Add Telegram/Slack node → send you preview + job summary.

Example Flow
Trigger: You POST {"task":"Add RFID scan view with filters"} to /cursor-job.

n8n → uses your Orchestrator MCP rules to infer role (coder, branch iot/add-rfid-scan-view).

n8n writes .orchestra/jobs/iot-add-rfid-scan-view.json.

GitHub node opens a PR with that branch.

Vercel builds a preview.

Telegram pings you with:

sql
Copy code
New Job: Add RFID scan view
Branch: iot/add-rfid-scan-view
Preview: https://vercel.app/preview/xyz

