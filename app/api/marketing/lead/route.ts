import { handleMarketingLeadGet, handleMarketingLeadPost } from "../../../../src/server/marketingLeadApi";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://web.whatsapp.com",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, x-marketing-debug-key",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  const response = await handleMarketingLeadGet(req);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export async function POST(req: Request) {
  const response = await handleMarketingLeadPost(req);
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

