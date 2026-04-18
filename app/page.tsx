import ClientAppEntry from "./client-app-entry";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

export default async function Page() {
  if (process.env.NODE_ENV !== "production") {
    return <ClientAppEntry puckData={null} />;
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.warn(
      "[Homepage] Missing Supabase configuration. Falling back to landing screen."
    );
    return <ClientAppEntry puckData={null} />;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let pageData = null;

  try {
    const { data, error } = await supabase
      .from("dawayir_pages")
      .select("data")
      .eq("path", "/")
      .single();

    if (error) {
      console.warn("[Homepage] Supabase query error:", error.message || error);
    }

    pageData = data?.data ?? null;
  } catch (error) {
    console.warn("[Homepage] Supabase request failed:", error);
  }

  return <ClientAppEntry puckData={pageData} />;
}
