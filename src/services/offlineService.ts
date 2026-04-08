import { logger } from "@/services/logger";
/**
 * Offline Service
 * خدمة العمل بدون إنترنت
 */

import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

const CACHE_NAME = "dawayir-cache-v1";
const OFFLINE_DATA_KEY = "dawayir-offline-data";

// URLs to cache
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.ico"
];

interface OfflineData {
  nodes: any[];
  pulses: any[];
  lastSync: number;
  pendingActions: PendingAction[];
}

interface PendingAction {
  id: string;
  type: "create" | "update" | "delete";
  entity: "node" | "pulse" | "note";
  data: any;
  timestamp: number;
}

export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  private constructor() {
    this.setupEventListeners();
  }

  static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  private setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.showNotification("متصل بالإنترنت", "جاري مزامنة البيانات...");
      this.syncData();
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.showNotification("وضع عدم الاتصال", "سيتم حفظ البيانات محلياً");
    });
  }

  private showNotification(title: string, body: string) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  }

  // Check if online
  isOnlineMode(): boolean {
    return this.isOnline;
  }

  // Save data for offline use
  saveOfflineData(data: Partial<OfflineData>) {
    const existing = this.getOfflineData();
    const updated: OfflineData = {
      ...existing,
      ...data,
      lastSync: Date.now()
    };
    setInLocalStorage(OFFLINE_DATA_KEY, JSON.stringify(updated));
  }

  // Get offline data
  getOfflineData(): OfflineData {
    try {
      const data = getFromLocalStorage(OFFLINE_DATA_KEY);
      if (data) {
        return JSON.parse(data) as OfflineData;
      }
    } catch {
      // ignore
    }
    return {
      nodes: [],
      pulses: [],
      lastSync: 0,
      pendingActions: []
    };
  }

  // Queue action for when back online
  queueAction(action: Omit<PendingAction, "id" | "timestamp">) {
    const data = this.getOfflineData();
    const pendingAction: PendingAction = {
      ...action,
      id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    
    data.pendingActions.push(pendingAction);
    this.saveOfflineData(data);
    
    return pendingAction.id;
  }

  // Sync data when back online
  async syncData(): Promise<boolean> {
    if (!this.isOnline || this.syncInProgress) return false;
    
    this.syncInProgress = true;
    const data = this.getOfflineData();
    
    try {
      // Process pending actions
      for (const action of data.pendingActions) {
        await this.processAction(action);
      }
      
      // Clear processed actions
      data.pendingActions = [];
      this.saveOfflineData(data);
      
      this.showNotification("تمت المزامنة", "تم مزامنة جميع البيانات بنجاح");
      return true;
    } catch (error) {
      logger.error("Sync failed:", error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  private async processAction(action: PendingAction): Promise<void> {
    // This would integrate with your actual API
    console.log("Processing action:", action);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Export data
  exportData(format: "json" | "pdf"): string | Blob {
    const data = this.getOfflineData();
    
    if (format === "json") {
      return JSON.stringify(data, null, 2);
    }
    
    // For PDF, return a simple text blob (would need PDF library for real PDF)
    const text = this.formatDataAsText(data);
    return new Blob([text], { type: "text/plain;charset=utf-8" });
  }

  private formatDataAsText(data: OfflineData): string {
    let text = "تقرير بيانات الرحلة\n";
    text += "==================\n\n";
    text += `آخر مزامنة: ${new Date(data.lastSync).toLocaleString("ar-EG")}\n\n`;
    
    text += `العُقد: ${data.nodes.length}\n`;
    text += `النبضات: ${data.pulses.length}\n`;
    text += `الإجراءات المعلقة: ${data.pendingActions.length}\n`;
    
    return text;
  }

  // Download exported data
  downloadExport(format: "json" | "pdf") {
    const data = this.exportData(format);
    const blob = data instanceof Blob ? data : new Blob([data], { type: "application/json" });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dawayir-export-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "txt" : "json"}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Export singleton instance
export const offlineService = OfflineService.getInstance();
