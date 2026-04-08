import { logger } from "../services/logger";
/**
 * ExportDataButton Component
 * مكون تصدير البيانات
 */

import { useState } from "react";
import { Download, FileJson, FileText, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { offlineService } from "@/services/offlineService";

type ExportFormat = "json" | "pdf";

export function ExportDataButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    setIsExporting(true);
    
    try {
      // Simulate processing
      await new Promise(resolve => setTimeout(resolve, 500));
      
      offlineService.downloadExport(format);
    } catch (error) {
      logger.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-500 transition-colors disabled:opacity-50"
        whileTap={{ scale: 0.98 }}
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span>تصدير البيانات</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden min-w-[160px] z-50"
          >
            <button
              type="button"
              onClick={() => handleExport("json")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-right"
            >
              <FileJson className="w-5 h-5 text-green-400" />
              <div className="text-right">
                <div className="text-sm font-medium text-white">JSON</div>
                <div className="text-xs text-slate-400">للنسخ الاحتياطي</div>
              </div>
            </button>
            
            <div className="border-t border-slate-700" />
            
            <button
              type="button"
              onClick={() => handleExport("pdf")}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-right"
            >
              <FileText className="w-5 h-5 text-red-400" />
              <div className="text-right">
                <div className="text-sm font-medium text-white">PDF / نص</div>
                <div className="text-xs text-slate-400">للقراءة والطباعة</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
