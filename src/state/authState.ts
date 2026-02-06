import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../services/supabaseClient";

interface AuthState {
  status: "loading" | "ready";
  user: User | null;
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const useAuthState = create<AuthState>((set) => ({
  status: "loading",
  user: null,
  session: null,
  setSession: (session) => set({ session, user: session?.user ?? null, status: "ready" })
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

if (typeof window !== "undefined" && supabase) {
  supabase.auth.getSession().then(({ data }) => {
    useAuthState.getState().setSession(data.session ?? null);
  });
  supabase.auth.onAuthStateChange((_event, session) => {
    useAuthState.getState().setSession(session ?? null);
  });
}
