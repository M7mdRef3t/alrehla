import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe billing portal is disabled. Use /checkout for manual payment support."
    },
    { status: 410 }
  );
}
