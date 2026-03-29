import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Stripe billing portal is disabled. Use the manual activation flow inside the platform."
    },
    { status: 410 }
  );
}
