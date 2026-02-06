import type { AuthResponse } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

export async function signInWithEmail(email: string, password: string): Promise<AuthResponse> {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: new Error("Supabase غير متاح")
    } as AuthResponse;
  }
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResponse> {
  if (!supabase) {
    return {
      data: { user: null, session: null },
      error: new Error("Supabase غير متاح")
    } as AuthResponse;
  }
  return supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function getSession() {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}
