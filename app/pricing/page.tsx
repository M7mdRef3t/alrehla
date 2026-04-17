/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import PricingPage from "../../src/modules/pricing/PricingPage";

export const metadata: Metadata = {
  title: "باقات الرحلة — خطط واضحة ومرنة",
  description:
    "اختر الخطة المناسبة لك في الرحلة. باقات مرنة تبدأ من المجاني للاستخدام الشخصي حتى الباقات المتقدمة مع تحليلات الذكاء الاصطناعي الكاملة.",
  alternates: { canonical: "https://www.alrehla.app/pricing" },
  openGraph: {
    title: "باقات الرحلة — خطط واضحة ومرنة",
    description:
      "اختر الخطة المناسبة لك — باقات مرنة تبدأ مجاناً.",
    url: "https://www.alrehla.app/pricing",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "باقات الرحلة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "باقات الرحلة — خطط واضحة ومرنة",
    description:
      "اختر الخطة المناسبة لك — باقات مرنة تبدأ مجاناً.",
    images: ["/og-home-optimized.jpg"],
  },
};

export default function PricingRoute() {
  return <PricingPage />;
}
