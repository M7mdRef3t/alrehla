/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "نشرة طقس علاقاتك — الرحلة",
  description:
    "اكتشف حالة الطقس في علاقاتك في دقيقة واحدة. عواصف؟ رياح؟ صحو؟ جاوب 4 أسئلة سريعة واعرف.",
  openGraph: {
    title: "نشرة طقس علاقاتك — الرحلة",
    description:
      "اكتشف حالة الطقس في علاقاتك في دقيقة واحدة. عواصف؟ رياح؟ صحو؟",
    url: "https://www.alrehla.app/weather",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "نشرة طقس العلاقات — الرحلة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "نشرة طقس علاقاتك — الرحلة",
    description:
      "اكتشف حالة الطقس في علاقاتك في دقيقة واحدة.",
  },
};

export default function WeatherLayout({ children }: { children: ReactNode }) {
  return children;
}
