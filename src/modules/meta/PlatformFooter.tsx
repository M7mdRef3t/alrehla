'use client';

import type { FC } from "react";
import { AlrehlaLogo } from "./logo/AlrehlaLogo";
import { SocialLinks } from '@/modules/growth/SocialLinks';

interface PlatformFooterProps {
  trustPoints?: string[];
  stagger?: any; // For framer-motion stagger animation
  onOpenLegal?: (path: "/privacy" | "/terms") => void;
}

const DEFAULT_TRUST_POINTS = [
  "نتيجتك في أقل من ٣ دقائق",
  "مجاني بالكامل — بدون تسجيل",
  "بياناتك خاصة ومحمية ١٠٠٪"
];

const PLATFORM_FOOTER_STYLES = `
  .platform-footer {
    background: #02040a;
    border-top: 1px solid rgba(201,168,76,0.15);
    padding: 80px 0 40px;
    margin-top: auto;
    position: relative;
    z-index: 10;
    width: 100%;
  }

  .platform-footer-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 48px;
    text-align: center;
  }

  .platform-footer-nav {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 32px;
  }

  .platform-footer-link {
    color: #94a3b8;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s ease;
  }

  .platform-footer-link:hover {
    color: #C9A84C;
  }

  .platform-footer-link.highlight {
    color: #C9A84C;
    font-weight: 700;
  }

  .platform-footer-trust-panel {
    background: rgba(201,168,76,0.03);
    border: 1px solid rgba(201,168,76,0.08);
    padding: 24px 40px;
    border-radius: 24px;
    width: 100%;
    max-width: 800px;
  }

  .platform-footer-trust-title {
    color: #F0C75E;
    font-size: 12px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    margin-bottom: 16px;
  }

  .platform-footer-trust-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 24px;
  }

  .platform-footer-trust-item {
    color: #94a3b8;
    font-size: 13px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .platform-footer-trust-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #C9A84C;
    box-shadow: 0 0 8px rgba(201,168,76,0.6);
  }

  .platform-footer-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding-top: 40px;
    border-top: 1px solid rgba(255,255,255,0.03);
  }

  .platform-footer-tagline {
    color: #64748b;
    font-size: 13px;
    font-style: italic;
  }

  .platform-footer-copy {
    color: #475569;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .platform-footer {
      padding: 60px 0 100px; /* Extra bottom padding for mobile tab bar */
    }
    .platform-footer-nav {
      gap: 20px;
      flex-direction: column;
    }
    .platform-footer-trust-row {
      flex-direction: column;
      gap: 12px;
      align-items: center;
    }
  }
`;

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

  return (
    <footer dir="rtl" className="platform-footer">
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
          <a href="/contact" className="platform-footer-link">تواصل معنا</a>
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
            الرحلة — ارتفع فوق حياتك، شوف الصورة الكاملة، واتحرك بوعي.
          </span>
          <p className="platform-footer-copy">
            © {year} الرحلة — جميع الحقوق محفوظة
          </p>
        </div>

      </div>
    </footer>
  );
};
