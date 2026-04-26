import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function PlasmicMarketingPage({
  params,
}: {
  params: Promise<{ catchall: string[] }>;
}) {
  const resolvedParams = await params;
  const plasmicEnabled = process.env.ENABLE_PLASMIC_MARKETING === "true";
  if (!plasmicEnabled) {
    notFound();
  }

  const [{ PLASMIC }, { PlasmicComponent }] = await Promise.all([
    import("@/plasmic-init"),
    import("@plasmicapp/loader-nextjs"),
  ]);

  const plasmicPath = "/" + (resolvedParams.catchall?.join("/") || "");
  const plasmicData = await PLASMIC.maybeFetchComponentData(plasmicPath);

  if (!plasmicData) {
    notFound();
  }

  return (
    <div className="bg-[#030712] min-h-screen text-white font-sans overflow-x-hidden">
      <PlasmicComponent component={plasmicData.entryCompMetas[0].name} />
    </div>
  );
}
