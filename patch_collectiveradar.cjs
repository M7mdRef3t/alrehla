const fs = require('fs');

function addExternalTension(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace('swarmMetrics: SwarmMetrics;', 'swarmMetrics: SwarmMetrics;\n    externalTension?: number;');
    fs.writeFileSync(file, content);
}

addExternalTension('src/components/Trajectory/CollectiveRadar.tsx');
