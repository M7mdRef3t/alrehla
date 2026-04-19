'use client';

import { AlrehlaLogo } from "./logo/AlrehlaLogo";
import { SocialLinks } from '@/modules/growth/SocialLinks';

/**
 * PlatformFooter — فوتر منفصل للصفحات المستقلة (/stories, /about)
 */
const PLATFORM_FOOTER_STYLES = `
  .platform-footer {
    border-top: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(to bottom, transparent, rgba(10,13,24,0.95));
    padding: 48px 24px 32px;
    margin-top: auto;
  }

  .platform-footer-inner {
    max-width: 720px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 28px;
  }

  .platform-footer-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    justify-content: center;
  }

  .platform-footer-link {
    font-size: 13px;
    color: #64748b;
    text-decoration: none;
    transition: color 0.2s;
  }

  .platform-footer-link:hover {
    color: #38bdf8;
  }

  .platform-footer-trust-row {
    display: flex;
    gap: 20px;
    font-size: 11px;
    color: #334155;
    flex-wrap: wrap;
    justify-content: center;
  }

  .platform-footer-copy {
    margin: 0;
    font-size: 11px;
    color: #1e293b;
    letter-spacing: 0.08em;
  }
`;

export function PlatformFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      dir="rtl"
      className="platform-footer"
    >
      <style>{PLATFORM_FOOTER_STYLES}</style>
      <div className="platform-footer-inner">

        {/* Brand */}
        <AlrehlaLogo height={44} showTagline />

        {/* Social links */}
        <SocialLinks />

        {/* Nav links */}
        <nav
          aria-label="روابط التنقل"
          className="platform-footer-nav"
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
              className="platform-footer-link"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Trust badges */}
        <div className="platform-footer-trust-row">
          {["🔒 بياناتك آمنة ومشفرة", "👁️ لا مشاركة مع طرف ثالث", "🗑️ يمكنك الحذف في أي وقت"].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>

        {/* Copyright */}
        <p className="platform-footer-copy">
          © {year} الرحلة — جميع الحقوق محفوظة
        </p>
      </div>
    </footer>
  );
}
