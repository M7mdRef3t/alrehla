/**
 * AlrehlaLogo — الشعار الكامل (رمز + اسم)
 * الرمز على اليمين، الاسم على اليسار (RTL)
 */
export function AlrehlaLogo({
  height = 48,
  showTagline = false,
  className,
}: {
  height?: number;
  showTagline?: boolean;
  className?: string;
}) {
  const viewH = showTagline ? 88 : 68;
  const viewW = 320;
  const width = Math.round(height * (viewW / viewH));

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${viewW} ${viewH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="الرحلة"
      className={className}
    >
      <defs>
        <linearGradient id="rl-body" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>
        <filter id="rl-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Mini icon (200×200 → 0.32 scale → ~64×64, at right) ── */}
      <g transform="translate(248,2) scale(0.32)" filter="url(#rl-glow)">
        {/* Halos */}
        <path d="M56 86 A44 44 0 0 0 144 86" stroke="#38BDF8" strokeWidth="3"   strokeLinecap="round" opacity="0.7" />
        <path d="M38 86 A62 62 0 0 0 162 86" stroke="#14B8A6" strokeWidth="2"   strokeLinecap="round" opacity="0.4" />
        <path d="M20 86 A80 80 0 0 0 180 86" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" opacity="0.2" />
        {/* Figure */}
        <circle cx="100" cy="52" r="16" fill="url(#rl-body)" />
        <rect x="88" y="70" width="24" height="32" rx="8" fill="url(#rl-body)" />
        <line x1="88"  y1="79" x2="63"  y2="95"  stroke="url(#rl-body)" strokeWidth="8" strokeLinecap="round" />
        <line x1="112" y1="79" x2="137" y2="93"  stroke="url(#rl-body)" strokeWidth="8" strokeLinecap="round" />
        <path d="M93 102 L79 140 L66 159"   stroke="url(#rl-body)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M107 102 L120 138 L134 155" stroke="url(#rl-body)" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      </g>

      {/* ── Wordmark ── */}
      <text
        x="12"
        y={showTagline ? "48" : "50"}
        fontFamily="Cairo, 'Segoe UI', Arial, sans-serif"
        fontSize="44"
        fontWeight="800"
        fill="white"
      >
        الرحلة
      </text>

      {showTagline && (
        <text
          x="13"
          y="72"
          fontFamily="Cairo, 'Segoe UI', Arial, sans-serif"
          fontSize="14"
          fontWeight="400"
          fill="#64748B"
        >
          منصة الوعي الذاتي
        </text>
      )}
    </svg>
  );
}
