import { Render, type Data } from "@measured/puck";
import { config } from "@/puck.config";

export function PuckLandingAdapter({ data }: { data: Data | null | undefined }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="p-8 text-center text-on-surface">Ù„Ù… ÙŠØªÙ… Ù†Ø´Ø± Ø§Ù„ØµÙØ­Ø© Ø¨Ø¹Ø¯ Ø£Ùˆ Ù„Ø§ ÙŠÙˆØ¬Ø¯ Ù…Ø­ØªÙˆÙ‰.</p>;
  }
  return <Render config={config} data={data} />;
}

