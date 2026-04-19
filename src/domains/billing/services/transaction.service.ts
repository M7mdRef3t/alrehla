import { supabase } from "@/services/supabaseClient";
import type { PaymentGateway, PaymentStatus } from "../types";

export interface CreateTransactionParams {
  userId?: string;
  leadId?: string;
  email?: string;
  phone?: string;
  amount: number;
  currency?: string;
  provider: PaymentGateway | string;
  providerReference?: string;
  itemType: "subscription" | "session" | "digital_good";
  itemId?: string;
  metadata?: Record<string, any>;
}

class TransactionService {
  async createTransaction(params: CreateTransactionParams) {
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data, error } = await supabase
      .from("transactions")
      .insert({
        user_id: params.userId,
        lead_id: params.leadId,
        email: params.email,
        phone: params.phone,
        amount: params.amount,
        currency: params.currency || "EGP",
        provider: params.provider,
        provider_reference: params.providerReference,
        item_type: params.itemType,
        item_id: params.itemId,
        status: "pending",
        metadata: params.metadata || {}
      })
      .select()
      .single();

    if (error) {
      console.error("[TransactionService] Failed to create transaction:", error);
      throw error;
    }

    return data;
  }

  async updateTransactionStatus(transactionId: string, status: PaymentStatus | "completed" | "failed" | "refunded", providerReference?: string) {
    if (!supabase) throw new Error("Supabase client not initialized");

    const { data, error } = await supabase
      .from("transactions")
      .update({
        status,
        provider_reference: providerReference,
        updated_at: new Date().toISOString()
      })
      .eq("id", transactionId)
      .select()
      .single();

    if (error) {
      console.error("[TransactionService] Failed to update transaction:", error);
      throw error;
    }

    // If completed, we might want to trigger a profile upgrade here or via webhook/trigger
    return data;
  }

  async getTransaction(id: string) {
    if (!supabase) return null;
    const { data } = await supabase.from("transactions").select("*").eq("id", id).single();
    return data;
  }
}

export const transactionService = new TransactionService();
