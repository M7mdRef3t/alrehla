/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";

import { LegalPage } from "@/modules/meta/LegalPage";

export const metadata: Metadata = {
  title: "الشروط والأحكام",
  description:
    "الشروط والأحكام لمنصة الرحلة — اقرأ الشروط التي تحكم استخدامك للمنصة وأدوات الوعي الذاتي.",
  alternates: { canonical: "https://www.alrehla.app/terms" },
  openGraph: {
    title: "الشروط والأحكام | الرحلة",
    description:
      "اقرأ الشروط التي تحكم استخدامك لمنصة الرحلة وأدوات الوعي الذاتي.",
    url: "https://www.alrehla.app/terms",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
  },
};

export default function TermsPage() {
  return <LegalPage type="terms" />;
}
