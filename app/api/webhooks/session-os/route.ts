import { NextResponse } from 'next/server';

/**
 * POST /api/webhooks/session-os
 * 
 * Receives feedback and updates from SessionOS when a session completes.
 * Expected payload:
 * {
 *   "phone": "+201...",
 *   "action": "session_completed",
 *   "impact_score": 8,
 *   "recommended_stage": "Stage 2" (Optional)
 * }
 */
export async function POST(request: Request) {
  try {
    // 1. Verify Secret to ensure request is genuinely from SessionOS
    const authHeader = request.headers.get("authorization");
    const secret = process.env.SESSION_OS_API_SECRET || "sos_secret_prod_2026"; // Fallback to matched prod secret
    
    if (!secret || authHeader !== `Bearer ${secret}`) {
      console.error("[SessionOS Webhook] Unauthorized request attempt.");
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    console.log("[SessionOS Webhook] Received payload:", payload);

    const { phone, action, impact_score, recommended_stage } = payload;

    if (!phone) {
      return NextResponse.json({ success: false, error: "Missing 'phone' in payload" }, { status: 400 });
    }

    if (action === "session_completed" || action === "intake_submitted") {
      const { supabaseAdmin } = await import("@/services/supabaseClient");
      
      if (supabaseAdmin) {
        // 1. Sanitize Phone to match format in DB
        let normalizedPhone = phone.replace(/[^\d+]/g, '');
        if (!normalizedPhone.startsWith('+')) {
          normalizedPhone = '+' + normalizedPhone; // Basic fallback
        }

        // 2. Find matching lead or user profile
        const { data: lead } = await supabaseAdmin
          .from("marketing_leads")
          .select("lead_id, note")
          .eq("phone_normalized", normalizedPhone)
          .maybeSingle();

        if (lead) {
          // 3. Update their journey/CRM status
          const updatedNote = `[SessionOS] ${action} (Impact: ${impact_score}/10) - Stage: ${recommended_stage || 'Unknown'}\n${lead.note || ''}`;
          
          await supabaseAdmin
            .from("marketing_leads")
            .update({ 
              status: "engaged", 
              intent: action === "intake_submitted" ? "session_requested" : "session_completed",
              note: updatedNote,
              updated_at: new Date().toISOString()
            })
            .eq("lead_id", lead.lead_id);
            
          console.log(`[SessionOS Webhook] Successfully updated Supabase marketing_lead for: ${normalizedPhone}`);
        } else {
           console.log(`[SessionOS Webhook] Phone ${normalizedPhone} not found in leads, cannot update DB.`);
        }
      } else {
        console.warn("[SessionOS Webhook] Supabase Admin client not available.");
      }
      
      return NextResponse.json({ 
        success: true, 
        message: "User journey and CRM updated successfully based on SessionOS feedback." 
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: "Webhook received, no action taken." }, { status: 200 });

  } catch (error) {
    console.error("[SessionOS Webhook] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
