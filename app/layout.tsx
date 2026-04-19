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
import ClarityInit from "@/components/analytics/ClarityInit";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.alrehla.app"),
  title: {
    default: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
    template: "%s | الرحلة",
  },
  description:
    "ابدأ رحلتك — اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل. منصة عربية لفهم الذات وتحسين العلاقات.",
  keywords: [
    "الرحلة",
    "وعي ذاتي",
    "خريطة العلاقات",
    "تحليل العلاقات",
    "ذكاء اصطناعي",
    "صحة نفسية",
    "تطوير الذات",
    "علم النفس",
    "فهم النفس",
    "alrehla",
    "self awareness",
    "relationship map",
    "AI psychology",
    "mental health arabic",
    "تحليل الشخصية",
    "دوائر العلاقات",
    "طقس العلاقات",
    "نشرة طقس علاقاتك",
  ],
  authors: [{ name: "الرحلة", url: "https://www.alrehla.app" }],
  creator: "الرحلة",
  publisher: "الرحلة",
  category: "Health & Wellness",
  manifest: "/manifest.json",
  // Google Search Console & Bing Webmaster verification
  // Replace GOOGLE_VERIFICATION_CODE and BING_VERIFICATION_CODE with your actual codes
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "",
    other: {
      "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION || "",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "ar_AR",
    url: "https://www.alrehla.app/",
    siteName: "الرحلة",
    title: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
    description:
      "ابدأ رحلتك — اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
    images: [
      {
        url: "/og-home-optimized.jpg",
        width: 1200,
        height: 630,
        alt: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@alrehla_app",
    creator: "@alrehla_app",
    title: "الرحلة — بوصلة الوعي الذاتي وخريطة العلاقات",
    description:
      "ابدأ رحلتك — اكتشف خريطة علاقاتك في 3 دقائق. شوف مين بيشحنك ومين بيستنزفك بالذكاء الاصطناعي — بدون تسجيل.",
    images: ["/og-home-optimized.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://www.alrehla.app",
  },
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
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  try {
                    const originalInfo = console.info;
                    if (!originalInfo) return;
                    console.info = function(...args) {
                      const text = args.map(arg => String(arg)).join(" ");
                      if (text.includes("Download the React DevTools")) return;
                      originalInfo.apply(console, args);
                    };
                  } catch (e) {}
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
                  "alternateName": ["Alrehla", "الرحلة - بوصلة الوعي الذاتي"],
                  "description": "منصة عربية للوعي الذاتي وخريطة العلاقات — اكتشف نفسك وعلاقاتك بالذكاء الاصطناعي",
                  "inLanguage": "ar",
                  "potentialAction": {
                    "@type": "SearchAction",
                    "target": "https://www.alrehla.app/?q={search_term_string}",
                    "query-input": "required name=search_term_string"
                  }
                },
                {
                  "@type": "Organization",
                  "@id": "https://www.alrehla.app/#organization",
                  "name": "الرحلة",
                  "alternateName": "Alrehla",
                  "url": "https://www.alrehla.app",
                  "logo": {
                    "@type": "ImageObject",
                    "url": "https://www.alrehla.app/icons/icon-512x512.png",
                    "width": 512,
                    "height": 512
                  },
                  "sameAs": [
                    "https://www.facebook.com/alrehla.app",
                    "https://www.instagram.com/alrehla.app",
                    "https://twitter.com/alrehla_app"
                  ],
                  "contactPoint": {
                    "@type": "ContactPoint",
                    "contactType": "customer support",
                    "availableLanguage": ["Arabic", "English"],
                    "url": "https://wa.me/201023050092"
                  }
                },
                {
                  "@type": "WebApplication",
                  "@id": "https://www.alrehla.app/#webapp",
                  "name": "الرحلة — بوصلة الوعي الذاتي",
                  "url": "https://www.alrehla.app",
                  "applicationCategory": "HealthApplication",
                  "applicationSubCategory": "Mental Health & Self-Awareness",
                  "operatingSystem": "All",
                  "browserRequirements": "Requires JavaScript",
                  "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "EGP",
                    "availability": "https://schema.org/InStock"
                  },
                  "inLanguage": "ar",
                  "description": "أداة مجانية لاكتشاف علاقاتك وتحليل ديناميكياتها بالذكاء الاصطناعي — خريطة دواير، نشرة طقس العلاقات، ومرآة الذات",
                  "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.8",
                    "reviewCount": "150",
                    "bestRating": "5"
                  },
                  "publisher": { "@id": "https://www.alrehla.app/#organization" }
                },
                {
                  "@type": "FAQPage",
                  "@id": "https://www.alrehla.app/#faq",
                  "mainEntity": [
                    {
                      "@type": "Question",
                      "name": "ما هي الرحلة؟",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "الرحلة هي منصة عربية للوعي الذاتي تستخدم الذكاء الاصطناعي لمساعدتك على فهم علاقاتك وأنماطك النفسية. تقدم أدوات مثل خريطة الدوائر ونشرة طقس العلاقات ومرآة الذات."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "هل الرحلة مجانية؟",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "نعم، يمكنك البدء مجاناً واكتشاف خريطة علاقاتك في 3 دقائق بدون تسجيل. باقات إضافية متاحة لتجربة أعمق تشمل تحليلات الذكاء الاصطناعي المتقدمة."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "كيف تعمل خريطة العلاقات؟",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "أضف الأشخاص في حياتك ورتبهم في دوائر حسب قربهم منك. الذكاء الاصطناعي يحلل ديناميكيات علاقاتك ويكشف مَن يشحنك ومَن يستنزفك."
                      }
                    },
                    {
                      "@type": "Question",
                      "name": "ما هي نشرة طقس العلاقات؟",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "اكتشف حالة الطقس في علاقاتك في دقيقة واحدة — عواصف؟ رياح؟ صحو؟ جاوب 4 أسئلة سريعة واعرف الحالة العاطفية لعلاقاتك."
                      }
                    }
                  ]
                },
                {
                  "@type": "BreadcrumbList",
                  "@id": "https://www.alrehla.app/#breadcrumb",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "الرئيسية",
                      "item": "https://www.alrehla.app"
                    }
                  ]
                }
              ]
            })
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <ClarityInit />
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
