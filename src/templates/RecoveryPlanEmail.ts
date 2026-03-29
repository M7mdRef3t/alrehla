
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
            <h1>أهلاً بك في أول خطوة للوضوح</h1>
            <p>"التعافي مش سحر.. هو إنك بقيت شايف خريطتك بوضوح."</p>
        </div>

        <div class="stat-card">
            <div style="color: #2dd4bf; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px;">ملخص الخريطة</div>
            <div class="stat-row">
                <span class="stat-label">علاقات تم رصدها</span>
                <span class="stat-value">${relationshipCount}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">مستوى الوضوح</span>
                <span class="stat-value" style="color: #2dd4bf;">عالٍ جداً</span>
            </div>
        </div>

        <div class="prescription">
            <h2>روشتة "الرحلة" للتعافي</h2>
            <p><strong>1. تفعيل درع الدواير:</strong> رصدت ${redCount} شخص في الدائرة الحمراء. ابدأ بتقليل الاحتكاك العاطفي اليومي معاهم عشان توقف نزيف طاقتك.</p>
            <p><strong>2. ركن التفريغ:</strong> ادخل الملاذ الآمن النهاردة وطلع المشاعر اللي حبستها وأنت بترسم الخريطة.. الورقة والقلم (أو شاشة التليفون) مش بيحكموا عليك.</p>
        </div>

        <div class="cta-container">
            <a href="${magicLink}" class="btn">اكمل رحلتك من هنا</a>
            <p style="color: #475569; font-size: 11px; margin-top: 20px;">الرابط ده هينقلك مباشرة لملفك الشخصي بدون باسوورد.</p>
        </div>

        <div class="footer">
            <p>أنت تتلقى هذا الإيميل لأنك بدأت رحلة الوعي في منصة الرحلة.</p>
            <p>بياناتك مشفرة ومحمية تماماً ولا يطلع عليها أحد.</p>
            <p>© 2026 الرحلة - منصة التعافي الوجداني</p>
        </div>
    </div>
</body>
</html>
  `;
}
