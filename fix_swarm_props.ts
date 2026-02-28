import { readFileSync, writeFileSync } from 'fs';

let file = './src/components/CommandCenter/SwarmStatusBadge.tsx';
let code = readFileSync(file, 'utf8');

// Replace the invalid destructured names with the correct ones from the interface
code = code.replace(
    /export const SwarmStatusBadge: React\.FC<SwarmStatusBadgeProps> = \(\{ _tension, _momentum, label, isInsulated \}\) => \{/,
    "export const SwarmStatusBadge: React.FC<SwarmStatusBadgeProps> = ({ tension: _tension, momentum: _momentum, label, isInsulated }) => {"
);

writeFileSync(file, code);
