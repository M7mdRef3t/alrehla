const fs = require('fs');
let content = fs.readFileSync('app/api/cron/marketing-outreach/route.ts', 'utf8');

content = content.replace(
  /\.eq\("id", row\.id\)\n\s*\.then\(\(res\) => res\)/g,
  '.eq("id", row.id)'
);

content = content.replace(
  /\.eq\("id", row\.id\)\n\s*\.then\(\(\{ error \}\) => \{\n\s*if \(error\) console\.error\("Failed to update queue row", row\.id, error\);\n\s*return null;\n\s*\}\)/g,
  '.eq("id", row.id)'
);

content = content.replace(
  /await Promise\.allSettled\(queueUpdates\);/g,
  `const updateResults = await Promise.allSettled(queueUpdates);
  for (const res of updateResults) {
    if (res.status === 'fulfilled' && res.value && res.value.error) {
      console.error("Failed to update queue row", res.value.error);
    } else if (res.status === 'rejected') {
      console.error("Queue update promise rejected", res.reason);
    }
  }`
);

fs.writeFileSync('app/api/cron/marketing-outreach/route.ts', content);
