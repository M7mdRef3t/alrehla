import { create } from "zustand";
import type { Session, SupabaseClient, User } from "@supabase/supabase-js";

interface AuthState {
  status: "loading" | "ready";
  user: User | null;
  session: Session | null;
  role: string | null;
  roleOverride: string | null;
  setSession: (session: Session | null) => void;
  setRole: (role: string | null) => void;
  setRoleOverride: (role: string | null) => void;
}

const ROLE_OVERRIDE_KEY = "dawayir-role-override";
const ROLE_OVERRIDE_QUERY_KEY = "asRole";
const hasSupabaseEnv = Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
let supabaseClient: SupabaseClient | null = null;
let supabaseAuthInitialized = false;

function getRoleOverrideFromUrl(): string | null {
  if (typeof window === "undefined" || !import.meta.env.DEV) return null;
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get(ROLE_OVERRIDE_QUERY_KEY);
    if (!raw || !raw.trim()) return null;
    return raw.trim();
  } catch {
    return null;
  }
}

function getInitialRoleOverride(): string | null {
  if (typeof window === "undefined" || !import.meta.env.DEV) return null;
  const fromUrl = getRoleOverrideFromUrl();
  if (fromUrl) {
    window.localStorage.setItem(ROLE_OVERRIDE_KEY, fromUrl);
    return fromUrl;
  }
  return window.localStorage.getItem(ROLE_OVERRIDE_KEY);
}

export const useAuthState = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  session: null,
  role: null,
  roleOverride: getInitialRoleOverride(),
  setSession: (session) => set({ session, user: session?.user ?? null, status: "ready" }),
  setRole: (role) => set({ role }),
  setRoleOverride: (role) =>
    set(() => {
      const normalized = role && role.trim() ? role.trim() : null;
      if (typeof window !== "undefined" && import.meta.env.DEV) {
        if (normalized) window.localStorage.setItem(ROLE_OVERRIDE_KEY, normalized);
        else window.localStorage.removeItem(ROLE_OVERRIDE_KEY);
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

export function getAuthRole(): string | null {
  const state = useAuthState.getState();
  if (import.meta.env.DEV && state.roleOverride) return state.roleOverride;
  return state.role ?? null;
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
