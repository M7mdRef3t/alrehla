import fs from "node:fs/promises";
import path from "node:path";

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

async function run() {
  const adminCode = process.env.ADMIN_EXPORT_ADMIN_CODE || getRequiredEnv("ADMIN_API_SECRET");
  const endpoint =
    process.env.ADMIN_EXPORT_ENDPOINT ||
    `${getRequiredEnv("PUBLIC_APP_URL").replace(/\/$/, "")}/api/admin/overview?kind=full-export&limit=5000`;

  const response = await fetch(endpoint, {
    headers: {
      "x-admin-code": adminCode
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Backup request failed: ${response.status} ${text.slice(0, 300)}`);
  }

  const data = await response.json();
  const outputDir = path.resolve("backups/admin");
  await fs.mkdir(outputDir, { recursive: true });

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const snapshotPath = path.join(outputDir, `full-export-${stamp}.json`);
  const latestPath = path.join(outputDir, "latest-full-export.json");
  const payload = `${JSON.stringify(data, null, 2)}\n`;

  await fs.writeFile(snapshotPath, payload, "utf8");
  await fs.writeFile(latestPath, payload, "utf8");

  console.log(`Backup created: ${snapshotPath}`);
  console.log(`Backup updated: ${latestPath}`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
