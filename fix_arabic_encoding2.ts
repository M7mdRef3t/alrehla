import { readFileSync, writeFileSync } from 'fs';

let file = './src/components/admin/dashboard/Content/ContentPanel.tsx';
let code = readFileSync(file, 'utf8');
code = code.replace(/حفظ Ø§Ù„ØªØºÙŠÙŠØ±Ø§Øª/g, "حفظ التغييرات");
writeFileSync(file, code);
