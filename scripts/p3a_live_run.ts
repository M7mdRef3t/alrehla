import * as dotenv from "dotenv";
import pg from "pg";
import { POST } from "../app/api/chat/agent/route";

dotenv.config({ path: ".env.local" });

const DB_CONFIG = {
  host: "aws-1-eu-west-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.acvcnktpsbayowhurcmn",
  password: process.env.SUPABASE_DB_PASSWORD || "mm2JMw1iyQiP1l0O",
  ssl: { rejectUnauthorized: false }
};

type TelemetryRow = {
  created_at: string;
  llm_latency_ms: number;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  json_success: boolean;
  failure_reason: string | null;
};

async function fetchLatestRun(client: pg.Client, userId: string, startedAtIso: string): Promise<TelemetryRow | null> {
  const r = await client.query(
    `
    select created_at, llm_latency_ms, prompt_tokens, completion_tokens, total_tokens, json_success, failure_reason
    from public.ai_telemetry
    where feature = 'facilitator_chat'
      and user_id = $1::uuid
      and created_at >= $2::timestamptz
    order by created_at desc
    limit 1
    `,
    [userId, startedAtIso]
  );
  return (r.rows[0] as TelemetryRow) ?? null;
}

async function callAgent(userId: string) {
  const payload = {
    userId,
    debugTelemetryPrompt: true,
    messages: [
      { role: "user", content: "اعمل تحليل سريع للوضع الحالي ثم اقترح خطوة واحدة. IMPORTANT: return strict JSON only with keys action and reason. No markdown." }
    ],
    fullMap: { nodes: [{ id: "n1", label: "اختبار" }] },
    focusedNode: { id: "n1", label: "دائرة الاختبار" }
  };
  const req = new Request("http://localhost/api/chat/agent", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  const res = await POST(req);
  const json = await res.json();
  return { status: res.status, json };
}

async function seedDummyTelemetry(client: pg.Client, userId: string) {
  const rows = [
    ["dummy-fm-1", false, "format_mismatch", 1900],
    ["dummy-fm-2", false, "format_mismatch", 2100],
    ["dummy-hallucination", false, "hallucination", 1800],
    ["dummy-token-limit", false, "token_limit_exceeded", 2400],
    ["dummy-success", true, null, 1600]
  ];

  for (const [suffix, jsonSuccess, reason, latency] of rows) {
    await client.query(
      `
      insert into public.ai_telemetry (
        request_id, user_id, feature, agent_name, provider, model,
        llm_latency_ms, prompt_tokens, completion_tokens, total_tokens,
        estimated_cost_usd, json_success, failure_reason, metadata
      )
      values (
        $1, $2::uuid, 'facilitator_chat', 'p3a-live-seed', 'gemini', 'seed-model',
        $3::int, 400, 220, 620, 0.000500, $4::boolean, $5::text,
        jsonb_build_object('seed', true)
      )
      `,
      [`p3a-live-${suffix}-${Date.now()}`, userId, latency, jsonSuccess, reason]
    );
  }
}

async function main() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const userRes = await client.query(
      `
      select u.id
      from auth.users u
      left join public.ai_telemetry t on t.user_id = u.id
      group by u.id
      order by count(t.id) asc, u.created_at asc
      limit 1
      `
    );
    if (userRes.rowCount === 0) throw new Error("No users found");
    const userId = userRes.rows[0].id as string;

    const baselineStart = new Date().toISOString();
    const baselineCall = await callAgent(userId);
    const baselineRow = await fetchLatestRun(client, userId, baselineStart);

    await seedDummyTelemetry(client, userId);

    const injectedStart = new Date().toISOString();
    const injectedCall = await callAgent(userId);
    const injectedRow = await fetchLatestRun(client, userId, injectedStart);

    const report = {
      user_id: userId,
      baseline: {
        status: baselineCall.status,
        proposed_action_present: Boolean(baselineCall.json?.proposedAction),
        system_prompt: baselineCall.json?.__debug_system_prompt || null,
        telemetry_context: baselineCall.json?.__debug_telemetry_context || "",
        telemetry_row: baselineRow
      },
      seeded_dummy_telemetry: {
        count: 5,
        profile: "2x format_mismatch + hallucination + token_limit_exceeded + high latency"
      },
      injected: {
        status: injectedCall.status,
        proposed_action_present: Boolean(injectedCall.json?.proposedAction),
        system_prompt: injectedCall.json?.__debug_system_prompt || null,
        telemetry_context: injectedCall.json?.__debug_telemetry_context || "",
        telemetry_row: injectedRow
      }
    };

    console.log(JSON.stringify(report, null, 2));
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("P3A_LIVE_RUN_FAILED", err);
  process.exit(1);
});

