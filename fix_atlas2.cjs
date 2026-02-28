const fs = require('fs');
let file = 'src/components/AtlasDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('payload: readonly any[]', 'payload: readonly { payload?: { pathLabel?: string; starts?: number } }[]');
content = content.replace('payload: readonly any[]', 'payload: readonly { payload?: { date?: string } }[]');

fs.writeFileSync(file, content);
