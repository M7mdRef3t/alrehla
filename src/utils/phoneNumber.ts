/**
 * Normalizes Arabic/Persian digits and prepares a phone number for WhatsApp linking.
 */
export function normalizeArabicDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 1632))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 1776));
}

export function normalizeWhatsAppPhone(rawPhone: string): string {
  let digits = normalizeArabicDigits(rawPhone).replace(/\D/g, "");
  if (!digits) return "";

  // Handle various formats
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("020")) digits = digits.slice(1);
  if (digits.startsWith("0") && digits.length === 11) digits = `20${digits.slice(1)}`;
  if (digits.startsWith("2") && digits.length === 12) return digits;
  if (digits.startsWith("20")) return digits;
  
  // Default fallback if it's already structured correctly or unknown
  return digits;
}

/**
 * Validates if the phone number is roughly correct for WhatsApp (min 10 digits).
 */
export function isValidWhatsAppPhone(phone: string): boolean {
  const digits = normalizeWhatsAppPhone(phone);
  return digits.length >= 10 && digits.length <= 15;
}
