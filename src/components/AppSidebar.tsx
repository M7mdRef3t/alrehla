import type { FC } from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, ArrowLeft, ClipboardList, PanelRightOpen, X, Bell, Database, Share2, BookOpen, Wind, AlertCircle, Palette, Trophy } from "lucide-react";
import { useJourneyState } from "../state/journeyState";
import { useNotificationState } from "../state/notificationState";
import { useEmergencyState } from "../state/emergencyState";
import { NotificationSettings } from "./NotificationSettings";
import { DataManagement } from "./DataManagement";
import { ShareStats } from "./ShareStats";
import { EducationalLibrary } from "./EducationalLibrary";
import { BreathingOverlay } from "./BreathingOverlay";
import { ThemeSettings } from "./ThemeSettings";
import { Achievements } from "./Achievements";
import { useAchievementState } from "../state/achievementState";
import { trackEvent, AnalyticsEvents } from "../services/analytics";

interface AppSidebarProps {
  onOpenGym: () => void;
  onStartJourney: () => void;
  onOpenBaseline: () => void;
}

export const AppSidebar: FC<AppSidebarProps> = ({
  onOpenGym,
  onStartJourney,
  onOpenBaseline
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showDataManagement, setShowDataManagement] = useState(false);
  const [showShareStats, setShowShareStats] = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showThemeSettings, setShowThemeSettings] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const isFirstTime = useJourneyState((s) => s.baselineCompletedAt == null);
  const unlockedCount = useAchievementState((s) => s.unlockedIds.length);
  const { isSupported: notificationsSupported, settings: notificationSettings } = useNotificationState();
  const openEmergency = useEmergencyState((s) => s.open);

  const handleClose = () => setIsOpen(false);
  const handleOpen = () => setIsOpen(true);

  return (
    <>
      <div
        className="fixed top-0 right-0 z-40 h-full hidden md:flex flex-row-reverse group/sidebar"
        aria-label="القائمة الرئيسية"
      >
        {/* المحتوى — يظهر عند تحريك الماوس على التاب أو الشريط؛ wrapper يمنع ظهور أي جزء عند الإغلاق */}
        <div className="h-full w-0 group-hover/sidebar:w-52 shrink-0 overflow-hidden transition-[width] duration-200 ease-out">
          <aside
            className="h-full w-52 bg-white dark:bg-slate-800 border-l border-slate-200 dark:border-slate-700 shadow-lg flex flex-col gap-2 py-6 px-3 min-w-0 invisible group-hover/sidebar:visible"
          >
          {isFirstTime && (
            <button
              type="button"
              onClick={onOpenGym}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
              title="تدرب على سيناريوهات حقيقية قبل ما تبدأ"
            >
              <Target className="w-5 h-5 shrink-0" />
              جرب نفسك الأول
            </button>
          )}
          <button
            type="button"
            onClick={onStartJourney}
            className="w-full flex items-center gap-3 rounded-xl bg-teal-600 text-white px-4 py-3 text-sm font-semibold hover:bg-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
            title="قائمة الأهداف"
          >
            <ArrowLeft className="w-5 h-5 shrink-0" />
            أبدأ رحلتك
          </button>
          <button
            type="button"
            onClick={onOpenBaseline}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="القياس الأولي"
          >
            <ClipboardList className="w-5 h-5 shrink-0" />
            القياس
          </button>
          {notificationsSupported && (
            <button
              type="button"
              onClick={() => setShowNotificationSettings(true)}
              className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right shrink-0 whitespace-nowrap"
              title="إعدادات الإشعارات"
            >
              <Bell className={`w-5 h-5 shrink-0 ${notificationSettings.enabled ? 'text-teal-600' : ''}`} />
              الإشعارات
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowDataManagement(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="تصدير/استيراد البيانات"
          >
            <Database className="w-5 h-5 shrink-0" />
            البيانات
          </button>
          <button
            type="button"
            onClick={() => setShowShareStats(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="شارك إحصائياتك"
          >
            <Share2 className="w-5 h-5 shrink-0" />
            شارك
          </button>
          <button
            type="button"
            onClick={() => {
              trackEvent(AnalyticsEvents.LIBRARY_OPENED);
              setShowLibrary(true);
            }}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="مكتبة المحتوى التعليمي"
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            المكتبة
          </button>
          <button
            type="button"
            onClick={() => setShowThemeSettings(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap"
            title="تغيير المظهر"
          >
            <Palette className="w-5 h-5 shrink-0" />
            المظهر
          </button>
          <button
            type="button"
            onClick={() => setShowAchievements(true)}
            className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-right shrink-0 whitespace-nowrap"
            title="إنجازاتك"
          >
            <Trophy className="w-5 h-5 shrink-0" />
            إنجازاتك
            {unlockedCount > 0 && (
              <span className="mr-auto text-xs font-bold bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
                {unlockedCount}
              </span>
            )}
          </button>
          
          {/* فاصل */}
          <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
          
          {/* أزرار الدعم والطوارئ */}
          <button
            type="button"
            onClick={() => {
              trackEvent(AnalyticsEvents.BREATHING_USED);
              useAchievementState.getState().markBreathingUsed();
              setShowBreathing(true);
            }}
            className="w-full flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 px-4 py-3 text-sm font-semibold hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all text-right shrink-0 whitespace-nowrap"
            title="تمرين تنفس للهدوء"
          >
            <Wind className="w-5 h-5 shrink-0" />
            هدّي نفسك
          </button>
          <button
            type="button"
            onClick={() => {
              trackEvent(AnalyticsEvents.EMERGENCY_USED);
              openEmergency();
            }}
            className="w-full flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm font-semibold hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right shrink-0 whitespace-nowrap"
            title="لحظة ضغط؟ اضغط هنا"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            طوارئ
          </button>
          </aside>
        </div>
        {/* تاب صغير ظاهر دايماً — تحريك الماوس عليه يفتح الشريط */}
        <div
          className="h-full w-10 shrink-0 flex flex-col justify-center items-center bg-teal-600 text-white border-l border-teal-700 shadow-md cursor-default py-4"
          title="افتح القائمة"
        >
          <PanelRightOpen className="w-5 h-5" />
        </div>
      </div>

      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed top-4 right-4 z-40 md:hidden w-12 h-12 flex items-center justify-center bg-teal-600 text-white rounded-full shadow-lg active:scale-95 transition-transform"
        title="افتح القائمة"
      >
        <PanelRightOpen className="w-6 h-6" />
      </button>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 bg-black/40 z-40 md:hidden"
            />
            
            {/* Sidebar Content */}
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 h-full w-72 bg-white dark:bg-slate-800 shadow-2xl z-50 md:hidden flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">القائمة</h2>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
                  title="إغلاق"
                >
                  <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {isFirstTime && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenGym();
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                  >
                    <Target className="w-6 h-6 shrink-0" />
                    <span>جرب نفسك الأول</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    onStartJourney();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-teal-600 text-white px-4 py-3 text-sm font-semibold active:scale-95 hover:bg-teal-700 dark:hover:bg-teal-600 transition-all text-right"
                >
                  <ArrowLeft className="w-6 h-6 shrink-0" />
                  <span>أبدأ رحلتك</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onOpenBaseline();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                >
                  <ClipboardList className="w-6 h-6 shrink-0" />
                  <span>القياس</span>
                </button>
                {notificationsSupported && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationSettings(true);
                      handleClose();
                    }}
                    className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right"
                  >
                    <Bell className={`w-6 h-6 shrink-0 ${notificationSettings.enabled ? 'text-teal-600 dark:text-teal-400' : ''}`} />
                    <span>الإشعارات</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowDataManagement(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-300 transition-all text-right"
                >
                  <Database className="w-6 h-6 shrink-0" />
                  <span>البيانات</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowShareStats(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/30 hover:text-purple-700 dark:hover:text-purple-300 transition-all text-right"
                >
                  <Share2 className="w-6 h-6 shrink-0" />
                  <span>شارك</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.LIBRARY_OPENED);
                    setShowLibrary(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all text-right"
                >
                  <BookOpen className="w-6 h-6 shrink-0" />
                  <span>المكتبة</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowThemeSettings(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right"
                >
                  <Palette className="w-6 h-6 shrink-0" />
                  <span>المظهر</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAchievements(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all text-right"
                >
                  <Trophy className="w-6 h-6 shrink-0" />
                  <span>إنجازاتك</span>
                  {unlockedCount > 0 && (
                    <span className="mr-auto text-xs font-bold bg-amber-200 dark:bg-amber-700 text-amber-900 dark:text-amber-100 rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1.5">
                      {unlockedCount}
                    </span>
                  )}
                </button>
                
                {/* فاصل */}
                <div className="border-t border-slate-200 dark:border-slate-700 my-2" />
                
                {/* أزرار الدعم والطوارئ */}
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.BREATHING_USED);
                    useAchievementState.getState().markBreathingUsed();
                    setShowBreathing(true);
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition-all text-right"
                >
                  <Wind className="w-6 h-6 shrink-0" />
                  <span>هدّي نفسك</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    trackEvent(AnalyticsEvents.EMERGENCY_USED);
                    openEmergency();
                    handleClose();
                  }}
                  className="w-full flex items-center gap-3 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 px-4 py-3 text-sm font-semibold active:scale-95 hover:border-rose-400 dark:hover:border-rose-500 hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-all text-right"
                >
                  <AlertCircle className="w-6 h-6 shrink-0" />
                  <span>طوارئ</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Notification Settings Modal */}
      <NotificationSettings
        isOpen={showNotificationSettings}
        onClose={() => setShowNotificationSettings(false)}
      />

      {/* Data Management Modal */}
      <DataManagement
        isOpen={showDataManagement}
        onClose={() => setShowDataManagement(false)}
      />

      {/* Share Stats Modal */}
      <ShareStats
        isOpen={showShareStats}
        onClose={() => setShowShareStats(false)}
      />

      {/* Educational Library Modal */}
      <EducationalLibrary
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)}
      />

      {/* Breathing Overlay */}
      {showBreathing && (
        <BreathingOverlay
          onClose={() => setShowBreathing(false)}
          autoCloseAfterCycles={0}
        />
      )}

      {/* Theme Settings Modal */}
      <ThemeSettings
        isOpen={showThemeSettings}
        onClose={() => setShowThemeSettings(false)}
      />

      {/* Achievements Modal */}
      {showAchievements && (
        <Achievements onClose={() => setShowAchievements(false)} />
      )}
    </>
  );
};
