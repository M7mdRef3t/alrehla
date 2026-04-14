<<<<<<< HEAD
=======
/* eslint-disable @typescript-eslint/no-explicit-any */
>>>>>>> feat/sovereign-final-stabilization
import dns from "node:dns/promises";

/**
 * Validates an email address using DNS MX record lookup.
 * Returns true if the domain has a valid MX record.
 */
export async function validateEmailDomain(email: string): Promise<{
  valid: boolean;
  reason?: "invalid_format" | "no_mx_records" | "domain_not_found" | "timeout" | "unexpected_error";
  details?: string;
}> {
  if (!email || !email.includes("@")) {
    return { valid: false, reason: "invalid_format" };
  }

  const domain = email.split("@").pop();
  if (!domain) {
    return { valid: false, reason: "invalid_format" };
  }

  try {
    // Resolve MX records with a timeout
    const mxRecords = await dns.resolveMx(domain);

    if (!mxRecords || mxRecords.length === 0) {
      return { valid: false, reason: "no_mx_records" };
    }

    // Sort by priority and check if at least one exchange exists
    const hasExchange = mxRecords.some(record => record.exchange && record.exchange.length > 0);
    
    if (!hasExchange) {
      return { valid: false, reason: "no_mx_records" };
    }

    return { valid: true };
  } catch (error: any) {
    if (error.code === "ENOTFOUND" || error.code === "ENODATA") {
      return { valid: false, reason: "domain_not_found" };
    }
    if (error.code === "ETIMEOUT") {
      return { valid: false, reason: "timeout" };
    }
    return { valid: false, reason: "unexpected_error", details: error.message };
  }
}
