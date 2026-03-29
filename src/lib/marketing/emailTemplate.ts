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
  senderName = "محمد",
  unsubLink,
}: EmailTemplateOptions): string {
  const greeting = name ? `أهلاً ${name}،` : "أهلاً،";
  const unsubHref = unsubLink ?? `https://www.alrehla.app/api/unsubscribe?token={{UNSUB_TOKEN}}`;

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>الرحلة — بداية وعيك</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&display=swap');
  body { margin: 0; padding: 0; background-color: #0d1117; font-family: 'Tajawal', '29LT Bukra', Arial, sans-serif; direction: rtl; }
  * { box-sizing: border-box; }
  a { color: #2dd4bf; }
  .container { max-width: 580px; margin: 0 auto; }
  .btn:hover { opacity: 0.9; }
</style>
</head>
<body style="background-color:#0d1117; margin:0; padding:20px 0;">
<!-- Preview text (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${previewText}</div>

<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#0d1117;">
  <tr>
    <td align="center" style="padding: 32px 16px;">
      <table class="container" width="580" cellpadding="0" cellspacing="0" border="0"
        style="max-width:580px; width:100%; background:#131a2b; border-radius:24px;
               border:1px solid rgba(45,212,191,0.15); overflow:hidden;">

        <!-- Top accent bar -->
        <tr>
          <td style="height:4px; background:linear-gradient(90deg,#2dd4bf,#6366f1,#2dd4bf);"></td>
        </tr>

        <!-- Logo + Header -->
        <tr>
          <td style="padding:40px 40px 24px; text-align:center;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" style="padding-bottom:24px;">
                  <div style="display:inline-block; width:52px; height:52px; border-radius:16px;
                    background:linear-gradient(135deg,#2dd4bf,#10b981);
                    line-height:52px; text-align:center; font-size:24px; font-weight:900; color:#0d1117;">
                    ر
                  </div>
                </td>
              </tr>
              <tr>
                <td style="font-size:28px; font-weight:900; color:#ffffff; text-align:center; line-height:1.2;">
                  بداية الوعي بنفسك
                </td>
              </tr>
              <tr>
                <td style="font-size:14px; color:#94a3b8; text-align:center; padding-top:8px;">
                  رحلتك الأولى نحو وضوح حقيقي
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding: 0 40px;">
            <hr style="border:none; border-top:1px solid rgba(255,255,255,0.06); margin:0;" />
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px 40px;">
            <p style="color:#e2e8f0; font-size:16px; line-height:1.8; margin:0 0 16px;">
              ${greeting}
            </p>
            <p style="color:#94a3b8; font-size:15px; line-height:1.9; margin:0 0 24px;">
              أنا ${senderName} من الرحلة. شكراً لاهتمامك — نحن بنينا شيئاً مختلفاً تماماً.
            </p>

            <!-- Highlight box -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:rgba(45,212,191,0.06); border:1px solid rgba(45,212,191,0.2);
                  border-radius:16px; padding:20px 24px;">
                  <p style="color:#2dd4bf; font-size:14px; font-weight:700; margin:0 0 8px;">
                    🗺️ خريطة علاقاتك الأولى
                  </p>
                  <p style="color:#cbd5e1; font-size:14px; line-height:1.8; margin:0;">
                    في دقيقتين فقط، ستتمكن من رؤية من يسرق طاقتك ومن يمنحها — بوضوح بصري لم تره من قبل.
                  </p>
                </td>
              </tr>
            </table>

            <p style="color:#94a3b8; font-size:14px; line-height:1.9; margin:0 0 32px;">
              اللينك ده خاص بيك، مش مجرد صفحة بداية — هو نقطة الانطلاق المُخصصة لرحلتك.
            </p>

            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center">
                  <a href="${personalLink}" class="btn"
                    style="display:inline-block; background:linear-gradient(135deg,#2dd4bf,#10b981);
                      color:#0d1117; font-size:16px; font-weight:900; text-decoration:none;
                      padding:16px 48px; border-radius:100px;
                      box-shadow:0 8px 24px rgba(45,212,191,0.3);">
                    ابدأ رحلتك الآن ←
                  </a>
                </td>
              </tr>
            </table>

            <p style="color:#475569; font-size:12px; text-align:center; margin:20px 0 0;">
              أو انسخ الرابط: <a href="${personalLink}" style="color:#2dd4bf;">${personalLink}</a>
            </p>
          </td>
        </tr>

        <!-- Features row -->
        <tr>
          <td style="padding:0 40px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="32%" style="text-align:center; padding:16px 8px;
                  background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.04);">
                  <div style="font-size:20px; margin-bottom:6px;">⚡</div>
                  <div style="color:#94a3b8; font-size:11px; font-weight:700;">سرعة فائقة</div>
                </td>
                <td width="4%"></td>
                <td width="32%" style="text-align:center; padding:16px 8px;
                  background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.04);">
                  <div style="font-size:20px; margin-bottom:6px;">🔒</div>
                  <div style="color:#94a3b8; font-size:11px; font-weight:700;">بياناتك آمنة</div>
                </td>
                <td width="4%"></td>
                <td width="32%" style="text-align:center; padding:16px 8px;
                  background:rgba(255,255,255,0.02); border-radius:12px; border:1px solid rgba(255,255,255,0.04);">
                  <div style="font-size:20px; margin-bottom:6px;">🎯</div>
                  <div style="color:#94a3b8; font-size:11px; font-weight:700;">مخصص لك</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:rgba(0,0,0,0.2); padding:24px 40px; text-align:center; border-top:1px solid rgba(255,255,255,0.04);">
            <p style="color:#334155; font-size:11px; margin:0 0 8px;">
              الرحلة — منصة الوعي بالنفس
            </p>
            <p style="color:#1e293b; font-size:11px; margin:0;">
              إذا كنت لا تريد استقبال رسائلنا،
              <a href="${unsubHref}" style="color:#334155;">
                اضغط هنا لإلغاء الاشتراك
              </a>
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
