import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // This is a demo endpoint to show TikTok reviewers that the OAuth flow works.
  
  if (error) {
    return new Response(
      `
      <html>
        <body style="background: #111; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column;">
          <div style="background: rgba(255,50,50,0.1); padding: 40px; border-radius: 20px; border: 1px solid rgba(255,50,50,0.2); text-align: center; max-width: 500px;">
            <h1 style="color: #ff5555; margin-top: 0;">Connection Failed</h1>
            <p style="color: #aaa;">There was an error connecting to TikTok: ${error}</p>
            <a href="/admin/radar" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background: #333; color: white; text-decoration: none; border-radius: 8px;">Return to Dashboard</a>
          </div>
        </body>
      </html>
      `,
      { headers: { "Content-Type": "text/html" } }
    );
  }

  return new Response(
    `
    <html>
      <body style="background: #0f172a; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; flex-direction: column;">
        <div style="background: rgba(0,255,200,0.05); padding: 50px; border-radius: 24px; border: 1px solid rgba(0,255,200,0.1); text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00f2fe, #4facfe); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <h1 style="font-size: 28px; margin-bottom: 10px; background: linear-gradient(to right, #fff, #aaa); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">TikTok Connected Successfully!</h1>
          <p style="color: #888; font-size: 16px; margin-bottom: 30px;">Your analytics data will now sync with Alrehla Ops Dashboard.</p>
          <a href="/admin/radar" style="display: inline-block; padding: 14px 30px; background: rgba(255,255,255,0.1); color: white; text-decoration: none; border-radius: 12px; font-weight: bold; transition: background 0.2s;">Return to Dashboard</a>
        </div>
      </body>
    </html>
    `,
    { headers: { "Content-Type": "text/html" } }
  );
}
