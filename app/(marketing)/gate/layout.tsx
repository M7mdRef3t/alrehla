import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "بوابة الوصول | الرحلة",
  description: "سجل بريدك الإلكتروني لفتح بوابة الوصول إلى خريطة علاقاتك وفهم وضوحك الشخصي.",
  alternates: {
    canonical: "/gate"
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.alrehla.app/gate",
    siteName: "الرحلة",
    title: "بوابة الوصول | الرحلة",
    description: "سجل بريدك الإلكتروني لفتح بوابة الوصول إلى خريطة علاقاتك وفهم وضوحك الشخصي.",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "بوابة الوصول للمنصة"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "بوابة الوصول | الرحلة",
    description: "سجل بريدك الإلكتروني لفتح بوابة الوصول إلى خريطة علاقاتك وفهم وضوحك الشخصي.",
    images: ["/og-home.png"]
  }
};

export default function GateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
