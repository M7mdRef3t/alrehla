import { NextRequest, NextResponse } from "next/server";
import handler from "../../../../server/gemini/stream";

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let statusCode = 200;
  let responseBody: unknown = null;
  let isStreaming = false;
  const chunks: string[] = [];

  const fakeReq = { method: "POST", body };
  const fakeRes = {
    statusCode,
    _status: 200,
    _headers: {} as Record<string, string>,
    status(code: number) {
      statusCode = code;
      return this;
    },
    json(payload: unknown) {
      responseBody = payload;
    },
    setHeader(name: string, value: string) {
      this._headers[name] = value;
      if (name === "Content-Type" && value.includes("text/plain")) {
        isStreaming = true;
      }
    },
    write(chunk: string) {
      chunks.push(chunk);
    },
    end(body?: string) {
      if (body) chunks.push(body);
    }
  };

  await handler(fakeReq, fakeRes);

  if (isStreaming || chunks.length > 0) {
    const fullText = chunks.join("");
    return new NextResponse(fullText, {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }

  return NextResponse.json(responseBody, { status: statusCode });
}
