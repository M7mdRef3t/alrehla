import fs from 'fs/promises';
import path from 'path';

const searchRegex = /['"](?:\.\.\/)*src\/domains\/dawayir(?:[^'"]*)['"]|['"](?:\.\.\/)*domains\/dawayir(?:[^'"]*)['"]|['"]@\/domains\/dawayir(?:[^'"]*)['"]/g;
const replacement = "'@alrehla/dawayir'";

async function processFile(filePath) {
  const stat = await fs.stat(filePath);
  if (stat.isDirectory()) {
    const files = await fs.readdir(filePath);
    await Promise.all(files.map(file => processFile(path.join(filePath, file))));
  } else if (filePath.endsWith('.ts') || filePath.endsWith('.tsx')) {
    const content = await fs.readFile(filePath, 'utf-8');
    if (searchRegex.test(content)) {
      const newContent = content.replace(searchRegex, replacement);
      await fs.writeFile(filePath, newContent, 'utf-8');
      console.log(`Updated ${filePath}`);
    }
  }
}

async function run() {
  const startDir = path.join(process.cwd(), 'src');
  console.log(`Starting refactor in ${startDir}`);
  await processFile(startDir);
  console.log('Refactor complete.');
}

run().catch(console.error);
