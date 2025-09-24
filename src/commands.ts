// Slash command handlers for Orchestra MCP
// Transforms /db, /auth, /brand, /rfid, /lang, /release into structured job routing

import { inferRole, branchFor } from "./router.js";

export interface SlashCommand {
  command: string;
  action: string;
}

export function parseSlashCommand(input: string): SlashCommand | null {
  const match = input.match(/^\/(\w+)\s+(.+)$/);
  if (!match) return null;
  
  const [, command, action] = match;
  return { command, action };
}

export function expandSlashCommand(cmd: SlashCommand): {
  title: string;
  constraints: string[];
  copy: string;
  assets?: string[];
  files?: string[];
} {
  const { command, action } = cmd;
  
  switch (command) {
    case "db":
      return {
        title: `Supabase migration: ${action}`,
        constraints: [
          "no breaking changes",
          "id as uuid primary key", 
          "timestamps default",
          "update schema.graphql",
          "generate .sql migration"
        ],
        copy: `Database task: ${action}`,
        files: ["supabase/migrations/*", "supabase/schema.graphql"]
      };
      
    case "auth":
      return {
        title: `Auth implementation: ${action}`,
        constraints: [
          "use Clerk auth",
          "secure token handling",
          "proper error states",
          "loading states"
        ],
        copy: `Authentication task: ${action}`,
        files: ["src/components/auth/*", "middleware.ts"]
      };
      
    case "brand":
      return {
        title: `Brand asset: ${action}`,
        constraints: [
          "2-color max",
          "SVG format preferred",
          "save to /public/assets/{brand}/",
          "include PNG fallback"
        ],
        copy: `Brand design task: ${action}`,
        assets: ["/public/assets/stryv/", "/public/assets/eman/", "/public/assets/eco/"]
      };
      
    case "rfid":
      return {
        title: `RFID/IoT task: ${action}`,
        constraints: [
          "TextileTrack compatibility",
          "StitchOS integration",
          "serial communication protocols",
          "error handling for hardware"
        ],
        copy: `IoT/RFID task: ${action}`,
        files: ["src/lib/rfid/*", "src/services/stitchos/*"]
      };
      
    case "lang":
      return {
        title: `Weft language: ${action}`,
        constraints: [
          "Weft repo context",
          "language processing",
          "textile domain specific",
          "compiler compatibility"
        ],
        copy: `Language/Weft task: ${action}`,
        files: ["weft/src/*", "weft/compiler/*"]
      };
      
    case "release":
      return {
        title: `Release ${action}`,
        constraints: [
          "version tagging",
          "changelog generation", 
          "production deployment",
          "rollback plan"
        ],
        copy: `Release task: ${action}`,
        files: ["CHANGELOG.md", "package.json", ".github/workflows/*"]
      };
      
    default:
      return {
        title: `${command}: ${action}`,
        constraints: [],
        copy: `${command} task: ${action}`
      };
  }
}

export function createJobFromSlash(input: string) {
  const slashCmd = parseSlashCommand(input);
  if (!slashCmd) return null;
  
  const expanded = expandSlashCommand(slashCmd);
  const role = inferRole(expanded.title);
  const branch = branchFor(expanded.title, role);
  
  return {
    id: `job-${Date.now()}`,
    role,
    title: expanded.title,
    inputs: {
      files: expanded.files || [],
      constraints: expanded.constraints,
      copy: expanded.copy,
      assets: expanded.assets || []
    },
    done_when: [
      "tests pass",
      "lighthouse ok",
      "review checklist ticked"
    ],
    branch,
    slash_origin: slashCmd
  };
}