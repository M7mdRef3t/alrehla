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

import Script from "next/script";

export default function RootLayout({ children }: { children: ReactNode }) {
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID || "964579425998794";

  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Almarai:wght@300;400;700;800&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@400;500;600;700;800;900&family=Tajawal:wght@400;500;700;800;900&display=swap"
        />
        <Script
          id="meta-pixel"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${pixelId}');
              fbq('track', 'PageView');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
