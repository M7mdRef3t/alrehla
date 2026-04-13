import { EditorClient } from "./client";
import { supabaseAdmin } from "../../../src/services/supabaseClient";
import { getEditorTemplate } from "../../../src/editor/editorTemplates";

export default async function EditorPage({ params }: { params: { puckPath: string[] } }) {
  const path = `/${params.puckPath?.join("/") || ""}`;

  let initialData = getEditorTemplate(path);

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("dawayir_pages")
        .select("data")
        .eq("path", path)
        .maybeSingle();

      if (!error && data?.data) {
        initialData = data.data;
      }
    } catch {
      // Fall back to the local editor template if the database lookup fails.
    }
  }

  return <EditorClient path={path} initialData={initialData} />;
}
