import { readFileSync, writeFileSync } from 'fs';

const file = './app/api/webhooks/stripe/route.ts';
let code = readFileSync(file, 'utf8');

code = code.replace(
    `import { sendEmail } from '../../../../../server/lib/email';`,
    `import { sendEmail } from '../../../../../server/lib/email.js';`
);

writeFileSync(file, code);
