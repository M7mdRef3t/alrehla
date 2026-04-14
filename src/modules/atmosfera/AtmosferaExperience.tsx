"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Atmosfera } from "@alrehla/atmosfera";
import type { AtmosferaTheme, EmotionalState } from "@alrehla/atmosfera";
import { eventBus } from "@/shared/events/bus";
import { initAtmosferaRewardsBridge } from "@/domains/social/services/atmosferaRewardsBridge";

// ─── State Labels ──────────────────────────────────────
const STATE_LABELS: Record<EmotionalState, { ar: string; icon: string; color: string }> = {
  crisis:     { ar: "أزمة",    icon: "🌊", color: "#ef4444" },
  struggling: { ar: "مقاومة",  icon: "🌧️", color: "#f59e0b" },
  stable:     { ar: "استقرار", icon: "🌤️", color: "#2dd4bf" },
  thriving:   { ar: "ازدهار",  icon: "☀️", color: "#22c55e" },
  flow:       { ar: "تدفّق",   icon: "✨", color: "#a855f7" },
};

const TIME_LABELS: Record<string, { ar: string; icon: string }> = {
  morning:   { ar: "صباح",  icon: "🌅" },
  afternoon: { ar: "ظهيرة", icon: "☀️" },
  evening:   { ar: "مساء",  icon: "🌆" },
  night:     { ar: "ليل",   icon: "🌙" },
};

function getTimeOfDay(): "morning" | "afternoon" | "evening" | "night" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

// ─── Component ─────────────────────────────────────────
export default function AtmosferaExperience() {
  const [theme, setTheme] = useState<AtmosferaTheme | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(0.5);
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [timeOfDay] = useState(getTimeOfDay);
  const bridgeInitRef = useRef(false);

  // Initialize rewards bridge once
  useEffect(() => {
    if (!bridgeInitRef.current) {
      initAtmosferaRewardsBridge();
      bridgeInitRef.current = true;
    }
  }, []);

  // Generate initial theme from localStorage or fallback
  useEffect(() => {
    try {
      const cached = localStorage.getItem("dawayir-consciousness-theme");
      if (cached) {
        const parsed = JSON.parse(cached) as AtmosferaTheme;
        setTheme(parsed);
        return;
      }
    } catch { /* noop */ }

    // Fallback: generate stable default
    const t = Atmosfera.generate({
      emotion: { state: "stable", tension: 30, shadow: 20, engagement: 70 },
      timeOfDay,
      sessionMinutes: 0,
      mode: "auto",
    });
    setTheme(t);
  }, [timeOfDay]);

  // Session timer
  useEffect(() => {
    const start = parseInt(sessionStorage.getItem("dawayir-session-start") || String(Date.now()));
    const tick = () => setSessionMinutes(Math.floor((Date.now() - start) / 60000));
    tick();
    const interval = setInterval(tick, 60000);
    return () => clearInterval(interval);
  }, []);

  // Listen for atmosfera-changed events from the engine
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<AtmosferaTheme>).detail;
      if (detail?.state) {
        const prev = theme?.state;
        setTheme(detail);
        if (prev && prev !== detail.state) {
          eventBus.emit("atmosfera:state_changed", { from: prev, to: detail.state });
        }
      }
    };
    window.addEventListener("atmosfera-changed", handler);
    return () => window.removeEventListener("atmosfera-changed", handler);
  }, [theme?.state]);

  // Mood explore handler — fires reward
  const handleMoodExplore = useCallback(() => {
    eventBus.emit("atmosfera:mood_explored", { state: theme?.state });
  }, [theme?.state]);

  // Soundscape toggle
  const handleSoundToggle = useCallback(() => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    eventBus.emit("atmosfera:soundscape_toggled", { enabled: next });
    if (theme) {
      Atmosfera.soundscape.sync(theme.state, soundVolume, next);
    }
  }, [soundEnabled, soundVolume, theme]);

  const handleVolumeChange = useCallback((vol: number) => {
    setSoundVolume(vol);
    if (theme && soundEnabled) {
      Atmosfera.soundscape.sync(theme.state, vol, true);
    }
  }, [theme, soundEnabled]);

  if (!theme) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingPulse}>جارٍ تحميل الأجواء...</div>
      </div>
    );
  }

  const stateInfo = STATE_LABELS[theme.state];
  const timeInfo = TIME_LABELS[timeOfDay];
  const intensity = Math.round(theme.colorIntensity * 100);

  return (
    <div style={{
      ...styles.container,
      background: `linear-gradient(135deg, ${theme.colors.background} 0%, ${theme.isDark ? "#0a0e1f" : "#f0f4f8"} 100%)`,
      color: theme.colors.text,
    }}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={{ ...styles.title, color: theme.colors.primary }}>
          🌬️ أجواء رحلتك
        </h1>
        <p style={styles.subtitle}>تجربتك الحسّية الحيّة — تتنفس مع حالتك</p>
      </header>

      {/* Emotional Ring */}
      <section style={styles.ringSection} onClick={handleMoodExplore} role="button" tabIndex={0}
        aria-label="استكشف حالتك النفسية"
      >
        <div style={{
          ...styles.emotionalRing,
          background: `conic-gradient(from 0deg, ${stateInfo.color}, ${theme.colors.accent}, ${theme.colors.primary}, ${stateInfo.color})`,
          boxShadow: `0 0 60px ${stateInfo.color}40, 0 0 120px ${stateInfo.color}20`,
        }}>
          <div style={{
            ...styles.ringInner,
            backgroundColor: theme.colors.background,
          }}>
            <span style={styles.ringIcon}>{stateInfo.icon}</span>
            <span style={{ ...styles.ringLabel, color: stateInfo.color }}>
              {stateInfo.ar}
            </span>
            <span style={styles.ringHint}>اضغط لاستكشاف</span>
          </div>
        </div>
      </section>

      {/* Live Tokens */}
      <section style={styles.section}>
        <h2 style={{ ...styles.sectionTitle, color: theme.colors.primary }}>
          ⚡ مؤشرات حيّة
        </h2>
        <div style={styles.tokensGrid}>
          <TokenBar label="الكثافة" value={intensity} color={theme.colors.primary} max={100} />
          <TokenBar label="التشبّع" value={Math.round(theme.saturation * 100)} color={theme.colors.accent} max={100} />
          <TokenBar label="الضبابية" value={theme.blur} color="#94a3b8" max={18} />
          <TokenBar label="التباين" value={Math.round(theme.contrast * 100)} color="#e2e8f0" max={150} />
          <TokenBar label="الحواف" value={theme.borderRadius} color={theme.colors.primary} max={32} suffix="px" />
        </div>
      </section>

      {/* Soundscape Controls */}
      <section style={styles.section}>
        <h2 style={{ ...styles.sectionTitle, color: theme.colors.primary }}>
          🎵 الصوت المحيط
        </h2>
        <div style={styles.soundCard}>
          <button
            onClick={handleSoundToggle}
            style={{
              ...styles.soundButton,
              backgroundColor: soundEnabled ? theme.colors.primary : "transparent",
              borderColor: theme.colors.primary,
              color: soundEnabled ? (theme.isDark ? "#0a0e1f" : "#fff") : theme.colors.primary,
            }}
          >
            {soundEnabled ? "🔊 مُفعّل" : "🔇 مُعطّل"}
          </button>
          {soundEnabled && (
            <div style={styles.volumeControl}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>الصوت</span>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(soundVolume * 100)}
                onChange={(e) => handleVolumeChange(Number(e.target.value) / 100)}
                style={styles.volumeSlider}
              />
              <span style={{ fontSize: 12, opacity: 0.7 }}>{Math.round(soundVolume * 100)}%</span>
            </div>
          )}
          <p style={styles.soundTrack}>
            🎶 Track: {theme.state}.mp3
          </p>
        </div>
      </section>

      {/* Time & Session Info */}
      <section style={styles.section}>
        <h2 style={{ ...styles.sectionTitle, color: theme.colors.primary }}>
          ⏱️ السياق الزمني
        </h2>
        <div style={styles.timeCard}>
          <div style={styles.timeItem}>
            <span style={styles.timeIcon}>{timeInfo.icon}</span>
            <span style={styles.timeLabel}>{timeInfo.ar}</span>
          </div>
          <div style={styles.timeDivider} />
          <div style={styles.timeItem}>
            <span style={styles.timeIcon}>⏰</span>
            <span style={styles.timeLabel}>{sessionMinutes} دقيقة في الجلسة</span>
          </div>
          <div style={styles.timeDivider} />
          <div style={styles.timeItem}>
            <span style={styles.timeIcon}>{theme.isDark ? "🌑" : "☀️"}</span>
            <span style={styles.timeLabel}>{theme.isDark ? "وضع مظلم" : "وضع فاتح"}</span>
          </div>
        </div>
      </section>

      {/* Animation & Layout Info */}
      <section style={styles.section}>
        <div style={styles.infoRow}>
          <span style={styles.infoChip}>
            🎬 رسوم: {theme.animations === "minimal" ? "بسيطة" : theme.animations === "rich" ? "غنية" : "متوسطة"}
          </span>
          <span style={styles.infoChip}>
            📐 التخطيط: {theme.layout === "zen" ? "هادئ" : theme.layout === "information-dense" ? "كثيف" : "متوازن"}
          </span>
        </div>
      </section>

      {/* Active CSS Variables Debug (dev feel) */}
      <section style={{ ...styles.section, opacity: 0.6 }}>
        <details>
          <summary style={{ cursor: "pointer", fontSize: 13, marginBottom: 8 }}>
            🔧 CSS Variables (للمطورين)
          </summary>
          <pre style={styles.cssVarsPre}>
            {Object.entries(theme.cssVariables)
              .map(([k, v]) => `${k}: ${v};`)
              .join("\n")}
          </pre>
        </details>
      </section>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────

function TokenBar({ label, value, color, max, suffix = "%" }: {
  label: string; value: number; color: string; max: number; suffix?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={styles.tokenRow}>
      <span style={styles.tokenLabel}>{label}</span>
      <div style={styles.tokenTrack}>
        <div style={{
          ...styles.tokenFill,
          width: `${pct}%`,
          backgroundColor: color,
          boxShadow: `0 0 8px ${color}60`,
        }} />
      </div>
      <span style={styles.tokenValue}>{value}{suffix}</span>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    padding: "24px 20px 80px",
    fontFamily: "'Inter', 'Tajawal', sans-serif",
    transition: "background 2s ease, color 2s ease",
    direction: "rtl",
    maxWidth: 600,
    margin: "0 auto",
  },
  loadingPulse: {
    textAlign: "center",
    paddingTop: 200,
    fontSize: 18,
    opacity: 0.5,
    animation: "pulse 2s infinite",
  },
  header: {
    textAlign: "center",
    marginBottom: 32,
    paddingTop: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 800,
    margin: 0,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },

  // Emotional Ring
  ringSection: {
    display: "flex",
    justifyContent: "center",
    marginBottom: 40,
    cursor: "pointer",
  },
  emotionalRing: {
    width: 200,
    height: 200,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 2s ease",
    animation: "spin 12s linear infinite",
  },
  ringInner: {
    width: 160,
    height: 160,
    borderRadius: "50%",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    transition: "background-color 2s ease",
  },
  ringIcon: {
    fontSize: 40,
  },
  ringLabel: {
    fontSize: 20,
    fontWeight: 700,
  },
  ringHint: {
    fontSize: 11,
    opacity: 0.4,
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 700,
    marginBottom: 14,
  },

  // Token Bars
  tokensGrid: {
    display: "flex",
    flexDirection: "column" as const,
    gap: 12,
  },
  tokenRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  tokenLabel: {
    width: 70,
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.8,
  },
  tokenTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  tokenFill: {
    height: "100%",
    borderRadius: 4,
    transition: "width 2s ease, background-color 2s ease",
  },
  tokenValue: {
    width: 50,
    fontSize: 12,
    fontWeight: 600,
    textAlign: "left" as const,
    opacity: 0.7,
  },

  // Soundscape
  soundCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    display: "flex",
    flexDirection: "column" as const,
    gap: 14,
    alignItems: "center",
  },
  soundButton: {
    padding: "10px 28px",
    borderRadius: 24,
    border: "2px solid",
    fontSize: 15,
    fontWeight: 700,
    cursor: "pointer",
    transition: "all 0.3s ease",
  },
  volumeControl: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    width: "100%",
  },
  volumeSlider: {
    flex: 1,
    accentColor: "var(--atm-primary, #2dd4bf)",
  },
  soundTrack: {
    fontSize: 12,
    opacity: 0.5,
  },

  // Time
  timeCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    flexWrap: "wrap" as const,
  },
  timeItem: {
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  timeIcon: {
    fontSize: 20,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: 600,
  },
  timeDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  // Info row
  infoRow: {
    display: "flex",
    gap: 10,
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  infoChip: {
    padding: "6px 14px",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    fontSize: 13,
    fontWeight: 600,
  },

  // CSS Vars
  cssVarsPre: {
    fontSize: 11,
    lineHeight: 1.6,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.3)",
    overflow: "auto",
    direction: "ltr" as const,
    textAlign: "left" as const,
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
};

// ─── Keyframe injection ────────────────────────────────
if (typeof document !== "undefined") {
  const styleTag = document.createElement("style");
  styleTag.textContent = `
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `;
  document.head.appendChild(styleTag);
}
