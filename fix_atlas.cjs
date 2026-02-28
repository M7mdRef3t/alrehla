const fs = require('fs');

let file = 'src/components/AtlasDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('payload: Array<{ payload?: { pathLabel?: string; starts?: number } }> | undefined', 'payload: readonly any[]');
content = content.replace('payload: Array<{ payload?: { date?: string } }> | undefined', 'payload: readonly any[]');

fs.writeFileSync(file, content);
