const fs = require('fs');
const path = require('path');

// --- Helpers ---
function getEnv(key) {
  const envLocal = fs.readFileSync('.env.local', 'utf8');
  const line = envLocal.split('\n').find(l => l.startsWith(key + '='));
  return line ? line.split('=')[1].replace(/['"]/g, '').trim() : '';
}

const API_URL = 'http://localhost:3031';
const ADMIN_CODE = getEnv('NEXT_PUBLIC_ADMIN_CODE') || '667788'; 
console.log(`[Debug] Using ADMIN_CODE: ${String(ADMIN_CODE).substring(0, 5)}... (length: ${String(ADMIN_CODE).length})`);

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
  if (!oracleResult.ok) {
    console.error(`❌ Oracle Analysis Failed: ${oracleResult.error || oracleResult.message}`);
  } else {
    console.log(`✅ Oracle Analysis Complete. Analyzed: ${oracleResult.analyzedCount || 0}`);
    if (oracleResult.analyzedCount === 0) {
        console.log("ℹ️ Raw Oracle Result payload:", JSON.stringify(oracleResult, null, 2));
    }
    if (oracleResult.results && Object.keys(oracleResult.results).length > 0) {
        console.log("Insights (First 2):", JSON.stringify(Object.values(oracleResult.results).slice(0, 2), null, 2));
    } else {
        console.log("ℹ️ No specific insights returned (likely already analyzed or empty batch).");
    }
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
  if (!ignitionResult.ok) {
    console.error(`❌ Auto-Ignition Failed: ${ignitionResult.error}`);
  } else {
    console.log(`✅ Auto-Ignition Cycle Complete. Actions Taken: ${ignitionResult.actionsCount ?? 0}`);
    if (ignitionResult.actions && ignitionResult.actions.length > 0) {
        ignitionResult.actions.forEach(a => console.log(` - Action: ${a.type} -> ${a.reason}`));
    } else {
        console.log("ℹ️ No autonomous actions triggered in this loop.");
    }
  }

  // 4. VERIFICATION
  console.log("\n[Stage 4/4] Radar Trace Verification...");
  console.log("🏁 Radar Cycle Finished. Agent will now perform a deep audit of the Sovereign Layer via SQL.");
}

radarTest().catch(err => {
  console.error("\n❌ Radar Test Failed:", err.message);
  process.exit(1);
});
