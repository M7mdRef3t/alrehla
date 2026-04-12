const fs = require('fs');
const content = fs.readFileSync('c:/Users/ty/Downloads/Dawayir-main/Dawayir-main/src/components/admin/sessions/SessionOSConsole.tsx', 'utf8');
let open = 0;
let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    for (let char of lines[i]) {
        if (char === '{') open++;
        if (char === '}') open--;
    }
    if (open < 0) {
        console.log(`Unmatched closing brace at line ${i + 1}`);
        process.exit(1);
    }
}
console.log(`Final balance: ${open}`);
