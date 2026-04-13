const data = {"email":"mohamedrefatmohamed@gmail.com", "phone":"01023050092", "status":"payment_requested", "source":"activation_page", "sourceType":"website"};
fetch("http://localhost:3030/api/marketing/lead", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data)
}).then(async r => {
  console.log("Status:", r.status);
  console.log("Body:", await r.text());
}).catch(console.error);
