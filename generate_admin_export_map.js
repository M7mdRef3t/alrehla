const fs = require('fs');
const path = require('path');

const adminDir = path.join(__dirname, 'src', 'services', 'admin');
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.ts') && f !== 'index.ts' && f !== 'admin.test.ts');

const exportMap = {};

for (const file of files) {
  const content = fs.readFileSync(path.join(adminDir, file), 'utf8');
  // Match export const, export type, export interface, export function, export async function
  const exportRegex = /export\s+(?:async\s+)?(const|type|interface|function|let|var)\s+([A-Za-z0-9_]+)/g;
  let match;
  while ((match = exportRegex.exec(content)) !== null) {
    const exportName = match[2];
    exportMap[exportName] = `@/services/admin/${file.replace('.ts', '')}`;
  }
}

fs.writeFileSync('admin_export_map.json', JSON.stringify(exportMap, null, 2));
console.log('Export map generated.');
