/**
 * SocialLinks — أيقونات التواصل الاجتماعي
 * SVG icons with brand-accurate hover colors
 */

const SOCIALS = [
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/refatalrehla",
    hoverColor: "#E1306C",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    id: "tiktok",
    label: "TikTok",
    href: "https://www.tiktok.com/@refatalrehla",
    hoverColor: "#69C9D0",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.74a4.85 4.85 0 01-1.01-.05z"/>
      </svg>
    ),
  },
  {
    id: "facebook",
    label: "Facebook",
    href: "https://web.facebook.com/RefatAlrehla",
    hoverColor: "#1877F2",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
  {
    id: "youtube",
    label: "YouTube",
    href: "https://www.youtube.com/user/M7mdRefat",
    hoverColor: "#FF0000",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    id: "x",
    label: "X (Twitter)",
    href: "https://x.com/RefatAlrehla",
    hoverColor: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
  },
  {
    id: "threads",
    label: "Threads",
    href: "https://www.threads.net/@refatalrehla",
    hoverColor: "#ffffff",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M12.554 11.232c-.066.046-.14.07-.215.07-.221 0-.4-.179-.4-.4V7.611c0-.221.179-.4.4-.4s.4.179.4.4v3.291c0 .126-.059.244-.16.32l-.025.01zM11.604 15.654c-.651.047-1.303.07-1.954.07-1.442 0-2.884-.116-4.326-.349-1.21-.21-2.235-.931-2.793-1.932-.465-.815-.651-1.745-.651-2.723 0-1.886.698-3.561 2.048-4.701 1.396-1.164 3.258-1.815 5.213-1.815 1.955 0 3.817.651 5.213 1.815 1.35 1.14 2.048 2.815 2.048 4.701 0 1.233-.302 2.42-.884 3.444-.558 1.001-1.396 1.769-2.397 2.211a5.617 5.617 0 01-2.48.559c-.651 0-1.28-.116-1.885-.349a4.11 4.11 0 01-1.419-.931 3.518 3.518 0 01-.884-1.396c-.233-.582-.349-1.234-.349-1.885 0-1.559.512-2.839 1.513-3.839 1-.977 2.257-1.466 3.77-.14 3.817 0 5.678.954 5.678 2.815v.14c0 .884-.14 1.745-.419 2.536a7.228 7.228 0 01-1.163 2.118 7.23 7.23 0 01-1.792 1.559c-.722.419-1.536.628-2.42.628-.884 0-1.745-.14-2.536-.419-.79-.279-1.512-.698-2.117-1.163-.605-.465-1.117-1.047-1.513-1.745a8.777 8.777 0 01-1.07-3.63 8.874 8.874 0 010-3.142c.163-.791.442-1.536.814-2.211.373-.675.861-1.28 1.443-1.792.582-.512 1.257-.931 2.025-1.233.768-.303 1.629-.466 2.559-.466 1.815 0 3.444.605 4.794 1.745 1.35 1.14 2.117 2.815 2.117 4.701 0 1.233-.302 2.42-.884 3.444z" />
      </svg>
    ),
  },
] as const;

interface SocialLinksProps {
  className?: string;
  iconSize?: number;
}

export function SocialLinks({ className = "", iconSize = 20 }: SocialLinksProps) {
  return (
    <div
      className={className}
      style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}
      role="list"
      aria-label="روابط التواصل الاجتماعي"
    >
      {SOCIALS.map(({ id, label, href, hoverColor, icon }) => (
        <a
          key={id}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          role="listitem"
          style={{
            color: "#475569",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: iconSize + 12,
            height: iconSize + 12,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.06)",
            transition: "color 0.2s, border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = hoverColor;
            e.currentTarget.style.borderColor = hoverColor + "44";
            e.currentTarget.style.background = hoverColor + "11";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#475569";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          {icon}
        </a>
      ))}
    </div>
  );
}
