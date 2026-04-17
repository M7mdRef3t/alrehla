/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لماذا الرحلة؟ — فلسفتنا وقيمنا",
  description:
    "تعرف على الرحلة — منصة الوعي الذاتي وخريطة العلاقات. نؤمن أن التغيير الحقيقي يبدأ من داخل. اكتشف قيمنا، فلسفتنا، وما الذي يجعلنا مختلفين.",
  openGraph: {
    title: "لماذا الرحلة؟ — فلسفتنا وقيمنا",
    description: "منصة وعي ذاتي تجمع علم النفس والذكاء الاصطناعي — اكتشف قيمنا وما الذي يجعلنا مختلفين.",
    url: "https://www.alrehla.app/about",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "عن الرحلة — فلسفتنا وقيمنا",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "لماذا الرحلة؟ — فلسفتنا وقيمنا",
    description: "منصة وعي ذاتي تجمع علم النفس والذكاء الاصطناعي.",
    images: ["/og-home-optimized.jpg"],
  },
  alternates: { canonical: "https://www.alrehla.app/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
