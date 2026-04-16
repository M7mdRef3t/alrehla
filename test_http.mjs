async function testHttp() {
  const row = {
    event_type: "flow_event",
    session_id: "test-session",
    anonymous_id: "test-anon",
    client_event_id: "test-client-" + Date.now(),
    payload: {
      mode: "anonymous",
      step: "goal_selected"
    }
  };

  try {
    const response = await fetch("http://localhost:3030/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row)
    });
    
    console.log("STATUS:", response.status);
    const text = await response.text();
    console.log("RESPONSE:", text);
  } catch (err) {
    console.error("FETCH ERROR:", err);
  }
}

testHttp();
