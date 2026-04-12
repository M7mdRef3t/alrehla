/**
 * Domain: Sessions — Intake Service
 * 
 * Server-side. Handles intake form submission,
 * client upsert, and triage creation.
 */

import { supabaseAdmin } from "@/infrastructure/database";
import { extractAiSessionBrief } from "./brief.service";
import type { IntakeFormData, SessionRequestStatus } from "../types";

export interface IntakeResult {
  success: boolean;
  requestId?: string;
  clientId?: string;
  nextStatus: SessionRequestStatus;
  error?: string;
}

/**
 * Process a complete intake submission.
 * 1. Upsert client
 * 2. Create session request
 * 3. Save triage answers
 * 4. Auto-generate AI brief (if not crisis)
 */
export async function processIntake(data: IntakeFormData): Promise<IntakeResult> {
  if (!supabaseAdmin) {
    return { success: false, nextStatus: "prep_pending", error: "Database not available" };
  }

  // 1. Upsert Client
  let clientId: string;
  const { data: existingClient } = await supabaseAdmin
    .from("dawayir_clients")
    .select("id")
    .eq("phone", data.phone)
    .maybeSingle();

  if (existingClient) {
    clientId = existingClient.id;
  } else {
    const { data: newClient, error: clientErr } = await supabaseAdmin
      .from("dawayir_clients")
      .insert({
        name: data.name,
        phone: data.phone,
        email: data.email,
        country: data.country,
        age_range: data.ageRange,
        preferred_contact: data.preferredContact,
      })
      .select("id")
      .single();

    if (clientErr) throw clientErr;
    clientId = newClient.id;
  }

  // 2. Create Session Request
  const triageStatus: SessionRequestStatus = data.crisisFlag
    ? "needs_manual_review"
    : "prep_pending";

  const { data: newRequest, error: reqErr } = await supabaseAdmin
    .from("dawayir_session_requests")
    .insert({
      client_id: clientId,
      status: triageStatus,
      request_reason: data.requestReason,
      urgency_reason: data.urgencyReason,
      biggest_challenge: data.biggestChallenge,
      previous_sessions: data.previousSessions,
      specific_person_or_situation: data.specificPersonOrSituation,
      impact_score: data.impactScore,
      duration_of_problem: data.durationOfProblem,
    })
    .select("id")
    .single();

  if (reqErr) throw reqErr;

  // 3. Triage Answers
  await supabaseAdmin.from("dawayir_triage_answers").insert({
    request_id: newRequest.id,
    safety_crisis_flag: data.crisisFlag,
    session_goal_type: data.sessionGoalType,
    urgency_score: data.crisisFlag ? 10 : 5,
  });

  // 4. Auto AI Brief (non-crisis only)
  let finalStatus: SessionRequestStatus = triageStatus;
  if (!data.crisisFlag) {
    try {
      const aiBrief = await extractAiSessionBrief({
        intake: {
          requestReason: data.requestReason,
          urgencyReason: data.urgencyReason,
          biggestChallenge: data.biggestChallenge || "",
          durationOfProblem: data.durationOfProblem || "",
          sessionGoalType: data.sessionGoalType || "",
        },
      });

      await supabaseAdmin.from("dawayir_ai_session_briefs").upsert({
        request_id: newRequest.id,
        ...aiBrief,
      });

      await supabaseAdmin
        .from("dawayir_session_requests")
        .update({ status: "brief_generated" })
        .eq("id", newRequest.id);

      finalStatus = "brief_generated";
    } catch (e) {
      console.error("[Sessions] Failed to generate AI Brief:", e);
      // Non-blocking — intake is still saved
    }
  }

  return {
    success: true,
    requestId: newRequest.id,
    clientId,
    nextStatus: finalStatus,
  };
}
