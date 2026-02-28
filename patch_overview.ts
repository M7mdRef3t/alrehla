import { readFileSync, writeFileSync } from 'fs';

const file = './server/admin/overview.ts';
let code = readFileSync(file, 'utf8');

code = code.replace(
`async function sendResend(subject: string, html: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.REPORT_EMAIL_TO;
  const from = process.env.REPORT_EMAIL_FROM;
  if (!apiKey || !to || !from) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: \`Bearer \${apiKey}\`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html
    })
  });
}`,
`import { sendEmail } from '../lib/email.js';

async function sendResend(subject: string, html: string): Promise<void> {
    const to = process.env.REPORT_EMAIL_TO;
    if (!to) return;
    await sendEmail(to, subject, html);
}`
);

writeFileSync(file, code);
