/**
 * Stub: requireAuth
 * Placeholder authentication guard for API routes.
 * Returns a user-like object or a 401 NextResponse.
 */

import { NextRequest, NextResponse } from "next/server";

export async function requireAuth(req: NextRequest) {
  // Check for Authorization header
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Placeholder: return a minimal user object
  // In production, validate the JWT and extract user info
  return { id: "stub-user", user_id: "stub-user" };
}
