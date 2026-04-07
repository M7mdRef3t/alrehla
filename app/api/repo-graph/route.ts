import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const GRAPH_PATH = path.join(process.cwd(), "output", "repo-graph", "graph.json");

export async function GET() {
  if (!fs.existsSync(GRAPH_PATH)) {
    // Return empty graph instead of 404 to avoid console spam
    return NextResponse.json(
      {
        generatedAt: new Date().toISOString(),
        stats: { scannedFiles: 0, nodeCount: 0, edgeCount: 0 },
        nodes: [],
        edges: [],
      },
      { status: 200 }
    );
  }

  try {
    const content = fs.readFileSync(GRAPH_PATH, "utf8");
    return new NextResponse(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to read repo graph.", detail: String(error) },
      { status: 500 }
    );
  }
}
