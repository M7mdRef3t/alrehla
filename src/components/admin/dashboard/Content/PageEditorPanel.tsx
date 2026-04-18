"use client";

import React, { useEffect, useState } from "react";
import { EditorClient } from "../../../../../app/editor/[[...puckPath]]/client";
import { getEditorTemplate } from "@/editor/editorTemplates";
import { supabase } from "@/services/supabaseClient";
import { AwarenessSkeleton } from "@/modules/meta/AwarenessSkeleton";
import { Data } from "@measured/puck";

export const PageEditorPanel: React.FC = () => {
  const [initialData, setInitialData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const path = "/"; // Default to root for dashboard view

  useEffect(() => {
    async function loadData() {
      let data = getEditorTemplate(path);

      try {
        if (!supabase) throw new Error("Supabase is not initialized");
        const { data: dbData, error } = await supabase?.from("dawayir_pages")
          .select("data")
          .eq("path", path)
          .maybeSingle();

        if (!error && dbData?.data) {
          data = dbData.data;
        }
      } catch (err) {
        console.error("Failed to fetch page data from DB:", err);
      }

      setInitialData(data);
      setLoading(false);
    }

    void loadData();
  }, [path]);

  if (loading || !initialData) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <AwarenessSkeleton />
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[800px] border border-white/10 bg-slate-950 relative shadow-2xl overflow-hidden">
      <div className="absolute inset-0">
         <EditorClient path={path} initialData={initialData} />
      </div>
    </div>
  );
};
