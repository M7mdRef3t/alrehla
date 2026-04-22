/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import { Suspense } from "react";
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
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <OnboardingRouteClient />
    </Suspense>
  );
}
