import { NextRequest, NextResponse } from "next/server";

/**
 * requireAdmin — guards admin-only API routes.
 *
 * Checks for ADMIN_CODE in:
 *   1. Authorization header: "Bearer <code>"
 *   2. x-admin-code header
 *
 * Returns null if authorized, or a 401 NextResponse if not.
 *
 * Usage:
 *   const denied = requireAdmin(req);
 *   if (denied) return denied;
 */
export function requireAdmin(req: NextRequest | Request): NextResponse | null {
  const adminCode = process.env.ADMIN_CODE;

  if (!adminCode) {
    // Misconfigured server — fail closed
    return NextResponse.json(
      { error: "Server misconfiguration: ADMIN_CODE not set" },
      { status: 500 }
    );
  }

  const authHeader =
    (req.headers.get("authorization") ?? "") ||
    (req.headers.get("x-admin-code") ?? "");

  const provided = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : authHeader.trim();

  if (!provided || provided !== adminCode) {
    console.warn(
      "[requireAdmin] Unauthorized access attempt to:",
      req instanceof NextRequest ? req.nextUrl.pathname : req.url
    );
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null; // authorized
}
