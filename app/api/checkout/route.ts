import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe checkout is disabled. Use the manual activation flow at /checkout."
    },
    { status: 410 }
  );
}
