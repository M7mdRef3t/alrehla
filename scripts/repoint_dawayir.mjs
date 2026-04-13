import fs from 'fs';
import path from 'path';

// Define the root directory to start searching
const rootDir = process.cwd();
const srcDir = path.join(rootDir, 'src');

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findFiles(filePath, fileList);
    } else {
      if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
        fileList.push(filePath);
      }
    }
  }

  return fileList;
}

const allTsFiles = findFiles(srcDir);

// Patterns to replace:
// import { useMapState } from '@/domains/dawayir/store/map.store' -> `@/modules/map/store/map.store`
// import { X } from '@/domains/dawayir' -> `@/modules/map/dawayirIndex`

let modifiedCount = 0;

for (const filePath of allTsFiles) {
  const content = fs.readFileSync(filePath, 'utf-8');
  let newContent = content;

  // Replace sub-paths first
  newContent = newContent.replace(/['"]@\/domains\/dawayir\/(store|services|hooks|types)(.*)['"]/g, (match, folder, rest) => {
    let tRest = rest;
    if (folder === 'types') {
        return `'@/modules/map/dawayirTypes${rest}'`;
    }
    return `'@/modules/map/${folder}${rest}'`;
  });

  // Replace root import
  newContent = newContent.replace(/['"]@\/domains\/dawayir['"]/g, "'@/modules/map/dawayirIndex'");

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf-8');
    modifiedCount++;
    console.log(`Updated: ${path.relative(rootDir, filePath)}`);
  }
}

console.log(`\nFinished refactoring imports. Modified ${modifiedCount} files.`);
