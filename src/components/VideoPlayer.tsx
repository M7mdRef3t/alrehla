"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  RotateCcw, SkipBack, SkipForward, Settings, FileText,
  PictureInPicture, Bookmark, ChevronDown,
} from "lucide-react";

/* ═══════ Types ═══════ */
export interface Chapter {
  title: string;
  time: number; // seconds
}

export interface TimestampNote {
  time: number;
  text: string;
  id: string;
}

interface Props {
  src?: string;
  title?: string;
  unitId?: string;
  chapters?: Chapter[];
  color?: string;
  savedTime?: number;
  onEnded?: () => void;
  onProgress?: (pct: number) => void;
  onTimeUpdate?: (time: number) => void;
}

/* ═══════ Helpers ═══════ */
const LS = (key: string) => `alrehla_vp_${key}`;
const fmt = (s: number) => {
  const m = Math.floor(s / 60), sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
};
const glass = (bg = "rgba(0,0,0,0.6)", b = "rgba(255,255,255,0.1)"): React.CSSProperties => ({
  background: bg, border: `1px solid ${b}`, backdropFilter: "blur(12px)",
});

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/* ═══════ Component ═══════ */
export function VideoPlayer({
  src = "",
  title = "قوة التعاطف",
  unitId = "default",
  chapters = [
    { title: "مقدمة", time: 0 },
    { title: "مفهوم التعاطف", time: 180 },
    { title: "التطبيق العملي", time: 540 },
    { title: "تمارين ختامية", time: 900 },
  ],
  color = "#06B6D4",
  savedTime = 0,
  onEnded,
  onProgress,
  onTimeUpdate: parentOnTimeUpdate,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState<TimestampNote[]>(() => {
    try { return JSON.parse(localStorage.getItem(LS(`notes_${unitId}`)) || "[]"); } catch { return []; }
  });
  const [noteInput, setNoteInput] = useState("");
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [isPiP, setIsPiP] = useState(false);
  const [buffered, setBuffered] = useState(0);

  // Restore saved position
  useEffect(() => {
    const local = localStorage.getItem(LS(`pos_${unitId}`));
    // Priority: Local Storage (current device) > Cloud Saved Time (other devices)
    const initial = local ? parseFloat(local) : (savedTime || 0);
    if (initial > 0 && videoRef.current) {
      videoRef.current.currentTime = initial;
    }
  }, [unitId, savedTime]);

  // Video event handlers
  const onTimeUpdate = useCallback(() => {
    const v = videoRef.current; if (!v) return;
    const time = v.currentTime;
    setCurrentTime(time);
    onProgress?.(duration ? (time / duration) * 100 : 0);
    parentOnTimeUpdate?.(time);
    try { localStorage.setItem(LS(`pos_${unitId}`), String(time)); } catch {}
    if (v.buffered.length > 0) setBuffered(v.buffered.end(v.buffered.length - 1));
  }, [unitId, duration, onProgress, parentOnTimeUpdate]);

  const onLoadedMetadata = () => {
    if (videoRef.current) setDuration(videoRef.current.duration);
  };

  const onVideoEnded = () => {
    setPlaying(false);
    try { localStorage.removeItem(LS(`pos_${unitId}`)); } catch {}
    onEnded?.();
  };

  // Controls visibility
  const showControls = () => {
    setControlsVisible(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (playing) hideTimer.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  // Playback
  const togglePlay = () => {
    const v = videoRef.current; if (!v) return;
    if (playing) { v.pause(); setPlaying(false); }
    else { v.play().catch(() => {}); setPlaying(true); }
  };

  const seek = (t: number) => {
    if (videoRef.current) { videoRef.current.currentTime = Math.max(0, Math.min(t, duration)); }
  };

  const skip = (delta: number) => seek(currentTime + delta);

  const setSpeedAndApply = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSettings(false);
  };

  const setVolumeAndApply = (v: number) => {
    setVolume(v); setMuted(v === 0);
    if (videoRef.current) { videoRef.current.volume = v; videoRef.current.muted = v === 0; }
  };

  const toggleMute = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
  };

  // Fullscreen
  useEffect(() => {
    const handler = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) await containerRef.current.requestFullscreen();
    else await document.exitFullscreen();
  };

  // PiP
  const togglePiP = async () => {
    const v = videoRef.current; if (!v) return;
    try {
      if (document.pictureInPictureElement) { await document.exitPictureInPicture(); setIsPiP(false); }
      else { await v.requestPictureInPicture(); setIsPiP(true); }
    } catch {}
  };

  // Seek bar interaction
  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current; if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const handleSeekHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressRef.current; if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setHoveredTime(pct * duration);
    setHoverX(e.clientX - rect.left);
  };

  // Chapter at current time
  const activeChapter = [...chapters].reverse().find(c => currentTime >= c.time) ?? chapters[0];

  // Notes
  const addNote = () => {
    if (!noteInput.trim()) return;
    const n: TimestampNote = { id: Date.now().toString(), time: currentTime, text: noteInput.trim() };
    const updated = [...notes, n].sort((a, b) => a.time - b.time);
    setNotes(updated);
    setNoteInput("");
    try { localStorage.setItem(LS(`notes_${unitId}`), JSON.stringify(updated)); } catch {}
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    setNotes(updated);
    try { localStorage.setItem(LS(`notes_${unitId}`), JSON.stringify(updated)); } catch {}
  };

  const progress = duration ? (currentTime / duration) * 100 : 0;
  const buffPct = duration ? (buffered / duration) * 100 : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, direction: "rtl" }}>
      {/* ── Player Container ── */}
      <div
        ref={containerRef}
        onMouseMove={showControls}
        onMouseLeave={() => playing && setControlsVisible(false)}
        onClick={togglePlay}
        style={{
          position: "relative", borderRadius: fullscreen ? 0 : 18, overflow: "hidden",
          background: "#000", aspectRatio: "16/9", cursor: "pointer",
          border: `1px solid ${color}20`,
        }}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={src}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onEnded={onVideoEnded}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />

        {/* No-src placeholder */}
        {!src && (
          <div style={{
            position: "absolute", inset: 0,
            background: `linear-gradient(135deg, ${color}18, rgba(139,92,246,0.12), #000)`,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12,
          }}>
            <div style={{ width: 70, height: 70, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "2px solid rgba(255,255,255,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {playing ? <Pause size={28} color="#fff" /> : <Play size={28} color="#fff" fill="#fff" style={{ marginRight: -4 }} />}
            </div>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, margin: 0 }}>مشغل الفيديو التعليمي</p>
          </div>
        )}

        {/* Big play button overlay */}
        <AnimatePresence>
          {!playing && (
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "2px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Play size={26} color="#fff" fill="#fff" style={{ marginRight: -4 }} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Chapter badge */}
        <AnimatePresence>
          {controlsVisible && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ position: "absolute", top: 12, right: 12, ...glass(), borderRadius: 10, padding: "4px 10px", pointerEvents: "none" }}>
              <p style={{ margin: 0, fontSize: 9, fontWeight: 900, color, letterSpacing: "0.06em" }}>{activeChapter?.title}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls overlay */}
        <AnimatePresence>
          {controlsVisible && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "20px 12px 10px",
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)" }}>

              {/* Seek bar */}
              <div ref={progressRef} onClick={handleSeekClick} onMouseMove={handleSeekHover} onMouseLeave={() => setHoveredTime(null)}
                style={{ width: "100%", height: 4, background: "rgba(255,255,255,0.15)", borderRadius: 2, cursor: "pointer", marginBottom: 10, position: "relative" }}>
                {/* Buffered */}
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${buffPct}%`, background: "rgba(255,255,255,0.2)", borderRadius: 2, pointerEvents: "none" }} />
                {/* Progress */}
                <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, ${color}, #8B5CF6)`, borderRadius: 2, pointerEvents: "none" }} />
                {/* Thumb */}
                <div style={{ position: "absolute", top: "50%", left: `${progress}%`, transform: "translate(-50%, -50%)", width: 12, height: 12, borderRadius: "50%", background: "#fff", boxShadow: `0 0 8px ${color}`, pointerEvents: "none" }} />
                {/* Chapter markers */}
                {chapters.map((ch, i) => (
                  <div key={i} title={ch.title} style={{ position: "absolute", top: "50%", left: `${(ch.time / duration) * 100}%`, transform: "translate(-50%, -50%)", width: 4, height: 4, borderRadius: "50%", background: "rgba(255,255,255,0.7)", pointerEvents: "none" }} />
                ))}
                {/* Hover tooltip */}
                {hoveredTime !== null && (
                  <div style={{ ...glass(), position: "absolute", bottom: 10, left: hoverX, transform: "translateX(-50%)", padding: "3px 8px", borderRadius: 8, fontSize: 9, color: "#fff", whiteSpace: "nowrap", pointerEvents: "none" }}>
                    {fmt(hoveredTime)}
                  </div>
                )}
              </div>

              {/* Controls row */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {/* Play/Pause */}
                <button onClick={togglePlay} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff", display: "flex" }}>
                  {playing ? <Pause size={18} color="#fff" /> : <Play size={18} color="#fff" fill="#fff" />}
                </button>
                {/* Skip back 10 */}
                <button onClick={() => skip(-10)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff", display: "flex", alignItems: "center", gap: 1, fontSize: 9 }}>
                  <RotateCcw size={15} color="rgba(255,255,255,0.8)" /> <span style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>10</span>
                </button>
                {/* Skip forward 10 */}
                <button onClick={() => skip(10)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#fff", display: "flex", alignItems: "center", gap: 1, fontSize: 9 }}>
                  <span style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>10</span> <SkipForward size={15} color="rgba(255,255,255,0.8)" />
                </button>

                {/* Time */}
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", fontVariantNumeric: "tabular-nums", minWidth: 80 }}>
                  {fmt(currentTime)} / {fmt(duration)}
                </span>

                <div style={{ flex: 1 }} />

                {/* Volume */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <button onClick={toggleMute} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                    {muted || volume === 0 ? <VolumeX size={16} color="rgba(255,255,255,0.7)" /> : <Volume2 size={16} color="rgba(255,255,255,0.7)" />}
                  </button>
                  <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                    onChange={e => setVolumeAndApply(Number(e.target.value))}
                    style={{ width: 60, accentColor: color, cursor: "pointer" }} />
                </div>

                {/* Speed */}
                <div style={{ position: "relative" }}>
                  <button onClick={e => { e.stopPropagation(); setShowSettings(v => !v); }}
                    style={{ ...glass("rgba(255,255,255,0.1)", "rgba(255,255,255,0.2)"), border: "none", borderRadius: 8, padding: "3px 8px", cursor: "pointer", fontSize: 10, fontWeight: 900, color: "#fff", display: "flex", alignItems: "center", gap: 3 }}>
                    {speed}× <ChevronDown size={10} />
                  </button>
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: "absolute", bottom: 32, left: "50%", transform: "translateX(-50%)", ...glass(), borderRadius: 12, padding: "6px 0", minWidth: 80, zIndex: 10 }}>
                        {SPEEDS.map(s => (
                          <button key={s} onClick={e => { e.stopPropagation(); setSpeedAndApply(s); }}
                            style={{ width: "100%", padding: "6px 14px", background: speed === s ? `${color}20` : "none", border: "none", cursor: "pointer", fontSize: 11, fontWeight: speed === s ? 900 : 600, color: speed === s ? color : "rgba(255,255,255,0.7)", textAlign: "center" }}>
                            {s}×
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Notes toggle */}
                <button onClick={e => { e.stopPropagation(); setShowNotes(v => !v); }}
                  style={{ background: showNotes ? `${color}20` : "none", border: showNotes ? `1px solid ${color}30` : "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}>
                  <FileText size={15} color={showNotes ? color : "rgba(255,255,255,0.6)"} />
                </button>

                {/* PiP */}
                {document.pictureInPictureEnabled && (
                  <button onClick={e => { e.stopPropagation(); togglePiP(); }}
                    style={{ background: isPiP ? `${color}20` : "none", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}>
                    <PictureInPicture size={15} color={isPiP ? color : "rgba(255,255,255,0.6)"} />
                  </button>
                )}

                {/* Fullscreen */}
                <button onClick={e => { e.stopPropagation(); toggleFullscreen(); }}
                  style={{ background: "none", border: "none", borderRadius: 8, padding: 5, cursor: "pointer", display: "flex" }}>
                  {fullscreen ? <Minimize size={15} color="rgba(255,255,255,0.7)" /> : <Maximize size={15} color="rgba(255,255,255,0.7)" />}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Chapters ── */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", padding: "2px 0" }}>
        {chapters.map((ch, i) => {
          const isActive = activeChapter === ch;
          return (
            <button key={i} onClick={() => seek(ch.time)}
              style={{ flexShrink: 0, padding: "5px 10px", borderRadius: 10, cursor: "pointer", border: `1px solid ${isActive ? color : "rgba(255,255,255,0.08)"}`, background: isActive ? `${color}15` : "rgba(255,255,255,0.03)", fontSize: 9, fontWeight: isActive ? 900 : 600, color: isActive ? color : "#64748B", whiteSpace: "nowrap" }}>
              {ch.title} · {fmt(ch.time)}
            </button>
          );
        })}
      </div>

      {/* ── Timestamp Notes ── */}
      <AnimatePresence>
        {showNotes && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} style={{ overflow: "hidden" }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 14 }}>
              <p style={{ margin: "0 0 10px", fontSize: 10, fontWeight: 900, color: "#94a3b8", display: "flex", alignItems: "center", gap: 5 }}>
                <FileText size={12} /> ملاحظاتي الزمنية
              </p>
              {/* Add note */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <button onClick={() => seek(currentTime)}
                  style={{ flexShrink: 0, padding: "6px 10px", borderRadius: 10, cursor: "pointer", background: `${color}12`, border: `1px solid ${color}25`, fontSize: 9, fontWeight: 900, color, whiteSpace: "nowrap" }}>
                  <Bookmark size={10} /> {fmt(currentTime)}
                </button>
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addNote()}
                  placeholder="اكتب ملاحظة عند هذه اللحظة..."
                  style={{ flex: 1, padding: "6px 10px", borderRadius: 10, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#e2e8f0", fontSize: 10, direction: "rtl" }} />
                <button onClick={addNote} style={{ padding: "6px 14px", borderRadius: 10, border: "none", cursor: "pointer", background: `linear-gradient(135deg,${color},#8B5CF6)`, fontSize: 10, fontWeight: 900, color: "#fff" }}>
                  أضف
                </button>
              </div>
              {/* Notes list */}
              {notes.length === 0
                ? <p style={{ fontSize: 9, color: "#334155", textAlign: "center" }}>لا توجد ملاحظات بعد</p>
                : <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {notes.map(n => (
                    <div key={n.id} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <button onClick={() => seek(n.time)}
                        style={{ flexShrink: 0, padding: "3px 8px", borderRadius: 8, cursor: "pointer", background: `${color}10`, border: `1px solid ${color}20`, fontSize: 8, fontWeight: 900, color }}>
                        {fmt(n.time)}
                      </button>
                      <p style={{ flex: 1, margin: 0, fontSize: 10, color: "#94a3b8", lineHeight: 1.6 }}>{n.text}</p>
                      <button onClick={() => deleteNote(n.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: "#334155", padding: 2 }}>✕</button>
                    </div>
                  ))}
                </div>
              }
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
