import fs from "node:fs/promises";

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const current = argv[index];
    if (!current.startsWith("--")) continue;
    const key = current.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      options[key] = "true";
      continue;
    }
    options[key] = next;
    index += 1;
  }
  return options;
}

function parseCsv(content, delimiter = ",") {
  const rows = [];
  let current = "";
  let row = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];
    const next = content[i + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        current += "\"";
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(current);
      if (row.some((value) => value.trim().length > 0)) rows.push(row);
      row = [];
      current = "";
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    if (row.some((value) => value.trim().length > 0)) rows.push(row);
  }

  if (rows.length === 0) return [];
  const [header, ...dataRows] = rows;
  return dataRows.map((dataRow) =>
    Object.fromEntries(header.map((key, index) => [String(key).trim(), String(dataRow[index] ?? "").trim()]))
  );
}

async function loadLeads(filePath) {
  const buffer = await fs.readFile(filePath);

  // Simple encoding detection
  let content = "";
  if (buffer[0] === 0xff && buffer[1] === 0xfe) {
    content = buffer.toString("utf16le");
  } else if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    content = buffer.toString("utf16be");
  } else if (buffer.slice(0, 100).includes(0x00)) {
    // If null bytes in header, likely UTF-16
    content = buffer.toString("utf16le");
  } else {
    content = buffer.toString("utf8");
  }

  if (filePath.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.leads ?? [];
  }

  // Simple delimiter detection
  const firstLine = content.split(/[\r\n]+/)[0] || "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";

  return parseCsv(content, delimiter);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file;
  if (!filePath) {
    throw new Error("Usage: npm run marketing:import-leads -- --file <path> [--url <endpoint>] [--key <debug-key>] [--dry-run]");
  }

  const leads = await loadLeads(filePath);
  const payload = {
    source: args.source || "manual_import",
    sourceType: "manual_import",
    leads
  };

  if (args["dry-run"] === "true") {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: "dry-run",
          filePath,
          leadsCount: leads.length,
          sample: leads.slice(0, 3),
          payload
        },
        null,
        2
      )
    );
    return;
  }

  const url = args.url || process.env.MARKETING_IMPORT_URL || "http://localhost:3000/api/marketing/lead/import";
  const debugKey = args.key || process.env.MARKETING_DEBUG_KEY || "";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(debugKey ? { "x-marketing-debug-key": debugKey } : {})
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Import failed (${response.status}): ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
