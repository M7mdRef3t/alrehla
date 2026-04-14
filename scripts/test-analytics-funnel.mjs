import { chromium } from 'playwright';

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = {
    PageView: [],
    ViewContent: [],
    Lead: [],
    CompleteRegistration: []
  };

  const internalEvents = [];

  page.on('request', request => {
    const url = request.url();
    if (url.includes('facebook.com/tr/')) {
       try {
           const urlObj = new URL(url);
           const ev = urlObj.searchParams.get('ev');
           if (ev) {
             console.log(`[Network] FB Pixel fired: ${ev}`);
             if (results[ev] !== undefined) {
                 results[ev].push(Date.now());
             }
           }
       } catch (e) {}
    }
  });

  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('[Analytics]') || text.includes('PixelFired:')) {
      console.log(`[Console] ${text}`);
      if (text.includes('PageView') || text.includes('trackPage')) results.PageView.push(Date.now());
      if (text.includes('ViewContent') || text.includes('trackLandingView')) results.ViewContent.push(Date.now());
      if (text.includes('Lead') || text.includes('trackLead')) results.Lead.push(Date.now());
      if (text.includes('CompleteRegistration') || text.includes('trackCompleteRegistration')) results.CompleteRegistration.push(Date.now());
    }
  });

  // Force Analytics Consent + Meta Enable
  await page.addInitScript(() => {
    window.localStorage.setItem('dawayir-analytics-consent', 'true');
    window.localStorage.setItem('alrehla-app-mode', 'user'); // User mode enables analytics in many places
    
    // Inject FBQ tracker
    window.originalFbq = window.fbq;
    let _fbq = function() {
      const args = Array.from(arguments);
      console.log('PixelFired:', args[1]);
      if (window.originalFbq) {
         return window.originalFbq.apply(this, arguments);
      }
    };
    Object.defineProperty(window, 'fbq', {
        get: () => _fbq,
        set: (v) => { window.originalFbq = v; },
        configurable: true
    });
  });

  console.log('--- 1. Navigating to Landing ---');
  await page.goto('http://localhost:3031/');
  await page.waitForTimeout(3000);
  
  console.log('--- 2. Navigating to Onboarding (Activate) ---');
  await page.goto('http://localhost:3031/activate');
  await page.waitForTimeout(3000);

  console.log('--- Triggering Lead sync to test funnel ---');
  await page.evaluate(async () => {
     if (window.marketingLeadService) {
        await window.marketingLeadService.syncLead({ phone: '01012345678', source: 'test' });
     }
  });
  await page.waitForTimeout(2000);
  
  console.log('--- 3. Navigating to Checkout ---');
  await page.goto('http://localhost:3031/checkout');
  await page.waitForTimeout(3000);
  
  console.log('\n========= FINAL RESULTS =========');
  console.log('PageView: ' + (results.PageView.length > 0 ? 'yes' : 'no') + ` (Count: ${results.PageView.length})`);
  console.log('ViewContent: ' + (results.ViewContent.length > 0 ? 'yes' : 'no') + ` (Count: ${results.ViewContent.length})`);
  console.log('Lead: ' + (results.Lead.length > 0 ? 'yes' : 'no') + ` (Count: ${results.Lead.length})`);
  console.log('CompleteRegistration: ' + (results.CompleteRegistration.length > 0 ? 'yes' : 'no') + ` (Count: ${results.CompleteRegistration.length})`);
    
  console.log('\n========= ADDITIONAL CHECKS =========');
  if (results.Lead.length > 1) {
      console.log('1) هل Lead بيتبعت مرة واحدة؟ -> في duplicate bug (Fired ' + results.Lead.length + ' times)');
  } else if (results.Lead.length === 1) {
      console.log('1) هل Lead بيتبعت مرة واحدة؟ -> نعم (Fired 1 time)');
  } else {
      console.log('1) هل Lead بيتبعت مرة واحدة؟ -> لم يتم الإرسال');
  }

  // Check if ViewContent fired quickly
  if (results.ViewContent.length > 0) {
      console.log('2) هل ViewContent بييجي أول ما الصفحة تفتح؟ -> الـ landing ViewContent بيـ fire من غير مشاكل.');
  } else {
      console.log('2) هل ViewContent بييجي أول ما الصفحة تفتح؟ -> متأخر أو مش موجود');
  }

  await browser.close();
})();
