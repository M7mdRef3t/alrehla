#!/usr/bin/env node
/**
 * دمج develop في main ورفع للنشر (Production على Vercel).
 * يشترط: الفرع الحالي develop وبدون تغييرات غير مُرفوعة.
 */
import { execSync } from "child_process";

function run(cmd, opts = {}) {
  const o = { encoding: "utf8", stdio: "inherit", ...opts };
  return execSync(cmd, o);
}

const branch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf8" }).trim();
if (branch !== "develop") {
  console.error("خطأ: شغّل الأمر من فرع develop (الآن: " + branch + ")");
  process.exit(1);
}

const status = execSync("git status --porcelain", { encoding: "utf8" });
if (status.trim()) {
  console.error("خطأ: فيه تغييرات غير مُرفوعة. اعمل commit و push على develop أولاً.");
  process.exit(1);
}

console.log("جاري دمج develop في main والرفع للنشر...");
run("git pull origin develop");
run("git checkout main");
run("git pull origin main");
run("git merge develop -m 'Merge develop into main (release)'");
run("git push origin main");
run("git checkout develop");
console.log("تم. Vercel هينشر من main تلقائي.");
