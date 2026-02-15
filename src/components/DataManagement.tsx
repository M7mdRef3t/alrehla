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
  Cloud,
  LogOut,
  User
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

  const authStatus = useAuthState((s) => s.status);
  const authUser = useAuthState((s) => s.user);
  const baseRole = useAuthState((s) => s.role);
  const setRoleOverride = useAuthState((s) => s.setRoleOverride);
  const authRole = useAuthState(getEffectiveRoleFromState);
  const isPrivilegedUser = isPrivilegedRole(authRole);
  const showAdminTools = isPrivilegedUser && !accountOnly;
  const canViewAsUser = isPrivilegedRole(baseRole);
  const isUserView = authRole === "user";
  const privilegedRoleLabel = (baseRole || "owner").trim().toLowerCase();

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
    // Keep field synced to server updates as long as the user hasn't started editing.
    if (!displayNameDirty) setDisplayName(authDisplayName);
  }, [authDisplayName, displayNameDirty]);

  useEffect(() => {
    if (!toneGenderDirty) setToneGender(authToneGender);
  }, [authToneGender, toneGenderDirty]);

  useEffect(() => {
    // On user switch (login/logout), reset edit state.
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

      // إعادة تحميل الصفحة لتطبيق البيانات الجديدة
      setTimeout(() => {
        reloadPage();
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
      setCloudSuccess("تم رفع بياناتك للسحابة");
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
      setAuthMessage("تعذّر فتح بوابة جوجل. راجع الإعدادات ونكمل.");
    } else {
      setAuthMessage("تمام... بنحوّلك على بوابة جوجل.");
    }
    setAuthLoading(false);
  };

  const handleSignOut = async () => {
    setAuthLoading(true);
    setAuthMessage(null);
    await signOut();
    setAuthLoading(false);
  };

  const handleBackToOwnerView = () => {
    setRoleOverride(null);
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
        setDisplayNameError("حصلت مشكلة وإحنا بنحفظ بيانات الحساب. جرّب تاني.");
      } else {
        setDisplayNameDirty(false);
        setToneGenderDirty(false);
        setDisplayNameMessage("تم حفظ بيانات الحساب.");

        const updatedUser = data?.user ?? null;
        if (updatedUser) {
          const currentSession = useAuthState.getState().session;
          if (currentSession) useAuthState.getState().setSession({ ...currentSession, user: updatedUser });
        }
      }
    } catch {
      setDisplayNameError("حصلت مشكلة وإحنا بنحفظ بيانات الحساب. جرّب تاني.");
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
            className="fixed inset-0 bg-black/40 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
          >
            <div className="bg-white rounded-2xl overflow-hidden">
              {/* Header */}
              <div
                className={`flex items-center justify-between p-4 border-b border-slate-200 bg-linear-to-l ${
                  showAdminTools ? "from-blue-50 to-white" : "from-teal-50 to-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      showAdminTools ? "bg-blue-100" : "bg-teal-100"
                    }`}
                  >
                    {showAdminTools ? (
                      <Database className="w-5 h-5 text-blue-600" />
                    ) : (
                      <User className="w-5 h-5 text-teal-700" />
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">{showAdminTools ? "إدارة البيانات" : "الحساب"}</h2>
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
                {showAdminTools && (
                  <>
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

                {/* Cloud Section */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 px-2">السحابة</p>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <Cloud className="w-4 h-4" />
                      <span>مزامنة البيانات</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      <button
                        type="button"
                        onClick={handleCloudImport}
                        disabled={cloudLoading}
                        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
                      >
                        <Upload className="w-4 h-4 text-blue-600" />
                        رفع النسخة الحالية للسحابة
                      </button>
                      <button
                        type="button"
                        onClick={handleCloudPull}
                        disabled={cloudLoading}
                        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-emerald-400 hover:bg-emerald-50 disabled:opacity-50"
                      >
                        <Download className="w-4 h-4 text-emerald-600" />
                        استعادة نسخة السحابة على هذا الجهاز
                      </button>
                      <button
                        type="button"
                        onClick={handleCloudExport}
                        disabled={cloudLoading}
                        className="w-full flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-slate-400 hover:bg-slate-100 disabled:opacity-50"
                      >
                        <FileJson className="w-4 h-4 text-slate-600" />
                        تنزيل نسخة السحابة كملف
                      </button>
                    </div>
                    {cloudSuccess && <p className="text-xs text-green-600">{cloudSuccess}</p>}
                    {cloudError && <p className="text-xs text-rose-600">{cloudError}</p>}
                  </div>
                </div>

                  </>
                )}

                {/* Auth Section */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-500 px-2">الحساب</p>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <User className="w-4 h-4" />
                      <span>ربط الحساب بالسحابة</span>
                    </div>
                    {authUser ? (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-slate-700">اسمك</p>
                          <input
                            value={displayName}
                            onChange={(e) => {
                              setDisplayName(e.target.value);
                              setDisplayNameDirty(true);
                              setDisplayNameError(null);
                              setDisplayNameMessage(null);
                            }}
                            placeholder={displayNamePlaceholder}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-teal-400"
                          />
                        </div>

                        <div className="space-y-1">
                          <p className="text-xs text-slate-500">صيغة مخاطبتك</p>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const next: UserToneGender = "male";
                                setToneGender(next);
                                setToneGenderDirty(next !== authToneGender);
                                setDisplayNameError(null);
                                setDisplayNameMessage(null);
                              }}
                              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                toneGender === "male"
                                  ? "border-teal-600 bg-teal-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                              }`}
                            >
                              مذكر
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next: UserToneGender = "female";
                                setToneGender(next);
                                setToneGenderDirty(next !== authToneGender);
                                setDisplayNameError(null);
                                setDisplayNameMessage(null);
                              }}
                              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                toneGender === "female"
                                  ? "border-teal-600 bg-teal-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                              }`}
                            >
                              مؤنث
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const next: UserToneGender = "neutral";
                                setToneGender(next);
                                setToneGenderDirty(next !== authToneGender);
                                setDisplayNameError(null);
                                setDisplayNameMessage(null);
                              }}
                              className={`flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                                toneGender === "neutral"
                                  ? "border-teal-600 bg-teal-600 text-white"
                                  : "border-slate-200 bg-white text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                              }`}
                            >
                              محايد
                            </button>
                          </div>
                          <p className="text-[11px] leading-relaxed text-slate-500">اختار محايد لو مش حابب تحدد.</p>
                        </div>

                        <button
                          type="button"
                          onClick={handleSaveAccountProfile}
                          disabled={displayNameSaving || (!displayNameDirty && !toneGenderDirty)}
                          className="w-full rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {displayNameSaving ? "..." : "حفظ"}
                        </button>

                        {displayNameError && <p className="text-xs text-rose-600">{displayNameError}</p>}
                        {displayNameMessage && <p className="text-xs text-emerald-700">{displayNameMessage}</p>}

                        {canViewAsUser && accountOnly && (
                          <button
                            type="button"
                            onClick={openRoleSwitchInAdmin}
                            className="w-full rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-800 hover:bg-teal-100 transition-colors"
                          >
                            التحكم في الصلاحية
                          </button>
                        )}

                        {authUser && canViewAsUser && isUserView && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 space-y-2">
                            <p className="text-xs text-amber-800">
                              أنت الآن في عرض المستخدم. اضغط للرجوع إلى وضع {privilegedRoleLabel}.
                            </p>
                            <button
                              type="button"
                              onClick={handleBackToOwnerView}
                              className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                            >
                              الرجوع لوضع المالك
                            </button>
                          </div>
                        )}

                        <p className="text-sm text-slate-700">مسجل كـ {authUser.email ?? "مستخدم"}</p>
                        <button
                          type="button"
                          onClick={handleSignOut}
                          disabled={authLoading}
                          className="w-full flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 hover:border-rose-400 hover:bg-rose-100 disabled:opacity-50"
                        >
                          <LogOut className="w-4 h-4 text-rose-600" />
                          تسجيل خروج
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          disabled={authLoading || authStatus === "loading"}
                          className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm hover:border-blue-400 hover:bg-blue-50 disabled:opacity-50"
                        >
                          <GoogleMark className="w-4 h-4" />
                          Continue with Google
                        </button>
                        {authStatus === "loading" && <p className="text-xs text-slate-500">جاري فحص الجلسة...</p>}
                        {authMessage && <p className="text-xs text-slate-500">{authMessage}</p>}
                      </div>
                    )}
                  </div>
                </div>

                {showAdminTools && (
                  <>
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

                {/* Data Wipe */}
                <div className="space-y-2 pt-2">
                  <p className="text-xs font-semibold text-slate-500 px-2">مسح البيانات</p>
                  <button
                    type="button"
                    onClick={() => setShowConfirmWipe(true)}
                    className="w-full flex items-center gap-3 p-4 bg-white border-2 border-rose-200 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all text-right active:scale-[0.99]"
                  >
                    <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-rose-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900">مسح كل البيانات المحلية</p>
                      <p className="text-xs text-slate-500">يحذف جميع بيانات الرحلة المخزنة محليًا</p>
                    </div>
                  </button>
                </div>
                  </>
                )}
              </div>

              {showAdminTools && (
                <div className="p-4 border-t border-slate-200 bg-slate-50">
                  <p className="text-xs text-slate-500 text-center flex items-center justify-center gap-1">
                    <FileJson className="w-3 h-3" />
                    كل بياناتك محفوظة محليًا في متصفحك
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {showAdminTools && (
            <AnimatePresence>
              {showConfirmImport && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4"
                onClick={handleCancelImport}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-white rounded-2xl p-6 max-w-sm w-full"
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
          )}

          {showAdminTools && (
            <AnimatePresence>
              {showConfirmWipe && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-60 flex items-center justify-center p-4"
                onClick={() => setShowConfirmWipe(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative bg-white rounded-2xl p-6 max-w-sm w-full"
                >
                  <button
                    type="button"
                    onClick={() => setShowConfirmWipe(false)}
                    className="absolute top-4 left-4 w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors"
                    aria-label="إغلاق"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        هل أنت متأكد؟
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        سيتم حذف جميع البيانات المحلية نهائيًا ولا يمكن التراجع عن هذا الإجراء.
                      </p>
                    </div>
                    <div className="flex gap-3 w-full">
                      <button
                        type="button"
                        onClick={() => setShowConfirmWipe(false)}
                        className="flex-1 py-2.5 px-4 border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        إلغاء
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmWipe}
                        className="flex-1 py-2.5 px-4 bg-rose-500 text-white font-semibold rounded-xl hover:bg-rose-600 transition-colors"
                      >
                        مسح
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
              )}
            </AnimatePresence>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
