const fs = require('fs');
let content = fs.readFileSync('src/components/BreathingOverlay.tsx', 'utf8');

const search = 'const AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;';
const replace = 'const AudioContextPolyfill = window.AudioContext || (window as unknown as { webkitAudioContext: typeof window.AudioContext }).webkitAudioContext;\n    const AudioContext = AudioContextPolyfill;';

if (content.includes(search)) {
    content = content.replace(search, replace);
    fs.writeFileSync('src/components/BreathingOverlay.tsx', content);
    console.log('patched');
} else {
    console.log('Not found');
    console.log(content.split('\n')[85]);
}
