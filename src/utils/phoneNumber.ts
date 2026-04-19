/**
 * Normalizes phone numbers for WhatsApp integration.
 * Removes whitespace and ensures no leading + for certain API calls,
 * or keeps it depending on the specific use case.
 */
export function normalizeWhatsAppPhone(phone: string): string {
  // Remove all non-numeric characters
  return phone.replace(/\D/g, "");
}

/**
 * Validates if the phone number is roughly correct for WhatsApp (min 10 digits).
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  const digits = normalizeWhatsAppPhone(phone);
  return digits.length >= 10 && digits.length <= 15;
}
