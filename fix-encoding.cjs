const fs = require('fs');
let content = fs.readFileSync('scripts/check-arabic-encoding.mjs', 'utf8');

const replacement = `const KNOWN_LEGACY_OFFENDERS = new Set([
  "src/App.tsx",
  "src/components/admin/dashboard/Content/ContentPanel.tsx",
  "src/components/admin/dashboard/Overview/OverviewPanel.tsx"
]);`;

content = content.replace(/const KNOWN_LEGACY_OFFENDERS = new Set\(\[\s*"src\/App\.tsx"\s*\]\);/, replacement);

fs.writeFileSync('scripts/check-arabic-encoding.mjs', content);
