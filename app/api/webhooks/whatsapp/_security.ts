import crypto from 'crypto';

/**
 * Verifies the X-Hub-Signature-256 header from Meta
 * https://developers.facebook.com/docs/graph-api/webhooks/getting-started#verify-signatures
 */
export async function verifyWhatsAppSignature(
  req: Request,
  rawBody: string,
  appSecret: string | undefined
): Promise<boolean> {
  // If appSecret is not provided, we skip verification but log a warning
  // This is to allow systems to work during setup if the user hasn't added the secret yet.
  if (!appSecret) {
    console.warn('[WhatsAppSecurity] META_APP_SECRET missing. Skipping signature verification.');
    return true;
  }

  const signature = req.headers.get('x-hub-signature-256');
  if (!signature) {
    console.warn('[WhatsAppSecurity] Missing x-hub-signature-256 header');
    return false;
  }

  // Signature format is "sha256=<hash>"
  const [algo, hash] = signature.split('=');
  if (algo !== 'sha256' || !hash) {
    console.warn('[WhatsAppSecurity] Invalid signature format:', signature);
    return false;
  }

  const expectedHash = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  const isValid = crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(expectedHash, 'hex')
  );

  if (!isValid) {
    console.error('[WhatsAppSecurity] Signature mismatch!');
  }

  return isValid;
}
