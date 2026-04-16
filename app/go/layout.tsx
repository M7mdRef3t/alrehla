import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "صديقك يدعوك للرحلة | الرحلة",
  description: "اكتشف خريطة علاقاتك في 3 دقائق — صديقك بدأ رحلته وعايزك تبدأ معاه. افهم مين في حياتك في الدائرة الخضراء ومين محتاج يتحرك.",
  alternates: {
    canonical: "/go"
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.alrehla.app/go",
    siteName: "الرحلة",
    title: "صديقك يدعوك لاكتشاف خريطة علاقاتك",
    description: "ابدأ رحلتك في 3 دقائق — اكتشف خريطة دوائرك وافهم علاقاتك بوضوح.",
    images: [
      {
        url: "/api/og?type=referral",
        width: 1200,
        height: 630,
        alt: "دعوة للرحلة"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "صديقك يدعوك لاكتشاف خريطة علاقاتك",
    description: "ابدأ رحلتك في 3 دقائق — اكتشف خريطة دوائرك.",
    images: ["/api/og?type=referral"]
  }
};

export default function ReferralLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
