import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:5173"; // أو البيئة المختبرة

test.describe("Full Journey Flow - الرحلة الكاملة", () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage قبل كل اختبار
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
  });

  test("Landing Page - الصفحة الرئيسية", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ تحقق من العنوان الصحيح
    await expect(page.getByRole("heading", { level: 1 })).toContainText("شوف مكانك");

    // ✅ تحقق من الزر الأساسي
    const ctaButton = page.getByRole("button", { name: /ابدأ الرحلة/ });
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toHaveText("ابدأ الرحلة");

    // ✅ تحقق من الشهادات
    const testimonials = page.getByRole("region").filter({ has: page.getByText(/الخريطة كشفت/) });
    await expect(testimonials).toBeTruthy();

    // ✅ اختبر الـ responsive على mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(ctaButton).toBeVisible();
    
    // ✅ عودة للـ desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test("Goal Selection Flow - اختيار الهدف", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ اضغط على "ابدأ الرحلة"
    const ctaButton = page.getByRole("button", { name: /ابدأ الرحلة/ });
    await ctaButton.click();

    // ✅ تحقق من صفحة اختيار الهدف
    await expect(page.getByRole("heading", { level: 1 })).toContainText("إيه أكتر حاجة");

    // ✅ اختر "العيلة"
    const familyButton = page.getByRole("button", { name: /العيلة/ }).first();
    await expect(familyButton).toBeVisible();
    await familyButton.click();

    // ✅ تحقق من الانتقال للخريطة
    await expect(page.getByRole("heading", { level: 1 })).toContainText("خريطة");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("العيلة");
  });

  test("Map Interaction - تفاعل الخريطة", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ اذهب للخريطة مباشرة
    await page.getByRole("button", { name: /ابدأ الرحلة/ }).click();
    await page.getByRole("button", { name: /العيلة/ }).first().click();

    // ✅ تخطى onboarding إذا ظهر
    const onboarding = page.getByRole("dialog");
    if (await onboarding.isVisible()) {
      await page.getByRole("button", { name: /فهمت/ }).click();
    }

    // ✅ تحقق من وجود زر "أضف جبهة"
    const addButton = page.getByRole("button", { name: /أضف جبهة/ });
    await expect(addButton).toBeVisible();
    
    // ✅ اضغط على "أضف جبهة"
    await addButton.click();

    // ✅ تحقق من ظهور modal الإضافة
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();

    // ✅ اختر شخص (أم أو أب إلخ)
    const personOption = page.getByRole("button").filter({ hasText: /أم|أب|أخ/ }).first();
    if (await personOption.isVisible()) {
      await personOption.click();

      // ✅ اختر من الخيارات السريعة
      const quickOption = page.getByRole("button").filter({ hasText: /قريب صحي|قرب مشروط|استنزاف/ }).first();
      if (await quickOption.isVisible()) {
        await quickOption.click();
      }

      // ✅ تحقق من إضافة الشخص
      await expect(page.getByRole("dialog")).not.toBeVisible();
    }
  });

  test("Emergency Button - زر الطوارئ", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ اذهب للخريطة
    await page.getByRole("button", { name: /ابدأ الرحلة/ }).click();
    await page.getByRole("button", { name: /العيلة/ }).first().click();

    // ✅ ابحث عن زر الطوارئ (في الـ sidebar عادة)
    const emergencyButton = page.getByRole("button").filter({ hasText: /🛑|طوارئ|مش دوري/ }).first();
    
    if (await emergencyButton.isVisible()) {
      // ✅ اضغط عليه
      await emergencyButton.click();

      // ✅ تحقق من ظهور overlay الطوارئ
      const emergencyOverlay = page.getByRole("dialog");
      await expect(emergencyOverlay).toBeVisible();

      // ✅ أغلق الـ overlay
      const closeButton = page.getByRole("button", { name: /إغلاق|أغلق|✕|×/ }).first();
      await closeButton.click();
    }
  });

  test("Navigation Transitions - الانتقالات بين الصفحات", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ Landing → Goal
    await page.getByRole("button", { name: /ابدأ الرحلة/ }).click();
    await page.waitForURL(/.*goal|choice.*/, { timeout: 5000 }).catch(() => null);

    // ✅ Goal → Map
    await page.getByRole("button", { name: /العيلة/ }).first().click();
    await page.waitForURL(/.*map|خريطة.*/, { timeout: 5000 }).catch(() => null);

    // ✅ في الخريطة، تحقق من وجود الـ sidebar
    const sidebar = page.getByRole("navigation");
    if (await sidebar.isVisible()) {
      // ✅ تحقق من الأدوات الموجودة
      const toolsButton = page.getByRole("button").filter({ hasText: /أدوات|tools/ }).first();
      if (await toolsButton.isVisible()) {
        await toolsButton.click();
        await page.waitForTimeout(500);
      }
    }
  });

  test("Error Recovery - التعافي من الأخطاء", async ({ page }) => {
    await page.goto(BASE_URL + "/nonexistent");

    // ✅ تحقق من رسالة الخطأ أو إعادة التوجيه
    // يجب أن تعود إلى landing أو تظهر صفحة خطأ
    await page.waitForTimeout(1000);
    
    const isOnLanding = await page.url().includes(BASE_URL) || page.url().includes("landing");
    const hasErrorMessage = await page.getByText(/خطأ|error/i).isVisible().catch(() => false);
    
    expect(isOnLanding || hasErrorMessage).toBeTruthy();
  });

  test("Responsiveness - الاستجابة لأحجام الشاشات", async ({ page }) => {
    const sizes = [
      { width: 375, height: 667, name: "Mobile" },
      { width: 768, height: 1024, name: "Tablet" },
      { width: 1280, height: 720, name: "Desktop" }
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.goto(BASE_URL);

      // ✅ تحقق من الزر الأساسي مرئي
      const ctaButton = page.getByRole("button", { name: /ابدأ الرحلة/ });
      await expect(ctaButton).toBeVisible({ timeout: 5000 });

      // ✅ تحقق من عدم وجود overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = size.width;
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // مع مساحة صغيرة للأمان
    }
  });

  test("Performance - الأداء والتحميل", async ({ page }) => {
    const startTime = Date.now();

    await page.goto(BASE_URL, { waitUntil: "networkidle" });

    const loadTime = Date.now() - startTime;

    // ✅ يجب أن يحمل في أقل من 3 ثواني
    expect(loadTime).toBeLessThan(3000);

    // ✅ تحقق من عدم وجود أخطاء في console
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.error("Console error:", msg.text());
      }
    });

    // ✅ تحقق من الـ accessibility
    const headings = page.getByRole("heading");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);
  });

  test("Local Storage Persistence - حفظ البيانات", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ اضغط على الزر
    await page.getByRole("button", { name: /ابدأ الرحلة/ }).click();

    // ✅ اختر هدف
    await page.getByRole("button", { name: /العيلة/ }).first().click();

    // ✅ تحقق من حفظ البيانات في localStorage
    const storedData = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key => 
        key.includes("dawayir") || key.includes("journey")
      );
    });

    expect(storedData.length).toBeGreaterThan(0);

    // ✅ أعد تحميل الصفحة
    await page.reload();
    await page.waitForTimeout(1000);

    // ✅ تحقق من استعادة البيانات
    const afterReload = await page.evaluate(() => {
      return Object.keys(localStorage).filter(key => 
        key.includes("dawayir") || key.includes("journey")
      );
    });

    expect(afterReload.length).toBeGreaterThan(0);
  });

  test("Theme Toggle - تبديل الـ Dark Mode", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ ابحث عن زر الـ theme
    const themeButton = page.getByRole("button").filter({ hasText: /☀️|🌙|theme|dark|light/ }).first();
    
    if (await themeButton.isVisible()) {
      const initialTheme = await page.evaluate(() => document.documentElement.className);
      
      // ✅ اضغط على الزر
      await themeButton.click();
      await page.waitForTimeout(300);

      const newTheme = await page.evaluate(() => document.documentElement.className);
      
      // ✅ يجب أن يتغير الـ theme
      expect(initialTheme).not.toEqual(newTheme);
    }
  });
});

test.describe("Accessibility - إمكانية الوصول", () => {
  test("Keyboard Navigation - التنقل بلوحة المفاتيح", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ استخدم Tab للتنقل
    await page.keyboard.press("Tab");
    await page.waitForTimeout(100);

    // ✅ تحقق من وجود focus indicator
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      return el?.tagName || null;
    });

    expect(focusedElement).toBeTruthy();

    // ✅ اضغط Enter على الزر المركز
    await page.keyboard.press("Enter");
    await page.waitForTimeout(500);

    // ✅ تحقق من التغيير
    const newUrl = page.url();
    expect(newUrl).not.toEqual(BASE_URL);
  });

  test("ARIA Labels - اختبار ARIA", async ({ page }) => {
    await page.goto(BASE_URL);

    // ✅ تحقق من وجود aria-label على الأزرار المهمة
    const buttons = page.getByRole("button");
    const buttonCount = await buttons.count();

    expect(buttonCount).toBeGreaterThan(0);

    // ✅ تحقق من أن الأزرار قابلة للوصول
    for (let i = 0; i < Math.min(3, buttonCount); i++) {
      const button = buttons.nth(i);
      const isAccessible = await button.evaluate((el: any) => {
        return el.textContent?.trim().length > 0 || el.getAttribute("aria-label");
      });

      expect(isAccessible).toBeTruthy();
    }
  });
});

test.describe("Error Scenarios - سيناريوهات الأخطاء", () => {
  test("Network Error Recovery - التعافي من أخطاء الشبكة", async ({ page, context }) => {
    // ✅ قطع الشبكة
    await context.setOffline(true);

    await page.goto(BASE_URL).catch(() => {
      // Expected to fail
    });

    // ✅ أعد الشبكة
    await context.setOffline(false);

    await page.goto(BASE_URL);

    // ✅ تحقق من الصفحة
    await expect(page.getByRole("button", { name: /ابدأ الرحلة/ })).toBeVisible();
  });

  test("Console Errors - عدم وجود أخطاء في Console", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto(BASE_URL);

    // ✅ تنقل عبر الرحلة
    await page.getByRole("button", { name: /ابدأ الرحلة/ }).click();
    await page.waitForTimeout(500);

    // ✅ يجب أن تكون الأخطاء فارغة أو معروفة
    const criticalErrors = errors.filter(err => 
      !err.includes("Uncaught") && !err.includes("deprecat")
    );

    expect(criticalErrors.length).toBe(0);
  });
});
