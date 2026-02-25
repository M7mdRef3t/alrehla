const SUPABASE_URL = "https://acvcnktpsbayowhurcmn.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjdmNua3Rwc2JheW93aHVyY21uIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQxNDA5OSwiZXhwIjoyMDg1OTkwMDk5fQ.EU428drssoyAgitVE9AIgZZ5xC-2mb5uOs2cqnv1GI0";

async function flood() {
    const userId = "stress-test-user-" + Date.now();
    console.log(`🚀 Starting Direct Flood for User: ${userId}`);

    const requests = Array.from({ length: 10 }).map((_, i) => {
        return fetch(`${SUPABASE_URL}/rest/v1/awareness_events_queue`, {
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify({
                user_id: userId,
                action_type: 'concurrency_ddos_attack',
                payload: { burst_id: i, timestamp: Date.now() },
                status: 'pending'
            })
        }).then(res => ({ id: i, status: res.status }));
    });

    const results = await Promise.all(requests);
    console.table(results);
    console.log("🔥 Flood finished. Check Supabase logs for Edge Function triggers!");
}

flood();
