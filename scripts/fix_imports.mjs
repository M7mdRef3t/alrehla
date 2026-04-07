import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Emulate __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SRC_DIR = path.resolve(__dirname, "../src");

// Patterns we want to match: directories that should be accessed from root alias @/
const rootFolders = [
  "services", "utils", "state", "hooks", "config", "copy", "data", "ai", "contexts", "modules", "components", "navigation", "styles", "templates", "types"
];

// Regex to catch imports like: from "../../../services/logger" or from '../../hooks/useX'
const IMPORT_REGEX_DOUBLE = new RegExp(`from "(\\.\\.\\/)+(${rootFolders.join("|")})(\\/[^"]*)?"`, "g");
const IMPORT_REGEX_SINGLE = new RegExp(`from '(\\.\\.\\/)+(${rootFolders.join("|")})(\\/[^']*)?'`, "g");

let changedFilesCount = 0;

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith(".tsx") || fullPath.endsWith(".ts")) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  const content = fs.readFileSync(filePath, "utf-8");
  
  let newContent = content.replace(IMPORT_REGEX_DOUBLE, 'from "@/$2$3"');
  newContent = newContent.replace(IMPORT_REGEX_SINGLE, "from '@/$2$3'");

  // Also catch dynamic imports like import("../../../services/...")
  const DYNAMIC_IMPORT_REGEX = new RegExp(`import\\("(\\.\\.\\/)+(${rootFolders.join("|")})(\\/[^"]*)?"\\)`, "g");
  newContent = newContent.replace(DYNAMIC_IMPORT_REGEX, 'import("@/$2$3")');
  const DYNAMIC_IMPORT_SINGLE = new RegExp(`import\\('(\\.\\.\\/)+(${rootFolders.join("|")})(\\/[^']*)?'\\)`, "g");
  newContent = newContent.replace(DYNAMIC_IMPORT_SINGLE, "import('@/$2$3')");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, "utf-8");
    console.log(`[NORMALIZE] Fixed imports in: ${path.relative(SRC_DIR, filePath)}`);
    changedFilesCount++;
  }
}

console.log("🚀 Starting the Grand Import Normalization Sweep...");
processDirectory(SRC_DIR);
console.log(`✅ Done! Fixed import paths in ${changedFilesCount} files.`);
