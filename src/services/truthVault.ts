import { getFromLocalStorage, setInLocalStorage } from "./browserStorage";
import { supabase, safeGetSession } from "./supabaseClient";

/**
 * Vault of Truth — خزنة الحقيقة 🔒
 * ==============================
 * خدمة لإدارة السجلات المصيرية والاكتشافات التي لا تقبل الجدل.
 * يتم تخزينها في Supabase للحفاظ على الحقيقة، والـ LocalStorage للمزامنة اللحظية.
 */

export interface TruthRecord {
    id: string;
    timestamp: number;
    content: string;
    category: "breakthrough" | "shadow_pattern" | "boundary_set";
    priority: number; // 1-10
    encrypted: boolean;
    user_id?: string;
}

const VAULT_STORAGE_KEY = "dawayir-truth-vault";

export class VaultService {
    /**
     * إضافة سجل جديد للخزنة
     */
    static async lockTruth(record: Omit<TruthRecord, "id" | "timestamp">): Promise<TruthRecord> {
        const session = await safeGetSession();
        const records = this.getRecords();
        
        const newRecord: TruthRecord = {
            ...record,
            id: `truth_${Date.now()}`,
            timestamp: Date.now(),
            user_id: session?.user?.id
        };

        // 1. Save Locally for immediate feedback
        records.push(newRecord);
        setInLocalStorage(VAULT_STORAGE_KEY, JSON.stringify(records));

        // 2. Save to Supabase if available
        if (supabase && session?.user?.id) {
            try {
                const { error } = await supabase
                    .from('truth_vault')
                    .insert({
                        id: newRecord.id.replace('truth_', ''), // Use UUID part or just let DB generate
                        user_id: session.user.id,
                        content: newRecord.content,
                        category: newRecord.category,
                        priority: newRecord.priority,
                        is_encrypted: newRecord.encrypted,
                    });
                
                if (error) console.error("❌ Failed to lock truth in cloud:", error);
                else console.info("☁️ Truth synced to Cloud Vault");
            } catch (err) {
                console.error("❌ Cloud Vault Error:", err);
            }
        }

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
     * مزامنة البيانات من السيرفر (Fetch and merge)
     */
    static async syncFromCloud(): Promise<TruthRecord[]> {
        const session = await safeGetSession();
        if (!supabase || !session?.user?.id) return this.getRecords();

        try {
            const { data, error } = await supabase
                .from('truth_vault')
                .select('*')
                .order('created_at', { ascending: true });

            if (error) throw error;

            const cloudRecords: TruthRecord[] = (data || []).map(r => ({
                id: `truth_${r.id}`,
                timestamp: new Date(r.created_at).getTime(),
                content: r.content,
                category: r.category as any,
                priority: r.priority,
                encrypted: r.is_encrypted,
                user_id: r.user_id
            }));

            // Merge with local (Cloud wins on ID conflict)
            const local = this.getRecords();
            const cloudIds = new Set(cloudRecords.map(r => r.id));
            const merged = [
                ...cloudRecords,
                ...local.filter(l => !cloudIds.has(l.id))
            ];

            setInLocalStorage(VAULT_STORAGE_KEY, JSON.stringify(merged));
            return merged;
        } catch (err) {
            console.error("❌ Sync failed:", err);
            return this.getRecords();
        }
    }

    /**
     * مسح سجل معين
     */
    static async wipeTruth(id: string): Promise<boolean> {
        const session = await safeGetSession();
        const records = this.getRecords();
        const filtered = records.filter(r => r.id !== id);
        if (filtered.length === records.length) return false;

        setInLocalStorage(VAULT_STORAGE_KEY, JSON.stringify(filtered));

        if (supabase && session?.user?.id) {
            const dbId = id.replace('truth_', '');
            await supabase.from('truth_vault').delete().eq('id', dbId);
        }

        return true;
    }
}


