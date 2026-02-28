import { readFileSync, writeFileSync } from 'fs';

const file = './app/api/webhooks/stripe/route.ts';
let code = readFileSync(file, 'utf8');

if (!code.includes("import { sendEmail }")) {
    code = code.replace(
        `import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';`,
        `import { getSupabaseAdminClient } from '../../_lib/supabaseAdmin';\nimport { sendEmail } from '../../../../../server/lib/email';`
    );
}

const targetStr = `                // If past_due, we could trigger an email via Resend here.
                if (subscription.status === 'past_due') {
                    console.log(\`Subscription for customer \${subscription.customer} is past due! Grace period activated.\`);
                    // TODO: Trigger email
                }`;

const replacementStr = `                // If past_due, trigger an email via Resend
                if (subscription.status === 'past_due') {
                    console.log(\`Subscription for customer \${subscription.customer} is past due! Grace period activated.\`);
                    const { data: user } = await supabaseAdmin
                        .from('profiles')
                        .select('email, display_name')
                        .eq('stripe_customer_id', subscription.customer as string)
                        .single();

                    if (user?.email) {
                        const subject = "Action Required: Your Subscription is Past Due";
                        const html = \`<p>Hi \${user.display_name || 'there'},</p>
                        <p>We noticed that your recent payment could not be processed, and your subscription is now <strong>past due</strong>.</p>
                        <p>Please update your payment method to ensure uninterrupted access to your premium features.</p>
                        <br/>
                        <p>Best,<br/>The Dawayir Team</p>\`;
                        await sendEmail(user.email, subject, html);
                    }
                }`;

code = code.replace(targetStr, replacementStr);
writeFileSync(file, code);
