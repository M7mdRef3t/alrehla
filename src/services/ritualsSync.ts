/**
 * 🔁 Rituals Supabase Sync
 * ==========================
 * sync ثنائي الاتجاه للعادات اليومية:
 * - daily_rituals      ← العادات والإعدادات
 * - ritual_logs        ← سجل الإتمام اليومي
 * - daily_plans        ← خطط اليوم + مراجعات المساء
 *
 * Strategy: Offline-first (local wins on conflict)
 */

import { supabase } from "@/services/supabaseClient";
import { useRitualState } from "@/domains/journey/store/ritual.store";
import type { DailyRitual, RitualLog, DailyPlan } from "@/types/dailyRituals";

// ─── Upload ──────────────────────────────────────────────────────

export async function uploadRituals(rituals: DailyRitual[], userId: string): Promise<boolean> {
  if (!supabase || !userId || rituals.length === 0) return false;

  const rows = rituals.map((r) => ({
    id: r.id,
    user_id: userId,
    name: r.name,
    icon: r.icon,
    domain_id: r.domainId,
    target_time: r.targetTime,
    frequency: r.frequency,
    estimated_minutes: r.estimatedMinutes,
    is_active: r.isActive,
    is_preset: r.isPreset,
    sort_order: r.sortOrder,
    created_at: new Date(r.createdAt).toISOString(),
  }));

  const { error } = await supabase
    .from("daily_rituals")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: false });

  if (error) {
    console.error("[RitualsSync] Upload rituals failed:", error.message);
    return false;
  }
  return true;
}

export async function uploadRitualLogs(logs: RitualLog[], userId: string): Promise<boolean> {
  if (!supabase || !userId || logs.length === 0) return false;

  // Only last 30 days
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const recentLogs = logs.filter((l) => l.logDate >= cutoff);
  if (recentLogs.length === 0) return true;

  const rows = recentLogs.map((l) => ({
    id: l.id,
    user_id: userId,
    ritual_id: l.ritualId,
    log_date: l.logDate,
    completed_at: new Date(l.completedAt).toISOString(),
    note: l.note ?? null,
    feeling_after: l.feelingAfter ?? null,
  }));

  const { error } = await supabase
    .from("ritual_logs")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    console.error("[RitualsSync] Upload ritual logs failed:", error.message);
    return false;
  }
  return true;
}

export async function uploadDailyPlan(plan: DailyPlan, userId: string): Promise<boolean> {
  if (!supabase || !userId) return false;

  const { error } = await supabase
    .from("daily_plans")
    .upsert(
      {
        id: plan.id,
        user_id: userId,
        plan_date: plan.planDate,
        day_theme: plan.dayTheme ?? null,
        morning_energy: plan.morningEnergy ?? null,
        top_priorities: plan.topPriorities,
        morning_started: plan.morningStarted,
        evening_reflection: plan.eveningReflection ?? null,
        day_rating: plan.dayRating ?? null,
        created_at: new Date(plan.createdAt).toISOString(),
      },
      { onConflict: "id", ignoreDuplicates: false }
    );

  if (error) {
    console.error("[RitualsSync] Upload daily plan failed:", error.message);
    return false;
  }
  return true;
}

// ─── Pull ─────────────────────────────────────────────────────────

export async function pullRituals(userId: string): Promise<void> {
  if (!supabase || !userId) return;

  const { data, error } = await supabase
    .from("daily_rituals")
    .select("*")
    .eq("user_id", userId)
    .order("sort_order", { ascending: true });

  if (error || !data) return;

  const local = useRitualState.getState();
  const localIds = new Set(local.rituals.map((r) => r.id));

  const newRituals: DailyRitual[] = data
    .filter((row: any) => !localIds.has(row.id))
    .map(
      (row: any): DailyRitual => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        domainId: row.domain_id,
        targetTime: row.target_time,
        frequency: row.frequency,
        estimatedMinutes: row.estimated_minutes ?? 10,
        isActive: row.is_active ?? true,
        isPreset: row.is_preset ?? false,
        sortOrder: row.sort_order ?? 0,
        createdAt: new Date(row.created_at).getTime(),
      })
    );

  if (newRituals.length > 0) {
    useRitualState.setState((s) => ({
      rituals: [...s.rituals, ...newRituals],
    }));
  }
}

export async function pullRitualLogs(userId: string): Promise<void> {
  if (!supabase || !userId) return;

  // Pull last 30 days only
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("ritual_logs")
    .select("*")
    .eq("user_id", userId)
    .gte("log_date", cutoff)
    .order("completed_at", { ascending: false });

  if (error || !data) return;

  const local = useRitualState.getState();
  const localIds = new Set(local.logs.map((l) => l.id));

  const newLogs: RitualLog[] = data
    .filter((row: any) => !localIds.has(row.id))
    .map(
      (row: any): RitualLog => ({
        id: row.id,
        ritualId: row.ritual_id,
        logDate: row.log_date,
        completedAt: new Date(row.completed_at).getTime(),
        note: row.note ?? undefined,
        feelingAfter: row.feeling_after ?? undefined,
      })
    );

  if (newLogs.length > 0) {
    useRitualState.setState((s) => ({
      logs: [...newLogs, ...s.logs].slice(0, 500),
    }));
  }
}

export async function pullDailyPlans(userId: string): Promise<void> {
  if (!supabase || !userId) return;

  // Last 14 days
  const cutoff = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("daily_plans")
    .select("*")
    .eq("user_id", userId)
    .gte("plan_date", cutoff)
    .order("plan_date", { ascending: false });

  if (error || !data) return;

  const local = useRitualState.getState();
  const localIds = new Set(local.plans.map((p) => p.id));

  const newPlans: DailyPlan[] = data
    .filter((row: any) => !localIds.has(row.id))
    .map(
      (row: any): DailyPlan => ({
        id: row.id,
        planDate: row.plan_date,
        dayTheme: row.day_theme ?? null,
        morningEnergy: row.morning_energy ?? null,
        topPriorities: row.top_priorities ?? [],
        morningStarted: row.morning_started ?? false,
        eveningReflection: row.evening_reflection ?? null,
        dayRating: row.day_rating ?? null,
        createdAt: new Date(row.created_at).getTime(),
      })
    );

  if (newPlans.length > 0) {
    useRitualState.setState((s) => ({
      plans: [...s.plans, ...newPlans].slice(0, 100),
    }));
  }
}

// ─── Main Sync ────────────────────────────────────────────────────

let hasSyncedRitualsThisSession = false;

/**
 * Full sync: pull from DB → merge → upload local deltas
 * Automatically called from syncLifeStateWithDB (fire-and-forget)
 */
export async function syncRitualsWithDB(userId: string): Promise<void> {
  if (!supabase || !userId || hasSyncedRitualsThisSession) return;
  hasSyncedRitualsThisSession = true;

  try {
    // 1. Pull remote
    await Promise.all([
      pullRituals(userId),
      pullRitualLogs(userId),
      pullDailyPlans(userId),
    ]);

    // 2. Upload local
    const state = useRitualState.getState();
    await Promise.allSettled([
      uploadRituals(state.rituals, userId),
      uploadRitualLogs(state.logs, userId),
      ...state.plans.slice(0, 14).map((p) => uploadDailyPlan(p, userId)),
    ]);
  } catch (err) {
    console.error("[RitualsSync] Sync failed:", err);
  }
}

// ─── Auto Sync (Realtime Sync) ──────────────────────────────────────

let syncTimeout: NodeJS.Timeout | null = null;
let isUnsubscribed = false;

/**
 * Setup a background sync that watches the local state and pushes to DB automatically.
 * Debounced to 5 seconds to prevent spamming the database.
 */
export function setupRitualsAutoSync(userId: string) {
  if (!userId || !supabase) return () => {};
  
  isUnsubscribed = false;
  
  const unsubscribe = useRitualState.subscribe((state, prevState) => {
     if (isUnsubscribed) return;
     
     // Only trigger if data actually changed
     if (
        state.rituals === prevState.rituals &&
        state.logs === prevState.logs &&
        state.plans === prevState.plans
     ) {
        return;
     }

     if (syncTimeout) {
        clearTimeout(syncTimeout);
     }
     
     syncTimeout = setTimeout(async () => {
        try {
           // We only need to upload deltas or recent state, same as full sync logic
           await Promise.allSettled([
              uploadRituals(state.rituals, userId),
              uploadRitualLogs(state.logs, userId),
              ...state.plans.slice(0, 5).map((p) => uploadDailyPlan(p, userId))
           ]);
        } catch (e) {
           console.error("[RitualsSync] Auto-sync failed:", e);
        }
     }, 5000); // 5 second debounce
  });
  
  return () => {
     isUnsubscribed = true;
     unsubscribe();
     if (syncTimeout) clearTimeout(syncTimeout);
  };
}

export function resetRitualsSyncSession(): void {
  hasSyncedRitualsThisSession = false;
  isUnsubscribed = true;
  if (syncTimeout) clearTimeout(syncTimeout);
}
