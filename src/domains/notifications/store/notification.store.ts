import { create } from "zustand";
import { runtimeEnv } from "@/config/runtimeEnv";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  loadNotificationSettings,
  saveNotificationSettings,
  recordActivity,
  checkAndSendInactiveReminder,
  checkAndSendWeeklyGratitude,
  checkAndSendMapRevisit,
  type NotificationSettings
} from "@/services/notifications";
import { behavioralService, type BehavioralAlert } from "@/services/behavioralService";
import { useToastState } from "@/modules/map/store/toast.store";

interface NotificationState {
  // حالة الدعم والإذن
  isSupported: boolean;
  permission: NotificationPermission | null;
  
  // الإعدادات
  settings: NotificationSettings;
  
  // حالة التحميل
  isLoading: boolean;
  
  // الإجراءات
  initialize: () => void;
  requestPermission: () => Promise<NotificationPermission>;
  updateSettings: (settings: Partial<NotificationSettings>) => void;
  recordUserActivity: () => void;
  
  // Behavioral Alerts
  behavioralAlerts: BehavioralAlert[];
  fetchBehavioralAlerts: () => Promise<void>;
  acknowledgeBehavioralAlert: (id: string) => Promise<void>;
}

export const useNotificationState = create<NotificationState>((set, get) => ({
  isSupported: false,
  permission: null,
    settings: {
      enabled: false,
      dailyReminder: true,
      dailyReminderTime: "20:00",
      inactiveReminder: true,
      inactiveReminderDays: 3,
      exerciseComplete: true,
      missionReminder: true,
      missionReminderStrategy: "next"
    },
  isLoading: false,
  behavioralAlerts: [],

  initialize: () => {
    const isSupported = isNotificationSupported();
    const permission = getNotificationPermission();
    
    set({
      isSupported,
      permission
    });

    // فحص تذكير العودة (ذكي حسب التقدم) قبل تحديث آخر نشاط
    void loadNotificationSettings().then((settings) => {
      // Sync from cloud if available
      import("@/domains/auth/store/auth.store").then(({ useAuthState }) => {
        const ecosystemData = useAuthState.getState().ecosystemData;
        if (ecosystemData?.notification_settings) {
          set({ settings: { ...settings, ...ecosystemData.notification_settings } });
        } else {
          set({ settings });
        }
      }).catch(() => {
        set({ settings });
      });
    });
    void checkAndSendInactiveReminder();
    void checkAndSendWeeklyGratitude();
    void checkAndSendMapRevisit();
    // تسجيل النشاط عند فتح التطبيق
    recordActivity();

    // جلب تنبيهات السلوك
    get().fetchBehavioralAlerts();

    // إعداد الاشتراك اللحظي
    import("@/domains/auth/store/auth.store").then(({ useAuthState }) => {
      const user = useAuthState.getState().user;
      if (user) {
        behavioralService.subscribeToAlerts(user.id, (alert) => {
          set((state) => ({
            behavioralAlerts: [alert, ...state.behavioralAlerts].slice(0, 10),
          }));

          // Trigger global toast
          useToastState.getState().showToast(alert.message, "warning");
        });
      }
    }).catch(() => {});
  },

  requestPermission: async () => {
    set({ isLoading: true });
    
    try {
      const permission = await requestNotificationPermission();
      
      set({
        permission,
        isLoading: false
      });

      // تفعيل الإعدادات تلقائياً لو الإذن تم منحه
      if (permission === "granted") {
        const currentSettings = get().settings;
        if (!currentSettings.enabled) {
          get().updateSettings({ enabled: true });
        }
      }

      return permission;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  updateSettings: (newSettings) => {
    const currentSettings = get().settings;
    const updatedSettings = { ...currentSettings, ...newSettings };
    
    saveNotificationSettings(updatedSettings);
    set({ settings: updatedSettings });

    // Sync to Cloud
    import("@/domains/auth/store/auth.store").then(({ useAuthState }) => {
      const { updateEcosystemData } = useAuthState.getState();
      updateEcosystemData({ notification_settings: updatedSettings as any });
    }).catch(() => {});
  },

  recordUserActivity: () => {
    recordActivity();
  },

  fetchBehavioralAlerts: async () => {
    const alerts = await behavioralService.getAlerts();
    set({ behavioralAlerts: alerts });
  },

  acknowledgeBehavioralAlert: async (id: string) => {
    await behavioralService.acknowledgeAlert(id);
    set((state) => ({
      behavioralAlerts: state.behavioralAlerts.map((a) =>
        a.id === id ? { ...a, is_read: true } : a
      ),
    }));
  },
}));

// تهيئة الـ state عند تحميل الملف
if (typeof window !== "undefined") {
  if (runtimeEnv.isDev) {
    useNotificationState.getState().initialize();
  } else {
  // تأخير التهيئة لما الـ DOM يكون جاهز
  setTimeout(() => {
    useNotificationState.getState().initialize();
  }, 0);
  }
}
