# Alrehla — Conversion Funnel & Analytics Events
## نقاط التحويل والأحداث التحليلية

---

## 📊 نظرة عامة على الفانيل

يتم تتبع رحلة المستخدم عبر 7 مراحل رئيسية:

1. **اكتشاف وتحويل (Discovery)**  
2. **التزام أولي (Micro-Commitment)**  
3. **بناء الخريطة (Map Building)**  
4. **الرحلة الموجهة (Guided Journey)**  
5. **الأدوات والميزات (Feature Adoption)**  
6. **التوسع والمشاركة (Expansion)**  
7. **الحفاظ (Retention)**

---

## 🎯 Conversion Funnel Events

### Stage 1: Discovery & Awareness
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `page_view` | `PAGE_VIEW` | Entry | المستخدم يزور الصفحة الرئيسية |
| `micro_compass_opened` | `MICRO_COMPASS_OPENED` | Click | فتح "compass" (اختبار سريع) |

**Goal:** تحويل الزائر إلى مهتم بالتجربة.

---

### Stage 2: Micro-Commitment (User Decision)
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `micro_compass_completed` | `MICRO_COMPASS_COMPLETED` | Engagement | إكمال أسئلة compass |
| `goal_selected` | `GOAL_SELECTED` | Selection | اختيار هدف (Family, Romantic, Workplace, Health) |
| `page_view` (Goal) | `PAGE_VIEW` | Navigation | الدخول لشاشة اختيار الهدف |

**Goal:** الحصول على التزام أولي من المستخدم.  
**Metric:** Goal selection rate = goals_selected / compass_completed

---

### Stage 3: Map Building (Core Feature)
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `page_view` (Map) | `PAGE_VIEW` | Navigation | دخول شاشة خريطة العلاقات |
| `person_added` | `PERSON_ADDED` | Critical* | ✨ **إضافة أول شخص/علاقة** |
| `node_added` (Journey) | (Custom) | Engagement | تسجيل في database |
| `baseline_completed` | `BASELINE_COMPLETED` | Milestone | إضافة 3+ أشخاص (خط أساسي) |

**Goal:** بناء خريطة أساسية.  
**Critical Metric:** persons_added > 0  
**Baseline Metric:** persons_added >= 3  
**Formula:**  
- First Person Conversion = persons_added > 0 / goals_selected  
- Baseline Completion = baseline_completed / persons_added_1st

---

### Stage 4: Guided Journey (Value Delivery)
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `page_view` (Guided) | `PAGE_VIEW` | Navigation | دخول الرحلة الموجهة |
| `step_completed` | `STEP_COMPLETED` | Engagement | إكمال خطوة من الخطة |
| `training_completed` | `TRAINING_COMPLETED` | Milestone | إكمال أول جلسة تدريب |

**Goal:** توصيل القيمة للمستخدم.  
**Metric:** journey_step_completion_rate = steps_completed / available_steps

---

### Stage 5: Feature Adoption (Sticky Features)
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `breathing_exercise_used` | `BREATHING_USED` | Feature | استخدام تمرين التنفس |
| `emergency_button_used` | `EMERGENCY_USED` | Safety | الضغط على زر الطوارئ |
| `library_opened` | `LIBRARY_OPENED` | Resource | دخول مكتبة الموارد |
| `ai_chat_used` | `AI_CHAT_USED` | Innovation | استخدام الدردشة الموجهة |

**Goal:** زيادة الاستخدام اليومي (DAU).  
**Metric:** feature_adoption_rate = users_using_feature / active_users

---

### Stage 6: Expansion & Sharing
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `auth_google_clicked` | `AUTH_GOOGLE_CLICKED` | Signup* | محاولة تسجيل الدخول |
| `data_exported` | `EXPORT_DATA` | Advanced | تصدير البيانات/التقرير |

**Goal:** تحويل إلى مستخدم مسجل (Sign-up).  
**Critical Metric:** auth_attempts > 0

---

### Stage 7: Trust & Consent (Privacy)
| Event | Key | Metric | Description |
|-------|-----|--------|-------------|
| `consent_given` | `CONSENT_GIVEN` | Privacy | قبول التتبع التحليلي |
| `consent_denied` | `CONSENT_DENIED` | Privacy | رفض التتبع |

**Goal:** فهم ثقة المستخدم في البيانات.  
**Metric:** consent_rate = consents_given / consent_prompts

---

## 📈 Funnel Metrics (KPIs)

```
Landing Visits
    ↓ (Discovery Rate: compass_opened / page_views)
Compass Completions
    ↓ (Micro-Commitment Rate: goals_selected / compass_completed)
Goal Selection
    ↓ (Activation Rate: persons_added > 0 / goals_selected)
First Person Added [CRITICAL] ⭐
    ↓ (Engagement Rate: step_completed / active_users)
Guided Journey Steps
    ↓ (Retention Rate: DAU > 0 / MAU)
Loyalty & Expansion
```

### Key Ratios to Track

1. **Activation Funnel:**
   ```
   Activation Rate = [PERSON_ADDED > 0] / [GOAL_SELECTED]
   Target: > 60%  (6 in 10 users who pick a goal add someone)
   ```

2. **Baseline Completion:**
   ```
   Baseline Rate = [BASELINE_COMPLETED] / [FIRST_PERSON_ADDED]
   Target: > 50%  (half of users progress to baseline)
   ```

3. **Feature Adoption:**
   ```
   Core Feature Rate = [BREATHING_USED + EMERGENCY_USED] / [ACTIVE_USERS]
   Target: > 20%  (sticky features used by 1 in 5)
   ```

4. **Signup Conversion:**
   ```
   Signup Rate = [AUTH_GOOGLE_CLICKED] / [FIRST_PERSON_ADDED]
   Target: > 30%
   ```

---

## 🔧 Implementation Details

### Analytics Service (`src/services/analytics.ts`)
```typescript
export const AnalyticsEvents = {
  PAGE_VIEW: "page_view",           // ← ADDED
  JOURNEY_STARTED: "journey_started",
  GOAL_SELECTED: "goal_selected",
  PERSON_ADDED: "person_added",     // ← TRACKED
  BASELINE_COMPLETED: "baseline_completed",
  MICRO_COMPASS_OPENED: "micro_compass_opened",
  MICRO_COMPASS_COMPLETED: "micro_compass_completed",
  AUTH_GOOGLE_CLICKED: "auth_google_clicked",
  BREATHING_USED: "breathing_exercise_used",
  EMERGENCY_USED: "emergency_button_used",
  LIBRARY_OPENED: "library_opened",
  EXPORT_DATA: "data_exported",
  TRAINING_COMPLETED: "training_completed",
  STEP_COMPLETED: "recovery_step_completed",
  AI_CHAT_USED: "ai_chat_used",
  CONSENT_GIVEN: "consent_given",
  CONSENT_DENIED: "consent_denied"
} as const;
```

### Tracking Person Addition (`src/components/AddPersonModal.tsx`)
```typescript
// When person is successfully added:
trackEvent(AnalyticsEvents.PERSON_ADDED, {
  person_label: finalLabel,      // e.g., "أم", "زوج"
  ring: ring,                     // e.g., "green", "yellow", "red"
  is_emergency: isEmergency,      // true if red ring & high detachment
  goal_id: goalId                 // linked goal
});
```

### Page View Tracking (`src/App.tsx`)
```typescript
useEffect(() => {
  const pageNames: Record<Screen, string> = {
    landing: "Landing",
    goal: "Goal Selection",
    map: "Relationship Map",
    guided: "Guided Journey",
    mission: "Mission",
    tools: "Tools"
  };
  trackPageView(pageNames[screen]);  // Fires on screen change
}, [screen]);
```

---

## 🎬 Testing the Funnel

### Manual Test Flow:
1. **Open App** → `page_view("Landing")`
2. **Click Compass** → `MICRO_COMPASS_OPENED`
3. **Complete Compass** → `MICRO_COMPASS_COMPLETED`
4. **Select Goal** → `GOAL_SELECTED` + `page_view("Goal Selection")`
5. **Enter Map** → `page_view("Relationship Map")`
6. **Add First Person** → `PERSON_ADDED` + `recordJourneyEvent("node_added")`
7. **Add 3rd Person** (Optional baseline trigger)
8. **Enter Guided Journey** → `page_view("Guided Journey")`
9. **Accept Consent** → `CONSENT_GIVEN`

### Automated Test Script (`scripts/test-funnel.mjs`):
TBD — Could use Playwright to automate the full funnel flow.

---

## 📊 Dashboard Recommendations

**Google Analytics 4 Setup:**
- Create conversion events for each critical stage
- Set up funnels for:
  - Discovery → Activation (compass → person_added)
  - Activation → Commitment (person_added → baseline)
  - Signup conversion (person_added → auth_clicked)

**Microsoft Clarity:**
- Session recordings of drop-off points
- Scroll heatmaps to understand attention

**Tableau / BI:**
- Weekly cohort analysis (sign-up date → retention)
- Feature adoption over time
- Consent rate trends

---

## 🚀 Next Steps

1. **Deploy & Monitor:** Run the updated build with PERSON_ADDED tracking
2. **Validate Data:** Check GA4 for person_added events
3. **Set Alerts:** Alert if funnel conversion < 10%
4. **Weekly Reviews:** Track KPIs weekly and optimize drop-off stages
5. **A/B Testing:** Test different micro-commitment CTA copy (see `MARKETING_COPY.md`)

---

**Last Updated:** 2026-02-15  
**Tracking Events Count:** 19 predefined events  
**Critical Stages:** 3 (person_added, baseline_completed, auth_clicked)
