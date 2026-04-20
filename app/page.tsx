import ClientAppEntry from "./client-app-entry";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;
const HOMEPAGE_SUPABASE_TIMEOUT_MS = 5000;
const isDevRuntime = process.env.NODE_ENV !== "production";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

export default async function Page() {
  if (isDevRuntime) {
    return <ClientAppEntry puckData={null} forceLanding />;
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
    const homepageQuery = supabase
      .from("dawayir_pages")
      .select("data")
      .eq("path", "/")
      .single();

    const timeoutResult = Symbol("homepage-timeout");
    const queryResult = await Promise.race([
      homepageQuery,
      new Promise<typeof timeoutResult>((resolve) => {
        setTimeout(() => resolve(timeoutResult), HOMEPAGE_SUPABASE_TIMEOUT_MS);
      }),
    ]);

    if (queryResult === timeoutResult) {
      console.warn(
        `[Homepage] Supabase query timed out after ${HOMEPAGE_SUPABASE_TIMEOUT_MS}ms. Falling back to landing screen.`
      );
      return <ClientAppEntry puckData={null} />;
    }

    const { data, error } = queryResult;

    if (error) {
      console.warn("[Homepage] Supabase query error:", error.message || error);
    }

    // FORCE SOVEREIGN OVERRIDE: 
    // We intentionally bypass the CMS data to render our newly restored
    // "Peak Sovereignty" local components (Hafiz, Sada, Markaz, Hero High-Fidelity).
    pageData = null; 
  } catch (error) {
    console.warn("[Homepage] Supabase request failed:", error);
  }

  return <ClientAppEntry puckData={pageData} />;
}
