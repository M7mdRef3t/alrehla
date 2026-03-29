import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe activation is disabled. Use the manual activation flow inside the platform."
    },
    { status: 410 }
  );
}
