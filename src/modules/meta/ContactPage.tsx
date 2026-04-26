'use client';

import React, { useState, useRef } from "react";
import { AlrehlaWordmark } from "./logo/AlrehlaWordmark";
import { motion, useInView, type Variants } from "framer-motion";

/* ─── Contact channels ─────────────────────────────────────── */
const CHANNELS = [
  {
    id: "whatsapp",
    emoji: "💬",
    title: "واتساب",
    subtitle: "ردّ في خلال ساعات",
    value: "201110795932",
    href: "https://wa.me/201110795932?text=مرحباً%20فريق%20الرحلة%2C%20أودّ%20التواصل%20معكم",
    cta: "افتح المحادثة",
    gradient: "from-emerald-500/20 to-emerald-600/10",
    border: "border-emerald-500/20",
    glow: "hover:shadow-emerald-500/10",
    textColor: "text-emerald-400",
  },
  {
    id: "email",
    emoji: "✉️",
    title: "البريد الإلكتروني",
    subtitle: "للاستفسارات الرسمية",
    value: "support@alrehla.app",
    href: "mailto:support@alrehla.app",
    cta: "أرسل بريداً",
    gradient: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/20",
    glow: "hover:shadow-blue-500/10",
    textColor: "text-blue-400",
  },
  {
    id: "instagram",
    emoji: "✨",
    title: "إنستغرام",
    subtitle: "تابعنا وشاركنا رحلتك",
    value: "@alrehla.app",
    href: "https://instagram.com/alrehla.app",
    cta: <span>تابع <AlrehlaWordmark height={10} color="currentColor" /></span> as any,
    gradient: "from-rose-500/20 to-purple-600/10",
    border: "border-rose-500/20",
    glow: "hover:shadow-rose-500/10",
    textColor: "text-rose-400",
  },
];

const REASONS = [
  { icon: "🧭", label: "استفسار عن ميزة أو خطة" },
  { icon: "🔐", label: "مشكلة تقنية أو حساب" },
  { icon: "🤝", label: "شراكة أو تعاون" },
  { icon: "💡", label: "اقتراح أو فكرة" },
  { icon: "🌱", label: "أخرى" },
];

/* ─── Animation variants ────────────────────────────────────── */
const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

/* ─── Page ──────────────────────────────────────────────────── */
export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", reason: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const formRef = useRef<HTMLDivElement>(null);
  const formInView = useInView(formRef, { once: true });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.message) return;

    setStatus("sending");

    // Build a WhatsApp deep link with the form data
    const text = encodeURIComponent(
      `مرحباً فريق الرحلة 👋\n\n` +
      `الاسم: ${form.name}\n` +
      (form.email ? `البريد: ${form.email}\n` : "") +
      (form.reason ? `الموضوع: ${form.reason}\n` : "") +
      `\nالرسالة:\n${form.message}`
    );

    // Open WhatsApp with pre-filled message
    window.open(`https://wa.me/201110795932?text=${text}`, "_blank");

    setTimeout(() => {
      setStatus("sent");
      setForm({ name: "", email: "", reason: "", message: "" });
    }, 600);
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        background: "#02040a",
        fontFamily: "'Cairo', 'IBM Plex Sans Arabic', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Nebula background ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none" }}>
        <div style={{
          position: "absolute", top: "-20%", right: "-10%",
          width: "70vw", height: "70vw", maxWidth: 900,
          background: "radial-gradient(ellipse at center, rgba(20,184,166,0.06) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-15%",
          width: "60vw", height: "60vw", maxWidth: 800,
          background: "radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
        }} />
        {/* Grain overlay */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E")`,
          opacity: 0.4,
        }} />
      </div>

      {/* ── Content ── */}
      <div style={{ position: "relative", zIndex: 1 }}>

        {/* Hero */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          style={{
            textAlign: "center",
            padding: "120px 24px 80px",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "rgba(20,184,166,0.08)",
              border: "1px solid rgba(20,184,166,0.2)",
              borderRadius: 100,
              padding: "8px 20px",
              marginBottom: 32,
              color: "#5eead4",
              fontSize: 12,
              fontWeight: 900,
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#14b8a6", boxShadow: "0 0 8px #14b8a6" }} />
            محطة التواصل
          </motion.div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 4.5rem)",
            fontWeight: 900,
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: 24,
            letterSpacing: "-0.02em",
          }}>
            نحن{" "}
            <span style={{
              background: "linear-gradient(135deg, #14b8a6, #3b82f6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              هنا معك
            </span>
          </h1>

          <p style={{
            fontSize: "clamp(1rem, 2.5vw, 1.25rem)",
            color: "#94a3b8",
            lineHeight: 1.8,
            maxWidth: 600,
            margin: "0 auto",
          }}>
            كل رحلة تبدأ بخطوة، وخطوتك الأولى هي أن تصل إلينا.
            سواء كان سؤالاً أو فكرة أو شراكة — نحن نسمع.
          </p>
        </motion.section>

        {/* Channel cards */}
        <section style={{ padding: "0 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 20,
            }}
          >
            {CHANNELS.map((ch) => (
              <motion.a
                key={ch.id}
                href={ch.href}
                target="_blank"
                rel="noopener noreferrer"
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                  padding: "32px 28px",
                  borderRadius: 28,
                  border: `1px solid`,
                  background: `linear-gradient(135deg, ${ch.gradient.split(" ")[0].replace("from-", "").replace("/20", "")}1a 0%, transparent 100%)`,
                  backdropFilter: "blur(20px)",
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "box-shadow 0.3s ease",
                  borderColor: ch.border.replace("border-", "").includes("emerald")
                    ? "rgba(16,185,129,0.2)"
                    : ch.border.includes("blue")
                    ? "rgba(59,130,246,0.2)"
                    : "rgba(244,63,94,0.2)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{
                    fontSize: 28,
                    width: 56,
                    height: 56,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 16,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    flexShrink: 0,
                  }}>
                    {ch.emoji}
                  </div>
                  <div>
                    <p style={{ color: "#ffffff", fontWeight: 800, fontSize: 18, margin: 0 }}>{ch.title}</p>
                    <p style={{ color: "#64748b", fontSize: 13, margin: "4px 0 0" }}>{ch.subtitle}</p>
                  </div>
                </div>

                <p style={{
                  color: "#94a3b8",
                  fontSize: 14,
                  fontWeight: 600,
                  margin: 0,
                  direction: ch.id === "email" ? "ltr" : "rtl",
                  textAlign: "right",
                }}>
                  {ch.value}
                </p>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  color: ch.id === "whatsapp" ? "#10b981"
                    : ch.id === "email" ? "#3b82f6"
                    : "#f43f5e",
                  fontWeight: 800,
                  fontSize: 14,
                  marginTop: 4,
                }}>
                  <span>{ch.cta}</span>
                  <span>←</span>
                </div>
              </motion.a>
            ))}
          </motion.div>
        </section>

        {/* Contact Form */}
        <section
          ref={formRef}
          style={{
            padding: "0 24px 120px",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7 }}
            style={{ textAlign: "center", marginBottom: 48 }}
          >
            <h2 style={{
              fontSize: "clamp(1.6rem, 4vw, 2.5rem)",
              fontWeight: 900,
              color: "#ffffff",
              marginBottom: 12,
            }}>
              أرسل رسالتك
            </h2>
            <p style={{ color: "#64748b", fontSize: 15 }}>
              سيصل نموذجك مباشرة عبر واتساب لضمان الرد السريع
            </p>
          </motion.div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 32 }}
            animate={formInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(20,184,166,0.12)",
              borderRadius: 32,
              padding: "clamp(28px, 5vw, 52px)",
              backdropFilter: "blur(24px)",
              display: "flex",
              flexDirection: "column",
              gap: 20,
            }}
          >
            {/* Name + Email row */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
            }}
            className="contact-form-grid"
            >
              <FormField
                label="الاسم *"
                name="name"
                type="text"
                placeholder="ما اسمك؟"
                value={form.name}
                onChange={handleChange}
                required
              />
              <FormField
                label="البريد الإلكتروني"
                name="email"
                type="email"
                placeholder="اختياري"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            {/* Reason select */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                موضوع الرسالة
              </label>
              <select
                name="reason"
                value={form.reason}
                onChange={handleChange}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "14px 18px",
                  color: form.reason ? "#e2e8f0" : "#475569",
                  fontSize: 15,
                  fontFamily: "inherit",
                  direction: "rtl",
                  outline: "none",
                  cursor: "pointer",
                  width: "100%",
                  appearance: "none",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(20,184,166,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              >
                <option value="">اختر الموضوع...</option>
                {REASONS.map((r) => (
                  <option key={r.label} value={r.label} style={{ background: "#0f172a" }}>
                    {r.icon} {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Message */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
                رسالتك *
              </label>
              <textarea
                name="message"
                value={form.message}
                onChange={handleChange}
                required
                rows={5}
                placeholder="اكتب ما تودّ قوله... كل كلمة تُقرأ باهتمام."
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16,
                  padding: "16px 18px",
                  color: "#e2e8f0",
                  fontSize: 15,
                  fontFamily: "inherit",
                  direction: "rtl",
                  outline: "none",
                  resize: "vertical",
                  minHeight: 140,
                  lineHeight: 1.7,
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) => { e.target.style.borderColor = "rgba(20,184,166,0.4)"; }}
                onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
              />
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={status === "sending" || status === "sent" || !form.name || !form.message}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                width: "100%",
                padding: "18px 32px",
                borderRadius: 18,
                border: "none",
                background: status === "sent"
                  ? "linear-gradient(135deg, #10b981, #059669)"
                  : "linear-gradient(135deg, #14b8a6, #3b82f6)",
                color: "#02040a",
                fontSize: 17,
                fontWeight: 900,
                fontFamily: "inherit",
                cursor: status === "sent" || !form.name || !form.message ? "not-allowed" : "pointer",
                opacity: !form.name || !form.message ? 0.5 : 1,
                transition: "all 0.3s ease",
                boxShadow: "0 8px 32px rgba(20,184,166,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginTop: 8,
              }}
            >
              {status === "sending" ? (
                <>
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span>
                  جاري الإرسال...
                </>
              ) : status === "sent" ? (
                <>✅ تم إرسال رسالتك بنجاح!</>
              ) : (
                <>
                  💬 أرسل عبر واتساب
                </>
              )}
            </motion.button>

            {status === "sent" && (
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  textAlign: "center",
                  color: "#10b981",
                  fontSize: 14,
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                سيُفتح تطبيق واتساب بالرسالة جاهزة للإرسال ✨
              </motion.p>
            )}
          </motion.form>
        </section>

        {/* Bottom promise strip */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          style={{
            borderTop: "1px solid rgba(20,184,166,0.08)",
            padding: "48px 24px 80px",
            textAlign: "center",
          }}
        >
          <p style={{ color: "#475569", fontSize: 15, lineHeight: 2 }}>
            نلتزم بالرد خلال{" "}
            <span style={{ color: "#14b8a6", fontWeight: 800 }}>٢٤ ساعة</span>{" "}
            في أيام العمل.
            <br />
            كل رسالة تُقرأ بعناية — لأن <AlrehlaWordmark height={10} color="currentColor" className="inline-block" /> تستحق ذلك.
          </p>
        </motion.section>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap');

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        @media (max-width: 600px) {
          .contact-form-grid {
            grid-template-columns: 1fr !important;
          }
        }

        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0 100px #0f172a inset;
          -webkit-text-fill-color: #e2e8f0;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>
    </div>
  );
}

/* ─── FormField helper ──────────────────────────────────────── */
function FormField({
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  required,
}: {
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ color: "#94a3b8", fontSize: 13, fontWeight: 700, letterSpacing: "0.05em" }}>
        {label}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 16,
          padding: "14px 18px",
          color: "#e2e8f0",
          fontSize: 15,
          fontFamily: "inherit",
          direction: "rtl",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
          transition: "border-color 0.2s ease",
        }}
        onFocus={(e) => { e.target.style.borderColor = "rgba(20,184,166,0.4)"; }}
        onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
      />
    </div>
  );
}
