/* eslint-disable react-refresh/only-export-components */
import type { Metadata } from "next";
import ContactPage from "../../src/modules/meta/ContactPage";

export const metadata: Metadata = {
  title: "تواصل معنا — الرحلة",
  description:
    "تواصل مع فريق الرحلة عبر واتساب أو البريد الإلكتروني. نحن هنا لنسمع أسئلتك وأفكارك واقتراحاتك — كل رسالة تُقرأ باهتمام.",
  alternates: { canonical: "https://www.alrehla.app/contact" },
  openGraph: {
    title: "تواصل معنا — الرحلة",
    description: "نحن هنا لنسمع — سواء كان سؤالاً أو فكرة أو شراكة.",
    url: "https://www.alrehla.app/contact",
    siteName: "الرحلة",
    locale: "ar_AR",
    type: "website",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "تواصل مع الرحلة",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "تواصل معنا — الرحلة",
    description: "نحن هنا لنسمع — سواء كان سؤالاً أو فكرة أو شراكة.",
    images: ["/og-home-optimized.jpg"],
  },
};

export default function ContactRoute() {
  return <ContactPage />;
}
