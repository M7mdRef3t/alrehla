export interface SessionFollowupData {
  clientName: string;
  summary: string;
  assignment: string;
  followupDate: string;
}

export const getSessionFollowupHtml = (data: SessionFollowupData) => `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; }
        .container { max-width: 600px; margin: 20px auto; background: #fff; padding: 40px; border-radius: 12px; border: 1px solid #eee; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { color: #000; font-size: 24px; font-weight: bold; }
        .section { margin-bottom: 25px; }
        .section-title { font-weight: bold; color: #666; font-size: 14px; text-transform: uppercase; margin-bottom: 8px; }
        .content { font-size: 16px; color: #111; }
        .assignment-box { background: #f0f7ff; border-right: 4px solid #0066ff; padding: 20px; border-radius: 4px; }
        .footer { margin-top: 40px; font-size: 12px; color: #999; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="title">رحلتنا مستمرة يا ${data.clientName} 🧭</div>
        </div>
        
        <div class="section">
            <div class="section-title">خلاصة ما حدث</div>
            <div class="content">${data.summary}</div>
        </div>

        <div class="section">
            <div class="section-title">خطوتك القادمة (الواجب)</div>
            <div class="assignment-box">
                <div class="content">${data.assignment}</div>
            </div>
        </div>

        <div class="section">
            <p>التعافي مش سحر، هو المتابعة الواعية دي. أنا موجود لسه لو احتجت أي حاجة.</p>
        </div>

        <div class="footer">
            عالم الدوائر - رحلتك تبدأ من الداخل
        </div>
    </div>
</body>
</html>
`;
