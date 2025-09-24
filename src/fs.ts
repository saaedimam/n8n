import { promises as fs } from "fs";
import path from "path";

export async function ensureDir(p: string) {
  await fs.mkdir(p, { recursive: true });
}

export async function writeJSON(p: string, data: unknown) {
  await ensureDir(path.dirname(p));
  await fs.writeFile(p, JSON.stringify(data, null, 2));
}

export async function readFile(p: string, encoding: BufferEncoding = 'utf8') {
  return await fs.readFile(p, encoding);
}

export async function writeFile(p: string, data: string, encoding: BufferEncoding = 'utf8') {
  await ensureDir(path.dirname(p));
  return await fs.writeFile(p, data, encoding);
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 60);
}