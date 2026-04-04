import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.alrehla.app").replace(/\/$/, "");
  
  // Construct the target URL with all tracking parameters
  const targetUrl = `${appUrl}/onboarding?ref=${id}&utm_source=email&utm_medium=shortlink&utm_campaign=direct_access`;
  
  // Perform a 307 temporary redirect
  return NextResponse.redirect(targetUrl, 307);
}
