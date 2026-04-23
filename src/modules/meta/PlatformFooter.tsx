'use client';

import type { FC } from "react";
import { motion, type Variants } from "framer-motion";
import { AlrehlaLogo } from "./logo/AlrehlaLogo";
import { SocialLinks } from '@/modules/growth/SocialLinks';

interface PlatformFooterProps {
  trustPoints?: string[];
  stagger?: Variants;
  onOpenLegal?: (path: "/privacy" | "/terms") => void;
}

const PLATFORM_FOOTER_STYLES = `
  .platform-footer {
    border-top: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(to bottom, transparent, rgba(10,13,24,0.95));
    padding: 64px 24px 40px;
    margin-top: auto;
    width: 100%;
  }

  .platform-footer-inner {
    max-width: 1000px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 40px;
  }

  .platform-footer-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 32px;
    justify-content: center;
  }

  .platform-footer-link {
    font-size: 14px;
    color: #94a3b8;
    text-decoration: none;
    transition: all 0.2s ease;
    font-weight: 500;
  }

  .platform-footer-link:hover {
    color: #2dd4bf;
    text-shadow: 0 0 12px rgba(45, 212, 191, 0.4);
  }

  .platform-footer-link.highlight {
    color: rgba(253, 230, 138, 0.9);
    font-weight: 700;
  }
  .platform-footer-link.highlight:hover {
    color: #fde68a;
    text-shadow: 0 0 12px rgba(253, 230, 138, 0.4);
  }

  .platform-footer-trust-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    background: rgba(15, 23, 42, 0.4);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 24px;
    padding: 24px 40px;
    margin-bottom: 8px;
  }

  .platform-footer-trust-title {
    font-size: 11px;
    font-weight: 900;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.3em;
    margin: 0;
  }

  .platform-footer-trust-row {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .platform-footer-trust-item {
    font-size: 14px;
    color: #94a3b8;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .platform-footer-trust-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #14b8a6;
    box-shadow: 0 0 8px rgba(20, 184, 166, 0.8);
  }

  .platform-footer-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    text-align: center;
  }

  .platform-footer-tagline {
    font-size: 13px;
    color: #64748b;
    font-family: var(--font-mono, monospace);
    letter-spacing: 0.1em;
  }

  .platform-footer-copy {
    margin: 0;
    font-size: 12px;
    color: #475569;
    letter-spacing: 0.05em;
  }
`;

const DEFAULT_TRUST_POINTS = [
  "بياناتك آمنة ومشفرة",
  "لا مشاركة مع طرف ثالث",
  "يمكنك الحذف في أي وقت"
];

export const PlatformFooter: FC<PlatformFooterProps> = ({
  trustPoints = DEFAULT_TRUST_POINTS,
  stagger,
  onOpenLegal
}) => {
  const year = new Date().getFullYear();

  const handleLegalClick = (e: React.MouseEvent<HTMLAnchorElement>, path: "/privacy" | "/terms") => {
    if (onOpenLegal) {
      e.preventDefault();
      onOpenLegal(path);
    }
  };

  const FooterWrapper = stagger ? motion.footer : 'footer';
  const wrapperProps = stagger ? {
    variants: stagger,
    initial: "hidden",
    whileInView: "visible",
    viewport: { once: true }
  } : {};

  return (
    <FooterWrapper
      dir="rtl"
      className="platform-footer"
      {...(wrapperProps as any)}
    >
      <style>{PLATFORM_FOOTER_STYLES}</style>
      <div className="platform-footer-inner">

        {/* Brand */}
        <AlrehlaLogo height={48} showTagline={false} />

        {/* Nav links */}
        <nav
          aria-label="روابط التنقل"
          className="platform-footer-nav"
        >
          <a href="/" className="platform-footer-link">الرئيسية</a>
          <a href="/stories" className="platform-footer-link">قصص النجاح</a>
          <a href="/about" className="platform-footer-link">عن الرحلة</a>
          <a
            href="/privacy"
            onClick={(e) => handleLegalClick(e, "/privacy")}
            className="platform-footer-link"
          >
            سياسة الخصوصية
          </a>
          <a
            href="/terms"
            onClick={(e) => handleLegalClick(e, "/terms")}
            className="platform-footer-link"
          >
            شروط الاستخدام
          </a>
          <a href="/pricing" className="platform-footer-link highlight">الخطط والأسعار</a>
          <a
            href="https://wa.me/201110795932"
            target="_blank"
            rel="noopener noreferrer"
            className="platform-footer-link"
          >
            تواصل معنا
          </a>
        </nav>

        {/* Trust badges */}
        <div className="platform-footer-trust-panel">
          <p className="platform-footer-trust-title">ما نعد به</p>
          <div className="platform-footer-trust-row">
            {trustPoints.map((point, idx) => (
              <span key={idx} className="platform-footer-trust-item">
                <span className="platform-footer-trust-dot" />
                {point}
              </span>
            ))}
          </div>
        </div>

        {/* Social links */}
        <SocialLinks />

        {/* Bottom text */}
        <div className="platform-footer-bottom">
          <span className="platform-footer-tagline">
            الرحلة — مساحة أوضح للعلاقات والحدود
          </span>
          <p className="platform-footer-copy">
            © {year} الرحلة — جميع الحقوق محفوظة
          </p>
        </div>

      </div>
    </FooterWrapper>
  );
}
