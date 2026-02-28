import { readFileSync, writeFileSync } from 'fs';

let file = './vite.config.ts';
let code = readFileSync(file, 'utf8');

// Replace __DEFINES__: "({})" with an empty string or correct JSON string. esbuild/vite replace expects JSON.stringify('{}')
code = code.replace(/__DEFINES__: "\(\{\}\)"/g, "__DEFINES__: \"{}\"");

writeFileSync(file, code);
