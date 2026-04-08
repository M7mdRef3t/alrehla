import { logger } from "@/services/logger";
import { supabase, supabaseAdmin } from './supabaseClient';

export interface MetaLeadData {
  id: string;
  created_time: string;
  ad_id: string;
  ad_name: string;
  adset_id: string;
  adset_name: string;
  campaign_id: string;
  campaign_name: string;
  form_id: string;
  form_name: string;
  is_organic: boolean;
  platform: string;
  field_data: Array<{
    name: string;
    values: string[];
  }>;
}

export const metaLeadsService = {
  /**
   * Fetches full lead details from Meta Graph API using the leadgen_id
   */
  async fetchLeadDetails(leadId: string): Promise<MetaLeadData | null> {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;

    // Handle simulation/test lead IDs
    if (leadId === 'test_lead_id_123') {
      console.log('[MetaLeadsService] Simulation ID detected, returning mock lead data');
      return {
        id: 'test_lead_id_123',
        created_time: new Date().toISOString(),
        ad_id: 'test_ad_id',
        ad_name: 'Test Advertisement',
        adset_id: 'test_adset_id',
        adset_name: 'Test Ad Set',
        campaign_id: 'test_campaign_id',
        campaign_name: 'Simulation Campaign',
        form_id: 'test_form_id',
        form_name: 'Test Instant Form',
        is_organic: false,
        platform: 'fb',
        field_data: [
          { name: 'email', values: ['test_lead@example.com'] },
          { name: 'full_name', values: ['Test Lead Simulation'] },
          { name: 'phone_number', values: ['+201111111111'] }
        ]
      };
    }

    if (!accessToken) {
      logger.error('[MetaLeadsService] Missing META_PAGE_ACCESS_TOKEN');
      return null;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${leadId}?access_token=${accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        logger.error('[MetaLeadsService] Error fetching lead details:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      logger.error('[MetaLeadsService] Network error fetching lead details:', error);
      return null;
    }
  },

  /**
   * Performs diagnostic API calls to Meta Graph API to "warm up" the connection.
   * This is required by Meta (1-call minimum) to move from "Standard" to "Advanced" access.
   */
  async warmUpMetaApi() {
    const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
    if (!accessToken) {
      return { success: false, error: 'Missing META_PAGE_ACCESS_TOKEN' };
    }

    const results: Record<string, any> = {};
    const endpoints = [
      { id: 'profile', url: 'https://graph.facebook.com/v19.0/me?fields=id,name,category' },
      { id: 'ads_access', url: 'https://graph.facebook.com/v19.0/me/adaccounts?fields=id,name,account_status' },
      { id: 'leads_access', url: 'https://graph.facebook.com/v19.0/me/leadgen_forms?limit=1' },
      { id: 'insights_access', url: 'https://graph.facebook.com/v19.0/me/insights?metric=page_impressions&period=day' },
      { id: 'business_access', url: 'https://graph.facebook.com/v19.0/me/businesses' }
    ];

    for (const endpoint of endpoints) {
      try {
        console.log(`[MetaLeadsService] Warming up ${endpoint.id}...`);
        const response = await fetch(`${endpoint.url}&access_token=${accessToken}`);
        const data = await response.json();
        
        if (response.ok) {
          results[endpoint.id] = { status: 'success', data: data.data || data };
        } else {
          results[endpoint.id] = { status: 'failed', error: data.error?.message || 'API error' };
        }
      } catch (error: any) {
        results[endpoint.id] = { status: 'error', error: error.message };
      }
    }

    return { success: true, results };
  },

  /**
   * Maps Meta lead data to the Alrehla marketing_leads schema and saves it
   */
  async processAndStoreLead(metaData: MetaLeadData) {
    // Map field_data to a flat object
    const fields: Record<string, string> = {};
    metaData.field_data.forEach(field => {
      fields[field.name] = field.values[0];
    });

    const leadId = metaData.id;
    const email = fields.email || '';
    const name = fields.full_name || fields.first_name || '';
    const phone = fields.phone_number || '';

    const leadRecord = {
      email,
      name,
      phone,
      source: metaData.platform || 'facebook',
      source_type: 'meta_instant_form',
      campaign: metaData.campaign_name,
      adset: metaData.adset_name,
      ad: metaData.ad_name,
      status: 'new',
      metadata: {
        meta_lead_id: leadId,
        form_id: metaData.form_id,
        form_name: metaData.form_name,
        campaign_id: metaData.campaign_id,
        adset_id: metaData.adset_id,
        ad_id: metaData.ad_id,
        is_organic: metaData.is_organic,
        raw_fields: fields
      }
    };

    try {
      const isAdminAvailable = !!supabaseAdmin;
      const client = supabaseAdmin || supabase;
      
      console.log(`[MetaLeadsService] Attempting to store lead. Admin Client: ${isAdminAvailable}, Email: ${email}`);
      
      if (!client) {
        logger.error('[MetaLeadsService] Supabase client not initialized');
        return { success: false, error: 'Supabase client not initialized' };
      }

      const { data, error } = await client
        .from('marketing_leads')
        .upsert(leadRecord, { onConflict: 'email' })
        .select();

      if (error) {
        logger.error('[MetaLeadsService] Supabase Error details:', error);
        return { success: false, error: error.message || 'Database error' };
      }

      console.log('[MetaLeadsService] Lead stored successfully:', email);
      return { success: true, data };
    } catch (error: any) {
      logger.error('[MetaLeadsService] Exception storing lead:', error);
      return { success: false, error: error.message || 'Unknown exception' };
    }
  }
};
