import { supabase } from './supabaseClient';

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
    if (!accessToken) {
      console.error('[MetaLeadsService] Missing META_PAGE_ACCESS_TOKEN');
      return null;
    }

    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${leadId}?access_token=${accessToken}`
      );
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[MetaLeadsService] Error fetching lead details:', error);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[MetaLeadsService] Network error fetching lead details:', error);
      return null;
    }
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
      source_type: 'meta_instant_form',
      source_name: metaData.platform || 'facebook',
      campaign_id: metaData.campaign_id,
      campaign_name: metaData.campaign_name,
      ad_id: metaData.ad_id,
      ad_name: metaData.ad_name,
      form_id: metaData.form_id,
      status: 'new',
      metadata: {
        meta_lead_id: leadId,
        form_name: metaData.form_name,
        is_organic: metaData.is_organic,
        raw_fields: fields
      }
    };

    try {
      const client = supabase;
      if (!client) {
        console.error('[MetaLeadsService] Supabase client not initialized');
        return { success: false, error: 'Supabase client not initialized' };
      }
      const { data, error } = await client
        .from('marketing_leads')
        .upsert(leadRecord, { onConflict: 'email' })
        .select();

      if (error) {
        console.error('[MetaLeadsService] Error storing lead:', error);
        return { success: false, error };
      }

      console.log('[MetaLeadsService] Lead stored successfully:', email);
      return { success: true, data };
    } catch (error) {
      console.error('[MetaLeadsService] Exception storing lead:', error);
      return { success: false, error };
    }
  }
};
