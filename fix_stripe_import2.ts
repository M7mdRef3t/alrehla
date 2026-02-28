import { readFileSync, writeFileSync } from 'fs';

const file = './app/api/webhooks/stripe/route.ts';
let code = readFileSync(file, 'utf8');

code = code.replace(
    `import { sendEmail } from '../../../../../server/lib/email.js';`,
    `import { sendEmail } from '@/server/lib/email';`
);

writeFileSync(file, code);
