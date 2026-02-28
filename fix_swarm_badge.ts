import { readFileSync, writeFileSync } from 'fs';

let file = './src/components/CommandCenter/SwarmStatusBadge.tsx';
let code = readFileSync(file, 'utf8');
code = code.replace(/\{ tension, momentum, label, isInsulated \}/g, "{ tension: _tension, momentum: _momentum, label, isInsulated }");
writeFileSync(file, code);
