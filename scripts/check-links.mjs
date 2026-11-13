#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP = new Set(["node_modules", ".git", "_archive"]);
const TEXT = new Set([".html", ".js", ".css"]);

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(ent.name) || ent.name === ".DS_Store") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else if (TEXT.has(path.extname(p).toLowerCase())) acc.push(p);
  }
  return acc;
}

function exists(abs) {
  try {
    fs.accessSync(abs);
    return true;
  } catch {
    return false;
  }
}

const re = /(?:src|href|poster|srcset|data-full-image|data-demo-src|data-demo-poster)\s*=\s*["']([^"']+)["']|url\(\s*['"]?([^'")]+)['"]?\s*\)/gi;
const missing = [];
const stubs = new Set([
  "Write.html", "Pathfinder.html", "Agent.html", "ChatPwC.html", "DesignSystem.html",
  "MAP.html", "Pulse.html", "DCB.html", "Approach.html", "Contact.html",
  "WriteBuilder.html", "AgentOSBuilder.html",
]);

for (const file of walk(ROOT)) {
  if (stubs.has(path.basename(file)) && path.dirname(file) === ROOT) continue;
  const rel = path.relative(ROOT, file);
  const text = fs.readFileSync(file, "utf8");
  let m;
  const localRe = new RegExp(re.source, "gi");
  while ((m = localRe.exec(text))) {
    let raw = (m[1] || m[2] || "").split("?")[0].split("#")[0].trim();
    if (!raw || /^(https?:|mailto:|tel:|data:|blob:|javascript:|#)/i.test(raw)) continue;
    if (raw.startsWith("/")) {
      const abs = path.join(ROOT, raw.replace(/^\//, ""));
      if (!exists(abs) && !exists(path.join(abs, "index.html"))) {
        missing.push({ file: rel, ref: raw });
      }
      continue;
    }
    const abs = path.resolve(path.dirname(file), raw);
    if (!abs.startsWith(ROOT)) continue;
    if (!exists(abs) && !exists(path.join(abs, "index.html"))) {
      missing.push({ file: rel, ref: raw });
    }
  }
}

const uniq = [];
const seen = new Set();
for (const row of missing) {
  const k = row.file + " " + row.ref;
  if (seen.has(k)) continue;
  seen.add(k);
  uniq.push(row);
}

console.log("Missing local refs:", uniq.length);
for (const row of uniq.slice(0, 80)) console.log(" -", row.file, "→", row.ref);
if (uniq.length > 80) console.log(" ...", uniq.length - 80, "more");
process.exit(uniq.length ? 1 : 0);
