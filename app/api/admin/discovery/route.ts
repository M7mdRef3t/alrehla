import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const discoverySchema = z.object({
  id: z.string().optional(),
  title: z.string(),
  description: z.string().optional(),
  source: z.string().optional(),
  stage: z.string().optional(),
  priority: z.string().optional(),
  facts: z.array(z.string()).optional(),
  interpretations: z.array(z.string()).optional(),
  jira_issue_url: z.string().optional(),
  signal_source: z.string().optional(),
  funnel_stage: z.string().optional(),
  business_goal: z.string().optional(),
  confidence: z.number().optional(),
  evidence: z.string().optional(),
  hypothesis: z.string().optional(),
  risk: z.string().optional(),
  next_step: z.string().optional(),
  execution_link: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

function isAuthorized(req: NextRequest) {
  const secret = process.env.ADMIN_API_SECRET;
  const authHeader = req.headers.get("x-admin-secret");
  return authHeader === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized Access - Bypass Failed" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("discovery_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized Access - Bypass Failed" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validatedData = discoverySchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Discovery API Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation Error", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error", message: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}
