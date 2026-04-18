import React, { Suspense, lazy, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supabase } from "@/services/supabaseClient";

interface EvolutionarySynapseProps {
  componentId: string;
  DefaultComponent: React.ComponentType<any>;
  componentProps?: any;
}

/**
 * EvolutionarySynapse — المحرك الجيني للواجهة 🧬
 * يقوم بتبديل المكونات الأصلية بنسخ "متطورة" يولدها الوكيل الذكي.
 */
export const EvolutionarySynapse: React.FC<EvolutionarySynapseProps> = ({
  componentId,
  DefaultComponent,
  componentProps = {}
}) => {
  const [ActiveVariant, setActiveVariant] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMutation = async () => {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("ui_mutations")
          .select("variant_path")
          .eq("component_id", componentId)
          .eq("is_active", true)
          .maybeSingle();

        if (data?.variant_path) {
          // Dynamic import based on the path registered by the agent
          // NOTE: Path must be relative to the src/evolution folder for the build system to find it
          const Variant = dynamic(() => import(`@/evolution/${data.variant_path}`), {
            loading: () => <DefaultComponent {...componentProps} />,
            ssr: false // Keep it client-side for faster hot-swapping
          });
          setActiveVariant(() => Variant);
        }
      } catch (err) {
        console.error(`[EvolutionarySynapse] Mutation failed for ${componentId}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchMutation();
  }, [componentId]);

  if (loading || !ActiveVariant) {
    return <DefaultComponent {...componentProps} />;
  }

  return (
    <Suspense fallback={<DefaultComponent {...componentProps} />}>
      <ActiveVariant {...componentProps} />
    </Suspense>
  );
};
