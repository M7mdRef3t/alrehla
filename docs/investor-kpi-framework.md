# Investor KPI Framework

## 1) North Star
- **North Star Metric:** Weekly Active Journeys (WAJ)
- التعريف: عدد الجلسات الفريدة خلال 7 أيام اللي وصلت "Value Moment" (مثلاً: `path_started` أو `task_completed`).
- الهدف: قياس قيمة فعلية، مش مجرد دخول.

## 2) Funnel (AARRR مبسّط)
1. **Acquisition**
- Landing Views
- Start Click Rate = `landing_clicked_start / landing_viewed`

2. **Activation**
- Pulse Completion Rate = `pulse_completed / landing_clicked_start`
- Add Person Completion Rate = `add_person_done_show_on_map / add_person_opened`
- Path Start Rate = `path_started / unique_sessions`

3. **Retention**
- D1 / D7 / D30 Retention by Cohort
- Rolling WAU/MAU

4. **Revenue**
- Trial → Paid Conversion
- ARPU / ARPPU
- MRR growth

5. **Referral**
- Invite rate
- Referral-to-activation conversion

## 3) Reliability & Risk
- Uptime %
- p95 latency (API + key user flows)
- Error rate %
- Security incidents (weekly)
- Failed auth/rate-limit events

## 4) Unit Economics
- CAC
- Payback Period
- Gross Margin
- Churn (% logo + % revenue)
- LTV/CAC

## 5) KPI Governance
- لكل KPI لازم يتوثق:
  - Definition
  - SQL/Source
  - Update frequency
  - Owner
  - Alert threshold

## 6) Suggested weekly thresholds (initial)
- Start Click Rate >= 30%
- Pulse Completion Rate >= 55%
- Add Person Completion Rate >= 40%
- D7 Retention >= 18%
- API Error Rate <= 1.5%
- p95 Admin/API Latency <= 350ms

