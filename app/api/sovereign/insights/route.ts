import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const response = await fetch("http://127.0.0.1:8000/insights/", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      console.error("[Sovereign API] Error fetching insights:", response.status, response.statusText);
      return NextResponse.json({ error: "Failed to fetch from Sovereign Backend" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error("[Sovereign API] Gateway Error:", err);
    return NextResponse.json({ error: "Internal Gateway Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const body = await request.json();

    const response = await fetch("http://127.0.0.1:8000/insights/", {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error("[Sovereign API] Error posting insight:", response.status, response.statusText);
      return NextResponse.json({ error: "Failed to post to Sovereign Backend" }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    console.error("[Sovereign API] Gateway Error (POST):", err);
    return NextResponse.json({ error: "Internal Gateway Error" }, { status: 500 });
  }
}
