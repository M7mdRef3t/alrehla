import { readFileSync, writeFileSync } from 'fs';

const file = './app/api/webhooks/stripe/route.ts';
let code = readFileSync(file, 'utf8');

const targetStr = `                    const { data: user } = await supabaseAdmin
                        .from('profiles')
                        .select('email, display_name')
                        .eq('stripe_customer_id', subscription.customer as string)
                        .single();

                    if (user?.email) {
                        const subject = "Action Required: Your Subscription is Past Due";
                        const html = \`<p>Hi \${user.display_name || 'there'},\</p>`;

const replacementStr = `                    const { data: user } = await supabaseAdmin
                        .from('profiles')
                        .select('email, full_name')
                        .eq('stripe_customer_id', subscription.customer as string)
                        .single();

                    if (user?.email) {
                        const subject = "Action Required: Your Subscription is Past Due";
                        const html = \`<p>Hi \${user.full_name || 'there'},\</p>`;

code = code.replace(targetStr, replacementStr);
writeFileSync(file, code);
