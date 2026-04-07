const fs = require('fs');
const file = 'src/services/resonanceMonitor.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
`        const pairingPromises = pioneers.map(async (pioneer) => {
            const { data: partner } = await supabase!
                .rpc('find_resonance_partner', { p_user_id: pioneer.id });
            return { pioneerId: pioneer.id, partner: partner && partner.length > 0 ? partner[0] : null };
        });`,
`        const pairingPromises = pioneers.map(async (pioneer) => {
            if (!supabase) return { pioneerId: pioneer.id, partner: null };
            const { data: partner } = await supabase
                .rpc('find_resonance_partner', { p_user_id: pioneer.id });
            return { pioneerId: pioneer.id, partner: partner && partner.length > 0 ? partner[0] : null };
        });`
);

fs.writeFileSync(file, code);
