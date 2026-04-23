import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walkDir(dirPath, callback);
    } else {
      if (dirPath.endsWith('.tsx') || dirPath.endsWith('.ts')) {
        callback(dirPath);
      }
    }
  });
}

let modifiedCount = 0;

walkDir(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Find import statement from lucide-react
  const lucideImportRegex = /import\s+{([^}]+)}\s+from\s+['"]lucide-react['"]/g;
  
  let newContent = content.replace(lucideImportRegex, (match, importsStr) => {
    if (importsStr.includes('Sparkles')) {
      // Check if "Zap as Sparkles" is already there to avoid double replacement
      if (importsStr.includes('Zap as Sparkles')) {
        return match;
      }
      
      // Replace Sparkles with "Zap as Sparkles"
      // Note: we use word boundary so we don't accidentally replace something like "SparklesIcon" if it existed
      const newImportsStr = importsStr.replace(/\bSparkles\b/g, 'Zap as Sparkles');
      return match.replace(importsStr, newImportsStr);
    }
    return match;
  });

  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    modifiedCount++;
    console.log(`Updated: ${filePath}`);
  }
});

console.log(`Total files modified: ${modifiedCount}`);
