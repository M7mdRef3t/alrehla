import { Render } from "@measured/puck";
import { config } from "@/puck.config";

export function PuckLandingAdapter({ data }: { data: any }) {
  if (!data || Object.keys(data).length === 0) {
    return <p className="p-8 text-center text-on-surface">لم يتم نشر الصفحة بعد أو لا يوجد محتوى.</p>;
  }
  return <Render config={config} data={data} />;
}
