const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";
const API_KEY = process.env.VITE_JULES_API_KEY;

async function listSessions() {
    const response = await fetch(`${JULES_API_BASE}/sessions`, {
        headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
        },
    });
    if (!response.ok) {
        console.error(`Error: ${response.status}`);
        return;
    }
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
}

listSessions();
