/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 🌌 Deep Cosmic Blue — الخلفية العلاجية
        space: {
          void: "var(--space-void, #0a0e1f)",      // أعمق من الأسود — void عميق
          950: "var(--space-950, #0f1629)",        // slate-950 محسّن
          deep: "var(--space-deep, #131a35)",       // أزرق كوني عميق
          mid: "var(--space-mid, #1a2242)",        // أزرق متوسط دافئ
          nebula: "var(--space-nebula, #212b4f)",     // سديم هادئ
          aurora: "var(--space-aurora, #2a3560)"      // شفق شمالي
        },
        // 🔥 Warm Amber — لون الروح الدافئ
        amber: {
          50: "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "var(--amber-500, #f5a623)",        // Warm Amber (aligned with --warm-amber)
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f"
        },
        // 🌿 Emerald Green — للطمأنينة والنجاح
        emerald: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "var(--emerald-500, #10b981)",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b"
        },
        // 🌊 Soft Teal — اللون الأساسي للعلامة
        teal: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "var(--teal-400, #2dd4bf)",        // اللون الرئيسي
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a"
        },
        // 🔴 Ring / Orbit Zone Colors
        ring: {
          safe: "var(--teal-400, #2dd4bf)",      // Teal
          caution: "var(--amber-500, #f5a623)",   // Warm Amber (aligned with --warm-amber)
          danger: "#f87171",    // Calm danger (aligned with --ring-danger)
          detached: "#94a3b8"
        }
      },
      fontFamily: {
        sans: ['Tajawal', 'Almarai', 'system-ui', 'sans-serif'],
        display: ['Tajawal', 'Almarai', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.02em' }],
        'sm': ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'base': ['1rem', { lineHeight: '1.75', letterSpacing: '0.01em' }],
        'lg': ['1.125rem', { lineHeight: '1.75', letterSpacing: '0' }],
        'xl': ['1.25rem', { lineHeight: '1.6', letterSpacing: '-0.01em' }],
        '2xl': ['1.5rem', { lineHeight: '1.5', letterSpacing: '-0.02em' }],
        '3xl': ['1.875rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }],
        '4xl': ['2.25rem', { lineHeight: '1.3', letterSpacing: '-0.03em' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '100': '25rem',
        '120': '30rem'
      },
      backdropBlur: {
        'xs': '2px',
        'xl': '24px',
        '2xl': '32px',
        '3xl': '48px'
      }
    }
  },
  plugins: []
};

