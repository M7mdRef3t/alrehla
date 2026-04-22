import { NextResponse } from "next/server";
import { verifyAppRouterAdmin } from "../../../../../server/admin/_shared";
import { validateEmailDomain } from "../../../../../src/lib/utils/emailValidator";

export const dynamic = "force-dynamic";

async function checkAuth(req: Request): Promise<boolean> {
  const secret = process.env.CRON_SECRET || process.env.MARKETING_DEBUG_KEY;
  const auth = req.headers.get("authorization");

  if (secret && auth === `Bearer ${secret}`) return true;

  return await verifyAppRouterAdmin(req);
}

/**
 * POST /api/admin/marketing-ops/validate-email
 * Validates a single email domain via DNS MX records.
 */
export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const email = body.email;

    if (!email) {
      return NextResponse.json({ ok: false, error: "missing_email" }, { status: 400 });
    }

    const { valid, reason, details } = await validateEmailDomain(email);

    return NextResponse.json({
      ok: true,
      valid,
      reason,
      details,
      domain: email.split("@").pop()
    });
  } catch (error: any) {
    console.error("[EmailValidatorAPI] Error:", error);
    return NextResponse.json({ ok: false, error: "validation_failed", details: error.message }, { status: 500 });
  }
}
