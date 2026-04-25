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
import { supabase as supabaseClient } from "@/services/supabaseClient";
import { ProfileService } from "@/services/profileService";
import { logger } from "@/services/logger";
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
  bio: string | null;
  ecosystemData: EcosystemData | null;
  setSession: (session: Session | null) => void;
  setRole: (role: string | null) => void;
  setRoleOverride: (role: string | null) => void;
  setTier: (tier: SubscriptionTier) => void;
  setBio: (bio: string | null) => void;
  setDisplayName: (name: string | null) => void;
  setEcosystemData: (data: EcosystemData | null) => void;
  updateEcosystemData: (data: Partial<EcosystemData>) => Promise<{ error: any }>;
}

const ROLE_OVERRIDE_KEY = "dawayir-role-override";
const LEGACY_ROLE_OVERRIDE_QUERY_KEY = "asRole";
const hasSupabaseEnv = Boolean(runtimeEnv.supabaseUrl && runtimeEnv.supabaseAnonKey);
let supabaseClientInstance: SupabaseClient | null = null;
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

  if (runtimeEnv.isDev) {
    const stored = getFromLocalStorage(ROLE_OVERRIDE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  }

  const stored = normalizeRole(getFromLocalStorage(ROLE_OVERRIDE_KEY));
  return stored === "user" ? "user" : null;
}

export const useAuthState = create<AuthState>((set, get) => ({
  status: "loading",
  user: null,
  session: null,
  displayName: null,
  firstName: null,
  toneGender: "neutral",
  role: null,
  roleOverride: getInitialRoleOverride(),
  tier: "free",
  bio: null,
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
  setBio: (bio) => set({ bio }),
  setDisplayName: (name) => set({ displayName: name, firstName: getFirstName(name) }),
  setEcosystemData: (data) => set({ ecosystemData: data }),
  updateEcosystemData: async (data) => {
    const { error } = await ProfileService.updateEcosystemData(data);
    if (!error) {
      const current = get().ecosystemData || {};
      set({
        ecosystemData: {
          ...current,
          ...data,
          satellite_metrics: {
            ...(current.satellite_metrics || {}),
            ...(data.satellite_metrics || {}),
          },
        } as EcosystemData,
      });
    }
    return { error };
  },
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
    useAuthState.getState().setBio(null);
    return;
  }

  // Baseline role from metadata
  let activeRole = getRoleFromMetadata(user);
  let tier: SubscriptionTier = "free";

  if (!supabaseClientInstance) {
    useAuthState.getState().setRole(activeRole);
    return;
  }

  try {
    const { data, error } = await supabaseClientInstance
      .from("profiles")
      .select("role, subscription_status, ecosystem_data, bio, basma_data")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) {
      // Use profile role if available, otherwise stay with metadata role
      if (typeof data.role === "string" && data.role.trim()) {
        activeRole = data.role.trim();
      }
      
      tier = getTierFromProfileRow(data);
      
      if (data.ecosystem_data) {
        useAuthState.getState().setEcosystemData(data.ecosystem_data as EcosystemData);
      }
      if (typeof data.bio === "string") {
        useAuthState.getState().setBio(data.bio);
      }
      if (data.basma_data) {
        import("@/modules/basma/store/basma.store").then(m => {
          m.useBasmaState.getState().setFullState(data.basma_data);
        }).catch(err => logger.error("Failed to load basma store from syncAuthRole", { error: err }));
      }
    } else if (error) {
      logger.error("Error syncing auth role from profile", { error });
    }
  } catch (err) {
    logger.error("Unexpected error in syncAuthRole", { error: err });
  }

  // Final updates
  useAuthState.getState().setRole(activeRole);
  useAuthState.getState().setTier(tier);
  if (tier === "pro") {
    markRevenueAccessUnlocked();
  }
}

export async function updateBio(bio: string): Promise<{ error: any }> {
  const user = useAuthState.getState().user;
  if (!user) return { error: new Error("No authenticated user") };

  const { error } = await ProfileService.updateBio(user.id, bio);
  if (!error) {
    useAuthState.getState().setBio(bio);
  }
  return { error };
}

export async function updateDisplayName(displayName: string): Promise<{ error: any }> {
  const user = useAuthState.getState().user;
  if (!user) return { error: new Error("No authenticated user") };

  const { error } = await ProfileService.updateDisplayName(user.id, displayName);
  if (!error) {
    useAuthState.getState().setDisplayName(displayName);
    
    // Also update Supabase Auth metadata for redundancy
    if (supabase) {
      await supabase.auth.updateUser({
        data: { full_name: displayName }
      });
    }
  }
  return { error };
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
      supabaseClientInstance = supabase;
      const session = await safeGetSession();
      
      await syncAuthRole(session);
      useAuthState.getState().setSession(session);
      
      if (useAuthState.getState().status === "loading") {
        useAuthState.setState({ status: "ready" });
      }

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
    } catch (err) {
      logger.error("Failed to initialize Supabase Auth:", { error: err });
      useAuthState.getState().setSession(null);
      useAuthState.getState().setRole(null);
      if (useAuthState.getState().status === "loading") {
        useAuthState.setState({ status: "ready" });
      }
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
