import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config({ path: '.env.local' });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('❌ TELEGRAM_BOT_TOKEN مش موجودة في .env.local');
    process.exit(1);
  }

  rl.question('🌐 إيه هو الدومين بتاعك؟ (مثال: https://alrehla.app أو NGROK URL لو بتجرب):\n> ', async (domain) => {
    if (!domain || !domain.startsWith('http')) {
      console.error('❌ لازم تحط لينك كامل بيبدأ بـ https://');
      process.exit(1);
    }

    const cleanDomain = domain.endsWith('/') ? domain.slice(0, -1) : domain;
    const webhookUrl = \`\${cleanDomain}/api/webhooks/telegram\`;

    console.log(\`\n⏳ بنحاول نربط البوت بالـ Webhook ده: \${webhookUrl} ...\`);

    try {
      const response = await fetch(\`https://api.telegram.org/bot\${token}/setWebhook\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          drop_pending_updates: true // عشان لو في رسايل قديمة متراكمة متعملش قلق
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        console.log('✅ تم بنجاح! تليجرام دلوقتي هيبعت أي رسالة للـ Webhook ده مباشرة.');
      } else {
        console.error('❌ فشل الربط:', data.description);
      }
    } catch (error) {
      console.error('❌ حصلت مشكلة في الاتصال بـ API تليجرام:', error.message);
    }

    rl.close();
  });
}

main();
