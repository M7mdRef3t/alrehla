import { NextRequest, NextResponse } from "next/server";
import handler from "../../../../server/routing/next-step-v2";

/**
 * POST /api/routing/next-step-v2
 * Wraps the server-side routing handler for Next.js App Router
 */
export async function POST(req: NextRequest) {
  let parsedBody: unknown = null;
  try {
    parsedBody = await req.json();
  } catch {
    parsedBody = {};
  }

  let statusCode = 200;
  let responseBody: unknown = null;

  const fakeReq = {
    method: "POST",
    body: parsedBody as { candidates?: unknown } | undefined
  };

  const fakeRes = {
    status(code: number) {
      statusCode = code;
      return fakeRes;
    },
    json(body: unknown) {
      responseBody = body;
    }
  };

  await handler(fakeReq, fakeRes);

  return NextResponse.json(responseBody, { status: statusCode });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
