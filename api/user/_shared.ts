import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "";

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let cachedClient: SupabaseClient | null = null;

export function getServiceSupabase(): SupabaseClient | null {
  if (!supabaseUrl || !serviceRoleKey) return null;
  if (!cachedClient) {
    cachedClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });
  }
  return cachedClient;
}

export function getDeviceToken(req: any): string | null {
  const token = req.headers?.["x-device-token"] || req.headers?.["X-Device-Token"];
  if (typeof token !== "string") return null;
  const trimmed = token.trim();
  return trimmed.length >= 20 ? trimmed : null;
}

export function getAuthToken(req: any): string | null {
  const auth = req.headers?.authorization || req.headers?.Authorization;
  if (typeof auth !== "string") return null;
  if (auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return null;
}

export async function getAuthUserId(req: any, client: SupabaseClient): Promise<string | null> {
  const token = getAuthToken(req);
  if (!token) return null;
  const { data, error } = await client.auth.getUser(token);
  if (error || !data?.user?.id) return null;
  return data.user.id;
}

export async function parseJsonBody(req: any): Promise<any> {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}
