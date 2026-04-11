import { EditorClient } from "./client";
import { supabaseAdmin } from "../../../src/services/supabaseClient";

export default async function EditorPage({ params }: { params: { puckPath: string[] } }) {
  const path = `/${params.puckPath?.join("/") || ""}`;

  // Initial mockup data
  let initialData = {
    content: [],
    root: {},
  };

  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('dawayir_pages')
      .select('data')
      .eq('path', path)
      .single();
      
    if (data && data.data) {
      initialData = data.data;
    }
  }

  return <EditorClient path={path} initialData={initialData} />;
}
