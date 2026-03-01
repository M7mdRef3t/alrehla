const JULES_API_BASE = "https://jules.googleapis.com/v1alpha";
const API_KEY = process.env.VITE_JULES_API_KEY;

if (!API_KEY) {
    console.error("VITE_JULES_API_KEY is not set.");
    process.exit(1);
}

const sessionId = "sessions/1772356391458920401";

async function checkSession() {
    const response = await fetch(`${JULES_API_BASE}/${sessionId}`, {
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

checkSession();
