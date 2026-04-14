const fs = require('fs');
const path = require('path');

// --- Helpers ---
function getEnv(key) {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  const line = envLocal.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1].replace(/['"]/g, '').trim() : '';
}

const API_URL = "http://localhost:3030";
const ADMIN_CODE = getEnv('NEXT_PUBLIC_ADMIN_CODE');

async function radarTest() {
  console.log("🚀 Starting [Intelligence Radar] Sovereign Test Cycle...");

  // 1. INGESTION — Capture a high-intent lead
  console.log("\n[Stage 1/4] Ingesting High-Intent Lead...");
  const leadPayload = {
    name: "Sovereign Test User",
    email: `test-${Date.now()}@alrehla.app`,
    phone: "201011111111",
    source: "meta",
    sourceType: "ad",
    intent: "seeking_transformation",
    note: "High resonance candidate for Dawayir Canvas. Interested in Sovereign Intelligence."
  };

  const resLead = await fetch(`${API_URL}/api/marketing/lead`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json"
    },
    body: JSON.stringify(leadPayload)
  });

  const leadResult = await resLead.json();
  if (!leadResult.ok) throw new Error(`Lead ingestion failed: ${leadResult.error}`);
  console.log(`✅ Lead Captured: ${leadResult.lead.lead_id}`);

  // 2. ANALYSIS — Trigger Oracle Radar
  console.log("\n[Stage 2/4] Triggering Oracle Intelligence Analysis...");
  const resOracle = await fetch(`${API_URL}/api/admin/intelligence/oracle-leads`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ADMIN_CODE}` // Simulate Admin Auth if needed
    },
    body: JSON.stringify({ batchSize: 5 })
  });

  const oracleResult = await resOracle.json();
  console.log(`✅ Oracle Analysis Complete. Analyzed: ${oracleResult.analyzedCount}`);
  if (oracleResult.results) {
      console.log("Insights:", JSON.stringify(oracleResult.results, null, 2));
  }

  // 3. ACTION — Trigger Auto-Ignition Loop
  console.log("\n[Stage 3/4] Triggering Auto-Ignition Loop...");
  const resIgnition = await fetch(`${API_URL}/api/admin/marketing-ops/auto-ignition`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${ADMIN_CODE}`
    }
  });

  const ignitionResult = await resIgnition.json();
  console.log(`✅ Auto-Ignition Cycle Complete. Actions Taken: ${ignitionResult.actionsCount}`);
  if (ignitionResult.actions) {
      ignitionResult.actions.forEach(a => console.log(` - Action: ${a.type} -> ${a.reason}`));
  }

  // 4. VERIFICATION
  console.log("\n[Stage 4/4] Radar Trace Verification...");
  // We'll leave this to the agent to check the DB directly via MCP
  console.log("🏁 Radar Cycle Finished. Agent will now perform a deep audit of the Sovereign Layer.");
}

radarTest().catch(err => {
  console.error("\n❌ Radar Test Failed:", err.message);
  process.exit(1);
});
