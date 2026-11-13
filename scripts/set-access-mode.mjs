import fs from "node:fs";

const mode = process.argv[2];
if (mode !== "request" && mode !== "public") {
  console.error("Usage: node scripts/set-access-mode.mjs request|public");
  process.exit(1);
}

const file = new URL("../assets/js/project-access.js", import.meta.url);
const source = fs.readFileSync(file, "utf8");
const next = source.replace(
  /defaultMode:\s*"(request|public)",/,
  'defaultMode: "' + mode + '",'
);
if (next === source) {
  console.error("Could not find defaultMode in assets/js/project-access.js");
  process.exit(1);
}
fs.writeFileSync(file, next);
console.log("PROJECT_ACCESS_MODE=" + mode);
