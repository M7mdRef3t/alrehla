import { logger } from "@/services/logger";
import { loadStoredState } from "./localStore";
import { getJSON, setJSON, getItem } from "./secureStore";
import {
  getFromLocalStorage,
  getLocalStorageKey,
  getLocalStorageLength
} from "./browserStorage";
import { downloadBlobFile } from "./clientDom";

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
export async function buildBackupFromLocal(): Promise<BackupData> {
  // جمع البيانات من التخزين المحلي
  const mapData = await loadStoredState();
  const meData = await getJSON("dawayir-me");
  const journeyData = await getJSON("dawayir-journey");
  const notificationData = await getJSON("dawayir-notification-settings");

  const data: BackupData = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    nodes: mapData?.nodes || []
  };

  if (meData) {
    data.me = meData as BackupData["me"];
  }

  if (journeyData) {
    data.journey = journeyData as BackupData["journey"];
  }

  if (notificationData) {
    data.notification = notificationData as BackupData["notification"];
  }

  return data;
}

export async function exportToJSON(): Promise<void> {
  try {
    const data = await buildBackupFromLocal();
    downloadBackupFile(data);
  } catch (error) {
    logger.error("فشل في تصدير البيانات:", error);
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
      } catch {
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
export async function restoreBackupData(data: BackupData): Promise<void> {
  try {
    // استعادة بيانات الخريطة
    if (data.nodes && Array.isArray(data.nodes)) {
      await setJSON("dawayir-map-nodes", { nodes: data.nodes });
    }

    // استعادة بيانات "أنا"
    if (data.me) {
      await setJSON("dawayir-me", data.me);
    }

    // استعادة بيانات الرحلة
    if (data.journey) {
      await setJSON("dawayir-journey", data.journey);
    }

    // استعادة إعدادات الإشعارات
    if (data.notification) {
      await setJSON("dawayir-notification-settings", data.notification);
    }
  } catch (error) {
    logger.error("فشل في استعادة البيانات:", error);
    throw new Error("حدث خطأ أثناء استعادة البيانات");
  }
}

export function downloadBackupFile(data: BackupData, fileNamePrefix = "journey-backup"): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: "application/json" });
  downloadBlobFile(blob, `${fileNamePrefix}-${Date.now()}.json`);
}

export function backupToKeyValues(data: BackupData): Record<string, string> {
  const updates: Record<string, string> = {};
  if (data.nodes && Array.isArray(data.nodes)) {
    updates["dawayir-map-nodes"] = JSON.stringify({ nodes: data.nodes });
  }
  if (data.me) {
    updates["dawayir-me"] = JSON.stringify(data.me);
  }
  if (data.journey) {
    updates["dawayir-journey"] = JSON.stringify(data.journey);
  }
  if (data.notification) {
    updates["dawayir-notification-settings"] = JSON.stringify(data.notification);
  }
  return updates;
}

export function buildBackupFromKeyValues(values: Record<string, string>): BackupData {
  const parse = <T>(key: string): T | undefined => {
    try {
      const raw = values[key];
      if (!raw) return undefined;
      return JSON.parse(raw) as T;
    } catch {
      return undefined;
    }
  };

  const map = parse<{ nodes?: unknown[] }>("dawayir-map-nodes");
  const me = parse<BackupData["me"]>("dawayir-me");
  const journey = parse<BackupData["journey"]>("dawayir-journey");
  const notification = parse<BackupData["notification"]>("dawayir-notification-settings");

  return {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    nodes: map?.nodes ?? [],
    ...(me ? { me } : {}),
    ...(journey ? { journey } : {}),
    ...(notification ? { notification } : {})
  };
}

/**
 * حساب حجم البيانات المحفوظة (بالكيلوبايت)
 */
export function getStorageSize(): number {
  let total = 0;
  for (let i = 0; i < getLocalStorageLength(); i += 1) {
    const key = getLocalStorageKey(i);
    if (!key || !key.startsWith("dawayir-")) continue;
    const value = getFromLocalStorage(key);
    if (value != null) {
      total += value.length + key.length;
    }
  }
  return Math.round(total / 1024); // بالكيلوبايت
}

/**
 * حساب عدد العناصر المحفوظة
 */
export async function getStorageStats(): Promise<{
  nodesCount: number;
  hasJourneyData: boolean;
  hasMeData: boolean;
  hasNotificationSettings: boolean;
  totalSizeKB: number;
}> {
  const mapData = await loadStoredState();
  const meData = await getJSON("dawayir-me");
  const journeyData = await getJSON("dawayir-journey");
  const notificationData = await getJSON("dawayir-notification-settings");

  return {
    nodesCount: mapData?.nodes?.length || 0,
    hasJourneyData: !!journeyData,
    hasMeData: !!meData,
    hasNotificationSettings: !!notificationData,
    totalSizeKB: getStorageSize()
  };
}

export async function hasAnyStoredData(): Promise<boolean> {
  const keys: string[] = [];
  for (let i = 0; i < getLocalStorageLength(); i += 1) {
    const key = getLocalStorageKey(i);
    if (key && key.startsWith("dawayir-")) keys.push(key);
  }
  if (keys.length === 0) return false;
  const mapData = await getItem("dawayir-map-nodes");
  return mapData != null;
}
