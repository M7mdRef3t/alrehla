import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

const GRAPH_PATH = path.join(process.cwd(), "output", "repo-graph", "graph.json");

export async function GET() {
  if (!fs.existsSync(GRAPH_PATH)) {
    return NextResponse.json({ error: "Repo graph not generated yet." }, { status: 404 });
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
