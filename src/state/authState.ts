import { create } from "zustand";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";
import { isPrivilegedRole } from "../utils/featureFlags";

export type UserToneGender = "male" | "female" | "neutral";

interface AuthState {
  status: "loading" | "ready";
  user: User | null;
  session: Session | null;
  displayName: string | null;
  firstName: string | null;
  toneGender: UserToneGender;
  role: string | null;
  roleOverride: string | null;
  setSession: (session: Session | null) => void;
  setRole: (role: string | null) => void;
  setRoleOverride: (role: string | null) => void;
}

const ROLE_OVERRIDE_KEY = "dawayir-role-override";
// Legacy: the app used to support role overrides via `?asRole=...`.
// This caused confusing URLs and made "owner" vs "developer" feel the same.
// We now strip it on load and rely on localStorage + UI controls instead.
const LEGACY_ROLE_OVERRIDE_QUERY_KEY = "asRole";
const hasSupabaseEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
let supabaseClient: SupabaseClient | null = null;
let supabaseAuthInitialized = false;

function normalizeToneGender(raw: unknown): UserToneGender {
  if (raw === "male" || raw === "female" || raw === "neutral") return raw;
  return "neutral";
}

function normalizeRole(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim().toLowerCase();
  return value ? value : null;
}

export function getEffectiveRoleFromState(
  state: Pick<AuthState, "role" | "roleOverride">,
  options?: { isDev?: boolean }
): string | null {
  const base = normalizeRole(state.role);
  const override = normalizeRole(state.roleOverride);
  if (!override) return base;

  const isDev = options?.isDev ?? import.meta.env.DEV;
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
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has(LEGACY_ROLE_OVERRIDE_QUERY_KEY)) return;
    url.searchParams.delete(LEGACY_ROLE_OVERRIDE_QUERY_KEY);
    window.history.replaceState({}, "", url.toString());
  } catch {
    // ignore URL update errors
  }
}

function getInitialRoleOverride(): string | null {
  if (typeof window === "undefined") return null;

  // ?asRole=user → وضع المستخدم: نطبّق ونمسح الرابط.
  try {
    const url = new URL(window.location.href);
    const fromUrl = normalizeRole(url.searchParams.get(LEGACY_ROLE_OVERRIDE_QUERY_KEY));
    if (fromUrl === "user") {
      if (window.localStorage) window.localStorage.setItem(ROLE_OVERRIDE_KEY, "user");
      stripLegacyRoleOverrideQueryParam();
      return "user";
    }
  } catch {
    /* ignore */
  }

  stripLegacyRoleOverrideQueryParam();

  // DEV: allow overriding via localStorage for fast testing.
  if (import.meta.env.DEV) {
    const stored = window.localStorage.getItem(ROLE_OVERRIDE_KEY);
    return stored && stored.trim() ? stored.trim() : null;
  }

  // Production: allow a persisted *down-scope* to `user` only.
  const stored = normalizeRole(window.localStorage.getItem(ROLE_OVERRIDE_KEY));
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
        if (import.meta.env.DEV) {
          if (normalized) window.localStorage.setItem(ROLE_OVERRIDE_KEY, normalized);
          else window.localStorage.removeItem(ROLE_OVERRIDE_KEY);
        } else {
          const safe = normalizeRole(normalized);
          if (safe === "user") window.localStorage.setItem(ROLE_OVERRIDE_KEY, "user");
          else window.localStorage.removeItem(ROLE_OVERRIDE_KEY);
        }
      }
      return { roleOverride: normalized };
    })
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
    return;
  }

  if (!supabaseClient) {
    useAuthState.getState().setRole(getRoleFromMetadata(user));
    return;
  }

  try {
    const { data, error } = await supabaseClient
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (!error && data && typeof data.role === "string" && data.role.trim()) {
      useAuthState.getState().setRole(data.role.trim());
      return;
    }
  } catch {
    // fallback to metadata below
  }

  useAuthState.getState().setRole(getRoleFromMetadata(user));
}

async function initSupabaseAuth(): Promise<void> {
  if (supabaseAuthInitialized) return;
  supabaseAuthInitialized = true;

  if (!hasSupabaseEnv) {
    useAuthState.getState().setSession(null);
    useAuthState.getState().setRole(null);
    return;
  }

  try {
    const { supabase } = await import("../services/supabaseClient");
    if (!supabase) {
      useAuthState.getState().setSession(null);
      useAuthState.getState().setRole(null);
      return;
    }
    supabaseClient = supabase;
    const { data } = await supabase.auth.getSession();
    const session = data.session ?? null;
    useAuthState.getState().setSession(session);
    void syncAuthRole(session);
    supabase.auth.onAuthStateChange((_event, nextSession) => {
      const currentSession = nextSession ?? null;
      useAuthState.getState().setSession(currentSession);
      void syncAuthRole(currentSession);
    });
  } catch {
    useAuthState.getState().setSession(null);
    useAuthState.getState().setRole(null);
  }
}

if (typeof window !== "undefined") {
  void initSupabaseAuth();
}

if (typeof window !== "undefined" && import.meta.env.DEV) {
  const helper = {
    get: () => getAuthRole(),
    set: (role: string) => useAuthState.getState().setRoleOverride(role),
    clear: () => useAuthState.getState().setRoleOverride(null)
  };
  (window as Window & { dawayirRole?: typeof helper }).dawayirRole = helper;
}
