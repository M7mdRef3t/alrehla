import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alrehla.app"),
  title: "Alrehla | Relationship Clarity Platform",
  description: "Alrehla helps you understand your relationships and boundaries with clarity through Dawayir.",
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.alrehla.app/",
    siteName: "Alrehla",
    title: "Alrehla | Relationship Clarity Platform",
    description: "Alrehla helps you understand your relationships and boundaries with clarity through Dawayir.",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "Alrehla homepage preview"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Alrehla | Relationship Clarity Platform",
    description: "Alrehla helps you understand your relationships and boundaries with clarity through Dawayir.",
    images: ["/og-home.png"]
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
