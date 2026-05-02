/**
 * usePlatform.ts
 * ══════════════════════════════════════════════════
 * React hook لقراءة بيانات أي module بشكل reactive.
 *
 * بدل ما كل screen يستورد 10 stores مختلفة:
 *
 *   // ❌ Before — 10 cross-module imports
 *   import { useTazkiyaState } from "@/modules/tazkiya/store/tazkiya.store";
 *   import { useKanzState } from "@/modules/kanz/store/kanz.store";
 *   ...etc
 *
 *   // ✅ After — single import
 *   import { usePlatform } from "@/shared/platform/usePlatform";
 *   const p = usePlatform();
 *   const tazkiyaCycles = p.tazkiya.totalCycles;
 *   const kanzGems = p.kanz.totalGems;
 *
 * Performance strategy:
 * - Snapshot is cached and only rebuilt when a store changes.
 * - A version counter provides stable reference identity for useSyncExternalStore.
 * - `usePlatformModule()` is available for components that only need one slice.
 */

import { useSyncExternalStore, useCallback, useRef } from "react";
import { platform, type PlatformSnapshot } from "./platformIntelligence";

// ── Zustand stores expose subscribe/getState — we piggyback on them ──

type StoreApi = {
  getState: () => unknown;
  subscribe: (listener: () => void) => () => void;
};

// Collect all zustand stores we can subscribe to
function getReactiveStores(): StoreApi[] {
  const stores: StoreApi[] = [];
  const paths: Array<[string, string]> = [
    ["@/domains/consciousness/store/pulse.store", "usePulseState"],
    ["@/modules/hafiz/store/hafiz.store", "useHafizState"],
    ["@/modules/khalwa/store/khalwa.store", "useKhalwaState"],
    ["@/modules/yawmiyyat/store/yawmiyyat.store", "useYawmiyyatState"],
    ["@/modules/niyya/store/niyya.store", "useNiyyaState"],
    ["@/modules/bawsala/store/bawsala.store", "useBawsalaState"],
    ["@/modules/mithaq/store/mithaq.store", "useMithaqState"],
    ["@/modules/athar/store/athar.store", "useAtharState"],
    ["@/modules/raseed/store/raseed.store", "useRaseedState"],
    ["@/modules/dawra/store/dawra.store", "useDawraState"],
    ["@/modules/qinaa/store/qinaa.store", "useQinaaState"],
    ["@/modules/wird/store/wird.store", "useWirdState"],
    ["@/modules/samt/store/samt.store", "useSamtState"],
    ["@/modules/tazkiya/store/tazkiya.store", "useTazkiyaState"],
    ["@/modules/qalb/store/qalb.store", "useQalbState"],
    ["@/modules/basma/store/basma.store", "useBasmaState"],
    ["@/modules/sijil/store/sijil.store", "useSijilState"],
    ["@/modules/nadhir/store/nadhir.store", "useNadhirState"],
    ["@/modules/zill/store/zill.store", "useZillState"],
    ["@/modules/qutb/store/qutb.store", "useQutbState"],
    ["@/modules/kanz/store/kanz.store", "useKanzState"],
    ["@/modules/raya/store/raya.store", "useRayaState"],
    ["@/modules/warsha/store/warsha.store", "useWarshaState"],
    ["@/modules/sila/store/sila.store", "useSilaState"],
    ["@/modules/jisr/store/jisr.store", "useJisrState"],
    ["@/modules/jathr/store/jathr.store", "useJathrState"],
    ["@/modules/masarat/store/masarat.store", "useMasaratStore"],
    ["@/modules/nabd/store/nabd.store", "useNabdState"],
    ["@/modules/mirah/store/mirah.store", "useMirahState"],
    ["@/modules/bathra/store/bathra.store", "useBathraState"],
    ["@/modules/risala/store/risala.store", "useRisalaState"],
    ["@/modules/rafiq/store/rafiq.store", "useRafiqState"],
  ];

  for (const [path, hook] of paths) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(path);
      const store = mod[hook];
      if (store?.subscribe && store?.getState) {
        stores.push(store as StoreApi);
      }
    } catch { /* module not loaded */ }
  }
  return stores;
}

// ═══════════════════════════════════════════════════════════
//  Singleton Snapshot Cache
//  - Rebuilt only when a subscribed store changes
//  - useSyncExternalStore compares by reference (===)
// ═══════════════════════════════════════════════════════════

let _cachedStores: StoreApi[] | null = null;
let _cachedSnapshot: PlatformSnapshot | null = null;
let _snapshotVersion = 0;
let _subscribed = false;
let _globalUnsubscribes: Array<() => void> = [];

function getAllStores() {
  if (!_cachedStores) _cachedStores = getReactiveStores();
  return _cachedStores;
}

/** Invalidate the cached snapshot (called when any store changes) */
function invalidateSnapshot() {
  _cachedSnapshot = null;
  _snapshotVersion++;
}

/** Get or rebuild the snapshot (stable reference until invalidated) */
function getCachedSnapshot(): PlatformSnapshot {
  if (!_cachedSnapshot) {
    _cachedSnapshot = platform.snapshot();
  }
  return _cachedSnapshot;
}

/** 
 * Ensure global store subscriptions are active.
 * This is a singleton — called once, shared across all hook instances.
 */
function ensureGlobalSubscriptions() {
  if (_subscribed) return;
  _subscribed = true;

  const stores = getAllStores();
  _globalUnsubscribes = stores.map((s) => {
    try { return s.subscribe(invalidateSnapshot); }
    catch { return () => {}; }
  });
}

// Global listener set for React's useSyncExternalStore
const _reactListeners = new Set<() => void>();
let _lastVersion = -1;

// Subscribe stores → on change → notify all React listeners
function ensureReactBridge() {
  ensureGlobalSubscriptions();

  // Patch invalidateSnapshot to also notify React
  const originalInvalidate = invalidateSnapshot;
  // We only patch once
  if (!(invalidateSnapshot as any).__patched) {
    const patchedInvalidate = () => {
      originalInvalidate();
      _reactListeners.forEach((cb) => cb());
    };
    (patchedInvalidate as any).__patched = true;

    // Replace module-level references by re-wiring subscriptions
    _globalUnsubscribes.forEach((u) => u());
    const stores = getAllStores();
    _globalUnsubscribes = stores.map((s) => {
      try { return s.subscribe(patchedInvalidate); }
      catch { return () => {}; }
    });
  }
}

/**
 * React Hook — يقرأ لقطة المنصة بشكل reactive.
 *
 * Performance optimizations:
 * 1. Snapshot is cached — only rebuilt when a store actually changes.
 * 2. All instances share one subscription set (no N×M problem).
 * 3. useSyncExternalStore only triggers re-render when snapshot reference changes.
 *
 * @example
 *   const p = usePlatform();
 *   if (p.wird.completedToday) { ... }
 *   if (p.qalb.zone === "critical") { ... }
 */
export function usePlatform(): PlatformSnapshot {
  // Ensure bridge is set up (idempotent)
  ensureReactBridge();

  const subscribe = useCallback((onStoreChange: () => void) => {
    _reactListeners.add(onStoreChange);
    return () => { _reactListeners.delete(onStoreChange); };
  }, []);

  const getSnapshot = useCallback(() => {
    return getCachedSnapshot();
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * React Hook — يقرأ أداة واحدة بشكل reactive.
 *
 * ⚡ أقل تكلفة من usePlatform() لأنه بيقارن slice واحد بس.
 *
 * @example
 *   const wird = usePlatformModule("wird");
 *   // wird.completedToday, wird.streak, etc.
 */
export function usePlatformModule<K extends keyof Omit<PlatformSnapshot, "relationships">>(
  moduleKey: K,
): PlatformSnapshot[K] {
  ensureReactBridge();

  const subscribe = useCallback((onStoreChange: () => void) => {
    _reactListeners.add(onStoreChange);
    return () => { _reactListeners.delete(onStoreChange); };
  }, []);

  // Return the specific module slice — React will shallowly compare
  const getSnapshot = useCallback(() => {
    return getCachedSnapshot()[moduleKey];
  }, [moduleKey]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
