#!/usr/bin/env node
/**
 * Asset reference inventory for portfolio migration.
 * Read-only: prints ownership classification.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", "shareable-export"]);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name) || ent.name === ".DS_Store") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}

function rel(p) {
  return path.relative(ROOT, p).split(path.sep).join("/");
}

const TEXT_EXT = new Set([".html", ".js", ".css", ".mjs", ".json", ".md", ".svg"]);
const files = walk(ROOT);
const textFiles = files.filter((f) => TEXT_EXT.has(path.extname(f).toLowerCase()));

const refRe =
  /(?:src|href|poster|srcset|data-full-image|data-demo-src|data-demo-poster|content)\s*=\s*["']([^"']+)["']|url\(\s*['"]?([^'")]+)['"]?\s*\)|["']((?:images|assets|css|js)\/[^"']+)["']/gi;

const refsByFile = {};
const filesByAsset = {};

function addRef(from, asset) {
  if (!asset) return;
  let a = asset.split("?")[0].split("#")[0].trim();
  if (!a || /^(https?:|mailto:|tel:|data:|blob:|#|javascript:)/i.test(a)) return;
  a = a.replace(/^\.\//, "");
  if (!/^(images|assets|css|js)\//.test(a) && !/\.(png|jpe?g|gif|svg|webp|avif|mp4|webm|pdf|ico)$/i.test(a)) {
    return;
  }
  (refsByFile[from] ||= new Set()).add(a);
  (filesByAsset[a] ||= new Set()).add(from);
}

for (const f of textFiles) {
  const from = rel(f);
  const text = fs.readFileSync(f, "utf8");
  let m;
  const re = new RegExp(refRe.source, "gi");
  while ((m = re.exec(text))) {
    addRef(from, m[1] || m[2] || m[3]);
  }
}

const PAGE_OWNERS = {
  "Write.html": "write",
  "WriteBuilder.html": "write",
  "Pathfinder.html": "pathfinder",
  "Agent.html": "agent-os",
  "AgentOSBuilder.html": "agent-os",
  "ChatPwC.html": "chat-pwc",
  "DesignSystem.html": "ai-design-system",
  "MAP.html": "ma-path",
  "Pulse.html": "pulse",
  "DCB.html": "dcb",
  "Approach.html": "shared",
  "Contact.html": "shared",
  "Me.html": "shared",
  "Me.legacy.html": "archive",
  "index.html": "shared",
};

function ownerOfReferrer(refFile) {
  const base = refFile.split("/").pop();
  if (PAGE_OWNERS[base]) return PAGE_OWNERS[base];
  if (refFile.startsWith("js/write-builder") || refFile.startsWith("css/write-builder")) return "write";
  if (refFile.includes("case-study-demo-viewer")) return "write+pathfinder";
  if (refFile.startsWith("js/pathfinder") || refFile.startsWith("css/pathfinder")) return "pathfinder";
  if (refFile.startsWith("js/agent-os") || refFile.startsWith("css/agent-os")) return "agent-os";
  if (refFile.startsWith("js/approach") || refFile.includes("landing-assistant") || refFile.includes("workspace") || refFile.includes("global-sidebar") || refFile.includes("portfolio-knowledge") || refFile.includes("embed-boot")) {
    return "shared";
  }
  return "other:" + refFile;
}

const imageFiles = files.filter((f) => {
  const e = path.extname(f).toLowerCase();
  return [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".avif", ".mp4", ".webm", ".pdf", ".ico"].includes(e) && !rel(f).startsWith("favicon");
});

const rows = [];
for (const img of imageFiles) {
  const r = rel(img);
  const refs = filesByAsset[r] ? [...filesByAsset[r]] : [];
  // also match by basename
  const base = r.split("/").pop();
  for (const [asset, set] of Object.entries(filesByAsset)) {
    if (asset === r) continue;
    if (asset.endsWith("/" + base) || asset === base) {
      refs.push(...set);
    }
  }
  const uniqueRefs = [...new Set(refs)];
  const owners = [...new Set(uniqueRefs.map(ownerOfReferrer))];
  let klass = "uncertain";
  const pageOwners = owners.filter((o) => !o.startsWith("other:") && o !== "archive" && o !== "write+pathfinder");
  if (uniqueRefs.length === 0) klass = "unreferenced";
  else if (owners.includes("shared") || pageOwners.length > 1 || owners.includes("write+pathfinder") && pageOwners.length >= 1) {
    // demo viewer shared between write and pathfinder is still per-asset
    const only = [...new Set(pageOwners.filter((o) => o !== "shared"))];
    if (owners.includes("shared") && only.length === 0) klass = "shared";
    else if (only.length === 1 && !owners.includes("shared")) klass = only[0];
    else if (only.length === 1 && owners.includes("shared")) klass = "shared"; // homepage + project
    else if (only.length > 1) klass = "shared";
    else klass = "shared";
  } else if (pageOwners.length === 1) klass = pageOwners[0];
  else if (owners.length === 1 && owners[0].startsWith("other:")) klass = "uncertain";

  rows.push({ path: r, refs: uniqueRefs, owners, klass, size: fs.statSync(img).size });
}

const byClass = {};
for (const row of rows) {
  (byClass[row.klass] ||= []).push(row);
}

console.log("=== CLASSIFICATION COUNTS ===");
for (const [k, v] of Object.entries(byClass).sort((a, b) => b[1].length - a[0].length)) {
  console.log(k, v.length);
}

console.log("\n=== UNREFERENCED ===");
for (const r of byClass.unreferenced || []) console.log(r.path);

console.log("\n=== UNCERTAIN ===");
for (const r of byClass.uncertain || []) console.log(r.path, "←", r.refs.join(", ") || "(none)", r.owners.join("|"));

console.log("\n=== SHARED (sample) ===");
for (const r of (byClass.shared || []).slice(0, 40)) console.log(r.path, "←", r.refs.join(", "));

for (const k of ["write", "pathfinder", "agent-os", "chat-pwc", "ai-design-system", "ma-path", "pulse", "dcb"]) {
  console.log(`\n=== ${k.toUpperCase()} (${(byClass[k] || []).length}) ===`);
  for (const r of byClass[k] || []) console.log(r.path);
}

fs.writeFileSync(
  path.join(ROOT, "scripts/_inventory.json"),
  JSON.stringify({ byClass, rows, refsByFile: Object.fromEntries(Object.entries(refsByFile).map(([k, v]) => [k, [...v]])) }, null, 2)
);
console.log("\nWrote scripts/_inventory.json");
