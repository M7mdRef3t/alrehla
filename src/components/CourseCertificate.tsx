/**
 * CourseCertificate.tsx — Premium Glassmorphism Design
 * شهادة إتمام الدورة بتصميم زجاجي فاخر
 */
import type { FC } from "react";
import { useRef } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Download, Linkedin, Star } from "lucide-react";

export interface CertificateData {
  id: string;
  userName: string;
  courseTitle: string;
  courseCategory: string;
  completedAt: string; // ISO date string
  instructorName: string;
  totalHours?: string;
}

interface CourseCertificateProps {
  data: CertificateData;
  onClose?: () => void;
  onShare?: () => void;
  compact?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

const CERT_ID_PREFIX = "ARL";
export function shortCertId(id: string): string {
  return `${CERT_ID_PREFIX}-${id.slice(0, 8).toUpperCase()}`;
}

export const CourseCertificate: FC<CourseCertificateProps> = ({
  data,
  onClose,
  onShare,
  compact = false,
}) => {
  const certRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (typeof window === "undefined") return;
    window.print();
  };

  const handleLinkedIn = () => {
    const shareUrl = encodeURIComponent(`${window.location.origin}/certificate/${data.id}`);
    const title = encodeURIComponent(`حصلت على شهادة: ${data.courseTitle}`);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}&title=${title}`,
      "_blank",
      "noopener,noreferrer"
    );
    onShare?.();
  };

  return (
    <div
      className={`flex flex-col items-center gap-6 ${
        compact ? "w-full" : "min-h-screen bg-[#0a0d1a] py-16 px-4"
      }`}
      dir="rtl"
    >
      {/* ══ Certificate Card ══ */}
      <motion.div
        ref={certRef}
        id="certificate-print-area"
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl"
        style={{
          background: "linear-gradient(145deg, rgba(20,26,45,0.97) 0%, rgba(12,17,35,0.97) 100%)",
          border: "1px solid rgba(255,255,255,0.09)",
          boxShadow:
            "0 0 0 1px rgba(20,210,200,0.08), 0 0 80px rgba(20,210,200,0.06), 0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Ambient glows */}
        <div
          className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full blur-3xl"
          style={{ background: "rgba(20,210,200,0.08)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full blur-3xl"
          style={{ background: "rgba(139,92,246,0.07)" }}
        />

        {/* Top shimmer line */}
        <div
          className="absolute top-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(20,210,200,0.5), rgba(139,92,246,0.5), transparent)",
          }}
        />

        <div className="relative px-10 py-12 text-center">

          {/* ── Brain icon ── */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 18 }}
            className="flex justify-center mb-5"
          >
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{
                background: "rgba(20,210,200,0.08)",
                border: "1px solid rgba(20,210,200,0.2)",
                boxShadow: "0 0 24px rgba(20,210,200,0.12)",
              }}
            >
              <BrainCircuit className="w-8 h-8" style={{ color: "#14d2c8" }} />
            </div>
          </motion.div>

          {/* ── "شهادة إتمام الدورة" label ── */}
          <p
            className="text-[10px] font-black uppercase tracking-[0.35em] mb-3"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            شهادة إتمام الدورة
          </p>

          {/* ── "تُمنح هذه الشهادة رسمياً إلى" ── */}
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>
            تُمنح هذه الشهادة رسمياً إلى
          </p>

          {/* ── User name — large calligraphic ── */}
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-black mb-6"
            style={{
              fontSize: "clamp(2rem, 5vw, 3rem)",
              letterSpacing: "-0.02em",
              color: "#f1f5f9",
              fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
              textShadow: "0 0 40px rgba(20,210,200,0.15)",
            }}
          >
            {data.userName}
          </motion.h1>

          {/* ── Divider ── */}
          <div
            className="mx-auto mb-6 h-px w-2/3"
            style={{
              background: "linear-gradient(to right, transparent, rgba(255,255,255,0.08), transparent)",
            }}
          />

          {/* ── "لإتمامه الدورة التدريبية المكثفة في" ── */}
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>
            لإتمامه بنجاح الدورة التدريبية المكثفة في
          </p>

          {/* ── Course title — teal ── */}
          <motion.h2
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-black mb-2"
            style={{
              fontSize: "clamp(1.4rem, 3vw, 1.9rem)",
              color: "#14d2c8",
              fontFamily: "'IBM Plex Sans Arabic', 'Tajawal', sans-serif",
              textShadow: "0 0 32px rgba(20,210,200,0.35)",
            }}
          >
            {data.courseTitle}
          </motion.h2>

          {data.totalHours && (
            <p className="text-xs mb-0" style={{ color: "rgba(255,255,255,0.3)" }}>
              {data.totalHours} ساعة تدريب مكثف
            </p>
          )}

          {/* ── Bottom row: signature | seal | date ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-10 flex items-end justify-between px-4"
          >
            {/* Instructor signature */}
            <div className="text-right">
              <p
                className="font-bold italic mb-0.5"
                style={{
                  fontFamily: "'Dancing Script', 'Scheherazade New', cursive, serif",
                  fontSize: "1.1rem",
                  color: "rgba(255,255,255,0.75)",
                  letterSpacing: "0.02em",
                }}
              >
                {data.instructorName}
              </p>
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                المدير الأكاديمي
              </p>
            </div>

            {/* Star seal */}
            <div className="flex flex-col items-center gap-1">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{
                  border: "2px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.03)",
                  boxShadow: "0 0 18px rgba(255,255,255,0.05)",
                }}
              >
                <Star
                  className="w-7 h-7"
                  strokeWidth={1.5}
                  style={{ color: "rgba(255,255,255,0.6)" }}
                />
              </div>
              <p className="text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                الختم الرسمي
              </p>
            </div>

            {/* Date */}
            <div className="text-left">
              <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                تاريخ الإصدار
              </p>
              <p className="font-bold" style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
                {formatDate(data.completedAt)}
              </p>
            </div>
          </motion.div>

          {/* Cert ID */}
          <div className="mt-6 flex justify-center">
            <div
              className="rounded-full px-4 py-1"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <p className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.18)", letterSpacing: "0.18em" }}>
                {shortCertId(data.id)}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom shimmer line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{
            background:
              "linear-gradient(to right, transparent, rgba(20,210,200,0.2), transparent)",
          }}
        />
      </motion.div>

      {/* ══ Action Buttons ══ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="flex gap-3 print:hidden flex-wrap justify-center"
      >
        {/* LinkedIn share */}
        <button
          onClick={handleLinkedIn}
          className="flex items-center gap-2 rounded-2xl transition-all font-bold text-sm"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            padding: "10px 22px",
            color: "rgba(255,255,255,0.75)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.09)";
            e.currentTarget.style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.05)";
            e.currentTarget.style.color = "rgba(255,255,255,0.75)";
          }}
        >
          <Linkedin size={15} />
          مشاركة على LinkedIn
        </button>

        {/* PDF download */}
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 rounded-2xl font-black text-sm transition-all"
          style={{
            background: "linear-gradient(135deg, #14d2c8, #0ea5e9)",
            boxShadow: "0 0 24px rgba(20,210,200,0.35), 0 4px 16px rgba(0,0,0,0.4)",
            border: "none",
            padding: "10px 22px",
            color: "#fff",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 0 36px rgba(20,210,200,0.5), 0 4px 20px rgba(0,0,0,0.5)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 0 24px rgba(20,210,200,0.35), 0 4px 16px rgba(0,0,0,0.4)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Download size={15} />
          تحميل بصيغة PDF
        </button>

        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 rounded-2xl font-bold text-sm transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              padding: "10px 18px",
              color: "rgba(255,255,255,0.35)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.65)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.35)"; }}
          >
            إغلاق
          </button>
        )}
      </motion.div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#certificate-print-area) { display: none !important; }
          #certificate-print-area {
            box-shadow: none !important;
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
};
