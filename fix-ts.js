const fs = require('fs');

const file = 'src/lib/analytics/metaPixel.ts';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/\(window as unknown\)\.fbq/g, '(window as any).fbq');
fs.writeFileSync(file, content);

console.log('Fixed.');
