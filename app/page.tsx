import ClientAppEntry from "./client-app-entry";
import { createClient } from "@supabase/supabase-js";

export const revalidate = 0;

export default async function Page() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const { data } = await supabase.from("dawayir_pages").select("data").eq("path", "/").single();

  return <ClientAppEntry puckData={data?.data || null} />;
}
