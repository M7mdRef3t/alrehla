export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.REPORT_EMAIL_FROM || "no-reply@dawayir.com";

  if (!apiKey) {
    console.warn("RESEND_API_KEY is not configured. Email not sent:", { to, subject });
    return;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html
      })
    });

    if (!res.ok) {
        const err = await res.text();
        console.error("Failed to send email via Resend:", err);
    }
  } catch (err) {
      console.error("Error sending email:", err);
  }
}
