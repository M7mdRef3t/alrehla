/**
 * AlrehlaIcon — رمز المنصة
 * شخص في حالة سير/وعي مع هالات توعية تتمدد حوله
 */
export function AlrehlaIcon({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <linearGradient id="ri-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <filter id="ri-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Awareness halos (behind figure) ── */}
      <path d="M56 86 A44 44 0 0 0 144 86" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.65" filter="url(#ri-glow)" />
      <path d="M38 86 A62 62 0 0 0 162 86" stroke="#14B8A6" strokeWidth="1.5" strokeLinecap="round" opacity="0.38" filter="url(#ri-glow)" />
      <path d="M20 86 A80 80 0 0 0 180 86" stroke="#7C3AED" strokeWidth="1"   strokeLinecap="round" opacity="0.18" filter="url(#ri-glow)" />

      {/* ── Journey trail ── */}
      <path d="M38 176 Q100 168 162 176" stroke="#14B8A6" strokeWidth="1.5" strokeDasharray="5 4" strokeLinecap="round" opacity="0.3" />

      {/* ── Figure ── */}
      {/* Head */}
      <circle cx="100" cy="52" r="16" fill="url(#ri-body)" filter="url(#ri-glow)" />
      {/* Torso */}
      <rect x="88" y="70" width="24" height="32" rx="8" fill="url(#ri-body)" opacity="0.95" />
      {/* Left arm (forward) */}
      <line x1="88" y1="79" x2="63" y2="95" stroke="url(#ri-body)" strokeWidth="8" strokeLinecap="round" />
      {/* Right arm (back) */}
      <line x1="112" y1="79" x2="137" y2="93" stroke="url(#ri-body)" strokeWidth="8" strokeLinecap="round" />
      {/* Left leg (back) */}
      <path d="M93 102 L79 140 L66 159" stroke="url(#ri-body)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      {/* Right leg (forward stride) */}
      <path d="M107 102 L120 138 L134 155" stroke="url(#ri-body)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
