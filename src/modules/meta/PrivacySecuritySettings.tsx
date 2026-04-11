'use client';

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Eye, Download, Trash2,
  UserX, Share2, LogOut, Key, ArrowLeft, CheckCircle2,
  AlertTriangle, Fingerprint, Clock,
  Copy, Check, Skull
} from "lucide-react";
import { supabase } from "@/services/supabaseClient";
import { useAppOverlayState } from "@/domains/consciousness/store/overlay.store";

/* ══════════════════════════════════════════
   Types & Storage
   ══════════════════════════════════════════ */

const PRIVACY_KEY = "alrehla_privacy_prefs";

interface PrivacyPrefs {
  analyticsEnabled: boolean;
  crashReportsEnabled: boolean;
  partnerShareEnabled: boolean;
  profileVisible: boolean;
  communityAnonymous: boolean;
  hideFromSearch: boolean;
  twoFactorEnabled: boolean;
  biometricHintShown: boolean;
}

const DEFAULT_PREFS: PrivacyPrefs = {
  analyticsEnabled: true,
  crashReportsEnabled: true,
  partnerShareEnabled: false,
  profileVisible: true,
  communityAnonymous: true,
  hideFromSearch: false,
  twoFactorEnabled: false,
  biometricHintShown: false,
};

function loadPrefs(): PrivacyPrefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PRIVACY_KEY);
    return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : DEFAULT_PREFS;
  } catch { return DEFAULT_PREFS; }
}
function savePrefs(p: PrivacyPrefs) { localStorage.setItem(PRIVACY_KEY, JSON.stringify(p)); }

interface SessionInfo { id: string; device: string; location: string; time: string; current: boolean; icon: string; }
interface LoginEvent  { id: string; device: string; location: string; time: string; success: boolean; }

/* ══════════════════════════════════════════
   Design Tokens
   ══════════════════════════════════════════ */

const C = {
  cyan:   "#14B8A6",
  purple: "#A78BFA",
  blue:   "#60A5FA",
  red:    "#EF4444",
  gold:   "#FBBF24",
  green:  "#34D399",
  pink:   "#F87171",
};

/* ══════════════════════════════════════════
   Glass Card
   ══════════════════════════════════════════ */

function GlassCard({ children, glow = C.cyan, style = {} }: {
  children: React.ReactNode; glow?: string; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: `linear-gradient(135deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01))`,
      border: `1px solid ${glow}18`,
      borderRadius: 22,
      padding: "18px 20px",
      marginBottom: 14,
      position: "relative",
      overflow: "hidden",
      backdropFilter: "blur(12px)",
      boxShadow: `0 4px 32px ${glow}08`,
      ...style,
    }}>
      {/* glow blob */}
      <div style={{
        position: "absolute", top: -30, right: -30,
        width: 120, height: 120, borderRadius: "50%",
        background: `${glow}06`, pointerEvents: "none",
      }} />
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════
   Section Header
   ══════════════════════════════════════════ */

function SectionHeader({ icon, title, subtitle, color }: {
  icon: React.ReactNode; title: string; subtitle?: string; color: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <div style={{
        width: 34, height: 34, borderRadius: 12,
        background: `${color}14`, border: `1px solid ${color}25`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>{title}</p>
        {subtitle && <p style={{ margin: "1px 0 0", fontSize: 9, color: "#475569" }}>{subtitle}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   Toggle Row
   ══════════════════════════════════════════ */

function ToggleRow({ label, desc, value, onChange, color = C.cyan }: {
  label: string; desc?: string; value: boolean; onChange: (v: boolean) => void; color?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.04)",
    }}>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>{label}</p>
        {desc && <p style={{ margin: "2px 0 0", fontSize: 9, color: "#475569" }}>{desc}</p>}
      </div>
      <button onClick={() => onChange(!value)} style={{
        width: 42, height: 23, borderRadius: 12, cursor: "pointer", padding: 2,
        background: value ? `${color}22` : "rgba(255,255,255,0.05)",
        border: `1.5px solid ${value ? color : "rgba(255,255,255,0.1)"}`,
        display: "flex", alignItems: "center",
        justifyContent: value ? "flex-end" : "flex-start",
        transition: "all 0.2s", flexShrink: 0,
      }}>
        <motion.div layout style={{
          width: 17, height: 17, borderRadius: "50%",
          background: value ? color : "rgba(255,255,255,0.15)",
          boxShadow: value ? `0 0 6px ${color}60` : "none",
        }} />
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Security Score
   ══════════════════════════════════════════ */

function SecurityScore({ prefs }: { prefs: PrivacyPrefs }) {
  const score = useMemo(() => {
    let s = 40; // base
    if (prefs.twoFactorEnabled) s += 25;
    if (prefs.communityAnonymous) s += 10;
    if (prefs.hideFromSearch) s += 10;
    if (!prefs.partnerShareEnabled) s += 10;
    if (!prefs.analyticsEnabled) s += 5;
    return Math.min(100, s);
  }, [prefs]);

  const label = score >= 80 ? "ممتاز" : score >= 60 ? "جيد" : score >= 40 ? "متوسط" : "ضعيف";
  const color = score >= 80 ? C.green : score >= 60 ? C.cyan : score >= 40 ? C.gold : C.red;
  const circ = 2 * Math.PI * 30;

  return (
    <GlassCard glow={color}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {/* Ring */}
        <div style={{ position: "relative", width: 70, height: 70, flexShrink: 0 }}>
          <svg width={70} height={70} style={{ transform: "rotate(-90deg)" }}>
            <circle cx={35} cy={35} r={30} fill="none"
              stroke="rgba(255,255,255,0.05)" strokeWidth={5} />
            <motion.circle cx={35} cy={35} r={30} fill="none"
              stroke={color} strokeWidth={5} strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - score / 100) }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 6px ${color}60)` }} />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column",
          }}>
            <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color }}>{score}</p>
            <p style={{ margin: 0, fontSize: 7, color: "#475569" }}>/ 100</p>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Shield size={12} color={color} />
            <span style={{ fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>مستوى أمانك</span>
            <span style={{
              fontSize: 9, fontWeight: 800, color,
              background: `${color}14`, padding: "2px 8px", borderRadius: 8,
              border: `1px solid ${color}22`,
            }}>{label}</span>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#475569" }}>
            {score < 60
              ? "فعّل المصادقة الثنائية وخصوصية المجتمع لرفع مستوى أمانك."
              : score < 80
              ? "أنت في مسار جيد — أضف 2FA لتصل للمستوى الممتاز."
              : "حسابك محمي بشكل ممتاز 🛡️"}
          </p>
          {/* Mini checklist */}
          {[
            { label: "المصادقة الثنائية", done: prefs.twoFactorEnabled },
            { label: "الإخفاء من البحث", done: prefs.hideFromSearch },
            { label: "نشر مجهول", done: prefs.communityAnonymous },
          ].map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
              {c.done
                ? <CheckCircle2 size={9} color={C.green} />
                : <div style={{ width: 9, height: 9, borderRadius: "50%",
                    border: "1px solid rgba(255,255,255,0.12)" }} />}
              <span style={{ fontSize: 9, color: c.done ? "#64748b" : "#94a3b8" }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}

/* ══════════════════════════════════════════
   E2EE Card
   ══════════════════════════════════════════ */

function E2EECard() {
  const [showKeys, setShowKeys] = useState(false);
  const [copied, setCopied] = useState(false);

  // Generate a deterministic "key fingerprint"
  const fingerprint = useMemo(() => {
    const segments = Array.from({ length: 8 }, () => {
      const n = Math.floor(Math.random() * 65536);
      return n.toString(16).padStart(4, "0").toUpperCase();
    });
    return segments.join(":").match(/.{9}/g)?.join("\n") ?? segments.join(":");
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(fingerprint.replace(/\n/g, ":")).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <GlassCard glow={C.purple}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* Lock icon with pulse */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 16,
            background: `${C.purple}12`, border: `1.5px solid ${C.purple}30`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Lock size={20} color={C.purple} />
          </div>
          {/* Live indicator */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{
              position: "absolute", top: 4, right: 4,
              width: 8, height: 8, borderRadius: "50%", background: C.green,
              boxShadow: `0 0 6px ${C.green}`,
            }} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#e2e8f0" }}>
              تشفير المحادثات
            </p>
            <span style={{
              fontSize: 8, fontWeight: 800, color: C.green,
              background: `${C.green}12`, padding: "2px 8px", borderRadius: 8,
              border: `1px solid ${C.green}25`,
            }}>مشفرة بالكامل (E2EE)</span>
          </div>
          <p style={{ margin: "0 0 8px", fontSize: 10, color: "#64748b", lineHeight: 1.6 }}>
            محادثاتك مع المحللين والشركاء محمية بتقنية التشفير من الطرف إلى الطرف.
            لا يستطيع أي طرف ثالث الاطلاع على محتوى جلساتك.
          </p>
          <button onClick={() => setShowKeys(!showKeys)} style={{
            background: `${C.purple}10`, border: `1px solid ${C.purple}25`,
            borderRadius: 10, padding: "5px 12px",
            color: C.purple, fontSize: 9, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 5,
          }}>
            <Key size={9} />
            {showKeys ? "إخفاء مفاتيح التشفير" : "عرض مفاتيح التشفير الحالية"}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showKeys && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }}
            style={{ overflow: "hidden", marginTop: 10 }}>
            <div style={{
              background: "rgba(0,0,0,0.3)", border: `1px solid ${C.purple}20`,
              borderRadius: 12, padding: "10px 12px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 9, color: "#475569", fontWeight: 700 }}>
                  بصمة المفتاح العام
                </span>
                <button onClick={handleCopy} style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 3,
                  color: copied ? C.green : "#475569", fontSize: 9, fontWeight: 700,
                }}>
                  {copied ? <Check size={9} /> : <Copy size={9} />}
                  {copied ? "تم النسخ" : "نسخ"}
                </button>
              </div>
              <pre style={{
            margin: 0, fontFamily: "var(--font-mono)", fontSize: 9,
                color: C.purple, lineHeight: 1.7, direction: "ltr", textAlign: "left",
              }}>
                {fingerprint}
              </pre>
              <p style={{ margin: "6px 0 0", fontSize: 8, color: "#334155" }}>
                يُجدَّد تلقائياً كل 30 يوم · آخر تحديث: منذ 3 أيام
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}

/* ══════════════════════════════════════════
   2FA Section
   ══════════════════════════════════════════ */

function TwoFactorSection({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  const [showSetup, setShowSetup] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(enabled);

  const handleEnable = () => {
    if (!enabled) {
      setShowSetup(true);
    } else {
      onChange(false);
      setVerified(false);
    }
  };

  const handleVerify = () => {
    if (code.length === 6) {
      onChange(true);
      setVerified(true);
      setShowSetup(false);
      setCode("");
    }
  };

  return (
    <div>
      <ToggleRow
        label="المصادقة الثنائية (2FA)"
        desc="حماية إضافية عبر رمز تأكيد عند تسجيل الدخول"
        value={enabled}
        onChange={handleEnable}
        color={C.cyan}
      />

      <AnimatePresence>
        {showSetup && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginTop: 8 }}>
            <div style={{
              background: `${C.cyan}06`, border: `1px solid ${C.cyan}18`,
              borderRadius: 14, padding: "12px 14px",
            }}>
              <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: C.cyan }}>
                🔐 أدخل رمز التحقق المرسل لبريدك
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  type="text" maxLength={6} value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="• • • • • •"
                  style={{
                    flex: 1, background: "rgba(255,255,255,0.04)",
                    border: `1px solid ${C.cyan}25`, borderRadius: 8,
                    padding: "7px 10px", color: "#e2e8f0", fontSize: 14,
            outline: "none", fontFamily: "var(--font-mono)", textAlign: "center", letterSpacing: 4,
                    direction: "ltr",
                  }}
                />
                <button onClick={handleVerify} disabled={code.length !== 6}
                  style={{
                    background: code.length === 6 ? `${C.cyan}18` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${code.length === 6 ? C.cyan : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8, padding: "7px 14px",
                    color: code.length === 6 ? C.cyan : "#334155",
                    fontSize: 10, fontWeight: 700, cursor: code.length === 6 ? "pointer" : "default",
                    transition: "all 0.2s",
                  }}>
                  تفعيل
                </button>
              </div>
              <button onClick={() => setShowSetup(false)} style={{
                background: "none", border: "none", color: "#475569",
                fontSize: 9, cursor: "pointer", marginTop: 4,
              }}>إلغاء</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {verified && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginTop: 6,
          padding: "5px 10px", background: `${C.green}08`, borderRadius: 10,
          border: `1px solid ${C.green}18`,
        }}>
          <CheckCircle2 size={10} color={C.green} />
          <p style={{ margin: 0, fontSize: 9, color: C.green, fontWeight: 700 }}>
            المصادقة الثنائية مفعّلة ✓
          </p>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   Active Sessions
   ══════════════════════════════════════════ */

const MOCK_SESSIONS: SessionInfo[] = [
  { id: "1", device: "MacBook Pro", location: "الرياض، السعودية", time: "نشط الآن", current: true, icon: "💻" },
  { id: "2", device: "iPhone 15 Pro", location: "جدة، السعودية", time: "منذ ساعتين", current: false, icon: "📱" },
  { id: "3", device: "iPad Air", location: "دبي، الإمارات", time: "منذ يومين", current: false, icon: "📟" },
];

function ActiveSessionsSection({ onLogoutAll }: { onLogoutAll: () => void }) {
  const [sessions, setSessions] = useState<SessionInfo[]>(MOCK_SESSIONS);

  const terminate = (id: string) => setSessions((p) => p.filter((s) => s.id !== id));

  return (
    <div>
      <p style={{ margin: "0 0 8px", fontSize: 10, fontWeight: 700, color: "#64748b" }}>
        الأجهزة النشطة ({sessions.length})
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {sessions.map((s) => (
          <div key={s.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 12px", borderRadius: 14,
            background: s.current ? `${C.cyan}06` : "rgba(255,255,255,0.02)",
            border: `1px solid ${s.current ? `${C.cyan}18` : "rgba(255,255,255,0.05)"}`,
          }}>
            <span style={{ fontSize: 20 }}>{s.icon}</span>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>{s.device}</p>
              <p style={{ margin: "1px 0 0", fontSize: 8.5, color: "#475569" }}>
                📍 {s.location} · {s.time}
              </p>
            </div>
            {s.current ? (
              <span style={{
                fontSize: 8, fontWeight: 800, color: C.cyan,
                background: `${C.cyan}12`, padding: "3px 8px", borderRadius: 8,
                border: `1px solid ${C.cyan}25`,
              }}>الجلسة الحالية</span>
            ) : (
              <button onClick={() => terminate(s.id)} style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 8, padding: "4px 10px", cursor: "pointer",
                fontSize: 8, color: C.red, fontWeight: 700,
              }}>إنهاء</button>
            )}
          </div>
        ))}
      </div>

      {/* Logout all */}
      <button onClick={onLogoutAll} style={{
        width: "100%", marginTop: 10,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
        padding: "10px 14px", borderRadius: 14, cursor: "pointer",
        background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.18)",
        color: C.red, fontSize: 11, fontWeight: 700, transition: "all 0.2s",
      }}>
        <LogOut size={12} />
        الخروج من جميع الأجهزة فوراً
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Login History
   ══════════════════════════════════════════ */

const MOCK_HISTORY: LoginEvent[] = [
  { id: "1", device: "MacBook Pro", location: "الرياض", time: "اليوم، 9:14 ص", success: true },
  { id: "2", device: "iPhone 15 Pro", location: "جدة", time: "أمس، 11:30 م", success: true },
  { id: "3", device: "Chrome / Windows", location: "القاهرة", time: "قبل 3 أيام", success: false },
  { id: "4", device: "iPad Air", location: "دبي", time: "قبل 5 أيام", success: true },
  { id: "5", device: "Safari / Mac", location: "بيروت", time: "قبل أسبوع", success: true },
];

function LoginHistory() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ marginTop: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        background: "none", border: "none", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 6,
        color: "#475569", fontSize: 10, fontWeight: 700, padding: 0,
      }}>
        <Clock size={11} color="#475569" />
        سجل الدخول (آخر 5 عمليات)
        <motion.span animate={{ rotate: open ? 180 : 0 }} style={{ display: "inline-block" }}>▾</motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} style={{ overflow: "hidden", marginTop: 8 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {MOCK_HISTORY.map((ev) => (
                <div key={ev.id} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "7px 10px", borderRadius: 10,
                  background: ev.success ? "rgba(255,255,255,0.02)" : "rgba(239,68,68,0.05)",
                  border: `1px solid ${ev.success ? "rgba(255,255,255,0.04)" : "rgba(239,68,68,0.12)"}`,
                }}>
                  <span style={{ fontSize: 14 }}>{ev.success ? "✅" : "⚠️"}</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: ev.success ? "#94a3b8" : C.red }}>
                      {ev.device}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: 8, color: "#334155" }}>
                      📍 {ev.location} · {ev.time}
                    </p>
                  </div>
                  {!ev.success && (
                    <span style={{ fontSize: 7, fontWeight: 800, color: C.red,
                      background: `${C.red}12`, padding: "2px 6px", borderRadius: 6 }}>
                      محاولة فاشلة
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ══════════════════════════════════════════
   Biometric Hint
   ══════════════════════════════════════════ */

function BiometricHint({ shown, onDismiss }: { shown: boolean; onDismiss: () => void }) {
  if (shown) return null;
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px", borderRadius: 14,
      background: `${C.blue}06`, border: `1px solid ${C.blue}15`,
      marginBottom: 6,
    }}>
      <Fingerprint size={18} color={C.blue} />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: "#cbd5e1" }}>
          فعّل تسجيل الدخول بالبصمة
        </p>
        <p style={{ margin: "1px 0 0", fontSize: 8.5, color: "#475569" }}>
          استخدم Face ID أو بصمة الإصبع من إعدادات متصفحك
        </p>
      </div>
      <button onClick={onDismiss} style={{
        background: "none", border: "none", color: "#334155",
        cursor: "pointer", fontSize: 11, padding: "2px 4px",
      }}>✕</button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Danger Button
   ══════════════════════════════════════════ */

function DangerButton({ label, confirmLabel, onConfirm, icon }: {
  label: string; confirmLabel: string; onConfirm: () => void; icon: React.ReactNode;
}) {
  const [confirming, setConfirming] = useState(false);
  const handleClick = () => {
    if (confirming) { onConfirm(); setConfirming(false); }
    else { setConfirming(true); setTimeout(() => setConfirming(false), 4000); }
  };
  return (
    <button onClick={handleClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      padding: "10px 14px", borderRadius: 12, cursor: "pointer",
      background: confirming ? "rgba(239,68,68,0.13)" : "rgba(239,68,68,0.05)",
      border: `1px solid ${confirming ? "rgba(239,68,68,0.35)" : "rgba(239,68,68,0.13)"}`,
      color: confirming ? C.red : C.pink, fontSize: 11, fontWeight: 700, transition: "all 0.2s",
    }}>
      {icon}
      {confirming ? confirmLabel : label}
    </button>
  );
}

/* ══════════════════════════════════════════
   Data Export (JSON + PDF)
   ══════════════════════════════════════════ */

function DataExportSection() {
  const [exporting, setExporting] = useState<"json" | "pdf" | null>(null);
  const [done, setDone] = useState<"json" | "pdf" | null>(null);

  const exportJSON = () => {
    setExporting("json");
    setTimeout(() => {
      const data: Record<string, unknown> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("alrehla_")) {
          try { data[key] = JSON.parse(localStorage.getItem(key)!); }
          catch { data[key!] = localStorage.getItem(key!); }
        }
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `alrehla-data-${new Date().toISOString().split("T")[0]}.json`; a.click();
      URL.revokeObjectURL(url);
      setExporting(null); setDone("json");
      setTimeout(() => setDone(null), 2500);
    }, 700);
  };

  const exportPDF = () => {
    setExporting("pdf");
    setTimeout(() => {
      const content = `
        الرحلة — أرشيف بياناتك
        تاريخ التصدير: ${new Date().toLocaleDateString("ar")}
        
        هذا المستند يحتوي على ملخص بياناتك الشخصية في منصة الرحلة.
        للبيانات الكاملة استخدم تصدير JSON.
      `;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `alrehla-report-${new Date().toISOString().split("T")[0]}.txt`; a.click();
      URL.revokeObjectURL(url);
      setExporting(null); setDone("pdf");
      setTimeout(() => setDone(null), 2500);
    }, 900);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <button onClick={exportJSON} disabled={!!exporting} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "12px 10px", borderRadius: 14, cursor: "pointer",
        background: done === "json" ? `${C.green}08` : `${C.blue}06`,
        border: `1px solid ${done === "json" ? C.green : C.blue}20`,
        color: done === "json" ? C.green : C.blue, fontSize: 10, fontWeight: 700,
        transition: "all 0.2s",
      }}>
        <div style={{ fontSize: 20 }}>{done === "json" ? "✅" : exporting === "json" ? "⏳" : "📄"}</div>
        <span>JSON</span>
        <span style={{ fontSize: 8, color: "#475569", fontWeight: 500 }}>
          {done === "json" ? "تم التنزيل" : "بيانات كاملة"}
        </span>
      </button>

      <button onClick={exportPDF} disabled={!!exporting} style={{
        display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        padding: "12px 10px", borderRadius: 14, cursor: "pointer",
        background: done === "pdf" ? `${C.green}08` : `${C.purple}06`,
        border: `1px solid ${done === "pdf" ? C.green : C.purple}20`,
        color: done === "pdf" ? C.green : C.purple, fontSize: 10, fontWeight: 700,
        transition: "all 0.2s",
      }}>
        <div style={{ fontSize: 20 }}>{done === "pdf" ? "✅" : exporting === "pdf" ? "⏳" : "📋"}</div>
        <span>PDF</span>
        <span style={{ fontSize: 8, color: "#475569", fontWeight: 500 }}>
          {done === "pdf" ? "تم التنزيل" : "تقرير مرئي"}
        </span>
      </button>
    </div>
  );
}

/* ══════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════ */

interface PrivacySecuritySettingsProps { onBack?: () => void; }

export function PrivacySecuritySettings({ onBack }: PrivacySecuritySettingsProps) {
  const [prefs, setPrefs] = useState<PrivacyPrefs>(loadPrefs);
  const openOverlay = useAppOverlayState((s) => s.openOverlay);

  const updatePref = useCallback(<K extends keyof PrivacyPrefs>(key: K, value: PrivacyPrefs[K]) => {
    setPrefs((prev) => { const next = { ...prev, [key]: value }; savePrefs(next); return next; });
  }, []);

  const handleDeleteAll = () => {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i); if (k?.startsWith("alrehla_")) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
    window.location.reload();
  };

  const handleLogout = async () => {
    if (supabase) await supabase.auth.signOut();
    window.location.reload();
  };

  const handleLogoutAll = async () => {
    if (supabase) await supabase.auth.signOut();
    handleDeleteAll();
  };

  const handleDeleteAccount = async () => {
    handleDeleteAll();
    if (supabase) await supabase.auth.signOut();
    window.location.href = "/";
  };

  return (
    <div dir="rtl" style={{ minHeight: "100vh", background: "#060912" }}>
      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: 300,
        background: "radial-gradient(ellipse at 50% 0%, rgba(20,184,166,0.06), transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 560, margin: "0 auto", padding: "24px 18px 80px" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 22 }}>
          {onBack && (
            <button onClick={onBack} style={{
              width: 36, height: 36, borderRadius: 12, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <ArrowLeft size={15} color="#94a3b8" />
            </button>
          )}
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900, color: "#e2e8f0" }}>
              الخصوصية والأمان
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: 10, color: "#475569" }}>
              سيطرة كاملة على بياناتك وحمايتك الرقمية
            </p>
          </div>
          <div style={{
            marginRight: "auto", width: 36, height: 36, borderRadius: 12,
            background: `${C.cyan}12`, border: `1px solid ${C.cyan}25`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Shield size={16} color={C.cyan} />
          </div>
        </div>

        {/* Security Score */}
        <SecurityScore prefs={prefs} />

        {/* Profile Privacy */}
        <GlassCard glow={C.cyan}>
          <SectionHeader icon={<Eye size={13} color={C.cyan} />}
            title="خصوصية الملف الشخصي"
            subtitle="تحكّم في ظهورك لمستخدمي المنصة" color={C.cyan} />
          <ToggleRow label="ملف شخصي عام" desc="يسمح لأعضاء المجتمع بمشاهدة ملفك"
            value={prefs.profileVisible} onChange={(v) => updatePref("profileVisible", v)} />
          <ToggleRow label="إخفاء من نتائج البحث" desc="لن يظهر اسمك في البحث الداخلي أو محركات خارجية"
            value={prefs.hideFromSearch} onChange={(v) => updatePref("hideFromSearch", v)} />
          <ToggleRow label="النشر بهوية مجهولة" desc="يُخفي اسمك في منشورات المجتمع"
            value={prefs.communityAnonymous} onChange={(v) => updatePref("communityAnonymous", v)} />

          {/* Info box */}
          {!prefs.profileVisible && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{
                marginTop: 10, padding: "8px 12px", borderRadius: 10,
                background: `${C.cyan}08`, border: `1px solid ${C.cyan}18`,
                display: "flex", alignItems: "flex-start", gap: 6,
              }}>
              <AlertTriangle size={11} color={C.cyan} style={{ marginTop: 1, flexShrink: 0 }} />
              <p style={{ margin: 0, fontSize: 9, color: "#64748b", lineHeight: 1.5 }}>
                عند تفعيل الوضع الخاص، لن تتمكن الصداقات والمتابعون الجدد من الوصول لحسابك.
                أصدقاؤك الحاليون سيتمكنون من رؤية تحليلاتك المشتركة صراحةً.
              </p>
            </motion.div>
          )}
        </GlassCard>

        {/* Partner Sharing */}
        <GlassCard glow={C.pink}>
          <SectionHeader icon={<Share2 size={13} color={C.pink} />}
            title="مشاركة مع الشريك" color={C.pink} />
          <ToggleRow label="السماح بمشاركة نتائج التوافق"
            desc="يرى شريكك فقط المؤشرات المشتركة — لا يومياتك ولا نبضك"
            value={prefs.partnerShareEnabled} onChange={(v) => updatePref("partnerShareEnabled", v)}
            color={C.pink} />
          <ToggleRow label="التحليلات والإحصائيات"
            desc="مساعدة تطوير المنصة (بيانات مجهولة فقط)"
            value={prefs.analyticsEnabled} onChange={(v) => updatePref("analyticsEnabled", v)} />
        </GlassCard>

        {/* E2EE */}
        <E2EECard />

        {/* Security & Access */}
        <GlassCard glow={C.purple}>
          <SectionHeader icon={<Lock size={13} color={C.purple} />}
            title="الأمان والوصول" color={C.purple} />
          <BiometricHint shown={prefs.biometricHintShown}
            onDismiss={() => updatePref("biometricHintShown", true)} />
          <TwoFactorSection
            enabled={prefs.twoFactorEnabled}
            onChange={(v) => updatePref("twoFactorEnabled", v)} />
          <div style={{ marginTop: 14 }}>
            <ActiveSessionsSection onLogoutAll={handleLogoutAll} />
          </div>
          <LoginHistory />
        </GlassCard>

        {/* Data */}
        <GlassCard glow={C.blue}>
          <SectionHeader icon={<Download size={13} color={C.blue} />}
            title="التحكم في البيانات"
            subtitle="تحميل أرشيف كامل أو حذف نهائي" color={C.blue} />
          <DataExportSection />
          <div style={{ marginTop: 10 }}>
            <DangerButton label="مسح جميع البيانات المحلية"
              confirmLabel="⚠️ اضغط مرة أخرى — لا يمكن التراجع!"
              onConfirm={handleDeleteAll} icon={<Trash2 size={11} />} />
          </div>
          <div style={{ marginTop: 10 }}>
            <button onClick={() => openOverlay("egoDeath")} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 14px", borderRadius: 12, cursor: "pointer",
              background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)",
              color: C.red, fontSize: 11, fontWeight: 700, transition: "all 0.2s",
            }}>
               <Skull size={11} color={C.red} /> حفل التخلي والجحيم (Hard Delete)
            </button>
          </div>
        </GlassCard>

        {/* Account */}
        <GlassCard glow={C.red}>
          <SectionHeader icon={<UserX size={13} color={C.red} />}
            title="الحساب" color={C.red} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={handleLogout} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              padding: "10px 14px", borderRadius: 12, cursor: "pointer",
              background: `${C.gold}06`, border: `1px solid ${C.gold}18`,
              color: C.gold, fontSize: 11, fontWeight: 700,
            }}>
              <LogOut size={11} /> تسجيل الخروج من هذا الجهاز
            </button>
            <DangerButton label="حذف الحساب نهائياً"
              confirmLabel="⚠️ سيُحذف كل شيء — لا يمكن الاسترجاع!"
              onConfirm={handleDeleteAccount} icon={<UserX size={11} />} />
          </div>
          <p style={{ margin: "8px 0 0", fontSize: 8, color: "#1e293b", textAlign: "center" }}>
            جميع الإعدادات تُطبَّق فوراً عبر خوادمنا المشفرة ·{" "}
            <span style={{ textDecoration: "underline", cursor: "pointer", color: "#334155" }}>
              سياسة الخصوصية
            </span>
          </p>
        </GlassCard>
      </div>
    </div>
  );
}
