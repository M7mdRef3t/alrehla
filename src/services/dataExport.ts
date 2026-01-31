import { loadStoredState } from "./localStore";

/**
 * واجهة بيانات النسخة الاحتياطية
 */
export interface BackupData {
  version: string;
  exportedAt: string;
  nodes: unknown[];
  me?: {
    battery: string;
    journalNote?: string;
    shieldMode?: boolean;
  };
  journey?: {
    currentStepId?: string;
    completedStepIds?: string[];
    baselineAnswers?: unknown;
    baselineScore?: number;
    goalId?: string;
    category?: string;
  };
  notification?: {
    enabled: boolean;
    dailyReminder?: boolean;
    dailyReminderTime?: string;
  };
}

/**
 * تصدير جميع البيانات إلى ملف JSON
 */
export function exportToJSON(): void {
  try {
    // جمع البيانات من localStorage
    const mapData = loadStoredState();
    const meData = localStorage.getItem("dawayir-me");
    const journeyData = localStorage.getItem("dawayir-journey");
    const notificationData = localStorage.getItem("dawayir-notification-settings");

    const data: BackupData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      nodes: mapData?.nodes || []
    };

    // إضافة البيانات الإضافية إن وُجدت
    if (meData) {
      try {
        data.me = JSON.parse(meData);
      } catch {
        // تجاهل الخطأ
      }
    }

    if (journeyData) {
      try {
        data.journey = JSON.parse(journeyData);
      } catch {
        // تجاهل الخطأ
      }
    }

    if (notificationData) {
      try {
        data.notification = JSON.parse(notificationData);
      } catch {
        // تجاهل الخطأ
      }
    }

    // إنشاء ملف JSON
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // تحميل الملف
    const a = document.createElement("a");
    a.href = url;
    a.download = `dawayir-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("فشل في تصدير البيانات:", error);
    throw new Error("حدث خطأ أثناء تصدير البيانات");
  }
}

/**
 * استيراد البيانات من ملف JSON
 */
export async function importFromJSON(file: File): Promise<BackupData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data: BackupData = JSON.parse(content);

        // التحقق من صحة البيانات
        if (!data.version || !data.exportedAt) {
          throw new Error("صيغة الملف غير صحيحة");
        }

        // التحقق من الإصدار
        if (data.version !== "1.0") {
          throw new Error("إصدار الملف غير مدعوم");
        }

        resolve(data);
      } catch (error) {
        reject(new Error("فشل في قراءة الملف. تأكد أن الملف صحيح."));
      }
    };

    reader.onerror = () => {
      reject(new Error("فشل في قراءة الملف"));
    };

    reader.readAsText(file);
  });
}

/**
 * استعادة البيانات المستوردة
 */
export function restoreBackupData(data: BackupData): void {
  try {
    // استعادة بيانات الخريطة
    if (data.nodes && Array.isArray(data.nodes)) {
      localStorage.setItem("dawayir-map-nodes", JSON.stringify({ nodes: data.nodes }));
    }

    // استعادة بيانات "أنا"
    if (data.me) {
      localStorage.setItem("dawayir-me", JSON.stringify(data.me));
    }

    // استعادة بيانات الرحلة
    if (data.journey) {
      localStorage.setItem("dawayir-journey", JSON.stringify(data.journey));
    }

    // استعادة إعدادات الإشعارات
    if (data.notification) {
      localStorage.setItem("dawayir-notification-settings", JSON.stringify(data.notification));
    }
  } catch (error) {
    console.error("فشل في استعادة البيانات:", error);
    throw new Error("حدث خطأ أثناء استعادة البيانات");
  }
}

/**
 * حساب حجم البيانات المحفوظة (بالكيلوبايت)
 */
export function getStorageSize(): number {
  let total = 0;
  for (const key in localStorage) {
    if (Object.prototype.hasOwnProperty.call(localStorage, key) && key.startsWith("dawayir-")) {
      total += localStorage[key].length + key.length;
    }
  }
  return Math.round(total / 1024); // بالكيلوبايت
}

/**
 * حساب عدد العناصر المحفوظة
 */
export function getStorageStats(): {
  nodesCount: number;
  hasJourneyData: boolean;
  hasMeData: boolean;
  hasNotificationSettings: boolean;
  totalSizeKB: number;
} {
  const mapData = loadStoredState();
  const meData = localStorage.getItem("dawayir-me");
  const journeyData = localStorage.getItem("dawayir-journey");
  const notificationData = localStorage.getItem("dawayir-notification-settings");

  return {
    nodesCount: mapData?.nodes?.length || 0,
    hasJourneyData: !!journeyData,
    hasMeData: !!meData,
    hasNotificationSettings: !!notificationData,
    totalSizeKB: getStorageSize()
  };
}
