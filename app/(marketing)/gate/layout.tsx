/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "ابدأ رحلتك — بوابة الاكتشاف",
  description:
    "ابدأ رحلتك في اكتشاف نفسك وعلاقاتك. أجب على أسئلة بسيطة واحصل على خريطة علاقاتك المخصصة بالذكاء الاصطناعي — مجاناً وبدون تسجيل.",
  alternates: { canonical: "https://www.alrehla.app/gate" },
  openGraph: {
    title: "ابدأ رحلتك — بوابة الاكتشاف | الرحلة",
    description:
      "أجب على أسئلة بسيطة واحصل على خريطة علاقاتك المخصصة بالذكاء الاصطناعي — مجاناً.",
    url: "https://www.alrehla.app/gate",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "بوابة الاكتشاف — الرحلة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ابدأ رحلتك — بوابة الاكتشاف | الرحلة",
    description:
      "أجب على أسئلة بسيطة واحصل على خريطة علاقاتك — مجاناً.",
    images: ["/og-home-optimized.jpg"],
  },
};

export default function GateLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
