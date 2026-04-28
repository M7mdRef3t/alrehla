import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { requireAdmin } from "@/server/requireAdmin";

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

const discoveryUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  source: z.string().min(1).optional(),
  stage: z
    .enum([
      "Inbox",
      "Needs Evidence",
      "Validated",
      "Prioritized",
      "In Delivery",
      "Shipped",
      "Dropped",
    ])
    .optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  facts: z.array(z.string()).optional(),
  interpretations: z.array(z.string()).optional(),
  jira_issue_url: z.string().url().optional().or(z.literal("")).nullable(),
  signal_source: z.string().optional().nullable(),
  funnel_stage: z.string().optional().nullable(),
  business_goal: z.string().optional().nullable(),
  confidence: z.number().min(0).max(100).optional().nullable(),
  evidence: z.array(z.string()).optional(),
  hypothesis: z.string().optional().nullable(),
  risk: z.string().optional().nullable(),
  next_step: z.string().optional().nullable(),
  execution_link: z.string().url().optional().or(z.literal("")).nullable(),
  tags: z.array(z.string()).optional(),
});

// Remove custom isAuthorized as we now use requireAdmin

export async function GET(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

  try {
    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Discovery GET API Error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      message: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin(req);
  if (authError) return authError;

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

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    const { id, updates: rawUpdates } = body || {};

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Invalid or missing ID" },
        { status: 400 }
      );
    }

    if (!rawUpdates || typeof rawUpdates !== "object" || Array.isArray(rawUpdates)) {
      return NextResponse.json(
        { error: "Invalid or missing updates object" },
        { status: 400 }
      );
    }

    const result = discoveryUpdateSchema.safeParse(rawUpdates);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: result.error.issues },
        { status: 400 }
      );
    }

    const updates = result.data;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("discovery_items")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Discovery PATCH failed:", error);
      return NextResponse.json(
        { error: "Failed to update item", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("Discovery PATCH error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : String(error) }, 
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const id = req.nextUrl.searchParams.get("id");

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid id parameter" },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from("discovery_items")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Discovery DELETE failed:", error);
      return NextResponse.json(
        { error: "Failed to delete item", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Discovery DELETE error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
