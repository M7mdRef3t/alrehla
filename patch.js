const fs = require('fs');

const content = fs.readFileSync('src/components/app-shell/AppRuntimeControllers.tsx', 'utf-8');

const target = `      for (const sessionId of alerts.newVisitors.sessionIds) {
        await sendOwnerNotification(
          "زائر جديد دخل المنصة",
          \`Session: \${sessionId.slice(0, 14)}…\`,
          \`owner-visitor-\${sessionId}\`
        );
      }

      for (const sessionId of alerts.logins.sessionIds) {
        await sendOwnerNotification(
          "زائر أكمل تسجيل الدخول",
          \`Session: \${sessionId.slice(0, 14)}…\`,
          \`owner-login-\${sessionId}\`
        );
      }

      for (const sessionId of alerts.installs.sessionIds) {
        await sendOwnerNotification(
          "زائر ثبّت التطبيق",
          \`Session: \${sessionId.slice(0, 14)}…\`,
          \`owner-install-\${sessionId}\`
        );
      }`;

const replacement = `      await Promise.all([
        ...alerts.newVisitors.sessionIds.map(sessionId =>
          sendOwnerNotification(
            "زائر جديد دخل المنصة",
            \`Session: \${sessionId.slice(0, 14)}…\`,
            \`owner-visitor-\${sessionId}\`
          )
        ),
        ...alerts.logins.sessionIds.map(sessionId =>
          sendOwnerNotification(
            "زائر أكمل تسجيل الدخول",
            \`Session: \${sessionId.slice(0, 14)}…\`,
            \`owner-login-\${sessionId}\`
          )
        ),
        ...alerts.installs.sessionIds.map(sessionId =>
          sendOwnerNotification(
            "زائر ثبّت التطبيق",
            \`Session: \${sessionId.slice(0, 14)}…\`,
            \`owner-install-\${sessionId}\`
          )
        )
      ]);`;

if (content.includes(target)) {
  const patched = content.replace(target, replacement);
  fs.writeFileSync('src/components/app-shell/AppRuntimeControllers.tsx', patched);
  console.log("Patched successfully!");
} else {
  console.log("Could not find target string.");
}
