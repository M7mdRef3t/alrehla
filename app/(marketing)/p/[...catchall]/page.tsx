import { PLASMIC } from "@/plasmic-init";
import { extractPlasmicQueryData } from "@plasmicapp/loader-nextjs";
import { notFound } from "next/navigation";
import { PlasmicComponent } from "@plasmicapp/loader-nextjs";

export const revalidate = 60; // ISR Trigger every 60 seconds

export default async function PlasmicMarketingPage({
  params,
  searchParams,
}: {
  params: { catchall: string[] };
  searchParams: Record<string, string | string[]>;
}) {
  const plasmicPath = "/" + (params.catchall?.join("/") || "");

  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);

  if (!plasmicData) {
    notFound();
  }

  return (
    <div className="bg-[#030712] min-h-screen text-white font-sans overflow-x-hidden">
        <PlasmicComponent 
            component={plasmicData.entryCompMetas[0].name} 
        />
    </div>
  );
}
