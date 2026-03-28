import type { FC } from "react";
import { ArrowLeft, BarChart3, Bell, BrainCircuit, ClipboardList, Compass, Globe, Layers, ShieldCheck } from "lucide-react";
import type { FeatureFlagKey } from "../config/features";

export interface AppSidebarQuickActionsProps {
  canShowJourneyToolsEntry: boolean;
  onOpenJourneyTools?: () => void;
  onOpenJourneyTimeline?: () => void;
  openAdminDashboard: () => void;
  openCoachDashboard: () => void;
  onOpenOwnerAnalytics?: () => void;
  onOpenDawayir?: () => void;
  onOpenGuidedJourney: () => void;
  onOpenBaseline: () => void;
  onStartJourney: () => void;
  setShowNotificationSettings: (value: boolean) => void;
  notificationsSupported: boolean;
  notificationEnabled: boolean;
  setShowTrackingDashboard: (value: boolean) => void;
  setShowAtlasDashboard: (value: boolean) => void;
  openWithFeatureGate: (feature: FeatureFlagKey, onAllowed: () => void) => void;
}

export const AppSidebarQuickActions: FC<AppSidebarQuickActionsProps> = (props) => {
  return (
    <>
      {props.canShowJourneyToolsEntry && (
        <button type="button" onClick={() => props.onOpenJourneyTools?.()} className="w-full flex items-center gap-3 rounded-xl bg-teal-50/80 dark:bg-teal-900/30 text-teal-700 dark:text-teal-200 border border-teal-200 dark:border-teal-700 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-100/70 dark:hover:bg-teal-900/40 transition-all text-right shrink-0 whitespace-nowrap" title="الترسانة — معداتك">
          <Compass className="w-5 h-5 shrink-0" />
          الترسانة
        </button>
      )}
      {props.onOpenJourneyTimeline && (
        <button type="button" onClick={() => props.onOpenJourneyTimeline?.()} className="w-full flex items-center gap-3 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-600 hover:bg-amber-100/70 dark:hover:bg-amber-900/30 transition-all text-right shrink-0 whitespace-nowrap" title="سجل العمليات">
          <ClipboardList className="w-5 h-5 shrink-0" />
          سجل العمليات
        </button>
      )}
      <button type="button" onClick={props.openAdminDashboard} className="w-full flex items-center gap-3 rounded-xl bg-slate-50/80 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap" title="لوحة التحكم">
        <ShieldCheck className="w-5 h-5 shrink-0 text-teal-600" />
        لوحة التحكم
      </button>
      {props.onOpenOwnerAnalytics && (
        <button type="button" onClick={props.onOpenOwnerAnalytics} className="w-full flex items-center gap-3 rounded-xl bg-violet-50/80 dark:bg-violet-900/30 text-violet-700 dark:text-violet-200 border border-violet-200 dark:border-violet-700 px-4 py-3 text-sm font-semibold hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-all text-right shrink-0 whitespace-nowrap" title="مركز التحليلات">
          <BarChart3 className="w-5 h-5 shrink-0 text-violet-600 dark:text-violet-400" />
          مركز التحليلات
        </button>
      )}
      <button type="button" onClick={props.openCoachDashboard} className="w-full flex items-center gap-3 rounded-xl bg-indigo-50/80 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 px-4 py-3 text-sm font-semibold hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all text-right shrink-0 whitespace-nowrap" title="بوابة المعالجين B2B">
        <BrainCircuit className="w-5 h-5 shrink-0 text-indigo-600 dark:text-indigo-400" />
        بوابة المعالجين
      </button>
      <button type="button" onClick={() => props.onOpenDawayir?.()} className="w-full flex items-center gap-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 transition-all text-right shrink-0 whitespace-nowrap" title="مركز القيادة">
        <Compass className="w-5 h-5 shrink-0 text-teal-600" />
        مركز القيادة
      </button>
      <button type="button" onClick={props.onStartJourney} className="w-full flex items-center gap-3 rounded-xl bg-teal-600 text-white px-4 py-3 text-sm font-semibold hover:bg-teal-700 transition-all text-right shrink-0 whitespace-nowrap" title="مهام الميدان">
        <ArrowLeft className="w-5 h-5 shrink-0" />
        انطلاق للمهمة
      </button>
      <button type="button" onClick={props.onOpenGuidedJourney} className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap" title="الرحلة الموجهة خطوة بخطوة">
        <Layers className="w-5 h-5 shrink-0" />
        الرحلة الموجهة
      </button>
      <button type="button" onClick={props.onOpenBaseline} className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap" title="رصد الحالة اللحظية">
        <ClipboardList className="w-5 h-5 shrink-0" />
        رصد الحالة
      </button>
      {props.notificationsSupported && (
        <button type="button" onClick={() => props.setShowNotificationSettings(true)} className="w-full flex items-center gap-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 px-4 py-3 text-sm font-semibold hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 transition-all text-right shrink-0 whitespace-nowrap" title="إعدادات الإشعارات">
          <Bell className={`w-5 h-5 shrink-0 ${props.notificationEnabled ? "text-teal-600" : ""}`} />
          الإشعارات
        </button>
      )}
      <button type="button" onClick={() => props.setShowTrackingDashboard(true)} className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-teal-400 dark:hover:border-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/30 hover:text-teal-700 dark:hover:text-teal-300 transition-all text-right shrink-0 whitespace-nowrap" title="رادار المتابعة">
        <BarChart3 className="w-5 h-5 shrink-0" />
        رادار المتابعة
      </button>
      <button type="button" onClick={() => props.openWithFeatureGate("global_atlas", () => props.setShowAtlasDashboard(true))} className="w-full flex items-center gap-3 rounded-xl bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm font-semibold hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 hover:text-amber-700 dark:hover:text-amber-300 transition-all text-right shrink-0 whitespace-nowrap" title="لوحة تحكم الأطلس">
        <Globe className="w-5 h-5 shrink-0" />
        لوحة الأطلس
      </button>
    </>
  );
};
