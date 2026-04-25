/**
 * AlrehlaIcon — صقر الشاهين (Peregrine Falcon)
 * رمز الرحلة — المسافر الذي يرتفع فوق حياته ليرى الصورة الكاملة
 * عين حورس مدسوسة في هندسة الجناح — البصيرة والحماية والشفاء
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
        {/* Primary falcon gradient — Royal Gold */}
        <linearGradient id="falcon-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#F0C75E" />
          <stop offset="50%" stopColor="#C9A84C" />
          <stop offset="100%" stopColor="#A8873A" />
        </linearGradient>
        {/* Horus Blue accent */}
        <linearGradient id="falcon-blue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1B6CA8" />
          <stop offset="100%" stopColor="#145080" />
        </linearGradient>
        {/* Eye glow */}
        <radialGradient id="eye-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#F0C75E" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C9A84C" stopOpacity="0" />
        </radialGradient>
        {/* Falcon glow filter */}
        <filter id="falcon-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Subtle outer glow for the whole icon */}
        <filter id="icon-aura" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="aura" />
          <feMerge>
            <feMergeNode in="aura" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Dawayir (Concentric Orbit Arcs) — رمز الدوائر ── */}
      <circle cx="100" cy="100" r="92" stroke="#C9A84C" strokeWidth="0.5" opacity="0.12" />
      <circle cx="100" cy="100" r="78" stroke="#C9A84C" strokeWidth="0.7" opacity="0.15" />
      <circle cx="100" cy="100" r="62" stroke="#1B6CA8" strokeWidth="0.5" opacity="0.10" />

      {/* ── Falcon Body — الصقر في وضع الانقضاض ── */}
      <g filter="url(#falcon-glow)">
        {/* Head — رأس الصقر */}
        <path
          d="M100 38 C107 38 113 44 113 52 C113 60 107 66 100 66 C93 66 87 60 87 52 C87 44 93 38 100 38Z"
          fill="url(#falcon-gold)"
        />

        {/* Eye of Horus — عين حورس المدسوسة */}
        {/* The eye pupil */}
        <circle cx="105" cy="50" r="3.5" fill="#0A1628" />
        <circle cx="106" cy="49.5" r="1.2" fill="#F0C75E" opacity="0.9" />
        {/* Horus eye marking — teardrop descending from eye */}
        <path
          d="M108 52 C108 54 107 58 105 62 C104 64 103 65 102 65"
          stroke="#0A1628"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.7"
        />
        {/* Eye brow line — the distinctive Horus eyebrow */}
        <path
          d="M93 47 C96 44 102 43 110 46"
          stroke="#A8873A"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
          opacity="0.6"
        />

        {/* Beak */}
        <path
          d="M113 52 L121 56 L113 58"
          fill="#A8873A"
          opacity="0.85"
        />

        {/* Neck */}
        <path
          d="M95 64 L93 74 L107 74 L105 64"
          fill="url(#falcon-gold)"
          opacity="0.9"
        />

        {/* Chest / Torso — صدر الصقر */}
        <path
          d="M88 74 C86 82 85 92 88 104 L100 112 L112 104 C115 92 114 82 112 74 Z"
          fill="url(#falcon-gold)"
        />

        {/* Chest markings — نقوش الصدر */}
        <path d="M95 80 L105 80" stroke="#A8873A" strokeWidth="0.8" opacity="0.4" />
        <path d="M94 86 L106 86" stroke="#A8873A" strokeWidth="0.8" opacity="0.35" />
        <path d="M93 92 L107 92" stroke="#A8873A" strokeWidth="0.8" opacity="0.3" />
        <path d="M92 98 L108 98" stroke="#A8873A" strokeWidth="0.8" opacity="0.25" />

        {/* ── Wings Spread — الأجنحة المنشورة (الدوائر المتداخلة) ── */}
        {/* Right Wing — arcs forming wing from concentric curves */}
        <path
          d="M112 78 C128 70 148 62 170 58 C168 68 158 82 140 94 C128 102 118 106 112 104"
          fill="url(#falcon-gold)"
          opacity="0.85"
        />
        {/* Right wing feather arcs — Hidden Eye of Horus geometry */}
        <path
          d="M120 74 C136 66 154 60 168 58"
          stroke="#A8873A"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M118 82 C134 74 152 68 166 64"
          stroke="#A8873A"
          strokeWidth="0.8"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M116 90 C130 84 148 78 160 74"
          stroke="#A8873A"
          strokeWidth="0.6"
          fill="none"
          opacity="0.25"
        />

        {/* Left Wing — mirrored */}
        <path
          d="M88 78 C72 70 52 62 30 58 C32 68 42 82 60 94 C72 102 82 106 88 104"
          fill="url(#falcon-gold)"
          opacity="0.85"
        />
        {/* Left wing feather arcs */}
        <path
          d="M80 74 C64 66 46 60 32 58"
          stroke="#A8873A"
          strokeWidth="1"
          fill="none"
          opacity="0.4"
        />
        <path
          d="M82 82 C66 74 48 68 34 64"
          stroke="#A8873A"
          strokeWidth="0.8"
          fill="none"
          opacity="0.3"
        />
        <path
          d="M84 90 C70 84 52 78 40 74"
          stroke="#A8873A"
          strokeWidth="0.6"
          fill="none"
          opacity="0.25"
        />

        {/* ── Tail Feathers — ذيل الصقر ── */}
        <path
          d="M95 112 L92 142 L100 148 L108 142 L105 112"
          fill="url(#falcon-gold)"
          opacity="0.75"
        />
        {/* Tail center line */}
        <line x1="100" y1="112" x2="100" y2="146" stroke="#A8873A" strokeWidth="0.8" opacity="0.35" />

        {/* ── Talons — المخالب ── */}
        <path
          d="M92 142 L86 154 M92 142 L90 156 M92 142 L94 155"
          stroke="url(#falcon-gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M108 142 L114 154 M108 142 L110 156 M108 142 L106 155"
          stroke="url(#falcon-gold)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.6"
        />
      </g>

      {/* ── Eye of Horus glow — الهالة الذهبية ── */}
      <circle cx="105" cy="50" r="12" fill="url(#eye-glow)" opacity="0.3" />

      {/* ── Wing-tip Horus Blue accents ── */}
      <path
        d="M170 58 C172 54 172 50 170 46"
        stroke="#1B6CA8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
      <path
        d="M30 58 C28 54 28 50 30 46"
        stroke="#1B6CA8"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}
