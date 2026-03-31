import os

file_path = r'c:\Users\ty\Downloads\Dawayir-main\Dawayir-main\src\components\Landing.tsx'

new_styles = """
const LANDING_STYLES = `
  .landing-dark-force {
    --space-void: #03040b;
    --text-primary: #ffffff;
    --text-secondary: rgba(226, 232, 240, 0.85);
    --text-muted: rgba(148, 163, 184, 0.5);
    --glass-bg: rgba(10, 15, 28, 0.65);
    --glass-border: rgba(255, 255, 255, 0.08);
    --soft-teal: #14b8a6;
    --soft-teal-glow: rgba(20, 184, 166, 0.35);
    --luminous-cyan: #22d3ee;
    color-scheme: dark;
  }

  .cosmic-editorial {
    font-family: 'Tajawal', sans-serif;
    letter-spacing: -0.05em;
    line-height: 0.95;
    text-shadow: 0 0 30px rgba(255,255,255,0.05);
  }

  .mesh-gradient-bg {
    position: absolute;
    inset: 0;
    overflow: hidden;
    z-index: 0;
    background: radial-gradient(circle at 50% 50%, #03040b 0%, #000000 100%);
  }

  .mesh-ball {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    mix-blend-mode: screen;
    opacity: 0.15;
    animation: mesh-float 25s infinite alternate ease-in-out;
  }

  @keyframes mesh-float {
    0% { transform: translate(0, 0) scale(1); }
    50% { transform: translate(15%, -10%) scale(1.1); }
    100% { transform: translate(-5%, 15%) scale(0.9); }
  }

  .grain-overlay {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.04;
    pointer-events: none;
    z-index: 1;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }

  .glass-card-v2 {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  }

  .glow-border {
    position: relative;
  }
  .glow-border::before {
    content: "";
    position: absolute;
    inset: -1px;
    background: linear-gradient(45deg, transparent, rgba(45,212,191,0.3), transparent);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    border-radius: inherit;
  }
`;
"""

# Read existing content
with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

# Replace Styles
for i in range(len(lines)):
    if 'const LANDING_STYLES = `' in lines[i]:
        start = i
        end = i
        while '`;' not in lines[end] and end < len(lines)-1:
            end += 1
        lines[start:end+1] = [new_styles + "\n"]
        break

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(lines)

print("Applied new styles successfully.")
