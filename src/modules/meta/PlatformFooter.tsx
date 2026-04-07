"use client";
import { AlrehlaLogo } from "./logo/AlrehlaLogo";
import { SocialLinks } from '@/modules/growth/SocialLinks';

/**
 * PlatformFooter — فوتر منفصل للصفحات المستقلة (/stories, /about)
 */
export function PlatformFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      dir="rtl"
      style={{
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "linear-gradient(to bottom, transparent, rgba(10,13,24,0.95))",
        padding: "48px 24px 32px",
        marginTop: "auto",
      }}
    >
      <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>

        {/* Brand */}
        <AlrehlaLogo height={44} showTagline />

        {/* Social links */}
        <SocialLinks />

        {/* Nav links */}
        <nav
          aria-label="روابط التنقل"
          style={{ display: "flex", flexWrap: "wrap", gap: "8px 24px", justifyContent: "center" }}
        >
          {[
            { label: "الرئيسية", href: "/" },
            { label: "قصص النجاح", href: "/stories" },
            { label: "لماذا الرحلة؟", href: "/about" },
            { label: "ابدأ رحلتك", href: "/onboarding" },
            { label: "سياسة الخصوصية", href: "/privacy" },
            { label: "شروط الاستخدام", href: "/terms" },
            { label: "تواصل معنا", href: "https://wa.me/201023050092", external: true },
          ].map(({ label, href, external }) => (
            <a
              key={href}
              href={href}
              target={external ? "_blank" : undefined}
              rel={external ? "noopener noreferrer" : undefined}
              style={{ fontSize: 13, color: "#64748b", textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#64748b")}
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: 20, fontSize: 11, color: "#334155", flexWrap: "wrap", justifyContent: "center" }}>
          {["🔒 بياناتك آمنة ومشفرة", "👁️ لا مشاركة مع طرف ثالث", "🗑️ يمكنك الحذف في أي وقت"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* Copyright */}
        <p style={{ margin: 0, fontSize: 11, color: "#1e293b", letterSpacing: "0.08em" }}>
          © {year} الرحلة — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
