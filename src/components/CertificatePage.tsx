/**
 * CertificatePage.tsx
 * صفحة الشهادة القابلة للمشاركة — تُعرض على رابط /certificate/:id
 * تُدار داخل AppExperienceShell عبر pathname check
 */
import type { FC } from "react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CourseCertificate, type CertificateData, shortCertId } from "./CourseCertificate";
import { supabase } from "../services/supabaseClient";
import { Loader2, AlertTriangle } from "lucide-react";

interface CertificatePageProps {
  /** الـ certId من الـ URL مثلاً /certificate/courseId-userId */
  certId: string;
}

type LoadState = "loading" | "found" | "not_found" | "error";

export const CertificatePage: FC<CertificatePageProps> = ({ certId }) => {
  const [state, setState] = useState<LoadState>("loading");
  const [data, setData] = useState<CertificateData | null>(null);

  useEffect(() => {
    if (!certId) { setState("not_found"); return; }

    const load = async () => {
      setState("loading");
      try {
        if (!supabase) { setState("error"); return; }
        const { data: row, error } = await supabase
          .from("course_completions")
          .select("id, user_name, course_title, course_category, completed_at, instructor_name, total_hours")
          .eq("id", certId)
          .single();

        if (error || !row) { setState("not_found"); return; }

        setData({
          id: row.id as string,
          userName: row.user_name as string,
          courseTitle: row.course_title as string,
          courseCategory: row.course_category as string,
          completedAt: row.completed_at as string,
          instructorName: row.instructor_name as string,
          totalHours: row.total_hours as string | undefined,
        });
        setState("found");
      } catch {
        setState("error");
      }
    };

    void load();
  }, [certId]);

  if (state === "loading") {
    return (
      <div className="min-h-screen bg-[#040410] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    );
  }

  if (state === "not_found" || state === "error") {
    return (
      <div className="min-h-screen bg-[#040410] flex flex-col items-center justify-center gap-4 text-center px-8">
        <AlertTriangle className="w-12 h-12 text-amber-400/60" />
        <h1 className="text-2xl font-black text-white">الشهادة غير موجودة</h1>
        <p className="text-sm text-white/40 max-w-xs">
          لم نتمكن من العثور على هذه الشهادة. تأكد من أن الرابط صحيح.
        </p>
        <p className="text-xs font-mono text-white/20 mt-2">
          رقم: {shortCertId(certId)}
        </p>
        <button
          onClick={() => { window.location.assign("/"); }}
          className="mt-4 rounded-full bg-violet-600 px-6 py-2.5 text-sm font-black text-white hover:bg-violet-500 transition-all"
        >
          العودة للرئيسية
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#040410]">
      {/* Nav strip */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 pt-6 pb-2 print:hidden"
      >
        <button
          onClick={() => { window.location.assign("/"); }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          ← العودة للمنصة
        </button>
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-400/60">
          منصة الرحلة
        </span>
      </motion.div>

      {/* Certificate */}
      {data && (
        <CourseCertificate
          data={data}
          compact={false}
        />
      )}
    </div>
  );
};
