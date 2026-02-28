import { readFileSync, writeFileSync } from 'fs';

const file = './server/admin/overview.ts';
let code = readFileSync(file, 'utf8');

if (!code.includes("import { sendEmail }")) {
    code = `import { sendEmail } from '../lib/email';\n` + code;
}

writeFileSync(file, code);
