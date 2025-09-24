// Orchestra router: maps tasks to roles and branches
// Enhanced with textile/IoT patterns for RFID, StitchOS, Weft

import { slugify } from "./fs.js";

export type JobRole = "coder" | "debugger" | "designer" | "seo" | "deploy" | "git";

export function inferRole(title: string): JobRole {
  const t = title.toLowerCase();
  if (/(bug|error|trace|stack|exception|fix|debug)/.test(t)) return "debugger";
  if (/(logo|brand|eco|stryv|eman|design|color|palette|typography|image|hero|poster|figma|banner|thumbnail)/.test(t)) return "designer";
  if (/(seo|meta|og|schema|json-ld|crawl|ranking|sitemap|robots)/.test(t)) return "seo";
  if (/(release|deploy|vercel|railway|production|env|ship)/.test(t)) return "deploy";
  if (/(merge|branch|tag|changelog|version|pr)/.test(t)) return "git";
  if (/(supabase|prisma|migration|db|schema)/.test(t)) return "coder"; // DB jobs
  if (/(auth|clerk|login|signup|token)/.test(t)) return "coder"; // auth jobs
  if (/(rfid|stitchos|weft|textiletrack|iot|serial)/.test(t)) return "coder"; // textile/IOT stack
  return "coder";
}

export function branchFor(title: string, role: JobRole) {
  const t = title.toLowerCase();
  
  // Special branch naming for specific domains
  if (/(rfid|stitchos|textiletrack|iot|serial)/.test(t)) {
    return `iot/${slugify(title)}`;
  }
  if (/(weft|lang)/.test(t)) {
    return `lang/${slugify(title)}`;
  }
  
  const base =
    role === "coder" ? "feature" :
    role === "debugger" ? "fix" :
    role === "designer" ? "design" :
    role === "seo" ? "chore" :
    role === "deploy" ? "deploy" :
    "chore";
  return `${base}/${slugify(title)}`;
}