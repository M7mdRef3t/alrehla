import fs from "node:fs/promises";
import path from "node:path";

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

function parseCsv(content) {
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

    if (char === "," && !inQuotes) {
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
  const content = await fs.readFile(filePath, "utf8");
  if (filePath.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : parsed.leads ?? [];
  }
  return parseCsv(content);
}

function slugify(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function buildLeadId(lead, index) {
  const email = String(lead.email ?? "").trim().toLowerCase();
  const phone = String(lead.phone ?? "").trim().replace(/\D+/g, "");
  const name = slugify(lead.name ?? "");

  if (email) {
    return `meta-${slugify(email.replace("@", "-at-"))}`;
  }
  if (phone) {
    return `meta-${phone.slice(-10)}`;
  }
  if (name) {
    return `meta-${name}-${index + 1}`;
  }
  return `meta-lead-${index + 1}`;
}

function buildPersonalizedUrl(baseUrl, leadId, leadSource) {
  const url = new URL(baseUrl);
  url.searchParams.set("lead_id", leadId);
  url.searchParams.set("lead_source", leadSource);
  return url.toString();
}

function buildWhatsappMessage(url) {
  return [
    "أهلًا، شفت إنك مهتم تعرف مين بيستنزف طاقتك.",
    "ابدأ من هنا:",
    url,
    "لو حابب، ابعتلي بعد ما تخلص وأنا أساعدك في الخطوة اللي بعدها."
  ].join("\n");
}

function escapeCsv(value) {
  const stringValue = String(value ?? "");
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }
  return stringValue;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = args.file;
  if (!filePath) {
    throw new Error("Usage: npm run marketing:generate-followups -- --file <path> [--output <path>] [--base-url <url>] [--lead-source <value>]");
  }

  const leads = await loadLeads(filePath);
  if (leads.length === 0) {
    throw new Error("No leads found in input file.");
  }

  const baseUrl = args["base-url"] || "https://www.alrehla.app/onboarding";
  const leadSource = args["lead-source"] || "meta_followup";
  const outputPath =
    args.output ||
    path.join(
      path.dirname(path.resolve(filePath)),
      `${path.basename(filePath, path.extname(filePath))}.followups.csv`
    );

  const rows = leads.map((lead, index) => {
    const leadId = buildLeadId(lead, index);
    const personalizedUrl = buildPersonalizedUrl(baseUrl, leadId, leadSource);
    return {
      email: lead.email ?? "",
      phone: lead.phone ?? "",
      name: lead.name ?? "",
      lead_id: leadId,
      personalized_url: personalizedUrl,
      whatsapp_message: buildWhatsappMessage(personalizedUrl)
    };
  });

  const headers = ["email", "phone", "name", "lead_id", "personalized_url", "whatsapp_message"];
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(","))
  ].join("\n");

  await fs.writeFile(outputPath, csv, "utf8");

  console.log(
    JSON.stringify(
      {
        ok: true,
        leadsCount: rows.length,
        outputPath,
        sample: rows.slice(0, 3)
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
