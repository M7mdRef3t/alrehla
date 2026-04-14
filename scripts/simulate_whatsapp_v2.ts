import { whatsappAutomationService } from '../src/services/whatsappAutomationService';
import fs from 'node:fs';
import path from 'node:path';

// Manual environment variable loading for standalone script execution
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      process.env[key] = value;
    }
  });
}

async function runSimulation() {
  console.log('🚀 Starting WhatsApp V2 Simulation...');
  
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing Supabase credentials in .env.local');
    console.log('Needed: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  // Ensure they are available where the service expects them
  process.env.SUPABASE_URL = supabaseUrl;
  process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey;


  const testPayload = {
    from: '201023050092',
    name: 'Mohamed Simulation',
    text: 'بكام الاشتراك في رحلتي؟ عايز تفاصيل الدفع',
    timestamp: new Date().getTime().toString(),
    messageId: `sim_${Date.now()}`,
    gateway: 'meta' as const
  };

  try {
    console.log('📡 Sending simulation payload to whatsappAutomationService...');
    const result = await whatsappAutomationService.processInboundMessage(testPayload);
    
    console.log('✅ Simulation Result:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('🎉 SUCCESS: Message processed!');
      console.log(`📍 Lead ID: ${result.leadId}`);
      console.log(`🎯 Intent Detected: ${result.intent}`);
      
      console.log('\n🔍 NEXT STEP: Check the "whatsapp_message_events" table in Supabase to confirm column alignment.');
    } else {
      console.error('❌ Simulation failed:', result.error);
    }
  } catch (err) {
    console.error('💥 Fatal error in simulation:', err);
  }
}

runSimulation();
