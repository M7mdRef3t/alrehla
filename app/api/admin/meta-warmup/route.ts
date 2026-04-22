import { NextResponse } from "next/server";
import { metaLeadsService } from "../../../../src/services/metaLeadsService";
import { verifyAppRouterAdmin } from "../../../../server/admin/_shared";

export const dynamic = "force-dynamic";

async function checkAuth(req: Request): Promise<boolean> {
  const secret = process.env.ADMIN_API_SECRET;
  const auth = req.headers.get("authorization");

  // 1. Secret Auth
  if (secret && auth === `Bearer ${secret}`) return true;

  // 2. Admin Session Auth
  return await verifyAppRouterAdmin(req);
}

export async function POST(req: Request) {
  if (!(await checkAuth(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    console.log("[MetaWarmup] Starting manual API warm-up...");
    const result = await metaLeadsService.warmUpMetaApi();
    
    if (result.success) {
      return NextResponse.json({ ok: true, results: result.results });
    } else {
      return NextResponse.json({ ok: false, error: result.error }, { status: 500 });
    }
  } catch (error: any) {
    console.error("[MetaWarmup] Exception during warm-up:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
