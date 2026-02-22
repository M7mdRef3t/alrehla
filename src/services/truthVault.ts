import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";

/**
 * Vault of Truth — خزنة الحقيقة 🔒
 * ==============================
 * خدمة لإدارة السجلات المصيرية والاكتشافات التي لا تقبل الجدل.
 * يتم تخزينها بشكل مشفر (أو محاكاة التشفير محلياً حالياً).
 */

export interface TruthRecord {
    id: string;
    timestamp: number;
    content: string;
    category: "breakthrough" | "shadow_pattern" | "boundary_set";
    priority: number; // 1-10
    encrypted: boolean;
}

const VAULT_STORAGE_KEY = "dawayir-truth-vault";

export class VaultService {
    /**
     * إضافة سجل جديد للخزنة
     */
    static async lockTruth(record: Omit<TruthRecord, "id" | "timestamp">): Promise<TruthRecord> {
        const records = this.getRecords();
        const newRecord: TruthRecord = {
            ...record,
            id: `truth_${Date.now()}`,
            timestamp: Date.now(),
        };

        records.push(newRecord);
        setInLocalStorage(VAULT_STORAGE_KEY, JSON.stringify(records));

        console.warn("🔒 Truth Locked in Vault:", newRecord.id);
        return newRecord;
    }

    /**
     * استرجاع كافة السجلات
     */
    static getRecords(): TruthRecord[] {
        const raw = getFromLocalStorage(VAULT_STORAGE_KEY);
        if (!raw) return [];
        try {
            return JSON.parse(raw) as TruthRecord[];
        } catch {
            return [];
        }
    }

    /**
     * مسح سجل معين (يتطلب تأكيد عالٍ تكتيكياً)
     */
    static async wipeTruth(id: string): Promise<boolean> {
        const records = this.getRecords();
        const filtered = records.filter(r => r.id !== id);
        if (filtered.length === records.length) return false;

        setInLocalStorage(VAULT_STORAGE_KEY, JSON.stringify(filtered));
        return true;
    }
}

