import type { Metadata } from "next";
import ClientAppEntry from "../client-app-entry";

export const metadata: Metadata = {
  title: "الدوائر — ذكاء العلاقات",
  description:
    "اكتشف الأنماط الخفية في علاقاتك الاجتماعية. من يستنزفك ومن يمنحك القوة؟ خريطة تفاعلية بالذكاء الاصطناعي لفهم ديناميكيات حياتك الاجتماعية.",
  alternates: { canonical: "https://www.alrehla.app/dawayir" },
  openGraph: {
    title: "الدوائر — ذكاء العلاقات | الرحلة",
    description:
      "خريطة تفاعلية بالذكاء الاصطناعي لفهم ديناميكيات حياتك الاجتماعية.",
    url: "https://www.alrehla.app/dawayir",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "الدوائر — خريطة العلاقات",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "الدوائر — ذكاء العلاقات | الرحلة",
    description: "خريطة تفاعلية لفهم مَن يشحنك ومَن يستنزفك.",
    images: ["/og-home-optimized.jpg"],
  },
};

export default function DawayirPage() {
  return <ClientAppEntry />;
}
