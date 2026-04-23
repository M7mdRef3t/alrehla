import fs from 'fs';
import path from 'path';


function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      if (file.endsWith('.store.ts')) {
        arrayOfFiles.push(path.join(dirPath, '/', file));
      }
    }
  });

  return arrayOfFiles;
}

const allStoreFiles = getAllFiles(path.join(process.cwd(), 'src'));

allStoreFiles.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');

  // Skip if it doesn't use persist
  if (!content.includes('persist(')) return;
  // Skip if already migrated
  if (content.includes('zustandIdbStorage')) return;

  // We need to add the import: import { zustandIdbStorage } from '@/utils/idbStorage';
  if (!content.includes("import { zustandIdbStorage }")) {
      const importStatement = `import { zustandIdbStorage } from '@/utils/idbStorage';\n`;
      // Insert after the last import
      const lines = content.split('\n');
      let lastImportIndex = 0;
      for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
              lastImportIndex = i;
          }
      }
      lines.splice(lastImportIndex + 1, 0, importStatement);
      content = lines.join('\n');
  }

  // We need to find `name: "something"` inside persist options and append `storage: zustandIdbStorage`
  // Usually it looks like:
  // {
  //   name: "alrehla-yawmiyyat",
  // }
  // or `name: "alrehla-wird",`
  // Let's use regex.
  const regex = /(name:\s*['"][^'"]+['"])(,?)/g;
  
  content = content.replace(regex, (match, p1, p2) => {
      // Check if storage is already defined on the next lines (heuristic)
      return `${p1}, storage: zustandIdbStorage${p2}`;
  });

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Migrated: ${file}`);
});
