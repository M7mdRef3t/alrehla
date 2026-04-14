/* eslint-disable react-refresh/only-export-components */
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ConsciousnessSensoryProvider } from "@/components/providers/ConsciousnessSensoryProvider";
import { WhisperOverlay } from "@/components/ui/WhisperOverlay";
import { SovereignReceiver } from "@/components/providers/SovereignReceiver";
import { SovereignThemeSync } from "@/components/providers/SovereignThemeSync";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alrehla.app"),
  title: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
  description: "ابدأ رحلتك — اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
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
    title: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
    description: "ابدأ رحلتك — اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "الرحلة — بوصلة الوعي الذاتي"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
    description: "ابدأ رحلتك — اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
    images: ["/og-home-optimized.jpg"]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true }
  },
  alternates: {
    canonical: "https://www.alrehla.app"
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
        {process.env.NODE_ENV !== "production" && (
          <Script
            id="silence-react-devtools-info"
            strategy="lazyOnload"
            dangerouslySetInnerHTML={{
              __html: `
                (function () {
                  try {
                    var originalInfo = console.info ? console.info.bind(console) : null;
                    if (!originalInfo) return;
                    console.info = function () {
                      var text = Array.prototype.map.call(arguments, function (item) {
                        if (typeof item === "string") return item;
                        try { return JSON.stringify(item); } catch (_) { return String(item); }
                      }).join(" ");
                      if (text.indexOf("Download the React DevTools for a better development experience") !== -1) {
                        return;
                      }
                      return originalInfo.apply(console, arguments);
                    };
                  } catch (_) {}
                })();
              `
            }}
          />
        )}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="facebook-domain-verification" content="kpz27jh9kfbty91d4ob1g1r3jtfyzo" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@200..1000&family=Noto+Kufi+Arabic:wght@100..900&display=swap"
        />
        <Script
          id="jsonld-website"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "WebSite",
                  "@id": "https://www.alrehla.app/#website",
                  "url": "https://www.alrehla.app",
                  "name": "الرحلة",
                  "description": "منصة الوعي الذاتي وخريطة العلاقات",
                  "inLanguage": "ar",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.alrehla.app/?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://www.alrehla.app/#webapp",
                  "name": "الرحلة — بوصلة الوعي الذاتي",
                  "url": "https://www.alrehla.app",
                  "applicationCategory": "HealthApplication",
                  "operatingSystem": "All",
                  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "EGP" },
                  "inLanguage": "ar",
                  "description": "أداة مجانية لاكتشاف علاقاتك وتحليل ديناميكياتها بالذكاء الاصطناعي"
                }
              ]
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ConsciousnessSensoryProvider>
            <WhisperOverlay />
            <SovereignReceiver />
            <SovereignThemeSync />
            {children}
          </ConsciousnessSensoryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
