import type { FC } from "react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Upload,
  X,
  AlertTriangle,
  Check,
  Database,
  FileJson,
  HardDrive,
  FileText,
  LogOut,
  User,
  Shield,
  Trash2
} from "lucide-react";
import { GoogleMark } from "./GoogleMark";
import {
  exportToJSON,
  importFromJSON,
  restoreBackupData,
  getStorageStats,
  downloadBackupFile,
  buildBackupFromKeyValues,
  backupToKeyValues,
  buildBackupFromLocal
} from "../services/dataExport";
import { useMapState } from "../state/mapState";
import { clearLocalData } from "../services/secureStore";
import { fetchRemoteState, pushRemoteState } from "../services/cloudStore";
import { getEffectiveRoleFromState, useAuthState, type UserToneGender } from "../state/authState";
import { signInWithGoogle, signOut, updateAccountProfile } from "../services/authService";
import { isPrivilegedRole } from "../utils/featureFlags";
import { useAppContentString } from "../hooks/useAppContentString";
import { assignUrl, getHref, pushUrl, reloadPage } from "../services/navigation";

let pdfExportLoader: Promise<typeof import("../services/pdfExport")> | null = null;

async function loadPdfExportService() {
  if (!pdfExportLoader) {
    pdfExportLoader = import("../services/pdfExport");
  }
  return pdfExportLoader;
}

interface DataManagementProps {
  isOpen: boolean;
  onClose: () => void;
  accountOnly?: boolean;
}

export const DataManagement: FC<DataManagementProps> = ({ isOpen, onClose, accountOnly = true }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [imageExporting, setImageExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmImport, setShowConfirmImport] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [showConfirmWipe, setShowConfirmWipe] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudSuccess, setCloudSuccess] = useState<string | null>(null);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const nodes = useMapState((s) => s.nodes);
  const [stats, setStats] = useState({
    nodesCount: 0,
    hasJourneyData: false,
    hasMeData: false,
    hasNotificationSettings: false,
    totalSizeKB: 0
  });

  const authUser = useAuthState((s) => s.user);
  const baseRole = useAuthState((s) => s.role);
  const authRole = useAuthState(getEffectiveRoleFromState);
  const isPrivilegedUser = isPrivilegedRole(authRole);
  const showAdminTools = isPrivilegedUser && !accountOnly;
  const canViewAsUser = isPrivilegedRole(baseRole);

  const authDisplayName = useAuthState((s) => s.displayName) ?? "";
  const authToneGender = useAuthState((s) => s.toneGender);

  const [displayName, setDisplayName] = useState(authDisplayName);
  const [displayNameDirty, setDisplayNameDirty] = useState(false);
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [displayNameMessage, setDisplayNameMessage] = useState<string | null>(null);

  const [toneGender, setToneGender] = useState<UserToneGender>(authToneGender);
  const [toneGenderDirty, setToneGenderDirty] = useState(false);

  const displayNamePlaceholder = useAppContentString(
    "account_display_name_placeholder",
    "اكتب اسمك",
    { page: "account" }
  );

  useEffect(() => {
    if (!displayNameDirty) setDisplayName(authDisplayName);
  }, [authDisplayName, displayNameDirty]);

  useEffect(() => {
    if (!toneGenderDirty) setToneGender(authToneGender);
  }, [authToneGender, toneGenderDirty]);

  useEffect(() => {
    setDisplayNameDirty(false);
    setToneGenderDirty(false);
    setDisplayNameError(null);
    setDisplayNameMessage(null);
  }, [authUser?.id]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const next = await getStorageStats();
      if (mounted) setStats(next);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleExport = async () => {
    try {
      await exportToJSON();
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
      const { exportMapToPDF } = await loadPdfExportService();
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
      const { downloadMapImage } = await loadPdfExportService();
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
      await restoreBackupData(data);
      setImportSuccess(true);
      setShowConfirmImport(false);
      setPendingFile(null);
      setTimeout(() => reloadPage(), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الاستيراد");
      setShowConfirmImport(false);
      setPendingFile(null);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCancelImport = () => {
    setShowConfirmImport(false);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleConfirmWipe = () => {
    clearLocalData();
    reloadPage();
  };

  const handleCloudExport = async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const remote = await fetchRemoteState();
      const backup = buildBackupFromKeyValues(remote);
      downloadBackupFile(backup, "journey-cloud-backup");
      setCloudSuccess("تم تنزيل نسخة السحابة بنجاح");
      setTimeout(() => setCloudSuccess(null), 3000);
    } catch {
      setCloudError("تعذر تنزيل بيانات السحابة");
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudImport = async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const backup = await buildBackupFromLocal();
      const payload = backupToKeyValues(backup);
      const ok = await pushRemoteState(payload);
      if (!ok) throw new Error("cloud");
      setCloudSuccess("تم رفع البيانات للسحابة");
      setTimeout(() => setCloudSuccess(null), 3000);
    } catch {
      setCloudError("فشل رفع البيانات للسحابة");
    } finally {
      setCloudLoading(false);
    }
  };

  const handleCloudPull = async () => {
    setCloudLoading(true);
    setCloudError(null);
    try {
      const remote = await fetchRemoteState();
      const backup = buildBackupFromKeyValues(remote);
      await restoreBackupData(backup);
      setCloudSuccess("تم استعادة نسخة السحابة");
      setTimeout(() => reloadPage(), 1200);
    } catch {
      setCloudError("فشل استعادة بيانات السحابة");
    } finally {
      setCloudLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthMessage(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setAuthMessage("تعذر فتح نافذة جوجل. راجع الإعدادات.");
    } else {
      setAuthMessage("تحويل... يبحث عن نافذة جوجل.");
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setAuthMessage(null);
    await signOut();
    setAuthLoading(false);
  };

  const openRoleSwitchInAdmin = () => {
    onClose();
    try {
      const next = new URL(getHref());
      next.pathname = "/admin";
      next.search = "";
      next.searchParams.set("tab", "feature-flags");
      pushUrl(next);
    } catch {
      assignUrl("/admin?tab=feature-flags");
    }
  };

  const handleSaveAccountProfile = async () => {
    const profileDirty = displayNameDirty || toneGenderDirty;
    if (!profileDirty) return;

    const normalizedName = displayName.replace(/\s+/g, " ").trim();
    if (displayNameDirty && !normalizedName) {
      setDisplayNameError("اكتب اسمك.");
      setDisplayNameMessage(null);
      return;
    }

    setDisplayNameSaving(true);
    setDisplayNameError(null);
    setDisplayNameMessage(null);
    try {
      const { data, error } = await updateAccountProfile({
        fullName: displayNameDirty ? normalizedName : undefined,
        toneGender: toneGenderDirty ? toneGender : undefined
      });
      if (error) {
        setDisplayNameError("حصلت مشكلة أثناء حفظ بيانات الحساب.");
      } else {
        setDisplayNameDirty(false);
        setToneGenderDirty(false);
        setDisplayNameMessage("تم حفظ بيانات الحساب.");
        if (data?.user) {
          const currentSession = useAuthState.getState().session;
          if (currentSession) useAuthState.getState().setSession({ ...currentSession, user: data.user });
        }
      }
    } catch {
      setDisplayNameError("حصلت مشكلة أثناء حفظ بيانات الحساب.");
    } finally {
      setDisplayNameSaving(false);
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
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:-translate-y-1/2 sm:max-w-md w-full mx-auto z-50 overflow-hidden"
          >
            <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]">

              {/* Header */}
              <div className={`flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${showAdminTools ? "bg-[var(--soft-teal)]/10 border-[var(--soft-teal)] text-[var(--soft-teal)]" : "bg-teal-500/10 border-teal-500/20 text-teal-400"}`}>
                    {showAdminTools ? <Database className="w-5 h-5" /> : <User className="w-5 h-5" />}
                  </div>
                  <h2 className="text-lg font-bold text-white">{showAdminTools ? "إدارة البيانات" : "الملف الشخصي"}</h2>
                </div>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 space-y-6 overflow-y-auto custom-scrollbar" dir="rtl">

                {/* Admin Tools: Storage & Local Actions */}
                {showAdminTools && (
                  <>
                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
                        <HardDrive className="w-3 h-3" />
                        حالة التخزين
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-500">العناصر</span>
                          <span className="font-mono text-teal-400">{stats.nodesCount}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-slate-950 rounded-lg border border-slate-800">
                          <span className="text-slate-500">الحجم</span>
                          <span className="font-mono text-[var(--soft-teal)]">{stats.totalSizeKB} KB</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 pr-2">أدوات التصدير</p>
                      <button onClick={handleExport} disabled={stats.nodesCount === 0} className="w-full group flex items-center gap-4 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-[var(--soft-teal)] hover:bg-slate-800 transition-all text-right disabled:opacity-50">
                        <div className="w-10 h-10 rounded-lg bg-[var(--soft-teal)]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                          <FileJson className="w-5 h-5 text-[var(--soft-teal)]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-200">نسخة احتياطية (JSON)</p>
                          <p className="text-[10px] text-slate-500">تحميل البيانات الخام كاملة</p>
                        </div>
                        {exportSuccess && <Check className="w-4 h-4 text-emerald-400" />}
                      </button>

                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={handleExportPDF} disabled={stats.nodesCount === 0 || pdfExporting} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800 transition-all disabled:opacity-50">
                          <FileText className="w-5 h-5 text-rose-400" />
                          <span className="text-xs font-bold text-slate-300">تصدير PDF</span>
                        </button>
                        <button onClick={handleExportImage} disabled={stats.nodesCount === 0 || imageExporting} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 hover:bg-slate-800 transition-all disabled:opacity-50">
                          <Download className="w-5 h-5 text-purple-400" />
                          <span className="text-xs font-bold text-slate-300">تصدير صورة</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-500 pr-2">السحابة والمزامنة</p>
                      <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 grid grid-cols-3 gap-1">
                        <button onClick={handleCloudImport} disabled={cloudLoading} className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                          <Upload className="w-4 h-4 text-emerald-400" />
                          <span className="text-[9px] font-bold text-slate-400">رفع للسحابة</span>
                        </button>
                        <button onClick={handleCloudPull} disabled={cloudLoading} className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                          <Download className="w-4 h-4 text-sky-400" />
                          <span className="text-[9px] font-bold text-slate-400">استعادة</span>
                        </button>
                        <button onClick={handleCloudExport} disabled={cloudLoading} className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50">
                          <FileJson className="w-4 h-4 text-amber-400" />
                          <span className="text-[9px] font-bold text-slate-400">تنزيل ملف</span>
                        </button>
                      </div>
                      {cloudSuccess && <p className="text-xs text-emerald-400 text-center">{cloudSuccess}</p>}
                      {cloudError && <p className="text-xs text-rose-400 text-center">{cloudError}</p>}
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="relative">
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" id="import-file" />
                        <label htmlFor="import-file" className="block w-full p-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-amber-500/50 text-center cursor-pointer transition-all">
                          <span className="text-xs font-bold text-slate-400 flex items-center justify-center gap-2">
                            <Upload className="w-3 h-3" />
                            استيراد نسخة احتياطية (JSON)
                          </span>
                        </label>
                      </div>
                      {importSuccess && <p className="text-xs text-emerald-400 text-center">تم الاستيراد بنجاح!</p>}
                      {error && <p className="text-xs text-rose-400 text-center">{error}</p>}
                    </div>
                  </>
                )}

                {/* Account Settings */}
                <div className="space-y-4">
                  {!showAdminTools && <p className="text-xs font-bold text-slate-500 pr-2">بيانات الحساب</p>}

                  {authUser ? (
                    <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
                        <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-400 text-lg font-bold">
                          {(authUser.email?.[0] || "U").toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{authDisplayName || "مستخدم جديد"}</p>
                          <p className="text-xs text-slate-500">{authUser.email}</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">الاسم الظاهر</label>
                          <input value={displayName} onChange={(e) => { setDisplayName(e.target.value); setDisplayNameDirty(true); }} placeholder={displayNamePlaceholder} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:border-teal-500 outline-none" />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">نبرة الخطاب</label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["male", "female", "neutral"] as const).map(g => (
                              <button
                                key={g}
                                onClick={() => { setToneGender(g); setToneGenderDirty(g !== authToneGender); }}
                                className={`py-1.5 rounded-lg text-[10px] font-bold transition-colors ${toneGender === g ? "bg-teal-600 text-white" : "bg-slate-950 text-slate-400 border border-slate-700 hover:border-teal-500"}`}
                              >
                                {g === "male" ? "مذكر" : g === "female" ? "مؤنث" : "محايد"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <button onClick={handleSaveAccountProfile} disabled={displayNameSaving || (!displayNameDirty && !toneGenderDirty)} className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          {displayNameSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
                        </button>
                        {displayNameMessage && <p className="text-xs text-emerald-400">{displayNameMessage}</p>}
                        {displayNameError && <p className="text-xs text-rose-400">{displayNameError}</p>}
                        {authMessage && <p className="text-xs text-slate-400">{authMessage}</p>}
                      </div>

                      <div className="pt-2 border-t border-slate-800 space-y-2">
                        {canViewAsUser && accountOnly && (
                          <button onClick={openRoleSwitchInAdmin} className="w-full py-2 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition-colors flex items-center justify-center gap-2">
                            <Shield className="w-3 h-3" />
                            لوحة التحكم
                          </button>
                        )}
                        <button onClick={handleSignOut} disabled={authLoading} className="w-full py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                          <LogOut className="w-3 h-3" />
                          تسجيل خروج
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 space-y-4">
                      <User className="w-12 h-12 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400">سجّل دخولك لحفظ بياناتك سحابياً ومتابعة رحلتك من أي جهاز.</p>
                      <button onClick={handleGoogleLogin} disabled={authLoading} className="w-full py-2.5 rounded-xl bg-white text-slate-900 font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                        <GoogleMark className="w-4 h-4" />
                        استمرار باستخدام Google
                      </button>
                    </div>
                  )}
                </div>

                {showAdminTools && (
                  <div className="pt-6 border-t border-slate-800">
                    <button onClick={() => setShowConfirmWipe(true)} className="w-full py-3 rounded-xl border border-rose-500/20 hover:bg-rose-500/10 text-rose-500 text-xs font-bold transition-colors flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      تصفير النظام (مسح كل شيء)
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Confirm Import Modal */}
          {showAdminTools && showConfirmImport && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={handleCancelImport}>
              <div className="bg-slate-900 border border-amber-500/30 p-6 rounded-2xl max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-center text-lg font-bold text-white">تأكيد الاستيراد</h3>
                <p className="text-center text-sm text-slate-400">استيراد الملف سيمسح جميع البيانات الحالية ويستبدلها بالنسخة الجديدة. هل أنت متأكد؟</p>
                <div className="flex gap-3">
                  <button onClick={handleCancelImport} className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs font-bold">إلغاء</button>
                  <button onClick={handleConfirmImport} disabled={isImporting} className="flex-1 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors text-xs font-bold disabled:opacity-50">{isImporting ? "???? ?????????..." : "???? ?????? ????????"}</button>
                </div>
              </div>
            </div>
          )}

          {/* Confirm Wipe Modal */}
          {showAdminTools && showConfirmWipe && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowConfirmWipe(false)}>
              <div className="bg-slate-900 border border-rose-500/30 p-6 rounded-2xl max-w-sm w-full space-y-4" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <h3 className="text-center text-lg font-bold text-white">تصفير النظام بالكامل</h3>
                <p className="text-center text-sm text-slate-400">تحذير: هذا الإجراء سيحذف كل شيء من ذاكرة المتصفح. لا يمكن التراجع عنه.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowConfirmWipe(false)} className="flex-1 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors text-xs font-bold">تراجع</button>
                  <button onClick={handleConfirmWipe} className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors text-xs font-bold">مسح نهائي</button>
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </AnimatePresence>
  );
};




