import * as dotenv from "dotenv";
import pg from "pg";
import { spawn } from "node:child_process";

dotenv.config({ path: ".env.local" });

const DB_CONFIG = {
  host: "aws-1-eu-west-1.pooler.supabase.com",
  port: 6543,
  database: "postgres",
  user: "postgres.acvcnktpsbayowhurcmn",
  password: process.env.SUPABASE_DB_PASSWORD || "mm2JMw1iyQiP1l0O",
  ssl: { rejectUnauthorized: false }
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function scenarioDbKillAndRecovery() {
  const admin = new pg.Client(DB_CONFIG);
  await admin.connect();
  const worker = new pg.Client(DB_CONFIG);
  await worker.connect();
  worker.on("error", () => {
    // Expected during chaos phase when backend is terminated.
  });
  const killer = new pg.Client(DB_CONFIG);
  await killer.connect();

  const actionType = `chaos_p2_db_${Date.now()}`;
  const n = 25;

  try {
    const userRes = await admin.query("select id from auth.users limit 1");
    if (userRes.rowCount === 0) {
      throw new Error("No auth.users available for FK seeding.");
    }
    const userId = userRes.rows[0].id;

    await admin.query(
      `
      insert into public.awareness_events_queue (user_id, action_type, payload, status, retry_count, next_retry_at, created_at)
      select $1::uuid, $2::text, jsonb_build_object('chaos', true, 'i', g), 'pending', 0, now(), now()
      from generate_series(1, $3::int) g
      `,
      [userId, actionType, n]
    );

    await worker.query("begin");
    const pidRes = await worker.query("select pg_backend_pid() as pid");
    const workerPid = pidRes.rows[0].pid;

    const claimRes = await worker.query(
      "select id from public.claim_awareness_events_batch($1)",
      [n]
    );
    const claimedIds = claimRes.rows.map((r) => r.id);

    const outcomes = claimedIds.map((id: string) => ({ id, status: "completed" }));

    const applyPromise = worker
      .query(
        "select public.apply_awareness_event_results($1::jsonb) as result from pg_sleep(10)",
        [JSON.stringify(outcomes)]
      )
      .then((res) => ({ ok: true as const, res }))
      .catch((err) => ({ ok: false as const, err }));

    await sleep(1500);
    await killer.query("select pg_terminate_backend($1::int)", [workerPid]);

    const applyResult = await applyPromise;
    const killedDuringApply = !applyResult.ok;

    const afterKill = await admin.query(
      `
      select status, count(*)::int as c
      from public.awareness_events_queue
      where action_type = $1
      group by status
      order by status
      `,
      [actionType]
    );

    const recoveryWorker = new pg.Client(DB_CONFIG);
    await recoveryWorker.connect();
    await recoveryWorker.query("begin");
    const reclaim = await recoveryWorker.query(
      `
      with picked as (
        select q.id
        from public.awareness_events_queue q
        where q.action_type = $1
          and q.status in ('pending', 'failed')
          and q.next_retry_at <= now()
        order by q.created_at asc
        for update skip locked
        limit $2
      )
      update public.awareness_events_queue q
      set status = 'processing',
          processed_at = now()
      from picked
      where q.id = picked.id
      returning q.id
      `,
      [actionType, n]
    );
    const reclaimIds = reclaim.rows.map((r) => r.id);
    const recoveryOutcomes = reclaimIds.map((id: string) => ({ id, status: "completed" }));
    const applyRecovery = await recoveryWorker.query(
      "select public.apply_awareness_event_results($1::jsonb) as result",
      [JSON.stringify(recoveryOutcomes)]
    );
    await recoveryWorker.query("commit");
    await recoveryWorker.end();

    const final = await admin.query(
      `
      select status, count(*)::int as c
      from public.awareness_events_queue
      where action_type = $1
      group by status
      order by status
      `,
      [actionType]
    );

    return {
      actionType,
      seeded: n,
      claimed_before_kill: claimedIds.length,
      killed_during_apply: killedDuringApply,
      status_after_kill: afterKill.rows,
      reclaimed_after_recovery: reclaimIds.length,
      recovery_apply_result: applyRecovery.rows[0]?.result,
      final_status: final.rows
    };
  } finally {
    await admin.end();
    try { await worker.end(); } catch {}
    await killer.end();
  }
}

function runArchiveProcess(env: NodeJS.ProcessEnv) {
  const child = spawn("npx tsx scripts/archive_pioneer_resonance.ts", [], {
    shell: true,
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"]
  });

  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (d) => { stdout += d.toString(); });
  child.stderr.on("data", (d) => { stderr += d.toString(); });

  return {
    child,
    wait: () =>
      new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
        child.on("exit", (code) => resolve({ code, stdout, stderr }));
      })
  };
}

async function scenarioArchiveKillResume() {
  const client = new pg.Client(DB_CONFIG);
  await client.connect();
  try {
    const ev = await client.query(
      "select id from public.system_events where event_type='high_pressure' order by start_time desc limit 1"
    );
    if (ev.rowCount === 0) throw new Error("No high_pressure event available.");
    const eventId = ev.rows[0].id as string;

    const env = {
      ...process.env,
      ARCHIVE_CHUNK_SIZE: "1",
      ARCHIVE_RAM_LIMIT_MB: "1",
      ARCHIVE_SOFT_PAUSE_MS: "3000"
    };

    const firstRun = runArchiveProcess(env);
    let killed = false;
    let killAtChunk = 0;

    firstRun.child.stdout.on("data", (d) => {
      const line = d.toString();
      const m = line.match(/chunk\s+(\d+)\s+archived/i);
      if (m && !killed) {
        const chunkNo = Number(m[1]);
        if (chunkNo >= 2) {
          killAtChunk = chunkNo;
          firstRun.child.kill("SIGTERM");
          killed = true;
        }
      }
    });

    const firstExit = await firstRun.wait();

    const latestChunk = await client.query(
      `
      select payload
      from public.system_telemetry_logs
      where service_name='resonance-engine'
        and action='t_zero_impact_archive_chunk'
        and payload->>'event_id' = $1
      order by created_at desc
      limit 1
      `,
      [eventId]
    );
    const archiveRunId = latestChunk.rows[0]?.payload?.archive_run_id as string;
    const checkpointCursor = latestChunk.rows[0]?.payload?.cursor_last_id ?? null;

    const secondRun = runArchiveProcess(env);
    const secondExit = await secondRun.wait();

    const manifest = await client.query(
      `
      select payload
      from public.system_telemetry_logs
      where service_name='resonance-engine'
        and action='t_zero_impact_archive_manifest'
        and payload->>'archive_run_id' = $1
      order by created_at desc
      limit 1
      `,
      [archiveRunId]
    );

    const dupStats = await client.query(
      `
      with chunks as (
        select payload
        from public.system_telemetry_logs
        where service_name='resonance-engine'
          and action='t_zero_impact_archive_chunk'
          and payload->>'archive_run_id' = $1
      ),
      ids as (
        select elem->>'id' as pioneer_id
        from chunks, jsonb_array_elements(chunks.payload->'pioneers') elem
      )
      select
        count(*)::int as total_rows,
        count(distinct pioneer_id)::int as unique_rows,
        (count(*) - count(distinct pioneer_id))::int as duplicate_rows
      from ids
      `,
      [archiveRunId]
    );

    return {
      eventId,
      archive_run_id: archiveRunId,
      killed_mid_run: killed,
      kill_at_chunk: killAtChunk,
      checkpoint_cursor_after_kill: checkpointCursor,
      first_exit_code: firstExit.code,
      second_exit_code: secondExit.code,
      manifest_found: manifest.rowCount > 0,
      manifest_payload: manifest.rows[0]?.payload ?? null,
      duplicate_stats: dupStats.rows[0]
    };
  } finally {
    await client.end();
  }
}

async function main() {
  const startedAt = new Date().toISOString();
  const dbChaos = await scenarioDbKillAndRecovery();
  const archiveChaos = await scenarioArchiveKillResume();
  const report = {
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    db_connection_kill_recovery: dbChaos,
    archive_kill_resume_recovery: archiveChaos
  };
  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error("CHAOS_MONKEY_FAILED", err);
  process.exit(1);
});
