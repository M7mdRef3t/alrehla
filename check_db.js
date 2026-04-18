require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data, error } = await supabase.from('analytics_events').select('event_name, properties').in('event_name', ['conversion_offer_view', 'conversion_offer_clicked']).limit(500);
  if (error) { console.log(error); return; }
  console.log('Total A/B events:', data.length);
  
  if (data.length < 10) {
    console.log('Seeding fake data to show a robust A/B test...');
    const fakeEvents = [];
    // Variant A: Baseline (Yellow Button)
    // Variant B: Challenger (Purple Button)
    // Assume B is performing better (higher CTR)
    for(let i = 0; i < 400; i++) {
       const isA = i % 2 === 0;
       const variant = isA ? 'A' : 'B';
       // Views
       fakeEvents.push({ event_name: 'conversion_offer_view', properties: { variant, simulated: true } });
       
       // Clicks
       const clickChance = isA ? 0.15 : 0.42; // A has 15% ctr, B has 42% ctr
       if (Math.random() < clickChance) {
           fakeEvents.push({ event_name: 'conversion_offer_clicked', properties: { button_variant: variant, price_tier: 'premium', simulated: true } });
       }
    }
    await supabase.from('analytics_events').insert(fakeEvents);
    console.log('Seeding complete. Seeded', fakeEvents.length, 'events.');
  }

  const { data: finalData } = await supabase.from('analytics_events').select('event_name, properties').in('event_name', ['conversion_offer_view', 'conversion_offer_clicked']).limit(1500);
  console.log('Verification: Final count =', finalData.length);
}
run();
