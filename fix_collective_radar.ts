import { readFileSync, writeFileSync } from 'fs';

const file = './src/components/Trajectory/CollectiveRadar.tsx';
let code = readFileSync(file, 'utf8');

if (!code.includes("externalTension?: number;")) {
    code = code.replace(
        /interface CollectiveRadarProps \{/,
        `interface CollectiveRadarProps {\n    externalTension?: number;`
    );
}

writeFileSync(file, code);
