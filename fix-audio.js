const fs = require('fs');
let content = fs.readFileSync('src/components/BreathingOverlay.tsx', 'utf8');
content = content.replace(
  'const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;',
  'const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;'
);
content = content.replace(
  'if (AudioContext) {',
  'if (AudioContextClass) {'
);
content = content.replace(
  'const ctx = new AudioContext();',
  'const ctx = new AudioContextClass();'
);
fs.writeFileSync('src/components/BreathingOverlay.tsx', content);
