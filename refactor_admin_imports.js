const fs = require('fs');
const path = require('path');

const map = require('./admin_export_map.json');

function walk(dir, callback) {
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory() && file !== 'node_modules') {
      walk(fullPath, callback);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      callback(fullPath);
    }
  }
}

let modifiedCount = 0;

walk(path.join(__dirname, 'src'), (filePath) => {
  if (filePath.includes(path.join('src', 'services', 'admin'))) return;
  if (filePath.includes(path.join('src', 'services', 'adminApi.ts'))) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  const importRegex = /import\s+type\s+{[^}]+}\s+from\s+["']@\/services\/adminApi["'];?|import\s+{[^}]+}\s+from\s+["']@\/services\/adminApi["'];?/g;

  content = content.replace(importRegex, (match) => {
    const exportsMatch = match.match(/{([^}]+)}/);
    if (!exportsMatch) return match;

    const isTypeOnly = match.startsWith('import type');
    const exports = exportsMatch[1].split(',').map(s => s.trim()).filter(Boolean);

    const groups = {};
    const unmapped = [];

    for (const exp of exports) {
      let cleanExp = exp;
      if (exp.includes(' as ')) {
        const parts = exp.split(' as ');
        cleanExp = parts[0].trim();
        if (cleanExp.startsWith('type ')) {
           cleanExp = cleanExp.replace('type ', '').trim();
        }
      } else if (exp.startsWith('type ')) {
        cleanExp = exp.replace('type ', '').trim();
      }
      
      const source = map[cleanExp];
      if (source) {
        if (!groups[source]) groups[source] = [];
        groups[source].push(exp);
      } else {
        unmapped.push(exp);
      }
    }

    if (unmapped.length > 0) {
      console.log(`Warning: Unmapped exports in ${filePath}:`, unmapped);
      // Fallback to adminCore
      if (!groups["@/services/admin/adminCore"]) groups["@/services/admin/adminCore"] = [];
      unmapped.forEach(u => groups["@/services/admin/adminCore"].push(u));
    }

    let replacements = [];
    for (const [source, exps] of Object.entries(groups)) {
       const expList = exps.join(', ');
       if (isTypeOnly) {
         replacements.push(`import type { ${expList} } from "${source}";`);
       } else {
         replacements.push(`import { ${expList} } from "${source}";`);
       }
    }
    
    changed = true;
    return replacements.join('\n');
  });

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
    modifiedCount++;
    console.log(`Modified: ${filePath}`);
  }
});

console.log(`\nSuccessfully modified ${modifiedCount} files.`);
