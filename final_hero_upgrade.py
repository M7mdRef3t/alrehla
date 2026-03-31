import sys

file_path = r'c:\Users\ty\Downloads\Dawayir-main\Dawayir-main\src\components\Landing.tsx'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# 1. Update OrbitViz
orbit_viz_old = """const OrbitViz: FC<{ reduceMotion: boolean | null; mirrorName: string }> = ({ reduceMotion, mirrorName }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const nodes = ["""

orbit_viz_new = """const OrbitViz: FC<{ reduceMotion: boolean | null; mirrorName: string }> = ({ reduceMotion, mirrorName }) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduceMotion) return;
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX - window.innerWidth / 2) / 40,
        y: (e.clientY - window.innerHeight / 2) / 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [reduceMotion]);

  const nodes = ["""

content = content.replace(orbit_viz_old, orbit_viz_new)

# 1b. Update OrbitViz nodes and container
orbit_viz_container_old = """<div className="relative flex items-center justify-center select-none" aria-hidden="true"
      style={{ width: 380, height: 380 }}>"""
orbit_viz_container_new = """<motion.div
      className="relative flex items-center justify-center select-none"
      aria-hidden="true"
      style={{
        width: 380,
        height: 380,
        x: mousePos.x,
        y: mousePos.y,
      }}
    >"""
content = content.replace(orbit_viz_container_old, orbit_viz_container_new)

# 1c. Close OrbitViz div
# orbit_viz_div_end_old = "</div>" # This is risky, let's skip and hope for the best or find a better anchor.

# 2. Update TypingWord
typing_word_old = """const TypingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 400);
    }, 2600);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block" style={{ minWidth: "5ch" }}>
      <span className="invisible select-none pointer-events-none whitespace-nowrap block" aria-hidden="true">
        ضغط من غير سبب
      </span>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 15, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -15, filter: "blur(8px)" }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[#67e8f9]"
            style={{
              fontWeight: 900,
              filter: "drop-shadow(0 18px 36px rgba(34,211,238,0.18))"
            }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};"""

typing_word_new = """const TypingWord: FC = () => {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % ROTATING_WORDS.length);
        setVisible(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="relative inline-block" style={{ minWidth: "6ch" }}>
      <span className="invisible select-none pointer-events-none whitespace-nowrap block" aria-hidden="true">
        ضغط من غير سبب
      </span>
      <AnimatePresence mode="wait">
        {visible && (
          <motion.span
            key={index}
            initial={{ opacity: 0, y: 20, filter: "blur(12px)", scale: 0.9 }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
            exit={{ opacity: 0, y: -20, filter: "blur(12px)", scale: 1.1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center whitespace-nowrap text-[var(--luminous-cyan)]"
            style={{
              fontWeight: 950,
              textShadow: "0 0 40px rgba(34,211,238,0.4)"
            }}
          >
            {ROTATING_WORDS[index]}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
};"""
content = content.replace(typing_word_old, typing_word_new)

# 3. Hero Section Layout (Add Mesh/Grain)
hero_section_start_old = """<section className="hero-orbital-center relative overflow-hidden px-4 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.18),transparent_30%),radial-gradient(circle_at_left_center,rgba(59,130,246,0.12),transparent_28%),linear-gradient(180deg,rgba(6,8,19,0.72)_0%,rgba(6,8,19,0.94)_100%)]" />
          <div className="hero-starfield opacity-30" />
          <FloatingSignatures />
          <div className="absolute -top-20 right-[8%] h-64 w-64 rounded-full bg-[rgba(45,212,191,0.12)] blur-3xl" />
          <div className="absolute bottom-0 left-[6%] h-72 w-72 rounded-full bg-[rgba(59,130,246,0.12)] blur-3xl" />
        </div>"""

hero_section_start_new = """<section className="hero-orbital-center relative overflow-hidden px-4 pt-28 sm:px-6 sm:pt-36 lg:px-8">
        {/* Cinematic Mesh Gradient Background */}
        <div className="mesh-gradient-bg">
          <div className="mesh-ball w-[600px] h-[600px] bg-teal-500/15 top-[-10%] right-[-5%]" />
          <div className="mesh-ball w-[500px] h-[500px] bg-indigo-600/15 bottom-[-5%] left-[-10%] animate-[mesh-float_30s_infinite_reverse]" />
          <div className="mesh-ball w-[400px] h-[400px] bg-cyan-400/10 top-[20%] left-[20%] animate-[mesh-float_40s_infinite]" />
        </div>
        <div className="grain-overlay" />

        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.12),transparent_40%),radial-gradient(circle_at_left_center,rgba(59,130,246,0.08),transparent_35%),linear-gradient(180deg,rgba(3,4,11,0.6)_0%,rgba(3,4,11,0.9)_100%)]" />
          <div className="hero-starfield opacity-20" />
          <FloatingSignatures />
        </div>"""

content = content.replace(hero_section_start_old, hero_section_start_new)

# 4. Hero Buttons
buttons_old = """              <motion.button
                type="button"
                onClick={handleStart}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.985 }}
                className="group inline-flex min-h-[64px] flex-1 items-center justify-center gap-3 rounded-[1.4rem] border border-[rgba(45,212,191,0.45)] px-7 py-4 text-lg font-black text-white shadow-[0_24px_60px_rgba(13,148,136,0.28)] transition-all duration-300"
                style={{ background: "linear-gradient(135deg, rgba(20,184,166,0.92) 0%, rgba(13,148,136,0.98) 100%)" }}
              >
                <Zap className="h-5 w-5" />
                <span style={{ fontFamily: "Tajawal" }}>{landingCopy.ctaJourney}</span>
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              </motion.button>

              <motion.button
                type="button"
                onClick={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-h-[64px] items-center justify-center gap-3 rounded-[1.4rem] border border-white/12 bg-white/5 px-6 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(0,0,0,0.16)] backdrop-blur-xl transition-colors hover:border-white/25 hover:bg-white/8 sm:flex-none"
              >
                {landingCopy.secondaryCta}
                <ChevronDown className="h-4 w-4" />
              </motion.button>"""

buttons_new = """              <motion.button
                type="button"
                onClick={handleStart}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="group glow-border inline-flex min-h-[68px] flex-1 items-center justify-center gap-3 rounded-[1.5rem] px-8 py-4 text-xl font-black text-white shadow-[0_20px_50px_rgba(13,148,136,0.35)] transition-all duration-300"
                style={{ 
                  background: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)",
                  fontFamily: "Tajawal"
                }}
              >
                <Zap className="h-5 w-5 fill-white/20" />
                <span>{landingCopy.ctaJourney}</span>
                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-2" />
              </motion.button>

              <motion.button
                type="button"
                onClick={() => document.getElementById("simulation")?.scrollIntoView({ behavior: "smooth" })}
                className="inline-flex min-h-[68px] items-center justify-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/5 px-8 py-4 text-sm font-bold text-white shadow-[0_15px_35px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all hover:bg-white/10 hover:border-white/20 sm:flex-none"
              >
                {landingCopy.secondaryCta}
                <ChevronDown className="h-4 w-4 opacity-50 group-hover:translate-y-1 transition-transform" />
              </motion.button>"""

content = content.replace(buttons_old, buttons_new)

# Save
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Applied complete Hero components upgrade.")
