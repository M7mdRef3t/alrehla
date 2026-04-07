import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function buildAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

/**
 * GET /api/admin/email/templates
 * List all active email templates.
 */
export async function GET() {
  const supabase = buildAdmin();

  const { data, error } = await supabase
    .from("email_templates")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ templates: data || [] });
}

/**
 * POST /api/admin/email/templates
 * Create a new email template.
 * Body: { name, subject, html, preview_text?, category?, variables? }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, subject, html, preview_text, category, variables } = body;

  if (!name || !subject || !html) {
    return NextResponse.json({ error: "Missing required: name, subject, html" }, { status: 400 });
  }

  const supabase = buildAdmin();

  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      name,
      subject,
      html,
      preview_text: preview_text || null,
      category: category || "marketing",
      variables: variables || [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

/**
 * PATCH /api/admin/email/templates
 * Update an existing template.
 * Body: { id, ...fields }
 */
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing template id" }, { status: 400 });
  }

  const supabase = buildAdmin();

  const { data, error } = await supabase
    .from("email_templates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ template: data });
}

/**
 * DELETE /api/admin/email/templates
 * Soft-delete a template (set is_active = false).
 * Body: { id }
 */
export async function DELETE(req: NextRequest) {
  const body = await req.json();
  const { id } = body;

  if (!id) {
    return NextResponse.json({ error: "Missing template id" }, { status: 400 });
  }

  const supabase = buildAdmin();

  const { error } = await supabase
    .from("email_templates")
    .update({ is_active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
