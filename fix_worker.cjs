const fs = require('fs');

let file = 'src/app/api/awareness-queue/worker/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('err.message', 'err instanceof Error ? err.message : String(err)');
content = content.replace('procError.message', 'procError instanceof Error ? procError.message : String(procError)');
content = content.replace('err.message', 'err instanceof Error ? err.message : String(err)');

fs.writeFileSync(file, content);

let file2 = 'src/app/api/awareness-queue/route.ts';
let content2 = fs.readFileSync(file2, 'utf8');

content2 = content2.replace('err.message', 'err instanceof Error ? err.message : String(err)');

fs.writeFileSync(file2, content2);
