/* eslint-disable @typescript-eslint/ban-ts-comment */
import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "../../../_lib/supabaseAdmin";
// @ts-ignore — external package may not be installed locally
import { quickAnalyze, generateDynamicPlan } from "@alrehla/masarat";

/**
 * MaaS Gateway: Masarat as a Service
 * POST /api/v1/masarat/analyze
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing or invalid Authorization header" }, { status: 401 });
    }

    const apiKey = authHeader.split("Bearer ")[1];
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: "System unconfigured" }, { status: 500 });
    }

    const { data: keyRecord, error: keyError } = await supabaseAdmin
      .from("api_keys")
      .select("platform_name, status, organization_id")
      .eq("key", apiKey)
      .single();

    if (keyError || !keyRecord || keyRecord.status !== "active") {
      console.warn(`[MaaS Gateway] Unauthorized access attempt with key: ${apiKey.substring(0, 5)}...`);
      return NextResponse.json({ error: "Unauthorized API Key" }, { status: 401 });
    }

    const body = await request.json();
    const { input, ring = "red", expectedOutput = "quick" } = body;

    // 1. Precise Input Validation
    if (!input || typeof input !== "string" || input.trim().length < 5) {
      return NextResponse.json({ 
        error: "Invalid payload", 
        detail: "Input must be a string of at least 5 characters" 
      }, { status: 400 });
    }

    console.log(`[MaaS Gateway] Processing [${expectedOutput}] for platform: ${keyRecord.platform_name}`);

    let engineResponse: any = null;
    let engineRaw: any = null;
    const startTime = Date.now();

    // 2. Controlled Execution Loop
    try {
      if (expectedOutput === "full_plan") {
        const analysis = quickAnalyze ? (quickAnalyze(input) as any) : null;
        engineRaw = analysis;
        const patterns = Array.isArray(analysis?.patterns) ? analysis.patterns : [];
        
        if (generateDynamicPlan) {
          engineResponse = generateDynamicPlan("العميل", ring as any, patterns, ["Generated via MaaS API"]);
        } else {
          engineResponse = { status: "Maintenance", detail: "Dynamic planning module currently unavailable" };
        }
      } else {
        engineResponse = quickAnalyze ? quickAnalyze(input) : { patterns: [], error: "Engine logic missing" };
        engineRaw = engineResponse;
      }
    } catch (engineError: any) {
      console.error("[MaaS Gateway] Engine Core Crash:", engineError);
      
      // Attempt legacy fallback or return structured error
      return NextResponse.json({ 
        error: "Engine Failure", 
        message: "Masarat Engine failed to process the request",
        timestamp: new Date().toISOString()
      }, { status: 500 });
    }

    const computeTimeMs = Date.now() - startTime;

    // 3. Telemetry Persistence
    try {
      await supabaseAdmin.from("api_usage_logs").insert([{
        organization_id: keyRecord.organization_id,
        endpoint: "/api/v1/masarat/analyze",
        compute_time_ms: computeTimeMs,
        payload_size_bytes: JSON.stringify(body).length,
        status: "success",
        metadata: { expectedOutput, ring }
      }]);
    } catch (logError) {
      console.error("[MaaS Gateway] Non-blocking logging failure:", logError);
    }

    return NextResponse.json({
      meta: {
        platform: "Masarat Engine (MaaS)",
        version: "1.1", // Bumped version for hardening
        compute_ms: computeTimeMs,
        platform_name: keyRecord.platform_name
      },
      data: engineResponse,
      engine_raw: process.env.NODE_ENV === "development" ? engineRaw : undefined
    }, { status: 200 });
  } catch (err: any) {
    console.error("[MaaS Gateway] Fatal API Hub Error:", err);
    return NextResponse.json({ error: "Internal Gateway Error", id: "FATAL_GW_001" }, { status: 500 });
  }
}
