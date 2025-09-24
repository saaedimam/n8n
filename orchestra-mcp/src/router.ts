import { slugify } from "./fs.js";

export type JobRole = "coder" | "debugger" | "designer" | "seo" | "deploy" | "git";

export function inferRole(title: string): JobRole {
  const t = title.toLowerCase();
  if (/(bug|error|stack|trace|fix|exception)/.test(t)) return "debugger";
  if (/(logo|image|hero|poster|figma|banner|thumbnail)/.test(t)) return "designer";
  if (/(seo|og|schema|meta|sitemap|robots)/.test(t)) return "seo";
  if (/(deploy|vercel|release|ship|production)/.test(t)) return "deploy";
  if (/(tag|changelog|pr|merge)/.test(t)) return "git";
  if (/(supabase|prisma|migration|db|schema)/.test(t)) return "coder";
  if (/(auth|clerk|login|signup|token)/.test(t)) return "coder";
  if (/(rfid|stitchos|weft|textiletrack|iot|serial)/.test(t)) return "coder";
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
