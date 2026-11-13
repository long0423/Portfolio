#!/usr/bin/env node
/**
 * One-shot portfolio structure migration.
 * Copies files to the project-based layout, rewrites references,
 * writes compatibility stubs, then removes moved originals.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIP_DIRS = new Set(["node_modules", ".git", "shareable-export", "_archive"]);

function rp(...parts) {
  return path.join(ROOT, ...parts);
}
function web(p) {
  return p.split(path.sep).join("/");
}
function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}
function copyFile(fromRel, toRel) {
  const src = rp(fromRel);
  const dest = rp(toRel);
  if (!fs.existsSync(src)) throw new Error("Missing source: " + fromRel);
  ensureDir(dest);
  fs.copyFileSync(src, dest);
  return toRel;
}
function hashFile(abs) {
  return crypto.createHash("sha256").update(fs.readFileSync(abs)).digest("hex");
}

const PAGE_MOVES = {
  "Write.html": "projects/write/index.html",
  "WriteBuilder.html": "projects/write/prototype/index.html",
  "Pathfinder.html": "projects/pathfinder/index.html",
  "Agent.html": "projects/agent-os/index.html",
  "AgentOSBuilder.html": "projects/agent-os/prototype/index.html",
  "ChatPwC.html": "projects/chat-pwc/index.html",
  "DesignSystem.html": "projects/ai-design-system/index.html",
  "MAP.html": "projects/ma-path/index.html",
  "Pulse.html": "projects/pulse/index.html",
  "DCB.html": "projects/dcb/index.html",
  "Approach.html": "pages/approach/index.html",
  "Contact.html": "pages/contact/index.html",
};

const PROJECT_CSS = {
  "css/write-builder.css": "projects/write/assets/css/write-builder.css",
  "css/agent-os-builder.css": "projects/agent-os/assets/css/agent-os-builder.css",
  "css/pathfinder-case-study.css": "projects/pathfinder/assets/css/pathfinder-case-study.css",
};

const PROJECT_JS = {
  "js/write-builder.js": "projects/write/assets/js/write-builder.js",
  "js/write-builder-caret.js": "projects/write/assets/js/write-builder-caret.js",
  "js/write-builder-demo.js": "projects/write/assets/js/write-builder-demo.js",
  "js/write-builder-previews.js": "projects/write/assets/js/write-builder-previews.js",
  "js/write-builder-report.js": "projects/write/assets/js/write-builder-report.js",
  "js/agent-os-builder.js": "projects/agent-os/assets/js/agent-os-builder.js",
  "js/pathfinder-case-study.js": "projects/pathfinder/assets/js/pathfinder-case-study.js",
};

const WRITE_SHARED_WITH_CHATPWC = new Set([
  "images/Write-constraint-1.png",
  "images/Write-constraint-2.png",
  "images/Write-constraint-3.png",
  "images/Write-dark-1.png",
  "images/Write-dark-2.png",
  "images/Write-milestone-1.png",
  "images/Write-optimised-1.png",
  "images/Write-optimised-2.png",
  "images/Write-optimised-3.png",
  "images/Write-optimised-4.png",
  "images/Write-problem-1.png",
  "images/Write-problem-2.png",
  "images/Write-problem-3.png",
  "images/Write-problem-4.png",
  "images/Write-prompt-history-1.png",
  "images/Write-prompt-history-2.png",
  "images/Write-share-1.png",
  "images/write-evolution-1.png",
  "images/write-evolution-2.png",
  "images/write-evolution-3.png",
]);

const inventory = JSON.parse(fs.readFileSync(rp("scripts/_inventory.json"), "utf8"));

function basename(p) {
  return p.split("/").pop();
}

function imageDest(row) {
  const src = row.path;
  if (src === "assets/Resume-Long-Geng.pdf") return "assets/media/Resume-Long-Geng.pdf";
  if (src.startsWith("assets/videos/")) {
    if (src.includes("pathfinder")) return "projects/pathfinder/assets/videos/" + basename(src);
    return "projects/write/assets/videos/" + basename(src);
  }
  if (WRITE_SHARED_WITH_CHATPWC.has(src)) {
    return "projects/write/assets/images/" + basename(src);
  }
  if (src.startsWith("images/write-builder/")) {
    return "projects/write/assets/images/write-builder/" + basename(src);
  }
  if (src.startsWith("images/pathfinder/")) {
    return "projects/pathfinder/assets/images/" + basename(src);
  }
  if (src.startsWith("images/Write") || src.startsWith("images/write-") || src === "images/Architecture - Write.jpg") {
    return "projects/write/assets/images/" + basename(src);
  }

  const klass = row.klass;
  if (klass === "write") return "projects/write/assets/images/" + basename(src);
  if (klass === "pathfinder") return "projects/pathfinder/assets/images/" + basename(src);
  if (klass === "agent-os") return "projects/agent-os/assets/images/" + basename(src);
  if (klass === "chat-pwc") return "projects/chat-pwc/assets/images/" + basename(src);
  if (klass === "ai-design-system") return "projects/ai-design-system/assets/images/" + basename(src);
  if (klass === "ma-path") return "projects/ma-path/assets/images/" + basename(src);
  if (klass === "pulse") return "projects/pulse/assets/images/" + basename(src);
  if (klass === "dcb") return "projects/dcb/assets/images/" + basename(src);
  if (klass === "unreferenced") {
    if (/write/i.test(src)) return "projects/write/assets/images/" + src.replace(/^images\//, "");
    if (/pathfinder/i.test(src)) return "projects/pathfinder/assets/images/" + basename(src);
    return "assets/images/unassigned/" + basename(src);
  }
  if (klass === "uncertain") {
    if (row.owners && row.owners.includes("archive")) {
      return "_archive/me-legacy-images/" + basename(src);
    }
    return "assets/images/unassigned/" + basename(src);
  }
  return "assets/images/shared/" + basename(src);
}

const oldToNew = {};

function map(from, to) {
  oldToNew[from] = to;
}

for (const [from, to] of Object.entries(PAGE_MOVES)) map(from, to);
for (const [from, to] of Object.entries(PROJECT_CSS)) map(from, to);
for (const [from, to] of Object.entries(PROJECT_JS)) map(from, to);

const cssDir = fs.readdirSync(rp("css"));
for (const name of cssDir) {
  const from = "css/" + name;
  if (!PROJECT_CSS[from] && name !== ".DS_Store") map(from, "assets/css/" + name);
}
const jsDir = fs.readdirSync(rp("js"));
for (const name of jsDir) {
  const from = "js/" + name;
  if (!PROJECT_JS[from] && name !== ".DS_Store") map(from, "assets/js/" + name);
}

map("assets/Resume-Long-Geng.pdf", "assets/media/Resume-Long-Geng.pdf");

for (const row of inventory.rows) {
  map(row.path, imageDest(row));
}

// Catch image files the inventory missed
function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name) || ent.name === ".DS_Store") continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, acc);
    else acc.push(p);
  }
  return acc;
}
for (const abs of walk(rp("images"))) {
  const rel = web(path.relative(ROOT, abs));
  if (!oldToNew[rel]) {
    if (rel.startsWith("images/write-builder/")) map(rel, "projects/write/assets/images/write-builder/" + basename(rel));
    else if (rel.startsWith("images/pathfinder/")) map(rel, "projects/pathfinder/assets/images/" + basename(rel));
    else if (/^images\/(Write|write)/.test(rel)) map(rel, "projects/write/assets/images/" + basename(rel));
    else map(rel, "assets/images/unassigned/" + basename(rel));
  }
}
for (const abs of walk(rp("assets/videos"))) {
  const rel = web(path.relative(ROOT, abs));
  if (!oldToNew[rel]) {
    map(rel, rel.includes("pathfinder") ? "projects/pathfinder/assets/videos/" + basename(rel) : "projects/write/assets/videos/" + basename(rel));
  }
}

map("images/logo_AI.svg", "assets/images/shared/logo_AI.svg");

const mappingPath = rp("docs/_path-map.json");
ensureDir(mappingPath);
fs.writeFileSync(mappingPath, JSON.stringify(oldToNew, null, 2));

const copied = [];
const seenDest = new Map();
for (const [from, to] of Object.entries(oldToNew)) {
  if (from === to) continue;
  if (!fs.existsSync(rp(from))) continue;
  if (seenDest.has(to) && seenDest.get(to) !== from) {
    console.warn("DEST COLLISION", to, "from", seenDest.get(to), "and", from);
  }
  seenDest.set(to, from);
  copyFile(from, to);
  copied.push({ from, to });
}

function relFrom(fromFile, toFile) {
  let r = web(path.relative(path.dirname(rp(fromFile)), rp(toFile)));
  if (!r.startsWith(".")) r = "./" + r;
  return r;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const oldPathsSorted = Object.keys(oldToNew).sort((a, b) => b.length - a.length);

function rewriteContent(content, fromFile) {
  let out = content;
  for (const oldPath of oldPathsSorted) {
    const neu = oldToNew[oldPath];
    if (!neu || neu === oldPath) continue;
    const newRel = relFrom(fromFile, neu);
    const re = new RegExp(`(["'])${escapeRe(oldPath)}(\\?[^"']*)?\\1`, "g");
    out = out.replace(re, (_, q, qs) => q + newRel + (qs || "") + q);
    const reUrl = new RegExp(`url\\((['"]?)${escapeRe(oldPath)}\\1\\)`, "g");
    out = out.replace(reUrl, `url(${newRel})`);
    const reUrlCss = new RegExp(`url\\((['"]?)\\.\\./${escapeRe(oldPath)}\\1\\)`, "g");
    // style.css uses ../images/... from css/ — after move, handle separately below
    void reUrlCss;
  }
  // CSS files originally in css/ used ../images/...
  if (fromFile.startsWith("assets/css/")) {
    for (const oldPath of oldPathsSorted) {
      if (!oldPath.startsWith("images/")) continue;
      const neu = oldToNew[oldPath];
      if (!neu) continue;
      const newRel = relFrom(fromFile, neu);
      const variants = ["../" + oldPath, oldPath];
      for (const v of variants) {
        const reUrl = new RegExp(`url\\((['"]?)${escapeRe(v)}\\1\\)`, "g");
        out = out.replace(reUrl, `url(${newRel})`);
      }
    }
  }
  return out;
}

function rewriteFile(relPath) {
  const abs = rp(relPath);
  if (!fs.existsSync(abs)) return;
  const ext = path.extname(abs).toLowerCase();
  if (![".html", ".js", ".css", ".mjs"].includes(ext)) return;
  const before = fs.readFileSync(abs, "utf8");
  const after = rewriteContent(before, relPath);
  if (after !== before) fs.writeFileSync(abs, after);
}

const newTextFiles = copied
  .filter((c) => /\.(html|js|css|mjs)$/i.test(c.to))
  .map((c) => c.to);
for (const f of ["Me.html", "index.html", "pages/approach/index.html", "pages/contact/index.html"]) {
  if (!newTextFiles.includes(f) && fs.existsSync(rp(f))) newTextFiles.push(f);
}
for (const f of new Set(newTextFiles)) rewriteFile(f);

// Inject site-base.js into HTML files that load local JS
const siteBaseTag = '<script src="SITE_BASE_SRC"></script>\n';
function injectSiteBase(htmlRel) {
  const abs = rp(htmlRel);
  let html = fs.readFileSync(abs, "utf8");
  if (html.includes("site-base.js")) return;
  const siteRel = relFrom(htmlRel, "assets/js/site-base.js");
  const tag = siteBaseTag.replace("SITE_BASE_SRC", siteRel);
  if (html.includes("embed-boot.js")) {
    html = html.replace(/(<script[^>]*embed-boot\.js[^>]*><\/script>)/, "$1\n        " + tag.trim());
  } else if (html.includes("<head>")) {
    html = html.replace("<head>", "<head>\n  " + tag.trim());
  } else {
    html = tag + html;
  }
  fs.writeFileSync(abs, html);
}

fs.writeFileSync(
  rp("assets/js/site-base.js"),
  `/**
 * Resolve the portfolio site root from this script's URL.
 * Works from nested project/pages paths and from the repo root.
 */
(function (window, document) {
  "use strict";
  function detectBase() {
    var scripts = document.getElementsByTagName("script");
    for (var i = 0; i < scripts.length; i++) {
      var abs = scripts[i].src || "";
      var m = abs.match(/^(.*\\/)assets\\/js\\/site-base\\.js(\\?.*)?$/);
      if (m) return m[1];
    }
    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src.replace(/assets\\/js\\/site-base\\.js(\\?.*)?$/, "");
    }
    return "/";
  }
  window.PORTFOLIO_BASE = detectBase();
  window.siteUrl = function (p) {
    p = String(p || "").replace(/^\\//, "");
    return window.PORTFOLIO_BASE + p;
  };
})(window, document);
`
);

for (const html of [
  "Me.html",
  "projects/write/index.html",
  "projects/write/prototype/index.html",
  "projects/pathfinder/index.html",
  "projects/agent-os/index.html",
  "projects/agent-os/prototype/index.html",
  "projects/chat-pwc/index.html",
  "projects/ai-design-system/index.html",
  "projects/ma-path/index.html",
  "projects/pulse/index.html",
  "projects/dcb/index.html",
  "pages/approach/index.html",
  "pages/contact/index.html",
]) {
  if (fs.existsSync(rp(html))) injectSiteBase(html);
}

fs.writeFileSync(rp("scripts/_copied.json"), JSON.stringify(copied, null, 2));
console.log("File copy and HTML rewrite complete. JS routing patches applied in a follow-up step.");
console.log("Copied", copied.length, "files");

function stubHtml(title, dest) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <link rel="canonical" href="${dest}" />
  <meta http-equiv="refresh" content="0; url=${dest}" />
  <script>
    (function () {
      var dest = ${JSON.stringify(dest)};
      var search = window.location.search || "";
      var hash = window.location.hash || "";
      if (dest.indexOf("#") !== -1) {
        window.location.replace(dest + search.replace(/^\\?/, dest.indexOf("?") >= 0 ? "&" : "?") .replace(/^\\?$/, "").replace(/^&$/, "") );
        return;
      }
      window.location.replace(dest + search + hash);
    })();
  </script>
</head>
<body>
  <p>This page has moved. <a href="${dest}">Continue to ${title}</a>.</p>
</body>
</html>
`;
}

const STUBS = {
  "Write.html": ["Tax Advice AI", "Me.html#/project/tax-advice"],
  "Pathfinder.html": ["Regulatory Pathfinder", "Me.html#/project/pathfinder"],
  "Agent.html": ["Agent OS", "Me.html#/project/agent-os"],
  "ChatPwC.html": ["ChatPwC", "Me.html#/project/chatpwc"],
  "DesignSystem.html": ["Enterprise AI Design System", "Me.html#/project/ai-design-system"],
  "MAP.html": ["M&A Path", "Me.html#/project/ma-path"],
  "Pulse.html": ["Engagement Pulse", "Me.html#/project/pulse"],
  "DCB.html": ["Digital Customer Blueprint", "Me.html#/project/dcb"],
  "Approach.html": ["Approach", "Me.html#/approach"],
  "Contact.html": ["Contact", "Me.html#/contact"],
  "WriteBuilder.html": ["Write Builder", "projects/write/prototype/"],
  "AgentOSBuilder.html": ["Agent OS Builder", "projects/agent-os/prototype/"],
};

for (const [file, [title, dest]] of Object.entries(STUBS)) {
  fs.writeFileSync(rp(file), stubHtml(title, dest));
}

// Archive Me.legacy and shareable-export outside the published tree
const localArchive = "/Users/lgeng004/Documents/Personal/_portfolio-local-archive";
fs.mkdirSync(localArchive, { recursive: true });
if (fs.existsSync(rp("Me.legacy.html"))) {
  ensureDir(rp("_archive/Me.legacy.html"));
  fs.copyFileSync(rp("Me.legacy.html"), rp("_archive/Me.legacy.html"));
  fs.copyFileSync(rp("Me.legacy.html"), path.join(localArchive, "Me.legacy.html"));
  fs.unlinkSync(rp("Me.legacy.html"));
}
if (fs.existsSync(rp("shareable-export"))) {
  fs.cpSync(rp("shareable-export"), path.join(localArchive, "shareable-export"), { recursive: true });
  fs.rmSync(rp("shareable-export"), { recursive: true, force: true });
}

// Remove moved originals (not the new destinations, not stubs)
const preserve = new Set(["Me.html", "index.html", "favicon.ico", ...Object.keys(STUBS)]);
for (const [from, to] of Object.entries(oldToNew)) {
  if (from === to) continue;
  if (preserve.has(from)) continue;
  const abs = rp(from);
  if (fs.existsSync(abs) && fs.existsSync(rp(to))) {
    fs.unlinkSync(abs);
  }
}

function rmEmpty(dir) {
  if (!fs.existsSync(dir)) return;
  const ents = fs.readdirSync(dir);
  for (const e of ents) {
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory()) rmEmpty(p);
  }
  const left = fs.readdirSync(dir).filter((n) => n !== ".DS_Store");
  if (left.length === 0) fs.rmSync(dir, { recursive: true, force: true });
}
rmEmpty(rp("css"));
rmEmpty(rp("js"));
rmEmpty(rp("images"));

fs.writeFileSync(
  rp(".gitignore"),
  `node_modules/
npm-debug.log
.DS_Store
.env
.env.*
!.env.example
*.log
shareable-export/
_archive/
_local-archive/
scripts/_inventory.json
docs/_path-map.json
`
);

const pkg = JSON.parse(fs.readFileSync(rp("package.json"), "utf8"));
pkg.scripts = {
  start: "live-server --port=8080 --open=index.html --watch=.",
  dev: "live-server --port=8080 --open=index.html --watch=.",
};
fs.writeFileSync(rp("package.json"), JSON.stringify(pkg, null, 2) + "\n");

console.log("Copied", copied.length, "files");
console.log("Stubs", Object.keys(STUBS).length);
console.log("Done");
