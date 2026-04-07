import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../_lib/supabaseAdmin";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { status, score, issues } = body;

    if (!status || !issues) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // Basic authorization check - only allow local or authenticated requests if possible.
    // Since autoHealthCheck runs client-side, we should protect this route.
    // Wait, the client doesn't have an admin token. We can check the origin or referer,
    // but the best way is to use a secret key or rate limit it.
    // For now, let's add a simple check for an internal header or just use Supabase auth.
    // Actually, autoHealthCheck runs periodically, and the user might be unauthenticated.
    // The most secure approach for an unauthenticated client endpoint is strict rate limiting and origin checking.
    // Let's implement origin validation to prevent trivial CSRF / external abuse.

    const origin = req.headers.get("origin") || req.headers.get("referer") || "";
    if (origin && !origin.includes("dawayir.com") && !origin.includes("localhost") && !origin.includes("alrehla")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      console.error("Supabase admin client not configured for health alert");
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 });
    }

    const issuesHtml = issues
      .map((i: Record<string, unknown>) => {
        // Sanitize html inputs
        const category = String(i.category || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const description = String(i.description || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        const severity = String(i.severity || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        return `<li><strong>${category}</strong>: ${description} (${severity})</li>`;
      })
      .join("");

    const htmlContent = `
      <h2>🚨 CRITICAL HEALTH ISSUE DETECTED 🚨</h2>
      <p><strong>Status:</strong> ${status.toUpperCase()}</p>
      <p><strong>Score:</strong> ${score}/100</p>
      <h3>Issues:</h3>
      <ul>
        ${issuesHtml}
      </ul>
      <p><small>Sent via Auto Health Check System</small></p>
    `;

    // Retrieve admin email from environment or fallback
    const adminEmail = process.env.ADMIN_EMAIL || "admin@dawayir.com";

    // Use Supabase edge function to send email as per memory guidelines
    const { error: invokeError } = await supabaseAdmin.functions.invoke("send-email", {
      body: {
        to: adminEmail,
        subject: `[CRITICAL] System Health Alert - Score: ${score}`,
        html: htmlContent,
      },
    });

    if (invokeError) {
      console.error("Failed to invoke send-email edge function:", invokeError);
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in health-alert route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
