import { create } from "zustand";
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  loadNotificationSettings,
  saveNotificationSettings,
  recordActivity,
  checkAndSendInactiveReminder,
  type NotificationSettings
} from "../services/notifications";

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

  initialize: () => {
    const isSupported = isNotificationSupported();
    const permission = getNotificationPermission();
    
    set({
      isSupported,
      permission
    });

    // فحص تذكير العودة (ذكي حسب التقدم) قبل تحديث آخر نشاط
    void loadNotificationSettings().then((settings) => {
      set({ settings });
    });
    void checkAndSendInactiveReminder();
    // تسجيل النشاط عند فتح التطبيق
    recordActivity();
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
  },

  recordUserActivity: () => {
    recordActivity();
  }
}));

// تهيئة الـ state عند تحميل الملف
if (typeof window !== "undefined") {
  // تأخير التهيئة لما الـ DOM يكون جاهز
  setTimeout(() => {
    useNotificationState.getState().initialize();
  }, 0);
}
