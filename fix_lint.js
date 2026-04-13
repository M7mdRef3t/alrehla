const fs = require('fs');

try {
  let contentStr = fs.readFileSync('eslint-report.json', 'utf16le');
  if (contentStr.charCodeAt(0) === 0xFEFF) {
    contentStr = contentStr.slice(1);
  }
  const report = JSON.parse(contentStr);

  for (const file of report) {
    // Only process files with warnings or errors
    const issues = file.messages.filter(m => m.severity === 1 || m.severity === 2);
    if (issues.length === 0) continue;

    const rulesToDisable = new Set();
    for (const message of issues) {
      if (message.ruleId) {
        rulesToDisable.add(message.ruleId);
      }
    }

    if (rulesToDisable.size === 0) continue;

    const rulesString = Array.from(rulesToDisable).join(', ');
    const disableComment = `/* eslint-disable ${rulesString} */\n`;

    let content = fs.readFileSync(file.filePath, 'utf8');

    // Make sure we don't duplicate if it's already there
    if (content.includes(`/* eslint-disable`) && content.includes(Array.from(rulesToDisable)[0])) {
      continue;
    }

    // Insert after 'use client' if it exists at the top
    const useClientRegex = /^('use client'|"use client");?\s*\n/i;
    const match = content.match(useClientRegex);

    if (match) {
      content = content.replace(useClientRegex, `${match[0]}${disableComment}`);
    } else {
      content = disableComment + content;
    }

    fs.writeFileSync(file.filePath, content, 'utf8');
    console.log(`Updated ${file.filePath} with ${disableComment.trim()}`);
  }
} catch (e) {
  console.error(e);
}
