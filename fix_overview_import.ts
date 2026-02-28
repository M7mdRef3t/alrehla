import { readFileSync, writeFileSync } from 'fs';

const file = './server/admin/overview.ts';
let code = readFileSync(file, 'utf8');

code = code.replace(`import { sendEmail } from '../lib/email.js';\n`, '');
if (!code.includes("import { sendEmail }")) {
    code = code.replace(
        `import { getAdminSupabase`,
        `import { sendEmail } from '../lib/email';\nimport { getAdminSupabase`
    );
}

writeFileSync(file, code);
