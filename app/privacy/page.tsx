import type { Metadata } from "next";

import { LegalPage } from "../../src/components/LegalPage";

export const metadata: Metadata = {
  title: "سياسة الخصوصية | الرحلة",
  description: "سياسة الخصوصية لمنصة الرحلة."
};

export default function PrivacyPage() {
  return <LegalPage type="privacy" />;
}

