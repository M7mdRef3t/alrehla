import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SRC_DIR = path.resolve(__dirname, "../src");
const LOG_FILE = path.resolve(__dirname, "../tmp/typecheck_errors.log");

if (!fs.existsSync(LOG_FILE)) {
  console.error("No typecheck error log found.");
  process.exit(1);
}

const logContent = fs.readFileSync(LOG_FILE, "utf-8");

// Regex to capture: filepath, line number, and broken import string
// Example: src/modules/meta/app-shell/AppOverlayHost.tsx(41,44): error TS2307: Cannot find module '../EmergencyOverlay'
const ERROR_REGEX = /^(src\/[^\(]+)\(\d+,\d+\): error TS2307: Cannot find module '([^']+)'/gm;

let match;
const repairs = {}; // { filepath: [ { brokenImport, targetComponentString } ] }

while ((match = ERROR_REGEX.exec(logContent)) !== null) {
  const filePath = path.resolve(__dirname, "..", match[1]);
  const brokenImport = match[2];
  
  if (!repairs[filePath]) repairs[filePath] = new Set();
  repairs[filePath].add(brokenImport);
}

// Build an index of all files in src/
const fileIndex = {};
function indexDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      indexDirectory(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts"))) {
      const baseNameWithoutExt = entry.name.replace(/\.tsx?$/, "");
      // store the alias path e.g. @/modules/action/EmergencyOverlay
      const aliasPath = "@/" + path.relative(SRC_DIR, fullPath).replace(/\\/g, "/").replace(/\.tsx?$/, "");
      
      if (!fileIndex[baseNameWithoutExt]) fileIndex[baseNameWithoutExt] = [];
      fileIndex[baseNameWithoutExt].push(aliasPath);
    }
  }
}
console.log("Indexing all files in src/...");
indexDirectory(SRC_DIR);

let fixedCount = 0;

for (const [filePath, brokenImportsArray] of Object.entries(repairs)) {
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, "utf-8");
  let fileModified = false;

  for (const brokenImport of brokenImportsArray) {
    // Extract what they were looking for, e.g. '../EmergencyOverlay' -> 'EmergencyOverlay'
    const parts = brokenImport.split("/");
    const targetName = parts[parts.length - 1];
    
    // Find where it really lives
    const candidates = fileIndex[targetName];
    
    if (candidates && candidates.length > 0) {
      // Pick the first match (assumes unique names, mostly true for our components)
      // Or prioritize index files if multiple. We will take candidates[0] for simplicity.
      let bestCandidate = candidates[0];
      if (candidates.length > 1) {
        // prefer exact matches or non-index components if named similarly
        bestCandidate = candidates.find(c => !c.includes("index")) || candidates[0];
      }

      // Replace the exact string globally in the file
      // e.g. from '../EmergencyOverlay' -> from '@/modules/action/EmergencyOverlay'
      // We escape the brokenImport string slightly for regex safety
      const safeSearchStr = brokenImport.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const replaceRegex = new RegExp(`['"\`]?${safeSearchStr}['"\`]?`, "g");
      
      content = content.replace(replaceRegex, `'${bestCandidate}'`);
      console.log(`[REPAIRED] in ${path.relative(SRC_DIR, filePath)}: ${brokenImport} -> ${bestCandidate}`);
      fileModified = true;
    } else {
      console.log(`[NOT FOUND] Couldn't locate replacement for: ${targetName} in ${filePath}`);
    }
  }

  if (fileModified) {
    fs.writeFileSync(filePath, content, "utf-8");
    fixedCount++;
  }
}

console.log(`✅ Auto-Repair Complete! Repaired imports in ${fixedCount} files.`);
