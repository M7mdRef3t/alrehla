import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const CHUNK_SIZE = Math.max(1, Number(process.env.ARCHIVE_CHUNK_SIZE || 500));
const RAM_LIMIT_MB = Math.max(128, Number(process.env.ARCHIVE_RAM_LIMIT_MB || 1024));
const RAM_SOFT_RATIO = 0.8;
const SOFT_PAUSE_MS = Math.max(250, Number(process.env.ARCHIVE_SOFT_PAUSE_MS || 1000));

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

type Checkpoint = {
  impactTimestamp: string;
  lastId: string | null;
  chunkIndex: number;
};

function logMemory(chunkIndex: number) {
  const mem = process.memoryUsage();
  const rssMb = mem.rss / (1024 * 1024);
  const heapUsedMb = mem.heapUsed / (1024 * 1024);
  const ratio = rssMb / RAM_LIMIT_MB;
  console.log(
    `RAM [ResonanceArchive] chunk=${chunkIndex} rss=${rssMb.toFixed(1)}MB heap=${heapUsedMb.toFixed(1)}MB limit=${RAM_LIMIT_MB}MB ratio=${(ratio * 100).toFixed(1)}%`
  );
  return { ratio };
}

async function applyRamGuard(chunkIndex: number) {
  const mem = logMemory(chunkIndex);
  if (mem.ratio < RAM_SOFT_RATIO) return;

  console.warn(
    `WARN [ResonanceArchive] RAM soft threshold exceeded (${(mem.ratio * 100).toFixed(1)}%). Applying guardrails...`
  );

  if (typeof global.gc === 'function') {
    global.gc();
    console.log('GC [ResonanceArchive] Manual GC triggered.');
  }

  await new Promise((resolve) => setTimeout(resolve, SOFT_PAUSE_MS));
}

async function resolveCheckpoint(eventId: string): Promise<Checkpoint> {
  const { data: lastChunk } = await supabase
    .from('system_telemetry_logs')
    .select('payload, created_at')
    .eq('service_name', 'resonance-engine')
    .eq('action', 't_zero_impact_archive_chunk')
    .contains('payload', { event_id: eventId })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!lastChunk?.payload) {
    return {
      impactTimestamp: new Date().toISOString(),
      lastId: null,
      chunkIndex: 0
    };
  }

  const impactTimestamp = String(lastChunk.payload.impact_timestamp || '').trim();
  const lastId = typeof lastChunk.payload.cursor_last_id === 'string' ? lastChunk.payload.cursor_last_id : null;
  const chunkIndex = Number(lastChunk.payload.chunk_index || 0);

  if (!impactTimestamp) {
    return {
      impactTimestamp: new Date().toISOString(),
      lastId: null,
      chunkIndex: 0
    };
  }

  // If manifest exists for this impact timestamp, session is complete -> start a fresh run.
  const { data: manifest } = await supabase
    .from('system_telemetry_logs')
    .select('id')
    .eq('service_name', 'resonance-engine')
    .eq('action', 't_zero_impact_archive_manifest')
    .contains('payload', { event_id: eventId, impact_timestamp: impactTimestamp })
    .limit(1)
    .maybeSingle();

  if (manifest?.id) {
    return {
      impactTimestamp: new Date().toISOString(),
      lastId: null,
      chunkIndex: 0
    };
  }

  return {
    impactTimestamp,
    lastId,
    chunkIndex: Number.isFinite(chunkIndex) ? chunkIndex : 0
  };
}

async function archivePioneerResonance() {
  console.log('[ResonanceArchive] Initializing T-Zero Data Capture...');

  const { data: activeEvent, error: eventError } = await supabase
    .from('system_events')
    .select('*')
    .eq('event_type', 'high_pressure')
    .order('start_time', { ascending: false })
    .limit(1)
    .single();

  if (eventError) {
    console.error('Error fetching event:', eventError);
    return;
  }
  if (!activeEvent) {
    console.error('No high_pressure event found to archive.');
    return;
  }

  const { data: metrics } = await supabase
    .from('swarm_resilience_metrics')
    .select('*')
    .single();

  const checkpoint = await resolveCheckpoint(activeEvent.id);
  const archiveRunId = `${activeEvent.id}:${checkpoint.impactTimestamp}`;
  let lastId: string | null = checkpoint.lastId;
  let chunkIndex = checkpoint.chunkIndex;
  let totalArchived = 0;

  if (lastId) {
    console.log(`[ResonanceArchive] Resuming run ${archiveRunId} from cursor=${lastId} chunk=${chunkIndex}.`);
  } else {
    console.log(`[ResonanceArchive] Starting new run ${archiveRunId}.`);
  }

  while (true) {
    let query = supabase
      .from('profiles')
      .select('id, awareness_vector, sovereignty_score')
      .order('id', { ascending: true })
      .limit(CHUNK_SIZE);

    if (lastId) {
      query = query.gt('id', lastId);
    }

    const { data: pioneersChunk, error: chunkError } = await query;
    if (chunkError) {
      console.error('Failed to fetch pioneer chunk:', chunkError);
      return;
    }

    if (!pioneersChunk || pioneersChunk.length === 0) {
      break;
    }

    chunkIndex += 1;
    totalArchived += pioneersChunk.length;
    const cursorLastId = pioneersChunk[pioneersChunk.length - 1].id;

    const { error: archiveChunkError } = await supabase.from('system_telemetry_logs').insert({
      service_name: 'resonance-engine',
      action: 't_zero_impact_archive_chunk',
      payload: {
        event_id: activeEvent.id,
        archive_run_id: archiveRunId,
        impact_timestamp: checkpoint.impactTimestamp,
        chunk_index: chunkIndex,
        chunk_size: pioneersChunk.length,
        cursor_last_id: cursorLastId,
        pioneers: pioneersChunk,
        aegis_prime_id: activeEvent.first_solver_id
      },
      status: 'success'
    });

    if (archiveChunkError) {
      console.error('Failed to archive chunk:', archiveChunkError);
      return;
    }

    lastId = cursorLastId;
    console.log(`[ResonanceArchive] chunk ${chunkIndex} archived (${pioneersChunk.length} pioneers), cursor=${cursorLastId}.`);
    await applyRamGuard(chunkIndex);
  }

  const { error: manifestError } = await supabase.from('system_telemetry_logs').insert({
    service_name: 'resonance-engine',
    action: 't_zero_impact_archive_manifest',
    payload: {
      event_id: activeEvent.id,
      archive_run_id: archiveRunId,
      impact_timestamp: checkpoint.impactTimestamp,
      metrics,
      total_chunks: chunkIndex,
      total_pioneers_archived: totalArchived,
      final_cursor_id: lastId,
      aegis_prime_id: activeEvent.first_solver_id,
      chunk_size: CHUNK_SIZE
    },
    status: 'success'
  });

  if (manifestError) {
    console.error('Failed to archive manifest:', manifestError);
    return;
  }

  console.log('[ResonanceArchive] T-Zero snapshot secured with resumable chunked streaming archive.');
  console.log(`Insulated pioneers: ${metrics?.insulated_count}/${metrics?.total_pioneers}`);
  console.log(`Archived pioneers: ${totalArchived} in this run (latest chunk_index=${chunkIndex}, chunk_size=${CHUNK_SIZE})`);
  console.log(`Aegis Prime: ${activeEvent.first_solver_id || 'NONE'}`);
}

archivePioneerResonance().catch(console.error);
