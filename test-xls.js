const fs = require('fs');

const path = 'C:\\Users\\ty\\Downloads\\energy_map_eg_v1_ad_01_Leads_2026-03-19_2026-04-10.xls';
const xml = fs.readFileSync(path, 'utf8');

// The file is XML Spreadsheet 2003 format
const rowRegex = /<Row>([\s\S]*?)<\/Row>/g;
const cellRegex = /<Data ss:Type=".*?">(.*?)<\/Data>/g;

let rows = [];
let match;
while ((match = rowRegex.exec(xml)) !== null) {
  const rowContent = match[1];
  let cells = [];
  let cellMatch;
  while ((cellMatch = cellRegex.exec(rowContent)) !== null) {
    cells.push(cellMatch[1]);
  }
  if (cells.length > 0) {
    rows.push(cells);
  }
}

console.log("Found rows:", rows.length);
if (rows.length > 0) {
    console.log("Headers:");
    rows[0].forEach((h, i) => console.log(`${i}: ${h}`));
}

if (rows.length > 1) {
    console.log("\nRow 1 Data:");
    rows[1].forEach((v, i) => console.log(`${i}: ${v}`));
}
