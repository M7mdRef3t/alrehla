import type { Metadata } from "next";

import OnboardingRouteClient from "./OnboardingRouteClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ابدأ رحلتك | الرحلة",
  description: "اكتشف خريطة علاقاتك في 3 دقائق، وابدأ أول خطوة نحو وضوح حقيقي وحدود أوضح.",
  alternates: {
    canonical: "/onboarding"
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.alrehla.app/onboarding",
    siteName: "الرحلة",
    title: "ابدأ رحلتك | الرحلة",
    description: "اكتشف خريطة علاقاتك في 3 دقائق، وابدأ أول خطوة نحو وضوح حقيقي وحدود أوضح.",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "معاينة صفحة بدء الرحلة"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "ابدأ رحلتك | الرحلة",
    description: "اكتشف خريطة علاقاتك في 3 دقائق، وابدأ أول خطوة نحو وضوح حقيقي وحدود أوضح.",
    images: ["/og-home.png"]
  }
};

export default function OnboardingPage() {
  return <OnboardingRouteClient />;
}
