import { readFileSync, writeFileSync } from 'fs';

const file = './src/services/hiveEngine.ts';
let code = readFileSync(file, 'utf8');

if (!code.includes("metadata?: any;")) {
    code = code.replace(
        /export interface SwarmMetrics \{/,
        `export interface SwarmMetrics {\n    metadata?: any;`
    );
}

writeFileSync(file, code);
