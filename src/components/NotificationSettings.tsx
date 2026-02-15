import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, BellOff, X, Check, Clock, Calendar, Target, HeartPulse } from "lucide-react";
import { useNotificationState } from "../state/notificationState";
import { usePulseState } from "../state/pulseState";
import { useAdminState } from "../state/adminState";
import { getEffectiveRoleFromState, useAuthState } from "../state/authState";
import { getEffectiveFeatureAccess } from "../utils/featureFlags";
import { isSupabaseReady } from "../services/supabaseClient";
import { savePulseCheckMode } from "../services/adminApi";
import { isUserMode } from "../config/appEnv";
import { runtimeEnv } from "../config/runtimeEnv";

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettings: FC<NotificationSettingsProps> = ({
  isOpen,
  onClose
}) => {
  const {
    isSupported,
    permission,
    settings,
    isLoading,
    requestPermission,
    updateSettings
  } = useNotificationState();
  const pulseCheckMode = usePulseState((s) => s.checkInMode);
  const setPulseCheckMode = usePulseState((s) => s.setCheckInMode);
  const featureFlags = useAdminState((s) => s.featureFlags);
  const betaAccess = useAdminState((s) => s.betaAccess);
  const adminAccess = useAdminState((s) => s.adminAccess);
  const role = useAuthState(getEffectiveRoleFromState);
  const canUsePulseCheck = getEffectiveFeatureAccess({
    featureFlags,
    betaAccess,
    role,
    adminAccess,
    isDev: !isUserMode && runtimeEnv.isDev
  }).pulse_check;

  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const handleToggleNotifications = async () => {
    if (!settings.enabled) {
      // تفعيل الإشعارات
      if (permission !== "granted") {
        setShowPermissionPrompt(true);
        try {
          const result = await requestPermission();
          if (result === "granted") {
            updateSettings({ enabled: true });
          }
        } catch {
          // تجاهل الخطأ
        }
        setShowPermissionPrompt(false);
      } else {
        updateSettings({ enabled: true });
      }
    } else {
      // إيقاف الإشعارات
      updateSettings({ enabled: false });
    }
  };

  if (!isSupported) {
    return null;
  }

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
              <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-gradient-to-l from-teal-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-teal-600" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">الإشعارات</h2>
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
                {/* Main Toggle */}
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    {settings.enabled ? (
                      <Bell className="w-5 h-5 text-teal-600" />
                    ) : (
                      <BellOff className="w-5 h-5 text-slate-400" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-900">تفعيل الإشعارات</p>
                      <p className="text-xs text-slate-500">
                        {settings.enabled ? "الإشعارات مفعّلة" : "الإشعارات متوقفة"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleNotifications}
                    disabled={isLoading}
                    className={`w-14 h-8 rounded-full transition-colors relative ${
                      settings.enabled ? "bg-teal-500" : "bg-slate-300"
                    } ${isLoading ? "opacity-50" : ""}`}
                  >
                    <motion.div
                      className="absolute top-1 w-6 h-6 bg-white rounded-full"
                      animate={{ x: settings.enabled ? 28 : 4 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>

                {/* Permission Prompt */}
                {showPermissionPrompt && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800"
                  >
                    جاري طلب إذن الإشعارات... اضغط "سماح" في نافذة المتصفح
                  </motion.div>
                )}

                {/* Permission Denied */}
                {permission === "denied" && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-800">
                    تم رفض إذن الإشعارات. لتفعيلها، افتح إعدادات المتصفح واسمح بالإشعارات لهذا الموقع.
                  </div>
                )}

                {/* Sub-settings (only when enabled) */}
                {settings.enabled && permission === "granted" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-3"
                  >
                    {/* Daily Reminder */}
                    <SettingToggle
                      icon={<Clock className="w-4 h-4" />}
                      label="تذكير يومي"
                      description="تذكير يومي لفحص مشاعرك"
                      checked={settings.dailyReminder}
                      onChange={(checked) => updateSettings({ dailyReminder: checked })}
                    />

                    <SettingToggle
                      icon={<Target className="w-4 h-4" />}
                      label="تذكير المهمة اليومية"
                      description="تذكير يومي لو عندك مهمة نشطة"
                      checked={settings.missionReminder}
                      onChange={(checked) => updateSettings({ missionReminder: checked })}
                    />

                    {settings.missionReminder && (
                      <div className="pr-9">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <span>خطوة التذكير:</span>
                          <select
                            value={settings.missionReminderStrategy}
                            onChange={(e) => updateSettings({ missionReminderStrategy: e.target.value as typeof settings.missionReminderStrategy })}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-sm bg-white"
                          >
                            <option value="next">أول خطوة غير منجزة</option>
                            <option value="random">خطوة مختلفة (عشوائي)</option>
                            <option value="last">آخر خطوة غير منجزة</option>
                            <option value="cycle">تناوب يومي</option>
                          </select>
                        </label>
                        <p className="text-[11px] text-slate-500 mt-1">
                          لو اخترت "خطوة مختلفة" هنحاول نتجنب أول خطوة لما يكون فيه أكثر من خطوة غير منجزة.
                        </p>
                      </div>
                    )}

                    {/* Daily Reminder Time */}
                    {(settings.dailyReminder || settings.missionReminder) && (
                      <div className="pr-9">
                        <label className="flex items-center gap-2 text-sm text-slate-600">
                          <span>وقت التذكير:</span>
                          <input
                            type="time"
                            value={settings.dailyReminderTime}
                            onChange={(e) => updateSettings({ dailyReminderTime: e.target.value })}
                            className="px-2 py-1 border border-slate-200 rounded-lg text-sm"
                          />
                        </label>
                      </div>
                    )}

                    {/* Inactive Reminder */}
                    <SettingToggle
                      icon={<Calendar className="w-4 h-4" />}
                      label="تذكير بالعودة"
                      description={`تذكير بعد ${settings.inactiveReminderDays} أيام من عدم الاستخدام`}
                      checked={settings.inactiveReminder}
                      onChange={(checked) => updateSettings({ inactiveReminder: checked })}
                    />

                    {/* Exercise Complete */}
                    <SettingToggle
                      icon={<Check className="w-4 h-4" />}
                      label="إشعارات الإنجاز"
                      description="إشعار عند إكمال تمرين أو خطوة"
                      checked={settings.exerciseComplete}
                      onChange={(checked) => updateSettings({ exerciseComplete: checked })}
                    />
                  </motion.div>
                )}

                {/* Pulse Check Settings */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-600">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">بوابة النبض اللحظي</p>
                      <p className="text-xs text-slate-500">اختار توقيت ظهورها</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={async () => {
                        setPulseCheckMode("daily");
                        if (isSupabaseReady) {
                          await savePulseCheckMode("daily");
                        }
                      }}
                      disabled={!canUsePulseCheck}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        pulseCheckMode === "daily"
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-rose-200"
                      } ${!canUsePulseCheck ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      مرة يوميًا
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setPulseCheckMode("everyOpen");
                        if (isSupabaseReady) {
                          await savePulseCheckMode("everyOpen");
                        }
                      }}
                      disabled={!canUsePulseCheck}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                        pulseCheckMode === "everyOpen"
                          ? "border-rose-300 bg-rose-50 text-rose-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-rose-200"
                      } ${!canUsePulseCheck ? "opacity-50 cursor-not-allowed" : ""}`}
                    >
                      مع كل فتح
                    </button>
                  </div>
                  {!canUsePulseCheck && (
                    <p className="text-[11px] text-slate-500 mt-2">
                      بوابة النبض مقفولة حالياً من لوحة التحكم.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <p className="text-xs text-slate-500 text-center">
                  الإشعارات محلية فقط ولا تُرسل أي بيانات للخارج
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Sub-component for setting toggles
interface SettingToggleProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const SettingToggle: FC<SettingToggleProps> = ({
  icon,
  label,
  description,
  checked,
  onChange
}) => (
  <label className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors">
    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-slate-900 text-sm">{label}</p>
      <p className="text-xs text-slate-500">{description}</p>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 shrink-0 mt-2"
    />
  </label>
);
