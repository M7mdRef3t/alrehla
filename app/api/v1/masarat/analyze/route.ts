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

    if (!input || typeof input !== "string") {
      return NextResponse.json({ error: "Missing 'input' field in payload" }, { status: 400 });
    }

    console.log(`[MaaS Gateway] Processing request for platform: ${keyRecord.platform_name}`);

    let engineResponse: unknown;
    const startTime = Date.now();

    try {
      if (expectedOutput === "full_plan") {
        const analysis = quickAnalyze ? (quickAnalyze(input) as any) : null;
        const patterns = Array.isArray(analysis?.patterns) ? analysis.patterns : [];
        engineResponse = generateDynamicPlan
          ? generateDynamicPlan("العميل", ring as any, patterns, ["Generated via MaaS API"])
          : { status: "Feature missing in engine" };
      } else {
        engineResponse = quickAnalyze ? quickAnalyze(input) : { patterns: [] };
      }
    } catch (engineError) {
      console.error("[MaaS Gateway] Engine Core Error:", engineError);
      return NextResponse.json({ error: "Masarat Engine failed to process the request" }, { status: 500 });
    }

    const computeTimeMs = Date.now() - startTime;

    await supabaseAdmin.from("api_usage_logs").insert([{
      organization_id: keyRecord.organization_id,
      endpoint: "/api/v1/masarat/analyze",
      compute_time_ms: computeTimeMs,
      payload_size_bytes: JSON.stringify(body).length,
      status: "success"
    }]);

    return NextResponse.json({
      meta: {
        platform: "Masarat Engine (MaaS)",
        version: "1.0",
        compute_ms: computeTimeMs
      },
      data: engineResponse
    }, { status: 200 });
  } catch (err) {
    console.error("[MaaS Gateway] Fatal API Error:", err);
    return NextResponse.json({ error: "Internal Gateway Error" }, { status: 500 });
  }
}
