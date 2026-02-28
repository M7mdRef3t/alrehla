import { readFileSync, writeFileSync } from 'fs';

const file = './src/components/AtlasDashboard.tsx';
let code = readFileSync(file, 'utf8');

code = code.replace(
    /labelFormatter=\{\(_label, payload: Array<\{ payload\?: \{ pathLabel\?: string; starts\?: number \} \}> \| undefined\) => \{/,
    `labelFormatter={(_label, payload: any) => {`
);

code = code.replace(
    /labelFormatter=\{\(_label, payload: Array<\{ payload\?: \{ date\?: string \} \}> \| undefined\) => \{/,
    `labelFormatter={(_label, payload: any) => {`
);


writeFileSync(file, code);
