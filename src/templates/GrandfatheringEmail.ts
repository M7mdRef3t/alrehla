export interface GrandfatheringData {
  userName?: string;
  planName: string;
  oldPrice: number;
  newPrice: number;
}

export function getGrandfatheringEmailHtml(data: GrandfatheringData): string {
  const { userName, planName, oldPrice, newPrice } = data;
  const displayName = userName ? userName : "يا بطل";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث أسعار اشتراكات دواير</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;800&display=swap');
        body {
            margin: 0; padding: 0; background-color: #020408; color: #ffffff;
            font-family: 'Tajawal', Arial, sans-serif; line-height: 1.6;
            -webkit-font-smoothing: antialiased;
        }
        .container {
            max-width: 600px; margin: 40px auto; padding: 40px 30px;
            background-color: #0c1128; border: 1px solid rgba(45,212,191,0.15);
            border-radius: 24px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 26px; font-weight: 800; color: #2dd4bf; letter-spacing: 1px; }

        .hero { text-align: center; margin-bottom: 30px; }
        .hero h1 { font-size: 26px; margin-bottom: 12px; color: #ffffff; }
        .hero p { color: #94a3b8; font-size: 16px; font-weight: 500; }

        .stat-card {
            background: rgba(2,4,8,0.6); border: 1px solid rgba(255,255,255,0.05);
            border-radius: 16px; padding: 20px; margin-bottom: 30px;
        }
        .stat-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .stat-label { color: #94a3b8; font-size: 14px; font-weight: bold; }
        .stat-value { color: #2dd4bf; font-weight: 800; font-size: 16px; }

        .prescription {
            border-right: 4px solid #2dd4bf; padding-right: 16px; margin-bottom: 35px;
            background: linear-gradient(90deg, transparent, rgba(45,212,191,0.03));
            padding-top: 10px; padding-bottom: 10px; border-radius: 8px 0 0 8px;
        }
        .prescription h2 { font-size: 18px; color: #2dd4bf; margin-bottom: 15px; margin-top: 0;}
        .p-block { margin-bottom: 16px; }
        .prescription p { color: #cbd5e1; font-size: 14px; margin: 0; line-height: 1.7; }

        .footer { text-align: center; margin-top: 40px; color: #475569; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 20px; }
        .footer p { margin-bottom: 6px; }

        @media (max-width: 600px) {
            .container { padding: 30px 20px; margin: 0; border-radius: 0; border: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">دواير</div>
        </div>

        <div class="hero">
            <h1>أهلاً بيك يا ${displayName}</h1>
            <p>عندنا أخبار مهمة بخصوص اشتراكك في منصة دواير.</p>
        </div>

        <div class="stat-card">
            <div style="color: #2dd4bf; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">تفاصيل خطتك</div>
            <div class="stat-row">
                <span class="stat-label">الخطة الحالية</span>
                <span class="stat-value">${planName}</span>
            </div>
            <div class="stat-row">
                <span class="stat-label">سعرك القديم (مستمر معاك)</span>
                <span class="stat-value">$${oldPrice}</span>
            </div>
            <div class="stat-row" style="margin-bottom: 0;">
                <span class="stat-label">السعر الجديد (للمشتركين الجدد)</span>
                <span class="stat-value" style="color: #f43f5e;">$${newPrice}</span>
            </div>
        </div>

        <div class="prescription">
            <h2>سعرك مش هيتغير!</h2>
            <div class="p-block">
                <p>بمناسبة تطوير المنصة وتحديث الأسعار للمشتركين الجدد، حابين نطمنك إنك كمشترك حالي <strong>هتفضل تدفع نفس السعر القديم</strong> طالما اشتراكك مستمر وبدون انقطاع.</p>
            </div>
            <div class="p-block">
                <p>ده تقدير مننا لثقتك ودعمك المستمر لدواير. استمر في رحلتك ووعيك معانا بدون أي قلق من زيادة الأسعار.</p>
            </div>
        </div>

        <div class="footer">
            <p>أنت بتستلم الإيميل ده لأنك مشترك في منصة دواير.</p>
            <p>دواير © 2026</p>
        </div>
    </div>
</body>
</html>
  `;
}
