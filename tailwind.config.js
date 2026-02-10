/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // 🌌 Cosmic Sanctuary Palette
        space: {
          void: "#0a0a1a",
          deep: "#0d1026",
          mid: "#131640",
          nebula: "#1a1250",
          aurora: "#1e2a5e"
        },
        // Warm Accents
        amber: {
          warm: "#f5a623"
        },
        // Override Tailwind's teal to match our brand
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A"
        },
        // Ring / Orbit Zone Colors
        ring: {
          safe: "#2dd4bf",
          caution: "#fbbf24",
          danger: "#f87171",
          detached: "#94a3b8"
        }
      }
    }
  },
  plugins: []
};

