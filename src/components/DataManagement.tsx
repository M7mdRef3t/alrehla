import type { FC } from "react";
import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Upload, X, AlertTriangle, Check, Database, FileJson, HardDrive, FileText } from "lucide-react";
import { exportToJSON, importFromJSON, restoreBackupData, getStorageStats } from "../services/dataExport";
import { exportMapToPDF, downloadMapImage } from "../services/pdfExport";
import { useMapState } from "../state/mapState";

interface DataManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataManagement: FC<DataManagementProps> = ({ isOpen, onClose }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [imageExporting, setImageExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodes = useMapState((s) => s.nodes);
  const stats = getStorageStats();

  const handleExport = () => {
    try {
      exportToJSON();
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل التصدير");
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExportPDF = async () => {
    if (nodes.length === 0) {
      setError("لا توجد بيانات لتصديرها");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setPdfExporting(true);
    setError(null);

    try {
      await exportMapToPDF(nodes);
      setTimeout(() => setPdfExporting(false), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تصدير PDF");
      setTimeout(() => setError(null), 3000);
      setPdfExporting(false);
    }
  };

  const handleExportImage = async () => {
    if (nodes.length === 0) {
      setError("لا توجد بيانات لتصديرها");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setImageExporting(true);
    setError(null);

    try {
      await downloadMapImage();
      setTimeout(() => setImageExporting(false), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل تصدير الصورة");
      setTimeout(() => setError(null), 3000);
      setImageExporting(false);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPendingFile(file);
    setShowConfirmImport(true);
  };

  const handleConfirmImport = async () => {
    if (!pendingFile) return;

    setIsImporting(true);
    setError(null);

    try {
      const data = await importFromJSON(pendingFile);
      restoreBackupData(data);
      
      setImportSuccess(true);
      setShowConfirmImport(false);
      setPendingFile(null);

      // إعادة تحميل الصفحة لتطبيق البيانات الجديدة
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاستيراد");
      setShowConfirmImport(false);
      setPendingFile(null);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelImport = () => {
    setShowConfirmImport(false);
    setPendingFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-l from-blue-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Database className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">إدارة البيانات</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Storage Stats */}
                <div className="p-4 bg-slate-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <HardDrive className="w-4 h-4" />
                    <span className="font-medium">البيانات المحفوظة:</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                      <span className="text-slate-700">{stats.nodesCount} شخص</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-slate-700">{stats.totalSizeKB} KB</span>
                    </div>
                  </div>
                </div>

                {/* Export Section */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 px-2">تصدير</p>
                  
                  <button
                    type="button"
                    onClick={handleExport}
                    disabled={stats.nodesCount === 0}
                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all text-right disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      <FileJson className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">نسخة احتياطية JSON</p>
                      <p className="text-xs text-slate-500">حمّل بياناتك الكاملة</p>
                    </div>
                    {exportSuccess && (
                      <Check className="w-5 h-5 text-green-600 shrink-0" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPDF}
                    disabled={stats.nodesCount === 0 || pdfExporting}
                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all text-right disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">تصدير PDF</p>
                      <p className="text-xs text-slate-500">
                        {pdfExporting ? "جاري التصدير..." : "خريطتك مع التفاصيل"}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportImage}
                    disabled={stats.nodesCount === 0 || imageExporting}
                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all text-right disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                      <Download className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">تصدير كصورة</p>
                      <p className="text-xs text-slate-500">
                        {imageExporting ? "جاري التصدير..." : "صورة PNG للخريطة"}
                      </p>
                    </div>
                  </button>
                </div>

                {/* Import Section */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 px-2">استيراد</p>
                  
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="import-file"
                    />
                    <label
                      htmlFor="import-file"
                      className="w-full flex items-center gap-3 p-4 bg-white border-2 border-slate-200 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all text-right cursor-pointer active:scale-[0.99]"
                    >
                      <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Upload className="w-5 h-5 text-amber-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900">استيراد نسخة احتياطية</p>
                        <p className="text-xs text-slate-500">استرجع بياناتك من ملف JSON</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Success Message */}
                {importSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2"
                  >
                    <Check className="w-5 h-5 text-green-600 shrink-0" />
                    <p className="text-sm text-green-800">تم الاستيراد بنجاح! جاري إعادة التحميل...</p>
                  </motion.div>
                )}

                {/* Error Message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
                    <p className="text-sm text-rose-800">{error}</p>
                  </motion.div>
                )}

                {/* Warning */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>تنبيه:</strong> استيراد نسخة احتياطية سيستبدل كل بياناتك الحالية. تأكد من تصدير نسخة احتياطية أولاً.
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                  <FileJson className="w-3 h-3" />
                  كل بياناتك محفوظة محلياً في متصفحك
                </p>
              </div>
            </div>
          </motion.div>

          {/* Confirm Import Dialog */}
          <AnimatePresence>
            {showConfirmImport && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
                onClick={handleCancelImport}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl"
                >
                  <button
                    type="button"
                    onClick={handleCancelImport}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        هل أنت متأكد؟
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        سيتم استبدال جميع بياناتك الحالية ({stats.nodesCount} شخص) بالبيانات من الملف.
                        هذا الإجراء لا يمكن التراجع عنه.
                      </p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={handleCancelImport}
                        disabled={isImporting}
                        className="flex-1 py-2.5 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-50"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmImport}
                        disabled={isImporting}
                        className="flex-1 py-2.5 px-4 bg-amber-500 text-white font-semibold rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                      >
                        {isImporting ? "جاري الاستيراد..." : "تأكيد"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};
