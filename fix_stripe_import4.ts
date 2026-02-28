import { readFileSync, writeFileSync } from 'fs';

const file = './app/api/webhooks/stripe/route.ts';
let code = readFileSync(file, 'utf8');

code = code.replace(
    `import { sendEmail } from '../../../../../server/lib/email';`,
    `import { sendEmail } from '@/server/lib/email';`
);

writeFileSync(file, code);

const tsconfig = './tsconfig.json';
const tsconfigData = JSON.parse(readFileSync(tsconfig, 'utf8'));
tsconfigData.compilerOptions.paths = tsconfigData.compilerOptions.paths || {};
tsconfigData.compilerOptions.paths['@/*'] = ["./*"];
writeFileSync(tsconfig, JSON.stringify(tsconfigData, null, 2));

const tsconfigTypecheck = './tsconfig.typecheck.json';
const tsconfigTypecheckData = JSON.parse(readFileSync(tsconfigTypecheck, 'utf8'));
tsconfigTypecheckData.compilerOptions = tsconfigTypecheckData.compilerOptions || {};
tsconfigTypecheckData.compilerOptions.paths = tsconfigTypecheckData.compilerOptions.paths || {};
tsconfigTypecheckData.compilerOptions.paths['@/*'] = ["./*"];
writeFileSync(tsconfigTypecheck, JSON.stringify(tsconfigTypecheckData, null, 2));
