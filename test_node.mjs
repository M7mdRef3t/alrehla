async function run() {
  try {
    const res = await fetch("http://localhost:3030/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "flow_event",
        session_id: "test-session",
        anonymous_id: "test-anon",
        client_event_id: "test-client-" + Date.now(),
        payload: {
          mode: "identified",
          step: "goal_selected"
        }
      })
    });
    const text = await res.text();
    console.log("STATUS:", res.status, "BODY:", text);
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}
run();
