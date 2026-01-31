/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dawayir Brand Colors - Calming Teal/Cyan Palette
        calm: {
          background: "#FAFAF9",      // Warm neutral base
          breathe: "#E0F2F1",         // Subtle teal mist (for breathing background)
          glow: "rgba(20, 184, 166, 0.12)" // Teal glow overlay
        },
        // Override Tailwind's teal to match our brand
        teal: {
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",  // Primary brand color
          600: "#0D9488",  // Primary CTA color
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A"
        }
      }
    }
  },
  plugins: []
};

