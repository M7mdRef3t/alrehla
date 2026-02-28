const fs = require('fs');

// AtlasDashboard.tsx
let atlasDash = fs.readFileSync('src/components/AtlasDashboard.tsx', 'utf8');
atlasDash = atlasDash.replace(/payload: Array<\{ payload\?: \{ pathLabel\?: string; starts\?: number \} \}> \| undefined/g, 'payload: ReadonlyArray<any> | undefined');
atlasDash = atlasDash.replace(/payload: Array<\{ payload\?: \{ date\?: string \} \}> \| undefined/g, 'payload: ReadonlyArray<any> | undefined');
fs.writeFileSync('src/components/AtlasDashboard.tsx', atlasDash);
