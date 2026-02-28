const fs = require('fs');

function addMetadata(file) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace('swarm_momentum: number;', 'swarm_momentum: number;\n    metadata?: {\n        external_tension?: number;\n        last_signal_label?: string;\n    };');
    fs.writeFileSync(file, content);
}

addMetadata('src/services/hiveEngine.ts');
