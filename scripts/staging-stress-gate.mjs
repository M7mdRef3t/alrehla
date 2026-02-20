import { Client } from "pg";

const databaseUrl =
  process.env.STAGING_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "";

if (!databaseUrl) {
  console.error("Missing STAGING_DATABASE_URL or DATABASE_URL.");
  process.exit(2);
}

const usersCount = Number.parseInt(process.env.STRESS_USERS_COUNT ?? "200000", 10);
const eventsCount = Number.parseInt(process.env.STRESS_EVENTS_COUNT ?? "2000000", 10);
const maxP95Ms = Number.parseFloat(process.env.STRESS_MAX_P95_MS ?? "350");
const maxAvgMs = Number.parseFloat(process.env.STRESS_MAX_AVG_MS ?? "220");
const minRows = Number.parseInt(process.env.STRESS_EXPECT_MIN_ROWS ?? String(eventsCount), 10);

if (!Number.isFinite(usersCount) || !Number.isFinite(eventsCount) || usersCount <= 0 || eventsCount <= 0) {
  console.error("Invalid stress counts.");
  process.exit(2);
}

const client = new Client({
  connectionString: databaseUrl
});

function msSince(start) {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

async function ensureSchema() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS stress_users (
      id BIGINT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      score INT NOT NULL DEFAULT 0
    );
  `);

  await client.query(`
    CREATE TABLE IF NOT EXISTS stress_events (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL REFERENCES stress_users(id),
      event_type TEXT NOT NULL,
      load_value INT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    );
  `);

  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_stress_events_user_time
      ON stress_events (user_id, created_at DESC);
  `);
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_stress_events_type_time
      ON stress_events (event_type, created_at DESC);
  `);
}

async function seedUsers() {
  const start = process.hrtime.bigint();
  await client.query(
    `
    INSERT INTO stress_users (id, created_at, score)
    SELECT g, NOW() - ((g % 86400) || ' seconds')::interval, (g % 100)
    FROM generate_series(1, $1) AS g
    ON CONFLICT (id) DO NOTHING;
    `,
    [usersCount]
  );
  return msSince(start);
}

async function seedEvents() {
  const start = process.hrtime.bigint();
  await client.query(
    `
    INSERT INTO stress_events (user_id, event_type, load_value, created_at)
    SELECT
      1 + ((g - 1) % $1),
      CASE
        WHEN g % 5 = 0 THEN 'heavy'
        WHEN g % 3 = 0 THEN 'normal'
        ELSE 'light'
      END,
      (g % 100),
      NOW() - ((g % 604800) || ' seconds')::interval
    FROM generate_series(1, $2) AS g;
    `,
    [usersCount, eventsCount]
  );
  return msSince(start);
}

async function analyze() {
  const start = process.hrtime.bigint();
  await client.query("ANALYZE stress_users;");
  await client.query("ANALYZE stress_events;");
  return msSince(start);
}

async function runBenchmarks() {
  const sql = `
    WITH recent AS (
      SELECT user_id, event_type, load_value, created_at
      FROM stress_events
      WHERE created_at >= NOW() - interval '7 days'
    ),
    ranked AS (
      SELECT
        user_id,
        COUNT(*) AS total_events,
        AVG(load_value)::numeric(10,2) AS avg_load
      FROM recent
      GROUP BY user_id
      ORDER BY total_events DESC
      LIMIT 5000
    )
    SELECT
      r.user_id,
      r.total_events,
      r.avg_load,
      MAX(e.created_at) AS last_event_at
    FROM ranked r
    JOIN recent e ON e.user_id = r.user_id
    GROUP BY r.user_id, r.total_events, r.avg_load
    ORDER BY r.total_events DESC, r.avg_load DESC
    LIMIT 500;
  `;

  const runs = [];
  for (let i = 0; i < 7; i += 1) {
    const t = process.hrtime.bigint();
    const result = await client.query(sql);
    const elapsed = msSince(t);
    runs.push({ elapsed, rows: result.rowCount ?? 0 });
  }

  const latencies = runs.map((r) => r.elapsed).sort((a, b) => a - b);
  const avg = latencies.reduce((sum, n) => sum + n, 0) / latencies.length;
  const p95Index = Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1);
  const p95 = latencies[p95Index];
  const minRowsSeen = Math.min(...runs.map((r) => r.rows));

  return { runs, avg, p95, minRowsSeen };
}

async function main() {
  await client.connect();
  try {
    console.log("[stress-gate] Preparing schema...");
    await ensureSchema();

    const { rows: usersRows } = await client.query("SELECT COUNT(*)::bigint AS c FROM stress_users;");
    const { rows: eventsRows } = await client.query("SELECT COUNT(*)::bigint AS c FROM stress_events;");
    const existingUsers = Number(usersRows[0]?.c ?? 0);
    const existingEvents = Number(eventsRows[0]?.c ?? 0);

    if (existingUsers < usersCount) {
      console.log(`[stress-gate] Seeding users to ${usersCount}...`);
      const seedUsersMs = await seedUsers();
      console.log(`[stress-gate] Users seed took ${seedUsersMs.toFixed(2)}ms`);
    } else {
      console.log(`[stress-gate] Users already seeded: ${existingUsers}`);
    }

    if (existingEvents < eventsCount) {
      console.log(`[stress-gate] Seeding events to ${eventsCount}...`);
      const seedEventsMs = await seedEvents();
      console.log(`[stress-gate] Events seed took ${(seedEventsMs / 1000).toFixed(2)}s`);
    } else {
      console.log(`[stress-gate] Events already seeded: ${existingEvents}`);
    }

    const analyzeMs = await analyze();
    console.log(`[stress-gate] ANALYZE took ${analyzeMs.toFixed(2)}ms`);

    const { runs, avg, p95, minRowsSeen } = await runBenchmarks();
    console.log("[stress-gate] Benchmark runs (ms):", runs.map((r) => Number(r.elapsed.toFixed(2))));
    console.log(
      `[stress-gate] avg=${avg.toFixed(2)}ms p95=${p95.toFixed(2)}ms minRows=${minRowsSeen}`
    );

    if (minRowsSeen < minRows) {
      console.error(
        `[stress-gate] FAILED: result rows ${minRowsSeen} أقل من الحد ${minRows}.`
      );
      process.exit(1);
    }
    if (avg > maxAvgMs || p95 > maxP95Ms) {
      console.error(
        `[stress-gate] FAILED: avg=${avg.toFixed(2)}ms (max ${maxAvgMs}) p95=${p95.toFixed(
          2
        )}ms (max ${maxP95Ms}).`
      );
      process.exit(1);
    }

    console.log("[stress-gate] PASSED");
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("[stress-gate] Unexpected error:", err);
  process.exit(1);
});
