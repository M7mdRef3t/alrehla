import React from 'react';

export default function BrandMark({ className = '', compact = false, withWordmark = false }) {
  return (
    <div className={`brand-mark ${compact ? 'brand-mark--compact' : ''} ${className}`.trim()}>
      <svg
        className="brand-mark__symbol"
        viewBox="0 0 128 128"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <linearGradient id="marayaLensGradient" x1="29" y1="64" x2="99" y2="64" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5EFFB3" />
            <stop offset="0.45" stopColor="#78C8FF" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
        <circle cx="64" cy="64" r="38" fill="url(#marayaLensGradient)" />
        <path
          d="M64 29C45.2 29 30 44.2 30 63C30 81.8 45.2 97 64 97C73.4 97 82 93.2 88.2 87.1C75.4 86.2 65.2 75.5 65.2 62.5C65.2 49.6 75.4 38.8 88.2 37.9C82 31.8 73.4 29 64 29Z"
          fill="#030305"
        />
        <path
          d="M57.6 44.8C60.4 50.1 61.8 56.1 61.8 62.7C61.8 69.1 60.4 75.1 57.6 80.6"
          stroke="#F7F4EA"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
      </svg>

      {withWordmark && (
        <div className="brand-mark__wordmark">
          <span className="brand-mark__name">مرايا</span>
          <span className="brand-mark__tag">Maraya</span>
        </div>
      )}
    </div>
  );
}
