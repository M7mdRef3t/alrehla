import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemaPath = path.resolve(__dirname, "../supabase/schema.sql");
const sqlFile = process.env.SUPABASE_SQL_FILE || schemaPath;
const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!dbUrl) {
  console.error("Missing SUPABASE_DB_URL (or DATABASE_URL).");
  process.exit(1);
}

const raw = await fs.readFile(sqlFile, "utf8");

function parseStatements(sql) {
  const statements = [];
  let buffer = "";
  let dollarTag = null;

  const lines = sql.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("--")) continue;

    const tagMatches = [...line.matchAll(/\$[A-Za-z0-9_]*\$/g)];
    for (const match of tagMatches) {
      const tag = match[0];
      if (!dollarTag) {
        dollarTag = tag;
      } else if (dollarTag === tag) {
        dollarTag = null;
      }
    }

    buffer += line + "\n";
    if (!dollarTag && trimmed.endsWith(";")) {
      statements.push(buffer.trim());
      buffer = "";
    }
  }
  if (buffer.trim()) statements.push(buffer.trim());
  return statements;
}

const statements = parseStatements(raw);
if (!statements.length) {
  console.error("No SQL statements found.");
  process.exit(1);
}

const client = new Client({ connectionString: dbUrl });
await client.connect();

try {
  for (const statement of statements) {
    await client.query(statement);
  }
  console.log(`Applied ${statements.length} statements from ${path.basename(sqlFile)}`);
} finally {
  await client.end();
}
