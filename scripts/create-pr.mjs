import https from 'https';

// --- إعدادات الـ Pull Request ---
const REPO_OWNER = 'M7mdRef3t';
const REPO_NAME = 'alrehla';
const BASE_BRANCH = 'main';
const HEAD_BRANCH = 'release/v2-hardening';

const PR_TITLE = '🚀 دمج تحديثات الهيكلة وموديول Meta WhatsApp';
const PR_BODY = `
## التحديثات في هذا الدمج
- استقرار هيكلة المنصة ونقل الملفات داخل مجلدات \`src/modules\`.
- دمج وإضافة التكامل مع Meta WhatsApp للرسائل والمنصة.
- إصلاحات متنوعة في قاعدة بيانات Supabase.

> [!NOTE] 
> يرجى مراجعة حالة فحص الـ (validate) إذا لزم الأمر قبل إتمام الدمج.
`;

// لازم يكون عندك مفتاح (Personal Access Token) من جيت هب
// ممكن تمرره كده: GITHUB_TOKEN=your_token node scripts/create-pr.mjs
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

if (!GITHUB_TOKEN) {
  console.error('❌ خطأ: لم يتم العثور على GITHUB_TOKEN. يرجى تمريره لتشغيل السكربت.');
  console.log('📌 لتشغيل السكربت:');
  console.log('GITHUB_TOKEN="your_token_here" node scripts/create-pr.mjs');
  console.log('\n🌐 أو ببساطة اعمل الـ PR من المتصفح عبر هذا الرابط:');
  console.log(`https://github.com/${REPO_OWNER}/${REPO_NAME}/compare/${BASE_BRANCH}...${HEAD_BRANCH}`);
  process.exit(1);
}

const data = JSON.stringify({
  title: PR_TITLE,
  body: PR_BODY,
  head: HEAD_BRANCH,
  base: BASE_BRANCH
});

const options = {
  hostname: 'api.github.com',
  path: `/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
  method: 'POST',
  headers: {
    'User-Agent': 'Node.js Script',
    'Authorization': `token ${GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

console.log('🔄 جاري إنشاء الـ Pull Request...');

const req = https.request(options, (res) => {
  let responseBody = '';

  res.on('data', (chunk) => {
    responseBody += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 201) {
      const prData = JSON.parse(responseBody);
      console.log('✅ تم إنشاء الـ Pull Request بنجاح!');
      console.log(`🔗 رابط الـ PR: ${prData.html_url}`);
    } else {
      console.error(`❌ حدث خطأ! (Status: ${res.statusCode})`);
      const errorData = JSON.parse(responseBody);
      console.error(errorData.message || responseBody);
      if (errorData.errors) {
         console.error(errorData.errors);
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ خطأ في الاتصال:', error.message);
});

req.write(data);
req.end();
