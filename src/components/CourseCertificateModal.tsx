/**
 * CourseCertificateModal.tsx
 * مودال شهادة الإتمام — يظهر مباشرة بعد اكتمال الدورة
 */
import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, GraduationCap } from "lucide-react";
import { CourseCertificate, type CertificateData } from "./CourseCertificate";
import { useAuthState } from "../state/authState";
import { getOrigin } from "../services/navigation";

interface CourseCertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  courseTitle: string;
  courseCategory: string;
  instructorName: string;
  totalHours?: string;
  completedAt?: string;
}

export const CourseCertificateModal: FC<CourseCertificateModalProps> = ({
  isOpen,
  onClose,
  courseId,
  courseTitle,
  courseCategory,
  instructorName,
  totalHours,
  completedAt,
}) => {
  const user = useAuthState((s) => s.user);
  const displayName = useAuthState((s) => s.displayName);
  const [copied, setCopied] = useState(false);

  const certData: CertificateData = {
    id: `${courseId}-${user?.id ?? "guest"}`,
    userName: displayName ?? user?.email?.split("@")[0] ?? "المستخدم",
    courseTitle,
    courseCategory,
    completedAt: completedAt ?? new Date().toISOString(),
    instructorName,
    totalHours,
  };

  const shareUrl = `${getOrigin()}/certificate/${certData.id}`;

  const handleShareCopied = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="cert-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 border border-white/10 text-white/50 hover:text-white transition-all"
            >
              <X size={16} />
            </button>

            {/* Completion celebration header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-4 flex flex-col items-center gap-2 pt-2"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/30">
                <GraduationCap className="w-7 h-7 text-emerald-400" />
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle size={14} className="text-emerald-400" />
                <span className="text-sm font-black text-emerald-400">تهانينا! أتممت الدورة</span>
              </div>
            </motion.div>

            {/* The certificate itself */}
            <CourseCertificate
              data={certData}
              compact
              onClose={onClose}
              onShare={handleShareCopied}
            />

            {/* Share URL display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4"
            >
              <p className="text-[11px] text-white/40 mb-2 text-center">رابط الشهادة القابل للمشاركة</p>
              <div className="flex items-center gap-2" dir="ltr">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs font-mono text-white/50 outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl).catch(() => {});
                    handleShareCopied();
                  }}
                  className={`rounded-xl px-3 py-2 text-xs font-black transition-all ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-violet-600 text-white hover:bg-violet-500"
                  }`}
                >
                  {copied ? "تم النسخ ✓" : "نسخ"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
