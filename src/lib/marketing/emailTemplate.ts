/**
 * Premium Arabic HTML email template for Alrehla marketing outreach.
 * RTL layout, dark and light email-client compatible.
 * Usage: buildMarketingEmail({ name, personalLink, previewText })
 */

interface EmailTemplateOptions {
  name?: string;
  personalLink: string;
  previewText?: string;
  senderName?: string;
  unsubLink?: string;
}

export function buildMarketingEmail({
  name,
  personalLink,
  previewText = "خريطة علاقاتك جاهزة — ابدأ الرحلة الآن",
  senderName = "فريق عمل",
  unsubLink,
}: EmailTemplateOptions): string {
  const greeting = name ? `أهلاً ${name} 🌙،` : "أهلاً بك 🌙،";
  const unsubHref = unsubLink ?? `https://www.alrehla.app/api/unsubscribe?token={{UNSUB_TOKEN}}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>الرحلة — بداية وعيك الحقيقي</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
  body { margin: 0; padding: 0; background-color: #020617; font-family: 'Tajawal', Arial, sans-serif; direction: rtl; color: #f8fafc; }
  * { box-sizing: border-box; }
  .container { max-width: 600px; margin: 0 auto; }
</style>
</head>
<body style="background-color:#020617; margin:0; padding:40px 0;">
<!-- Preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#020617;">
  <tr>
    <td align="center" style="padding: 20px;">
      
      <!-- Glass Card -->
      <table class="container" width="600" cellpadding="0" cellspacing="0" border="0"
        style="background: #0f172a; border-radius: 32px; 
               border: 1px solid rgba(45,212,191,0.2); 
               box-shadow: 0 40px 100px -20px rgba(45,212,191,0.15); 
               overflow: hidden;">

        <!-- Header Pulse -->
        <tr>
          <td style="padding: 60px 40px 30px; text-align: center;">
             <!-- Logo pulsing effect icon -->
             <div style="display: inline-block; width: 64px; height: 64px; background: linear-gradient(135deg, #2dd4bf, #10b981); border-radius: 20px; box-shadow: 0 0 30px rgba(45,212,191,0.5); line-height: 64px; color: #020617; font-size: 32px; font-weight: 900; margin-bottom: 30px;">
               ر
             </div>
             <h1 style="color: #ffffff; font-size: 32px; font-weight: 950; margin: 0; line-height: 1.2; letter-spacing: -0.5px;">
               ${greeting} الرحلة مستنياك 🗺️
             </h1>
             <p style="color: #94a3b8; font-size: 16px; margin: 15px 0 0; font-weight: 500;">
                خريطة وعيك بتبدأ من هنا — في دقيقتين بس
             </p>
          </td>
        </tr>

        <!-- Main Body -->
        <tr>
          <td style="padding: 0 50px 40px;">
            <div style="background: rgba(255,255,255,0.03); border-radius: 24px; padding: 35px; border: 1px solid rgba(255,255,255,0.05);">
              <p style="color: #cbd5e1; font-size: 16px; line-height: 1.9; margin: 0 0 25px;">
                يا ${name || 'بطل'}، إحنا فريق عمل المنصة. شوفنا إنك كنت عايز تبدأ رحلة اكتشاف علاقاتك بس لسه مخلصتش الخريطة.
              </p>
              
              <!-- Reward Card -->
              <div style="background: linear-gradient(135deg, rgba(250,204,21,0.1), rgba(45,212,191,0.05)); border: 1px solid rgba(250,204,21,0.2); border-radius: 20px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <p style="color: #facc15; font-weight: 900; font-size: 14px; margin: 0 0 10px; text-transform: uppercase; letter-spacing: 1px;">
                  🎁 مكافأة البداية
                </p>
                <div style="color: #ffffff; font-size: 18px; font-weight: 800; line-height: 1.5;">
                  أكمل خريطة علاقاتك الآن واكسب <span style="color: #facc15; font-size: 22px;">50</span> <br/>
                  <span style="color: #2dd4bf; text-shadow: 0 0 10px rgba(45,212,191,0.3);">نقطة وعي (Awareness Points)</span>
                </div>
                <p style="color: #94a3b8; font-size: 12px; margin: 10px 0 0;">
                  تضاف لرصيدك فوراً عند تسجيل الدخول ✦
                </p>
              </div>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <a href="${personalLink}" 
                      style="display: inline-block; background: linear-gradient(135deg, #2dd4bf, #0d9488); 
                             color: #ffffff; text-decoration: none; padding: 22px 55px; border-radius: 20px; 
                             font-size: 18px; font-weight: 900; box-shadow: 0 15px 35px rgba(45,212,191,0.4); 
                             transition: all 0.3s ease;">
                      اكتمل الآن 🛡️
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="text-align: center; color: #475569; font-size: 12px; margin: 25px 0 0;">
                أو تابع عبر الرابط: <a href="${personalLink}" style="color: #2dd4bf; text-decoration: underline;">${personalLink}</a>
              </p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding: 20px 40px 50px; text-align: center; border-top: 1px solid rgba(255,255,255,0.03); background: rgba(0,0,0,0.1);">
            <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 15px;">
              فريق عمل المنصة مستني يشوف خريطة وعيك تكتمل. إحنا هنا لمساعدتك في أي وقت.
            </p>
            <p style="color: #475569; font-size: 11px; margin: 0;">
              إذا أردت الرحيل من هذه الدائرة، <a href="${unsubHref}" style="color: #64748b;">اضغط هنا لإلغاء الاشتراك</a>
            </p>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

</body>
</html>`;
}

