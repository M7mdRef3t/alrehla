/**
 * 🔁 Life State Supabase Sync
 * ============================
 * يعمل sync ثنائي الاتجاه بين localStorage (Zustand) وقاعدة بيانات Supabase.
 *
 * الاتجاهات:
 * 1. UPLOAD: عند إضافة entry جديد → يتحفظ في `life_entries`
 * 2. DOWNLOAD: عند بداية الجلسة → يسحب بيانات المستخدم من DB
 * 3. SNAPSHOT: كل مرة تتحسب الـ Life Score → تتحفظ في `life_score_snapshots`
 *
 * Conflict Resolution: Local wins (offline-first strategy)
 * يعني البيانات المحلية لها الأولوية دايماً.
 */

import { supabase } from "@/services/supabaseClient";
import type { LifeEntry, DomainAssessment, LifeScore } from "@/types/lifeDomains";
import { useLifeState } from "@/domains/dawayir/store/life.store";

// ─── Upload Functions ─────────────────────────────────────────────

/**
 * Upload a single life entry to Supabase
 */
export async function uploadLifeEntry(entry: LifeEntry, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;

  const { error } = await supabase
    .from("life_entries")
    .upsert({
      id: entry.id,
      user_id: userId,
      type: entry.type,
      content: entry.content,
      domain_id: entry.domainId,
      priority: entry.priority,
      status: entry.status,
      tags: entry.tags ?? [],
      linked_entry_id: entry.linkedEntryId ?? null,
      created_at: new Date(entry.createdAt).toISOString(),
      updated_at: new Date(entry.updatedAt).toISOString(),
      resolved_at: entry.resolvedAt ? new Date(entry.resolvedAt).toISOString() : null
    }, {
      onConflict: "id",
      ignoreDuplicates: false
    });

  if (error) {
    console.error("[LifeSync] Failed to upload entry:", error.message);
    return false;
  }
  return true;
}

/**
 * Upload a domain assessment to Supabase
 */
export async function uploadAssessment(assessment: DomainAssessment, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;

  const { error } = await supabase
    .from("life_domain_assessments")
    .insert({
      user_id: userId,
      domain_id: assessment.domainId,
      score: assessment.score,
      answers: assessment.answers,
      note: assessment.note ?? null,
      assessed_at: new Date(assessment.timestamp).toISOString()
    });

  if (error) {
    console.error("[LifeSync] Failed to upload assessment:", error.message);
    return false;
  }
  return true;
}

/**
 * Upload a Life Score snapshot to Supabase
 */
export async function uploadScoreSnapshot(score: LifeScore, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;

  const { error } = await supabase
    .from("life_score_snapshots")
    .insert({
      user_id: userId,
      overall_score: score.overall,
      domain_scores: score.domains,
      trend: score.trend,
      weakest_domain: score.weakestDomain,
      strongest_domain: score.strongestDomain,
      active_problems: score.activeProblems,
      pending_decisions: score.pendingDecisions,
      snapshot_date: new Date().toISOString().slice(0, 10)
    });

  if (error) {
    // Ignore duplicate key errors (already snapped today)
    if (!error.message.includes("duplicate")) {
      console.error("[LifeSync] Failed to upload score snapshot:", error.message);
    }
    return false;
  }
  return true;
}

// ─── Download / Restore Functions ────────────────────────────────

/**
 * Pull all life entries from DB and merge with local state.
 * Uses "local wins" conflict resolution.
 */
export async function pullLifeEntries(userId: string): Promise<void> {
  if (!supabase || !userId) return;

  const { data, error } = await supabase
    .from("life_entries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(500);

  if (error || !data) {
    console.error("[LifeSync] Failed to pull entries:", error?.message);
    return;
  }

  const localState = useLifeState.getState();
  const localIds = new Set(localState.entries.map(e => e.id));

  // Only add entries that don't exist locally (local wins)
  const newEntries: LifeEntry[] = data
    .filter((row: any) => !localIds.has(row.id))
    .map((row: any): LifeEntry => ({
      id: row.id,
      type: row.type,
      content: row.content,
      domainId: row.domain_id,
      priority: row.priority ?? 3,
      status: row.status ?? "active",
      tags: row.tags ?? [],
      linkedEntryId: row.linked_entry_id ?? undefined,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
      resolvedAt: row.resolved_at ? new Date(row.resolved_at).getTime() : undefined
    }));

  if (newEntries.length > 0) {
    // Merge: remote entries go to the end, local entries take priority
    const merged = [...localState.entries, ...newEntries].slice(0, 1000);
    useLifeState.setState({ entries: merged });
    localState.recalculateLifeScore();
  }
}

/**
 * Pull domain assessments from DB and merge with local
 */
export async function pullAssessments(userId: string): Promise<void> {
  if (!supabase || !userId) return;

  const { data, error } = await supabase
    .from("life_domain_assessments")
    .select("*")
    .eq("user_id", userId)
    .order("assessed_at", { ascending: false })
    .limit(200);

  if (error || !data) return;

  const localState = useLifeState.getState();
  const localTimestamps = new Set(localState.assessments.map(a => a.timestamp));

  const newAssessments: DomainAssessment[] = data
    .filter((row: any) => !localTimestamps.has(new Date(row.assessed_at).getTime()))
    .map((row: any): DomainAssessment => ({
      domainId: row.domain_id,
      score: row.score,
      answers: row.answers ?? [],
      note: row.note ?? undefined,
      timestamp: new Date(row.assessed_at).getTime()
    }));

  if (newAssessments.length > 0) {
    const merged = [...localState.assessments, ...newAssessments].slice(0, 500);
    useLifeState.setState({ assessments: merged });
    localState.recalculateLifeScore();
  }
}

// ─── Main Sync Hook ───────────────────────────────────────────────

let hasSyncedThisSession = false;

/**
 * Full bidirectional sync:
 * 1. Pull remote data (merge with local)
 * 2. Upload any local entries not yet in DB
 * 
 * Call this once when the user signs in / app boots.
 */
export async function syncLifeStateWithDB(userId: string): Promise<void> {
  if (!supabase || !userId || hasSyncedThisSession) return;
  hasSyncedThisSession = true;

  try {
    // 1. Pull from DB (merge into local state)
    await Promise.all([
      pullLifeEntries(userId),
      pullAssessments(userId)
    ]);

    // 2. Upload local entries that might be new (added offline)
    const localState = useLifeState.getState();
    const uploadQueue = localState.entries.slice(0, 50); // Upload most recent 50

    const batchSize = 10;
    for (let i = 0; i < uploadQueue.length; i += batchSize) {
      const batch = uploadQueue.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(entry => uploadLifeEntry(entry, userId))
      );
    }

    // 3. Upload today's score snapshot if we have one
    if (localState.lifeScore) {
      await uploadScoreSnapshot(localState.lifeScore, userId);
    }

    // 4. Sync rituals (fire-and-forget, non-blocking)
    import("@/services/ritualsSync").then(({ syncRitualsWithDB, setupRitualsAutoSync }) => {
      syncRitualsWithDB(userId).then(() => {
        setupRitualsAutoSync(userId);
      }).catch(() => {});
    });

  } catch (err) {
    console.error("[LifeSync] Sync failed:", err);
  }
}


/**
 * Reset session sync flag (call on sign out)
 */
export function resetLifeSyncSession(): void {
  hasSyncedThisSession = false;
  // Also reset rituals sync
  import("@/services/ritualsSync").then(({ resetRitualsSyncSession }) => {
    resetRitualsSyncSession();
  });
}

