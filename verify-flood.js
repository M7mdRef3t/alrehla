const SUPABASE_URL = "https://acvcnktpsbayowhurcmn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxNDA5OSwiZXhwIjoyMDg1OTkwMDk5fQ.EU428drssoyAgitVE9AIgZZ5xC-2mb5uOs2cqnv1GI0";

async function verify() {
    console.log("🔍 Fetching recent stress test results...");

    const res = await fetch(`${SUPABASE_URL}/rest/v1/awareness_events_queue?action_type=eq.concurrency_ddos_attack&order=created_at.desc&limit=15`, {
        method: 'GET',
        headers: {
            'apikey': SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
    });

    const data = await res.json();

    if (data.length === 0) {
        console.warn("⚠️ No stress test records found. Check if the Edge Function trigger is actually enabled.");
        return;
    }

    const stats = data.reduce((acc, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1;
        return acc;
    }, {});

    console.log("📊 [Stress Test Results Summary]:");
    console.table(stats);

    const userId = data[0].user_id;
    console.log(`👤 Target User ID: ${userId}`);

    const details = data.map(r => ({
        id: r.id.substring(0, 8),
        status: r.status,
        error: r.last_error,
        processed_at: r.processed_at
    }));
    console.table(details);

    if (stats['completed'] === 1 && stats['cancelled'] >= 9) {
        console.log("✅ [SUCCESS] The Distributed Lock (Mutex) worked perfectly. Only 1 worker proceeded.");
    } else if (stats['completed'] > 1) {
        console.log("❌ [FAILURE] Concurrency Leak detected! Multiple workers completed the journey generation.");
    } else if (stats['pending'] > 0) {
        console.log("⏳ [WAITING] Some events are still pending. The worker might be slow or Gemini API is lagging.");
    }
}

// Wait a bit for the workers to finish
setTimeout(verify, 15000); 
