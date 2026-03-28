import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe webhooks are disabled. The project now uses manual payment activation only."
    },
    { status: 410 }
  );
}
