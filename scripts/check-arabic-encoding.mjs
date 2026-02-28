import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const TARGET_DIRS = ["src", "e2e", "docs"];
const ALLOWED_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".md", ".json", ".css"]);
const SUSPICIOUS = /(Ø|Ù|â€|â€™|ï¿½)/;
const KNOWN_LEGACY_OFFENDERS = new Set([
  "src/App.tsx",
  "src/components/admin/dashboard/Content/ContentPanel.tsx",
  "src/components/admin/dashboard/Overview/OverviewPanel.tsx"
]);

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist" || entry.name === "coverage") {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(full));
      continue;
    }
    if (!ALLOWED_EXTS.has(path.extname(entry.name))) continue;
    files.push(full);
  }
  return files;
}

const offenders = [];
for (const target of TARGET_DIRS) {
  const dir = path.join(ROOT, target);
  if (!fs.existsSync(dir)) continue;
  for (const filePath of walk(dir)) {
    const raw = fs.readFileSync(filePath, "utf8");
    const relative = path.relative(ROOT, filePath).replace(/\\/g, "/");
    if (KNOWN_LEGACY_OFFENDERS.has(relative)) continue;
    if (SUSPICIOUS.test(raw)) offenders.push(relative);
  }
}

if (offenders.length > 0) {
  console.error("Arabic encoding guard failed. Suspicious mojibake patterns found in:");
  for (const file of offenders) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log("Arabic encoding guard passed.");
