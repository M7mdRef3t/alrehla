import { NextResponse } from "next/server";
import { generateLeadSignature } from "../../../../../src/server/marketingLeadApi";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const leadId = url.searchParams.get("lead_id");
  const sig = url.searchParams.get("sig");

  if (!leadId || !sig) {
    return NextResponse.json({ ok: false, error: "missing_params" }, { status: 400 });
  }

  const expectedSig = generateLeadSignature(leadId);

  if (sig !== expectedSig) {
    return NextResponse.json({ ok: false, error: "invalid_signature" }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
