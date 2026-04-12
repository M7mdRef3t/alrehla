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

    if (action === "session_completed") {
      // TODO: Connect to Firebase Admin to update user's journey progress
      // Example logic structure:
      // const user = await getUserByPhone(phone);
      // if (user) {
      //   await updateUserDocument(user.uid, {
      //     last_session_date: new Date(),
      //     current_impact_score: impact_score,
      //     unlocked_milestone: recommended_stage
      //   });
      // }

      console.log(`[SessionOS Webhook] Successfully processed session completion for phone: ${phone}`);
      
      return NextResponse.json({ 
        success: true, 
        message: "User journey updated successfully based on SessionOS feedback." 
      }, { status: 200 });
    }

    return NextResponse.json({ success: true, message: "Webhook received, no action taken." }, { status: 200 });

  } catch (error) {
    console.error("[SessionOS Webhook] Unexpected error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
