const fs = require('fs');

const path = 'src/server/marketingLeadApi.ts';
let code = fs.readFileSync(path, 'utf8');

const cryptoImport = `import crypto from "crypto";\n`;
if (!code.includes('import crypto')) {
  code = cryptoImport + code;
}

const sigFunction = `
export function generateLeadSignature(leadId: string): string {
  const secret = process.env.MARKETING_LINK_SECRET || process.env.MARKETING_DEBUG_KEY || "default-unsafe-secret-replace-in-prod";
  return crypto.createHmac("sha256", secret).update(leadId).digest("hex");
}
`;

if (!code.includes('generateLeadSignature')) {
  code = code.replace(
    'function buildPersonalizedUrl(leadId: string, source: string, path = "/onboarding"): string {',
    sigFunction + '\nfunction buildPersonalizedUrl(leadId: string, source: string, path = "/onboarding"): string {'
  );
  fs.writeFileSync(path, code);
}
