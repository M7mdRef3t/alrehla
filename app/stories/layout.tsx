import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قصص النجاح — الرحلة",
  description:
    "اكتشف كيف ساعدت الرحلة مئات الأشخاص على فهم أنفسهم وعلاقاتهم. قصص حقيقية من أناس حققوا تحولاً جذرياً في حياتهم.",
  openGraph: {
    title: "قصص النجاح — الرحلة",
    description: "قصص حقيقية من رحلات حقيقية",
    url: "https://www.alrehla.app/stories",
    siteName: "الرحلة",
    locale: "ar_SA",
    type: "website",
  },
  alternates: { canonical: "https://www.alrehla.app/stories" },
};

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
