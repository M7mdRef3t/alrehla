import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // Mock data for the Cognitive Influence Map
  // In a real implementation, this would aggregate data from tracking_events or similar tables.
  const { searchParams } = new URL(request.url);
  const compare = searchParams.get("compare") === "true";

  const nodes = [
    { id: "1", label: "المركز", type: "state" },
    { id: "2", label: "طلعت", type: "circle" },
    { id: "3", label: "ياسمين", type: "circle" },
    { id: "4", label: "أحمد", type: "circle" },
    { id: "5", label: "سارة", type: "circle" },
  ];

  const edges = [
    { source: "2", target: "1", strength: 0.8, confidence: 0.9, drift: compare ? 0.2 : 0 },
    { source: "3", target: "1", strength: -0.5, confidence: 0.8, drift: compare ? -0.1 : 0 },
    { source: "4", target: "1", strength: 0.3, confidence: 0.6, drift: compare ? 0.05 : 0 },
    { source: "5", target: "1", strength: -0.7, confidence: 0.85, drift: compare ? -0.3 : 0 },
  ];

  return NextResponse.json({ nodes, edges });
}
