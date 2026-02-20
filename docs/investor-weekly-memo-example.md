# Weekly Investor Memo (Example)

## Week
- الفترة: `2026-02-14 .. 2026-02-20`

## 1) Executive Summary
- المنصة حافظت على استقرار تشغيلي جيد مع مراقبة لحظية للأداء والأمان.
- تم تفعيل بوابات منع regression في CI (Performance/Security/Logic Flow/Prompt Quality).
- الأولوية الأسبوع القادم: تحسين تحويل `add_person_opened -> add_person_done_show_on_map` ورفع D7.

## 2) KPI Snapshot
- WAJ: `يتم سحبه من owner-ops + ops-insights`
- Landing Views: `flowStats.byStep.landing_viewed`
- Start Click Rate: `landing_clicked_start / landing_viewed`
- Pulse Completion Rate: `pulse_completed / landing_clicked_start`
- Add Person Completion Rate: `add_person_done_show_on_map / add_person_opened`
- D1: `retentionCohorts latest`
- D7: `retentionCohorts latest`
- D30: `retentionCohorts latest`
- MRR: `N/A حالياً`
- Churn: `N/A حالياً`

## 3) Reliability & Security
- Uptime: `من systemHealth.api.uptimeSec`
- API Error Rate: `systemHealth.api.errorRate`
- p95 Latency: `systemHealth.api.p95LatencyMs`
- Security Incidents: `securitySignals.incidents.length`
- Auth Failed / Rate-limited (15m peak):  
  - `securitySignals.metrics.authFailed15m`  
  - `securitySignals.metrics.authRateLimited15m`

## 4) Product & Experiments
- Experiment #1:
  - Hypothesis: تحسين copy شاشة البداية يرفع Start Click Rate.
  - Result: `pending`
  - Decision: `iterate`
- Experiment #2:
  - Hypothesis: CTA بعد إضافة الشخص يرفع Path Start.
  - Result: `pending`
  - Decision: `keep`

## 5) GTM / Growth
- Top channels this week: `ops-insights.segments.byChannel`
- CAC by channel: `pending`
- Best conversion path: `landing -> pulse -> add person -> path started`
- Blockers: attribution ناقص في بعض المصادر.

## 6) Capital & Runway
- Cash in bank: `to be filled`
- Monthly burn: `to be filled`
- Runway (months): `to be filled`

## 7) Asks
1. تقديم 2 introductions لمتخصصي Growth في wellness/productivity.
2. مراجعة استراتيجية التسعير التجريبية (pricing test design).
3. اتصال مع مستثمر Seed عند أول milestone retention واضح.

## 8) Appendix (links)
- Owner Ops snapshot: `/api/admin?path=overview&kind=owner-ops`
- Ops Insights: `/api/admin?path=overview&kind=ops-insights`
- Executive Report: `/api/admin?path=overview&kind=executive-report`
- Security Signals: `/api/admin?path=overview&kind=security-signals`

