import { NextRequest, NextResponse } from "next/server";
import handler from "../../../../server/gemini/generate";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let statusCode = 200;
  let responseBody: unknown = null;

  const fakeReq = { method: "POST", body };
  const fakeRes = {
    _status: 200,
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      responseBody = payload;
    }
  };

  await handler(fakeReq, fakeRes);

  return NextResponse.json(responseBody, { status: statusCode });
}
