/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";

import { LegalPage } from "@/modules/meta/LegalPage";

export const metadata: Metadata = {
  title: "الشروط والأحكام | الرحلة",
  description: "الشروط والأحكام لمنصة الرحلة."
};

export default function TermsPage() {
  return <LegalPage type="terms" />;
}

