/**
 * Recovery Plan Email Template (Arabic/Egyptian Direct Response)
 * High-fidelity HTML template for the "Al-Dawayir" onboarding experience.
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
  const { userName, relationshipCount, magicLink } = data;
  const displayName = userName ? userName : "يا بطل";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>روشتة وعيك اللحظية</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        body {
            margin: 0; padding: 0; background-color: #020408; color: #ffffff;
            font-family: 'Tajawal', Arial, sans-serif; line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px; margin: 40px auto; padding: 40px 30px;
            background-color: #0c1128; border: 1px solid rgba(201,168,76,0.15);
            border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 26px; font-weight: 800; color: #C9A84C; letter-spacing: 1px; }
        
        .hero { text-align: center; margin-bottom: 30px; }
        .hero h1 { font-size: 26px; margin-bottom: 12px; color: #ffffff; }
        .hero p { color: #94a3b8; font-size: 16px; font-weight: 500; }

        .stat-card {
            background: rgba(2,4,8,0.6); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px; padding: 20px; margin-bottom: 30px;
        }
        .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .stat-label { color: #94a3b8; font-size: 14px; font-weight: bold; }
        .stat-value { color: #C9A84C; font-weight: 800; font-size: 16px; }
        
        .prescription {
            border-right: 4px solid #f43f5e; padding-right: 16px; margin-bottom: 35px;
            background: linear-gradient(90deg, transparent, rgba(244,63,94,0.03));
            padding-top: 10px; padding-bottom: 10px; border-radius: 8px 0 0 8px;
        }
        .prescription h2 { font-size: 18px; color: #f43f5e; margin-bottom: 15px; margin-top: 0;}
        .p-block { margin-bottom: 16px; }
        .p-title { font-weight: 800; display: inline-block; margin-bottom: 4px; }
        .p-red { color: #f43f5e; }
        .p-yellow { color: #f59e0b; }
        .p-green { color: #C9A84C; }
        .prescription p { color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.7; }

        .cta-container { text-align: center; margin-top: 30px; }
        .btn {
            display: inline-block; padding: 18px 40px; background-color: #C9A84C;
            color: #020408; text-decoration: none; border-radius: 16px;
            font-weight: 800; font-size: 16px;
            box-shadow: 0 8px 25px rgba(201,168,76,0.3); transition: all 0.3s; width: 80%; max-width: 300px;
        }
        .btn:hover { background-color: #A8873A; box-shadow: 0 8px 30px rgba(201,168,76,0.4); transform: translateY(-2px); }

        .footer { text-align: center; margin-top: 40px; color: #475569; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; }
        .footer p { margin-bottom: 6px; }

        @media (max-width: 600px) {
            .container { padding: 30px 20px; margin: 0; border-radius: 0; border: none; }
            .btn { width: 100%; padding: 18px 20px; box-sizing: border-box; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🦅 الرحلة</div>
        </div>

        <div class="hero">
            <h1>أهلاً بيك يا ${displayName}، المواجهة بدأت بجد</h1>
            <p>"إنت أخدت الخطوة الأصعب ورسمت الحقيقة. روشتتك هنا، وفيها ناس بتسحبك لتحت من غير ما تحس."</p>
        </div>

        <div class="stat-card">
            <div style="color: #C9A84C; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">مؤشرات الوعي اللحظية</div>
            <div class="stat-row">
                <span class="stat-label">العلاقات على الرادار</span>
                <span class="stat-value">${relationshipCount}</span>
            </div>
            <div class="stat-row" style="margin-bottom: 0;">
                <span class="stat-label">تشخيص الخريطة</span>
                <span class="stat-value" style="color: #f43f5e;">نزيف طاقة قيد الفحص</span>
            </div>
        </div>

        <div class="prescription">
            <h2>روشتة التعافي (تحذيرات هامة)</h2>
            
            <div class="p-block">
                <span class="p-title p-red">🔴 المدار الخارجي (نزيف حرفي):</span>
                <p>الناس اللي هنا عبارة عن "ثقوب سوداء" بتشفط مجهودك. الحل الوحيد: قلل الاحتكاك للصفر أو حط حدود صارمة. مفيش وقت للنزيف ده.</p>
            </div>
            
            <div class="p-block">
                <span class="p-title p-yellow">🟡 المدار الأوسط (مراوغة):</span>
                <p>متقلبين، يوم بيرفعوك وعشرة بيتعبوك. متديش أمان كامل وراقب نمطهم. اديهم مساحتك بس من غير ما تشاركهم تفاصيلك اللي ممكن تضربك بعدين.</p>
            </div>
            
            <div class="p-block" style="margin-bottom: 0;">
                <span class="p-title p-green">🟢 النواة (حصنك الحصين):</span>
                <p>دول الشاحن بتاعك وعمودك الفقري في المعركة اللي جاية. استثمر معاهم عشان تعوض الخسارة اللي بتحصل بره المدار.</p>
            </div>
        </div>

        <div class="cta-container">
            <h3 style="color: #ffffff; font-size: 15px; margin-bottom: 16px;">مستعد تحرر مساحتك؟</h3>
            <a href="${magicLink}" class="btn">افتح خريطتك وابدأ التنفيذ</a>
            <p style="color: #64748b; font-size: 11px; margin-top: 16px; font-weight: bold;">اضغط فوق للدخول الفوري. الرابط مشفر لملاذك الخاص.</p>
        </div>

        <div class="footer">
            <p>أنت بتستلم الإيميل ده لأنك قررت تدور على راحتك وتواجه المشتتات.</p>
            <p>بياناتك أمانة ومشفرة تماماً.</p>
            <p>قتل الدجال بالعلم © 2026</p>
        </div>
    </div>
</body>
</html>
  `;
}
