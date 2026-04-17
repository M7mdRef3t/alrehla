/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قصص النجاح — الرحلة",
  description:
    "اكتشف كيف ساعدت الرحلة مئات الأشخاص على فهم أنفسهم وعلاقاتهم. قصص حقيقية من أناس حققوا تحولاً جذرياً في حياتهم.",
  openGraph: {
    title: "قصص النجاح — الرحلة",
    description: "قصص حقيقية من رحلات حقيقية — اكتشف كيف غيّرت الرحلة حياة الناس.",
    url: "https://www.alrehla.app/stories",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "قصص النجاح — الرحلة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "قصص النجاح — الرحلة",
    description: "قصص حقيقية من رحلات حقيقية — اكتشف كيف غيّرت الرحلة حياة الناس.",
    images: ["/og-home-optimized.jpg"],
  },
  alternates: { canonical: "https://www.alrehla.app/stories" },
};

export default function StoriesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
