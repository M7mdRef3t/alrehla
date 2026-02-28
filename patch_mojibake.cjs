const fs = require('fs');
const files = [
    'src/components/admin/dashboard/Content/ContentPanel.tsx',
    'src/components/admin/dashboard/Overview/OverviewPanel.tsx'
];

function fixEncoding(content) {
    try {
        const buffer = Buffer.from(content, 'utf8');
        const asBinaryString = buffer.toString('binary');
        // Check if parsing binary as utf8 creates valid characters
        const decoded = Buffer.from(asBinaryString, 'binary').toString('utf8');

        // Let's actually just use iconv-lite if it exists, or do a manual buffer decode
        return Buffer.from(content, 'latin1').toString('utf8');
    } catch (e) {
        return content;
    }
}

for (const file of files) {
    const raw = fs.readFileSync(file, 'utf8');
    // It seems like the files are read as UTF-8 but contain Mojibake (UTF-8 bytes incorrectly decoded as something else, or vice-versa).
    // Let's try to convert latin1 back to utf8.
    const fixed = Buffer.from(raw, 'binary').toString('utf8');

    // Check if it looks more like Arabic
    if (/[\u0600-\u06FF]/.test(fixed)) {
        fs.writeFileSync(file, fixed);
        console.log(`Fixed ${file}`);
    } else {
        // Try latin1 -> utf8
        const fixed2 = Buffer.from(raw, 'latin1').toString('utf8');
        if (/[\u0600-\u06FF]/.test(fixed2)) {
            fs.writeFileSync(file, fixed2);
            console.log(`Fixed ${file} (latin1)`);
        } else {
            console.log(`Could not automatically fix ${file}`);
        }
    }
}
