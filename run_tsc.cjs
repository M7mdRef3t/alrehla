const { execSync } = require('child_process');
const fs = require('fs');

try {
  const output = execSync('npx tsc --noEmit --pretty false', {
    encoding: 'utf8',
    timeout: 120000,
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  fs.writeFileSync('tsc_errors.txt', output || 'NO ERRORS', 'utf8');
  console.log('TSC passed with zero errors');
} catch (e) {
  const combined = (e.stdout || '') + '\n' + (e.stderr || '');
  fs.writeFileSync('tsc_errors.txt', combined, 'utf8');
  // Filter to maraya-related errors
  const lines = combined.split('\n').filter(l => l.includes('maraya'));
  console.log('MARAYA ERRORS (' + lines.length + '):');
  lines.forEach(l => console.log(l));
  if (lines.length === 0) {
    console.log('NO maraya errors. Other errors:');
    const otherLines = combined.split('\n').filter(l => l.includes('error TS'));
    console.log(otherLines.slice(0, 10).join('\n'));
  }
}
