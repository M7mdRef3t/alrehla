#!/usr/bin/env node

/**
 * Journey Language Lint
 * Scans user-facing files for forbidden product-oriented language.
 * Run: npm run lint:journey
 * Reference: GLOSSARY.md
 */

import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

// ── Config ───────────────────────────────────────────────────────────
const SCAN_GLOBS = [
  "src/copy/**/*.{ts,tsx}",
  "src/modules/**/*.{ts,tsx}",
  "src/data/**/*.{ts,tsx}",
  "src/templates/**/*.{ts,tsx}",
  "app/not-found.tsx",
  "app/error.tsx",
  "app/onboarding/**/*.{ts,tsx}",
  "public/manifest.json",
];

const FORBIDDEN = [
  { term: "\u0627\u0633\u062A\u062E\u062F\u0645 \u0627\u0644\u0645\u0646\u0635\u0629",   fix: "\u0627\u0628\u062F\u0623 \u0631\u062D\u0644\u062A\u0643" },
  { term: "\u0627\u0633\u062A\u062E\u062F\u0627\u0645 \u0627\u0644\u0645\u0646\u0635\u0629",  fix: "\u0627\u0644\u0631\u062D\u0644\u0629" },
  { term: "\u0625\u0639\u062F\u0627\u062F\u0627\u062A \u0627\u0644\u0645\u0646\u0635\u0629", fix: "\u0627\u0644\u0625\u0639\u062F\u0627\u062F\u0627\u062A" },
  { term: "\u0623\u062F\u0648\u0627\u062A\u0646\u0627",            fix: "\u0628\u0648\u0635\u0644\u062A\u0646\u0627" },
  { term: "\u062E\u062F\u0645\u0627\u062A\u0646\u0627",            fix: "\u0645\u062D\u0637\u0627\u062A\u0646\u0627" },
  { term: "\u0645\u0646\u062A\u062C\u0646\u0627",              fix: "\u0631\u062D\u0644\u062A\u0646\u0627" },
  { term: "\u0645\u0633\u062A\u062E\u062F\u0645\u064A \u0627\u0644\u0645\u0646\u0635\u0629", fix: "\u0645\u0633\u0627\u0641\u0631\u064A \u0627\u0644\u0631\u062D\u0644\u0629" },
  { term: "\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u062A\u0637\u0628\u064A\u0642",    fix: "\u0648\u0627\u062C\u0647\u0629 \u0627\u0644\u0631\u062D\u0644\u0629" },
  { term: "\u0631\u062C\u0648\u0639 \u0644\u0644\u062A\u0637\u0628\u064A\u0642",     fix: "\u0631\u062C\u0648\u0639 \u0644\u0631\u062D\u0644\u062A\u0643" },
  { term: "\u0627\u0641\u062A\u062D \u0627\u0644\u062A\u0637\u0628\u064A\u0642",     fix: "\u0627\u0628\u062F\u0623 \u0631\u062D\u0644\u062A\u0643" },
];

// ── Helpers ──────────────────────────────────────────────────────────
function rg(pattern, globs) {
  const globArgs = globs.flatMap((g) => ["--glob", g]);
  const cmd = [
    "rg",
    "--no-heading",
    "--line-number",
    "--encoding",
    "utf-8",
    ...globArgs,
    "--",
    pattern,
  ];

  try {
    const out = execSync(cmd.join(" "), {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return out.trim().split("\n").filter(Boolean);
  } catch {
    return []; // rg exits 1 when no matches
  }
}

// ── Main ─────────────────────────────────────────────────────────────
console.log("");
console.log("=== Journey Language Lint ===");
console.log("");

let totalViolations = 0;

for (const { term, fix } of FORBIDDEN) {
  const hits = rg(term, SCAN_GLOBS);
  if (hits.length > 0) {
    totalViolations += hits.length;
    console.log(`\u26A0\uFE0F  "${term}" => "${fix}" (${hits.length} hit${hits.length > 1 ? "s" : ""})`);
    hits.slice(0, 5).forEach((h) => console.log(`    ${h}`));
    console.log("");
  }
}

console.log("=".repeat(40));
if (totalViolations === 0) {
  console.log("\u2705 All clear! No forbidden terms found.");
} else {
  console.log(`\u274C ${totalViolations} violation(s) found. See GLOSSARY.md`);
}
console.log("");

process.exit(totalViolations > 0 ? 1 : 0);
