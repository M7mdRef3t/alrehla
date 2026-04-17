/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";

import { LegalPage } from "@/modules/meta/LegalPage";

export const metadata: Metadata = {
  title: "سياسة الخصوصية",
  description:
    "سياسة الخصوصية لمنصة الرحلة — نشرح كيف نحمي بياناتك ونحترم خصوصيتك أثناء رحلتك في الوعي الذاتي.",
  alternates: { canonical: "https://www.alrehla.app/privacy" },
  openGraph: {
    title: "سياسة الخصوصية | الرحلة",
    description:
      "نشرح كيف نحمي بياناتك ونحترم خصوصيتك أثناء رحلتك في الوعي الذاتي.",
    url: "https://www.alrehla.app/privacy",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
  },
};

export default function PrivacyPage() {
  return <LegalPage type="privacy" />;
}
