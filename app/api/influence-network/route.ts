import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type InfluenceNetworkResponse = {
  nodes: Array<{
    id: string;
    label: string;
    type: "circle" | "state";
  }>;
  edges: Array<{
    source: string;
    target: string;
    strength: number;
    confidence: number;
    currentStrength?: number;
    drift?: number;
  }>;
};

export async function GET() {
  const body: InfluenceNetworkResponse = {
    nodes: [],
    edges: [],
  };

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
