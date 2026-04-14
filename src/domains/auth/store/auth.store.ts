import { create } from "zustand";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { isPrivilegedRole } from "@/utils/featureFlags";
import { safeGetSession, supabase } from "@/services/supabaseClient";
import { getFromLocalStorage, removeFromLocalStorage, setInLocalStorage } from "@/services/browserStorage";
import { replaceUrl, createCurrentUrl } from "@/services/navigation";
import { runtimeEnv } from "@/config/runtimeEnv";
import { AnalyticsEvents, trackIdentityLinked } from "@/services/analytics";
import { analyticsService } from "@/domains/analytics";
import { markRevenueAccessUnlocked } from "@/services/revenueAccess";
import { EcosystemData } from "@/types/ecosystem";

export type UserToneGender = "male" | "female" | "neutral";
export type SubscriptionTier = "free" | "pro";

interface AuthState {
  status: "loading" | "ready";
  user: User | null;
  session: Session | null;
  displayName: string | null;
  firstName: string | null;
  toneGender: UserToneGender;
  role: string | null;
  roleOverride: string | null;
  tier: SubscriptionTier;
  ecosystemData: EcosystemData | null;
  setSession: (session: Session | null) => void;
  setRole: (role: string | null) => void;
  setRoleOverride: (role: string | null) => void;
  setTier: (tier: SubscriptionTier) => void;
  setEcosystemData: (data: EcosystemData | null) => void;
}

const ROLE_OVERRIDE_KEY = "dawayir-role-override";
// Legacy: the app used to support role overrides via `?asRole=...`.
// This caused confusing URLs and made "owner" vs "developer" feel the same.
// We now strip it on load and rely on localStorage + UI controls instead.
const LEGACY_ROLE_OVERRIDE_QUERY_KEY = "asRole";
const hasSupabaseEnv = Boolean(runtimeEnv.supabaseUrl && runtimeEnv.supabaseAnonKey);
let supabaseClient: SupabaseClient | null = null;
let supabaseAuthInitialized = false;
let supabaseAuthInitPromise: Promise<void> | null = null;

function normalizeToneGender(raw: unknown): UserToneGender {
  if (raw === "male" || raw === "female" || raw === "neutral") return raw;
  return "neutral";
}

function normalizeRole(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  return value ? value : null;
}

function getTierFromProfileRow(row: { subscription_status?: unknown } | null | undefined): SubscriptionTier {
  const status =
    typeof row?.subscription_status === "string"
      ? row.subscription_status.trim().toLowerCase()
      : "";

  return status === "active" || status === "trialing" ? "pro" : "free";
}

export function getEffectiveRoleFromState(
  state: Pick<AuthState, "role" | "roleOverride">,
  options?: { isDev?: boolean }
): string | null {
  const base = normalizeRole(state.role);
  const override = normalizeRole(state.roleOverride);
  if (!override) return base;

  const isDev = options?.isDev ?? runtimeEnv.isDev;
  if (isDev) return override;

  // Production: allow privileged users to *down-scope* only (view-as user).
  if (override === "user" && isPrivilegedRole(base)) return override;
  return base;
}

function getDisplayNameFromUser(user: User | null): string | null {
  if (!user) return null;
  const meta = (user as { user_metadata?: Record<string, unknown> }).user_metadata ?? {};
  const rawName =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.name === "string" && meta.name.trim()) ||
    "";
  const email = typeof user.email === "string" ? user.email : "";
  const fromEmail = email && email.includes("@") ? email.split("@")[0] : "";
  const base = (rawName || fromEmail).trim();
  return base ? base : null;
}

function getFirstName(displayName: string | null): string | null {
  if (!displayName) return null;
  const first = displayName.trim().split(/\s+/)[0];
  return first ? first : null;
}

function getToneGenderFromUser(user: User | null): UserToneGender {
  if (!user) return "neutral";
  const meta = (user as { user_metadata?: Record<string, unknown> }).user_metadata ?? {};
  const raw =
    meta.tone_gender ??
    meta.user_tone_gender ??
    meta.userToneGender ??
    meta.toneGender;
  return normalizeToneGender(raw);
}

function stripLegacyRoleOverrideQueryParam(): void {
  try {
    const url = createCurrentUrl();
    if (!url) return;
    if (!url.searchParams.has(LEGACY_ROLE_OVERRIDE_QUERY_KEY)) return;
    url.searchParams.delete(LEGACY_ROLE_OVERRIDE_QUERY_KEY);
    replaceUrl(url, {});
  } catch {
    // ignore URL update errors
  }
}

function getInitialRoleOverride(): string | null {
  if (typeof window === "undefined") return null;

  // ?asRole=user → وضع المستخدم: نطبّق ونمسح الرابط.
  try {
    const url = createCurrentUrl();
    if (!url) return null;
    const fromUrl = normalizeRole(url.searchParams.get(LEGACY_ROLE_OVERRIDE_QUERY_KEY));
    if (fromUrl === "user") {
      setInLocalStorage(ROLE_OVERRIDE_KEY, "user");
      stripLegacyRoleOverrideQueryParam();
      return "user";
    }
  } catch {
    /* ignore */
  }

  stripLegacyRoleOverrideQueryParam();

  // DEV: allow overriding via localStorage for fast testing.
  if (runtimeEnv.isDev) {
    const stored = getFromLocalStorage(ROLE_OVERRIDE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  }

  // Production: allow a persisted *down-scope* to `user` only.
  const stored = normalizeRole(getFromLocalStorage(ROLE_OVERRIDE_KEY));
  return stored === "user" ? "user" : null;
}

export const useAuthState = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  session: null,
  displayName: null,
  firstName: null,
  toneGender: "neutral",
  role: null,
  roleOverride: getInitialRoleOverride(),
  tier: "free",
  ecosystemData: null,
  setSession: (session) =>
    set(() => {
      const user = session?.user ?? null;
      const displayName = getDisplayNameFromUser(user);
      return {
        session,
        user,
        status: "ready",
        displayName,
        firstName: getFirstName(displayName),
        toneGender: getToneGenderFromUser(user)
      };
    }),
  setRole: (role) => set({ role }),
  setRoleOverride: (role) =>
    set(() => {
      const normalized = role && role.trim() ? role.trim() : null;
      if (typeof window !== "undefined") {
        if (runtimeEnv.isDev) {
          if (normalized) setInLocalStorage(ROLE_OVERRIDE_KEY, normalized);
          else removeFromLocalStorage(ROLE_OVERRIDE_KEY);
        } else {
          const safe = normalizeRole(normalized);
          if (safe === "user") setInLocalStorage(ROLE_OVERRIDE_KEY, "user");
          else removeFromLocalStorage(ROLE_OVERRIDE_KEY);
        }
      }
      return { roleOverride: normalized };
    }),
  setTier: (tier) => set({ tier }),
  setEcosystemData: (data) => set({ ecosystemData: data })
}));

export function getAuthToken(): string | null {
  return useAuthState.getState().session?.access_token ?? null;
}

export function getAuthUserId(): string | null {
  return useAuthState.getState().user?.id ?? null;
}

export function getAuthEmail(): string | null {
  return useAuthState.getState().user?.email ?? null;
}

export function getAuthDisplayName(): string | null {
  return useAuthState.getState().displayName ?? null;
}

export function getAuthFirstName(): string | null {
  return useAuthState.getState().firstName ?? null;
}

export function getAuthToneGender(): UserToneGender {
  return useAuthState.getState().toneGender ?? "neutral";
}

export function getAuthRole(): string | null {
  return getEffectiveRoleFromState(useAuthState.getState());
}

function getRoleFromMetadata(user: User | null): string | null {
  if (!user) return null;
  const roleValue =
    user.user_metadata?.role ??
    user.app_metadata?.role ??
    user.user_metadata?.user_role ??
    user.app_metadata?.user_role;
  return typeof roleValue === "string" && roleValue.trim() ? roleValue.trim() : null;
}

async function syncAuthRole(session: Session | null): Promise<void> {
  const user = session?.user ?? null;
  if (!user) {
    useAuthState.getState().setRole(null);
    useAuthState.getState().setTier("free");
    return;
  }

  if (!supabaseClient) {
    useAuthState.getState().setRole(getRoleFromMetadata(user));
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("role, subscription_status, ecosystem_data")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      if (typeof data.role === "string" && data.role.trim()) {
        useAuthState.getState().setRole(data.role.trim());
      }
      const tier = getTierFromProfileRow(data);
      useAuthState.getState().setTier(tier);
      if (tier === "pro") {
        markRevenueAccessUnlocked();
      }
      if (data.ecosystem_data) {
        useAuthState.getState().setEcosystemData(data.ecosystem_data as EcosystemData);
      }
      return;
    }
  } catch {
    // fallback to metadata below
  }

  useAuthState.getState().setRole(getRoleFromMetadata(user));
}

async function initSupabaseAuth(): Promise<void> {
  if (supabaseAuthInitPromise) return supabaseAuthInitPromise;

  supabaseAuthInitPromise = (async () => {
    if (supabaseAuthInitialized) return;
    supabaseAuthInitialized = true;

    if (!hasSupabaseEnv) {
      useAuthState.getState().setSession(null);
      useAuthState.getState().setRole(null);
      return;
    }

    try {
      if (!supabase) {
        useAuthState.getState().setSession(null);
        useAuthState.getState().setRole(null);
        return;
      }
      supabaseClient = supabase;
      const session = await safeGetSession();
      await syncAuthRole(session);
      useAuthState.getState().setSession(session);
      
      // P0: Link initial identity if session exists
      if (session?.user?.id) {
        void trackIdentityLinked(session.user.id);
      }

      supabase.auth.onAuthStateChange((event, nextSession) => {
        const currentSession = nextSession ?? null;
        useAuthState.getState().setSession(currentSession);
        void syncAuthRole(currentSession);

        if (event === "SIGNED_IN" && currentSession?.user?.id) {
          analyticsService.auth(AnalyticsEvents.AUTH_COMPLETED);
          void trackIdentityLinked(currentSession.user.id);
        }
      });
    } catch {
      useAuthState.getState().setSession(null);
      useAuthState.getState().setRole(null);
    }
  })().finally(() => {
    supabaseAuthInitPromise = null;
  });

  return supabaseAuthInitPromise;
}

if (typeof window !== "undefined") {
  void initSupabaseAuth();
}

if (typeof window !== "undefined" && runtimeEnv.isDev) {
  const helper = {
    get: () => getAuthRole(),
    set: (role: string) => useAuthState.getState().setRoleOverride(role),
    clear: () => useAuthState.getState().setRoleOverride(null)
  };
  (window as Window & { dawayirRole?: typeof helper }).dawayirRole = helper;
}
