export interface PricingGrandfatheringData {
  userName?: string;
  oldPrice: number;
  newPrice: number;
  currency: string;
}

export function getPricingGrandfatheringHtml(data: PricingGrandfatheringData): string {
  const { userName, oldPrice, newPrice, currency } = data;
  const displayName = userName ? userName : "يا بطل";

  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تحديث أسعار الباقات - أنت في أمان</title>
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
            border-radius: 16px; padding: 20px; margin-bottom: 30px; text-align: center;
        }

        .cta-container { text-align: center; margin-top: 30px; }

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
            <h1>أهلاً بيك يا ${displayName}، أنت من مؤسسي الرحلة!</h1>
            <p>"لأنك كنت معانا من البداية، مكملين بيك وبدعمك، وأسعارك القديمة محفوظة."</p>
        </div>

        <div class="stat-card">
            <p>أطلقنا تحديثات جديدة وأسعار الباقات اتغيرت للعملاء الجدد لـ <strong style="color: #f43f5e;">${newPrice} ${currency}</strong>.</p>
            <p style="color: #2dd4bf; font-weight: bold; font-size: 18px; margin-top: 15px;">لكن لأنك اشتركت معانا قبل التغيير، سعر باقتك هيفضل <span style="text-decoration: underline;">${oldPrice} ${currency}</span> للأبد.</p>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 10px;">(طالما اشتراكك مفعل ولم يتم إلغاؤه)</p>
        </div>

        <div class="cta-container">
            <p>شكراً لثقتك ودعمك المستمر، ومكملين الرحلة مع بعض 🚀</p>
        </div>

        <div class="footer">
            <p>أنت بتستلم الإيميل ده لتنبيهك بتحديث الأسعار وحفظ حقوقك كمشترك قديم.</p>
            <p>دواير © ${new Date().getFullYear()}</p>
        </div>
    </div>
</body>
</html>
  `;
}
