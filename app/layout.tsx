/* eslint-disable react-refresh/only-export-components */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alrehla.app"),
  title: "الرحلة — منصة الوعي الذاتي وخريطة العلاقات",
  description: "اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.alrehla.app/",
    siteName: "الرحلة",
    title: "الرحلة — منصة الوعي الذاتي وخريطة العلاقات",
    description: "اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
    images: [
      {
        url: "/og-home.png",
        width: 1200,
        height: 630,
        alt: "الرحلة — منصة الوعي الذاتي"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "الرحلة — منصة الوعي الذاتي وخريطة العلاقات",
    description: "اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
    images: ["/og-home.png"]
  }
};

export const viewport: Viewport = {
  themeColor: "#0D9488",
  colorScheme: "dark light"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>{children}</body>
    </html>
  );
}
