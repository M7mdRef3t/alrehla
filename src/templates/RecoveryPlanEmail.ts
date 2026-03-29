
/**
 * Recovery Plan Email Template (Arabic/Egyptian)
 * High-fidelity HTML template for the "Al-Dawayir" (Alrehla) onboarding experience.
 */

export interface RecoveryPlanData {
  userName?: string;
  relationshipCount: number;
  redCount: number;
  yellowCount: number;
  greenCount: number;
  magicLink: string;
}

export function getRecoveryPlanHtml(data: RecoveryPlanData): string {
  const { userName, relationshipCount, redCount, magicLink } = data;
  const displayName = userName ? `يا ${userName}` : "يا صديق الرحلة";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>روشتة رحلتك الشخصية</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
        body {
            margin: 0; padding: 0; background-color: #0a0e1f; color: #ffffff;
            font-family: 'Tajawal', Arial, sans-serif; line-height: 1.6;
        }
        .container {
            max-width: 600px; margin: 0 auto; padding: 40px 20px;
            background-color: #0c1128; border: 1px solid rgba(255,255,255,0.08);
            border-radius: 24px;
        }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 24px; font-weight: bold; color: #2dd4bf; letter-spacing: 2px; }
        
        .hero { text-align: center; margin-bottom: 40px; }
        .hero h1 { font-size: 28px; margin-bottom: 16px; color: #ffffff; }
        .hero p { color: #94a3b8; font-size: 16px; }

        .stat-card {
            background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
            border-radius: 20px; padding: 24px; margin-bottom: 32px;
        }
        .stat-row { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .stat-label { color: #94a3b8; font-size: 14px; }
        .stat-value { color: #ffffff; font-weight: bold; font-family: monospace; }
        
        .prescription {
            border-right: 4px solid #2dd4bf; padding-right: 20px; margin-bottom: 40px;
        }
        .prescription h2 { font-size: 18px; color: #2dd4bf; margin-bottom: 12px; }
        .prescription p { color: #cbd5e1; font-size: 15px; margin-bottom: 20px; }

        .cta-container { text-align: center; margin-top: 40px; }
        .btn {
            display: inline-block; padding: 18px 36px; background-color: #2dd4bf;
            color: #0a0e1f; text-decoration: none; border-radius: 16px;
            font-weight: bold; font-size: 18px;
            box-shadow: 0 10px 30px rgba(45,212,191,0.25);
        }

        .footer { text-align: center; margin-top: 60px; color: #475569; font-size: 12px; }
        .footer p { margin-bottom: 8px; }

        @media (max-width: 600px) {
            .container { padding: 30px 15px; border-radius: 0; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">الرحلة . ALREHLA</div>
        </div>

        <div class="hero">
            <h1>أهلاً بك في عالم "الوضوح"</h1>
            <p>"التعافي مش سحر يا ${userName || "بطل"}.. هو إنك بقيت شايف خريطتك بوضوح ومقرر توقف النزيف."</p>
        </div>

        <div class="stat-card">
            <div style="color: #2dd4bf; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px;">تحليل الوعي اللحظي</div>
            <div class="stat-row">
                <span class="stat-label">علاقات تم رصدها</span>
                <span class="stat-value">${relationshipCount}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">تشويش المدارات</span>
                <span class="stat-value" style="color: #fb7185;">محتاج تدخل فوراً</span>
            </div>
        </div>

        <div class="prescription">
            <h2>روشتة "الرحلة" للسيادة النفسية</h2>
            <p><strong>1. "قتل الدجال بالعلم":</strong> أول خطوة هي مواجهة الأوهام. العلاقات اللي حطيتها في المدار الأحمر مش مجرد أشخاص، دي "ثقوب سوداء" بتسحب طاقتك. ابدأ بوضع حدود واضحة (درع الدواير) عشان تحمي مساحتك الشخصية.</p>
            <p><strong>2. المواجهة لا الهروب:</strong> ادخل الملاذ الآمن النهاردة. خريطة وعيك اللي رسمتها هي سلاحك الجديد. ركز في مدارك الأخضر (الناس اللي بتديك طاقة) وحاول تكبره، ده حصنك الحقيقي.</p>
        </div>

        <div class="cta-container">
            <a href="${magicLink}" class="btn">استكمل رحلة السيادة</a>
            <p style="color: #475569; font-size: 11px; margin-top: 24px; line-height: 1.5;">الرابط ده هو مفتاح دخولك الخاص. هيفتح لك "الملاذ الآمن" فوراً عشان تبدأ تنفذ الخطة.</p>
        </div>

        <div class="footer">
            <p>أنت بتستلم الإيميل ده لأنك قررت تبدأ "الرحلة" نحو الحقيقة والوعي.</p>
            <p>بياناتك أمانة، وهي ملكك أنت بس ومشفرة بالكامل.</p>
            <p>© 2026 الرحلة - السيادة النفسية بمبدأ المبادئ الأولى</p>
        </div>
    </div>
</body>
</html>
  `;
}
