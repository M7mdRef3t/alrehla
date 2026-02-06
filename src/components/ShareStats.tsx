import type { FC } from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share2, Download, TrendingUp, Users, Calendar, Check } from "lucide-react";
import { useMapState } from "../state/mapState";
import { useJourneyState } from "../state/journeyState";
import html2canvas from "html2canvas";

interface ShareStatsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareStats: FC<ShareStatsProps> = ({ isOpen, onClose }) => {
  const nodes = useMapState((s) => s.nodes);
  const { baselineScore, postStepScore, journeyStartedAt } = useJourneyState();
  
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);

  const greenCount = nodes.filter(n => n.ring === "green").length;
  const yellowCount = nodes.filter(n => n.ring === "yellow").length;
  const redCount = nodes.filter(n => n.ring === "red").length;
  const totalCount = nodes.length;

  // حساب مدة الرحلة
  const journeyDuration = journeyStartedAt 
    ? Math.floor((Date.now() - journeyStartedAt) / (1000 * 60 * 60 * 24))
    : 0;

  // حساب نسبة التحسن
  const improvement = baselineScore !== null && postStepScore !== null
    ? Math.round(((baselineScore - postStepScore) / baselineScore) * 100)
    : null;

  // حساب عدد الخطوات المكملة
  const completedStepsCount = nodes.reduce((total, node) => {
    const recoverySteps = node.recoveryProgress?.completedSteps.length || 0;
    const firstSteps = node.firstStepProgress?.completedFirstSteps.length || 0;
    return total + recoverySteps + firstSteps;
  }, 0);

  const handleExportImage = async () => {
    if (!statsRef.current) return;

    setIsExporting(true);

    try {
      const canvas = await html2canvas(statsRef.current, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `journey-stats-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setExportSuccess(true);
          setTimeout(() => {
            setExportSuccess(false);
            setIsExporting(false);
          }, 2000);
        }
      }, "image/png");
    } catch (error) {
      console.error("فشل في تصدير الإحصائيات:", error);
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-l from-purple-50 to-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">شارك تقدمك</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          {/* Stats Card */}
          <div ref={statsRef} className="p-6 bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900 mb-1">رحلتي في أداة دواير</h3>
              <p className="text-sm text-slate-600">إحصائيات مجهولة عن تقدمي</p>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-green-600">{greenCount}</span>
                </div>
                <p className="text-xs text-slate-600">علاقات صحية</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-amber-600">{yellowCount}</span>
                </div>
                <p className="text-xs text-slate-600">تحتاج انتباه</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center mx-auto mb-2">
                  <span className="text-xl font-bold text-rose-600">{redCount}</span>
                </div>
                <p className="text-xs text-slate-600">استنزاف</p>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="space-y-3">
              <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">{totalCount} شخص</p>
                  <p className="text-xs text-slate-500">إجمالي العلاقات</p>
                </div>
              </div>

              {journeyDuration > 0 && (
                <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{journeyDuration} يوم</p>
                    <p className="text-xs text-slate-500">مدة الرحلة</p>
                  </div>
                </div>
              )}

              {completedStepsCount > 0 && (
                <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <Check className="w-5 h-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{completedStepsCount} خطوة</p>
                    <p className="text-xs text-slate-500">تم إكمالها</p>
                  </div>
                </div>
              )}

              {improvement !== null && improvement > 0 && (
                <div className="bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">تحسن {improvement}%</p>
                    <p className="text-xs text-slate-500">في النتيجة</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-6 text-center">
              <p className="text-xs text-slate-500">الرحلة — أداة دواير</p>
              <p className="text-xs text-slate-400">alrehla.app</p>
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-3">
            <button
              type="button"
              onClick={handleExportImage}
              disabled={isExporting || totalCount === 0}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-l from-purple-600 to-purple-500 text-white font-semibold rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              {exportSuccess ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>تم الحفظ بنجاح</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  <span>{isExporting ? "جاري التصدير..." : "حفظ كصورة"}</span>
                </>
              )}
            </button>

            <div className="p-3 bg-slate-50 rounded-xl text-center">
              <p className="text-xs text-slate-500 leading-relaxed">
                الإحصائيات لا تحتوي على أي أسماء أو معلومات شخصية
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
