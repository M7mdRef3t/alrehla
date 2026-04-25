/**
 * AlrehlaLogo — الشعار الكامل (صقر الشاهين + اسم "الرحلة")
 * الصقر على اليمين، الاسم على اليسار (RTL layout)
 * Peregrine Falcon × Eye of Horus × الرحلة
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
      style={{ direction: 'ltr' }}
    >
      <defs>
        <linearGradient id="rl-falcon-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0C75E" />
          <stop offset="50%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A8873A" />
        </linearGradient>
        <linearGradient id="rl-falcon-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B6CA8" />
          <stop offset="100%" stopColor="#145080" />
        </linearGradient>
        <filter id="rl-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Mini Falcon Icon (200×200 → 0.32 scale → ~64×64, at right side) ── */}
      <g transform="translate(248,2) scale(0.32)" filter="url(#rl-glow)">
        {/* Orbit arcs */}
        <circle cx="100" cy="100" r="88" stroke="#C9A84C" strokeWidth="1.2" opacity="0.15" />
        <circle cx="100" cy="100" r="72" stroke="#C9A84C" strokeWidth="1.5" opacity="0.18" />

        {/* Falcon head */}
        <path
          d="M100 38 C107 38 113 44 113 52 C113 60 107 66 100 66 C93 66 87 60 87 52 C87 44 93 38 100 38Z"
          fill="url(#rl-falcon-gold)"
        />
        {/* Eye — Horus embedded */}
        <circle cx="105" cy="50" r="3.5" fill="#0A1628" />
        <circle cx="106" cy="49.5" r="1.2" fill="#F0C75E" opacity="0.9" />
        <path d="M108 52 C108 54 107 58 105 62 C104 64 103 65 102 65" stroke="#0A1628" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.6" />
        {/* Beak */}
        <path d="M113 52 L121 56 L113 58" fill="#A8873A" opacity="0.8" />
        {/* Neck */}
        <path d="M95 64 L93 74 L107 74 L105 64" fill="url(#rl-falcon-gold)" opacity="0.9" />
        {/* Chest */}
        <path d="M88 74 C86 82 85 92 88 104 L100 112 L112 104 C115 92 114 82 112 74 Z" fill="url(#rl-falcon-gold)" />
        {/* Wings */}
        <path d="M112 78 C128 70 148 62 170 58 C168 68 158 82 140 94 C128 102 118 106 112 104" fill="url(#rl-falcon-gold)" opacity="0.85" />
        <path d="M88 78 C72 70 52 62 30 58 C32 68 42 82 60 94 C72 102 82 106 88 104" fill="url(#rl-falcon-gold)" opacity="0.85" />
        {/* Wing-tip blue accents */}
        <path d="M170 58 C172 54 172 50 170 46" stroke="#1B6CA8" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        <path d="M30 58 C28 54 28 50 30 46" stroke="#1B6CA8" strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        {/* Tail */}
        <path d="M95 112 L92 142 L100 148 L108 142 L105 112" fill="url(#rl-falcon-gold)" opacity="0.7" />
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
          fill="#C9A84C"
        >
          ارتفع . شوف . اتحرك
        </text>
      )}
    </svg>
  );
}
