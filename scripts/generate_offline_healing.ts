import * as dotenv from "dotenv";
import pg from "pg";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config({ path: ".env.local" });

const DB_CONFIG = {
  host: process.env.SUPABASE_DB_HOST || "aws-1-eu-west-1.pooler.supabase.com",
  port: Number(process.env.SUPABASE_DB_PORT || 6543),
  database: process.env.SUPABASE_DB_NAME || "postgres",
  user: process.env.SUPABASE_DB_USER || "postgres.acvcnktpsbayowhurcmn",
  password: process.env.SUPABASE_DB_PASSWORD || "mm2JMw1iyQiP1l0O",
  ssl: { rejectUnauthorized: false }
};

type Candidate = {
  user_id: string;
  s1: number | null;
  s2: number | null;
  s3: number | null;
  s4: number | null;
  latest_at: string | null;
  trigger_reason: string;
};

type CliOptions = {
  dryRun: boolean;
  limit: number;
  dropThreshold: number;
  dummy: boolean;
};

const SYSTEM_PROMPT = `You are "Sovereignty Oracle".
The user is currently offline, but their Phoenix score trend indicates decline.
Write a very short intervention message in Arabic (max 2 sentences):
- warm but sharp
- zero fluff
- must remind them that Dawayir analyzed their pain while they were away
- do not ask questions
Return strict JSON only: {"message":"string"}`;

function parseOptions(argv: string[]): CliOptions {
  const has = (flag: string) => argv.includes(flag);
  const get = (prefix: string) => {
    const raw = argv.find((a) => a.startsWith(prefix));
    return raw ? raw.slice(prefix.length) : null;
  };

  return {
    dryRun: has("--dry-run"),
    dummy: has("--dummy"),
    limit: Number(get("--limit=") || 25),
    dropThreshold: Number(get("--drop-threshold=") || 15)
  };
}

async function fetchCandidates(client: pg.Client, dropThreshold: number, limit: number): Promise<Candidate[]> {
  const q = await client.query(
    `
    WITH ranked AS (
      SELECT
        user_id,
        phoenix_score,
        recorded_at,
        row_number() OVER (PARTITION BY user_id ORDER BY recorded_at DESC) AS rn
      FROM public.phoenix_score_history
    ),
    pivoted AS (
      SELECT
        user_id,
        max(phoenix_score) FILTER (WHERE rn = 1) AS s1,
        max(phoenix_score) FILTER (WHERE rn = 2) AS s2,
        max(phoenix_score) FILTER (WHERE rn = 3) AS s3,
        max(phoenix_score) FILTER (WHERE rn = 4) AS s4,
        max(recorded_at) FILTER (WHERE rn = 1) AS latest_at
      FROM ranked
      GROUP BY user_id
    )
    SELECT
      p.user_id::text AS user_id,
      p.s1,
      p.s2,
      p.s3,
      p.s4,
      p.latest_at::text,
      CASE
        WHEN p.s2 IS NOT NULL AND (p.s2 - p.s1) >= $1::float
          THEN format('Score drop by %s%% (%.2f -> %.2f)', to_char((p.s2 - p.s1), 'FM999990D00'), p.s2, p.s1)
        WHEN p.s4 IS NOT NULL AND p.s4 > p.s3 AND p.s3 > p.s2 AND p.s2 > p.s1
          THEN format('3 consecutive drops (%.2f -> %.2f -> %.2f -> %.2f)', p.s4, p.s3, p.s2, p.s1)
      END AS trigger_reason
    FROM pivoted p
    WHERE
      (p.s2 IS NOT NULL AND (p.s2 - p.s1) >= $1::float)
      OR
      (p.s4 IS NOT NULL AND p.s4 > p.s3 AND p.s3 > p.s2 AND p.s2 > p.s1)
    ORDER BY p.latest_at DESC
    LIMIT $2::int
    `,
    [dropThreshold, limit]
  );

  return q.rows as Candidate[];
}

async function buildDummyCandidate(client: pg.Client): Promise<Candidate> {
  const userQ = await client.query("select id::text from auth.users order by created_at asc limit 1");
  if (userQ.rowCount === 0) {
    throw new Error("No users found for dummy run.");
  }
  return {
    user_id: userQ.rows[0].id as string,
    s1: 52,
    s2: 63,
    s3: 71,
    s4: 78,
    latest_at: new Date().toISOString(),
    trigger_reason: "3 consecutive drops (78.00 -> 71.00 -> 63.00 -> 52.00)"
  };
}

async function generateMessage(genAI: GoogleGenerativeAI, candidate: Candidate) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.4,
      maxOutputTokens: 3000
    }
  });

  const userPrompt = [
    `user_id: ${candidate.user_id}`,
    `trigger_reason: ${candidate.trigger_reason}`,
    `latest_scores: [${candidate.s4}, ${candidate.s3}, ${candidate.s2}, ${candidate.s1}]`,
    "Write the intervention now."
  ].join("\n");

  const t0 = Date.now();
  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\n${userPrompt}`
  );
  const latencyMs = Date.now() - t0;
  const rawText = result.response.text();

  let message = rawText.trim();
  try {
    const parsed = JSON.parse(rawText);
    const fromJson =
      (typeof parsed?.message === "string" && parsed.message) ||
      (typeof parsed?.intervention === "string" && parsed.intervention) ||
      (typeof parsed?.text === "string" && parsed.text) ||
      "";
    if (fromJson.trim().length > 0) {
      message = fromJson.trim();
    }
  } catch {
    // Fallback to raw text.
  }

  if (!message || message.length < 24) {
    const fallbackModel = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 180
      }
    });
    const retry = await fallbackModel.generateContent(
      `اكتب رسالة تدخل قصيرة جدا للمستخدم (جملتين كحد اقصى)، دافئة لكن حادة، بدون سؤال، وبحد أدنى 70 حرف.\nالسبب: ${candidate.trigger_reason}`
    );
    message = retry.response.text().trim();
  }

  return { message, latencyMs };
}

async function persistIntervention(
  client: pg.Client,
  candidate: Candidate,
  message: string,
  latencyMs: number,
  dryRun: boolean
) {
  if (dryRun) return { inserted: false, id: null as string | null };

  const ins = await client.query(
    `
    INSERT INTO public.pending_interventions (
      user_id,
      ai_message,
      trigger_reason,
      status,
      metadata
    )
    VALUES (
      $1::uuid,
      $2::text,
      $3::text,
      'unread',
      jsonb_build_object(
        'model', 'gemini-2.5-pro',
        'llm_latency_ms', $4::int,
        'generated_at', now()
      )
    )
    ON CONFLICT (user_id, trigger_reason)
      WHERE status = 'unread'
    DO UPDATE SET
      ai_message = EXCLUDED.ai_message,
      created_at = now(),
      metadata = EXCLUDED.metadata
    RETURNING id::text
    `,
    [candidate.user_id, message, candidate.trigger_reason, latencyMs]
  );

  return {
    inserted: true,
    id: (ins.rows[0]?.id as string) || null
  };
}

async function main() {
  const options = parseOptions(process.argv.slice(2));
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    throw new Error("Missing GEMINI_API_KEY");
  }

  const genAI = new GoogleGenerativeAI(geminiApiKey);
  const client = new pg.Client(DB_CONFIG);
  await client.connect();

  const startedAt = Date.now();
  try {
    const candidates = options.dummy
      ? [await buildDummyCandidate(client)]
      : await fetchCandidates(client, options.dropThreshold, options.limit);

    const report: Array<Record<string, unknown>> = [];

    for (const candidate of candidates) {
      const { message, latencyMs } = await generateMessage(genAI, candidate);
      const saved = await persistIntervention(client, candidate, message, latencyMs, options.dryRun);

      report.push({
        user_id: candidate.user_id,
        trigger_reason: candidate.trigger_reason,
        llm_latency_ms: latencyMs,
        ai_message: message,
        persisted: saved.inserted,
        intervention_id: saved.id
      });
    }

    console.log(
      JSON.stringify(
        {
          mode: options.dryRun ? "dry-run" : "write",
          dummy: options.dummy,
          candidates: candidates.length,
          total_runtime_ms: Date.now() - startedAt,
          results: report
        },
        null,
        2
      )
    );
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("OFFLINE_HEALING_FAILED", err);
  process.exit(1);
});
