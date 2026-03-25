import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "لماذا الرحلة؟ — فلسفتنا وقيمنا",
  description:
    "تعرف على الرحلة — منصة الوعي الذاتي وخريطة العلاقات. نؤمن أن التغيير الحقيقي يبدأ من داخل. اكتشف قيمنا، فلسفتنا، وما الذي يجعلنا مختلفين.",
  openGraph: {
    title: "لماذا الرحلة؟",
    description: "منصة وعي ذاتي تجمع علم النفس والذكاء الاصطناعي",
    url: "https://www.alrehla.app/about",
    siteName: "الرحلة",
    locale: "ar_SA",
    type: "website",
  },
  alternates: { canonical: "https://www.alrehla.app/about" },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
