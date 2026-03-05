BEGIN;

-- 1. Create alert_rules table
CREATE TABLE IF NOT EXISTS public.alert_rules (
    rule_key text PRIMARY KEY,
    enabled boolean DEFAULT true,
    segment text DEFAULT 'all',
    metric_name text NOT NULL,
    threshold numeric NOT NULL,
    window_minutes integer DEFAULT 60,
    min_samples integer DEFAULT 50,
    debounce_required integer DEFAULT 2,
    cooldown_minutes integer DEFAULT 240,
    auto_resolve_checks integer DEFAULT 2,
    severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    action_hint text,
    owner text DEFAULT 'admin',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Create alert_incidents table
CREATE TABLE IF NOT EXISTS public.alert_incidents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key text REFERENCES public.alert_rules(rule_key),
    status text CHECK (status IN ('open', 'ack', 'resolved')) DEFAULT 'open',
    segment text NOT NULL,
    opened_at timestamp with time zone DEFAULT now(),
    last_seen_at timestamp with time zone DEFAULT now(),
    resolved_at timestamp with time zone,
    evidence jsonb DEFAULT '{}',
    fingerprint text UNIQUE NOT NULL, -- Format: rule_key:segment
    resolution_reason text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Create alert_notifications table
CREATE TABLE IF NOT EXISTS public.alert_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id uuid REFERENCES public.alert_incidents(id) ON DELETE CASCADE,
    channel text CHECK (channel IN ('inapp', 'email', 'slack')),
    sent_at timestamp with time zone DEFAULT now(),
    delivery_status text DEFAULT 'pending',
    payload jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT now()
);

-- 4. Create alert_playbooks table
CREATE TABLE IF NOT EXISTS public.alert_playbooks (
    rule_key text PRIMARY KEY REFERENCES public.alert_rules(rule_key) ON DELETE CASCADE,
    checklist jsonb DEFAULT '[]', -- Array of {step, title, details}
    owner_role text DEFAULT 'admin',
    expected_impact text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 5. Create alert_sweep_runs table for logging
CREATE TABLE IF NOT EXISTS public.alert_sweep_runs (
  id bigserial primary key,
  ran_at timestamptz not null default now(),
  status text not null,
  details jsonb not null default '{}'::jsonb
);

-- Enable RLS for all new tables
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_sweep_runs ENABLE ROW LEVEL SECURITY;

-- Create policies for Admins (Gated by profiles role)
-- The project uses p.id as text and auth.uid() as uuid, so cast is required.
-- Admins have role 'owner' or 'superadmin' in this system.
CREATE POLICY "admin_all_alert_rules" ON public.alert_rules FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role IN ('owner', 'superadmin')));

CREATE POLICY "admin_all_alert_incidents" ON public.alert_incidents FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role IN ('owner', 'superadmin')));

CREATE POLICY "admin_all_alert_notifications" ON public.alert_notifications FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role IN ('owner', 'superadmin')));

CREATE POLICY "admin_all_alert_playbooks" ON public.alert_playbooks FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role IN ('owner', 'superadmin')));

CREATE POLICY "admin_all_alert_sweep_runs" ON public.alert_sweep_runs FOR ALL TO authenticated 
USING (exists (select 1 from public.profiles p where p.id = auth.uid()::text and p.role IN ('owner', 'superadmin')));


-- 6. Seed Initial Data (12 Rules + Playbooks)
INSERT INTO public.alert_rules (rule_key, segment, metric_name, threshold, severity, action_hint) VALUES
('activation_yield_drop', 'all', 'first_pulse_rate', 0.70, 'high', 'Activation friction — راجع Sanctuary microcopy + Quick Pulse visibility'),
('ttfp_p50_slow', 'all', 'time_to_first_pulse_p50_seconds', 12, 'medium', 'Lag or hesitation — راجع أول Frame + تحميل الـ HUD + أي Blocking calls'),
('mobile_activation_gap', 'mobile', 'first_pulse_rate_mobile', 0.65, 'high', 'Mobile layout friction — راجع حجم الأيقونات/اللمس/الـ Dock/Overlap'),
('desktop_activation_gap', 'desktop', 'first_pulse_rate_desktop', 0.75, 'medium', 'Desktop clarity — راجع hero-to-map transition + CTA affordance'),
('hesitation_spike', 'all', 'hesitation_rate', 0.18, 'medium', 'Users hesitate — راجع labeling / icon semantics / micro-hint'),
('cta_to_entry_drop', 'all', 'cta_to_entry_rate', 0.80, 'high', 'Routing/latency/blocked navigation — راجع Landing button + route + perf'),
('auth_conversion_drop', 'all', 'auth_rate', 0.45, 'high', 'Auth modal trust friction — راجع copy + why login + providers reliability'),
('merge_failure_spike', 'all', 'merge_failure_rate', 0.03, 'high', 'Data loss risk — راجع upsert key (user_id, day) + timezone day key + retries'),
('duplicate_pulse_attempts_spike', 'all', 'pulse_conflict_rate', 0.05, 'medium', 'Double-tap guard/latency — راجع isSavingRef + optimistic UI + onConflict'),
('analytics_ingest_lag_high', 'all', 'event_ingest_lag_p95_seconds', 20, 'high', 'Analytics stale — راجع client_ts, server_received_at, network batching, retries'),
('alert_sweep_failure', 'all', 'last_sweep_age_minutes', 20, 'critical', 'Automation down — راجع Vercel cron + secrets + DB connectivity'),
('ai_gate_pressure_spike', 'all', 'ai_gate_rate', 0.25, 'low', 'Users want AI early — راجع placement/tease/value preview قبل login')
ON CONFLICT (rule_key) DO UPDATE SET threshold = EXCLUDED.threshold, severity = EXCLUDED.severity, action_hint = EXCLUDED.action_hint;

-- Seed Playbooks
INSERT INTO public.alert_playbooks (rule_key, expected_impact, checklist) VALUES
('activation_yield_drop', '+8% إلى +15%', '[
  {"step":1,"title":"Verify samples","details":"تأكد entries >= min_samples + شوف trend آخر 6 ساعات"},
  {"step":2,"title":"Sanctuary first frame","details":"راجع أي Layout shift / flicker / blocking fetch"},
  {"step":3,"title":"Quick Pulse prominence","details":"كبّر أيقونات Quick Pulse + خفف نصوص فوقها"},
  {"step":4,"title":"Microcopy","details":"جرّب سطر واحد: \"سجّل نبضك في ثانية\" بدل أي شرح"},
  {"step":5,"title":"Measure","details":"راقب first_pulse_rate + ttfp_p50 بعد 30–60 دقيقة"}
]'),
('ttfp_p50_slow', '-3s إلى -7s', '[
  {"step":1,"title":"Perf trace","details":"قسّم الوقت: route load vs hydration vs first interaction"},
  {"step":2,"title":"Kill blockers","details":"أي call بيتعمل قبل render (خصوصاً analytics sync) يتأجل بعد first paint"},
  {"step":3,"title":"Reduce motion","details":"خفف framer-motion في Sanctuary لحد 10% opacity"},
  {"step":4,"title":"Optimistic feedback","details":"خلي \"تم تسجيل النبض\" يظهر قبل network ack"}
]'),
('mobile_activation_gap', '+10% Mobile activation', '[
  {"step":1,"title":"Thumb reach","details":"تأكد Capsule و icons في منطقة الإبهام (top too high؟)"},
  {"step":2,"title":"Hit targets","details":"44px minimum لكل icon"},
  {"step":3,"title":"Overlay conflicts","details":"pointer-events + z-index (منع overlaps مع map drag)"},
  {"step":4,"title":"Network on mobile","details":"لو بطيء، زود retries + show offline hint"}
]'),
('desktop_activation_gap', '+5% إلى +10%', '[
  {"step":1,"title":"CTA affordance","details":"هل اليوزر شايف إن الأيقونات قابلة للضغط؟"},
  {"step":2,"title":"Cursor cues","details":"hover states + tooltips خفيفة"},
  {"step":3,"title":"Reduce ambiguity","details":"Dual-layer label على طول"},
  {"step":4,"title":"Check landing->map continuity","details":"هل transition بيشتت؟"}
]'),
('hesitation_spike', '-30% hesitation rate', '[
  {"step":1,"title":"Inspect heat","details":"شوف sessions اللي فيها hover طويل بدون click"},
  {"step":2,"title":"Rename labels","details":"قلّل الشاعرية في أول لحظة، خليك \"واضح/وظيفي\""},
  {"step":3,"title":"Icon clarity","details":"أضف legend بسيط (emoji + كلمة) داخل Capsule"},
  {"step":4,"title":"Remove choices","details":"خلي default selection visible (pre-highlight neutral)"}
]'),
('cta_to_entry_drop', '+10% pipeline continuity', '[
  {"step":1,"title":"Routing","details":"تأكد زر CTA مش بيعمل full reload ولا error silent"},
  {"step":2,"title":"Time-to-route","details":"لو >1.5s، اعمل preload لصفحة Sanctuary"},
  {"step":3,"title":"Track failures","details":"event entry_failed مع السبب (network/timeout)"},
  {"step":4,"title":"Fallback","details":"زر بديل \"فتح الخريطة\" لو simulation section تقيل"}
]'),
('auth_conversion_drop', '+10% إلى +20% auth rate', '[
  {"step":1,"title":"Trust copy","details":"\"ليه لازم تسجيل؟ لحفظ نبضاتك\" سطر واحد"},
  {"step":2,"title":"Provider reliability","details":"راجع Google auth errors + redirect URI"},
  {"step":3,"title":"Timing","details":"هل بتطلب Auth بدري قوي؟ خلي trigger بعد pulse #2 مش #1"},
  {"step":4,"title":"One-tap","details":"خفف modal steps، زر واحد واضح"}
]'),
('merge_failure_spike', 'merge failures < 1%', '[
  {"step":1,"title":"Inspect errors","details":"خزن merge_error_code (conflict, timezone, duplicate)"},
  {"step":2,"title":"Upsert key","details":"تأكد onConflict (user_id, day) + day string local"},
  {"step":3,"title":"Retry strategy","details":"exponential backoff + idempotency key"},
  {"step":4,"title":"User safety","details":"لو fail → لا تمسح localStorage + اعمل \"Retry merge\" button في admin debug"}
]'),
('duplicate_pulse_attempts_spike', '-70% duplicates', '[
  {"step":1,"title":"Double tap guard","details":"تأكد isSavingRef شغال في كل paths"},
  {"step":2,"title":"Disable UI","details":"بعد click مباشرة قفل icons 600ms"},
  {"step":3,"title":"Server idempotency","details":"accept client_request_idوتجاهل التكرار"},
  {"step":4,"title":"Telemetry","details":"event pulse_save_started/ended لحساب latency الحقيقي"}
]'),
('analytics_ingest_lag_high', 'regain trust in live metrics', '[
  {"step":1,"title":"Clock sanity","details":"فرق client clock؟ خزن client_clock_skew estimate"},
  {"step":2,"title":"Batching","details":"قلّل batching delay على الموبايل"},
  {"step":3,"title":"Network retries","details":"لو offline queue طول، اعمل flush على next open"},
  {"step":4,"title":"UI disclaimer","details":"Admin radar يظهر \"data delayed\" banner"}
]'),
('alert_sweep_failure', 'restore automation continuity', '[
  {"step":1,"title":"Check last run","details":"log في جدول alert_sweep_runs (حتى لو بسيط)"},
  {"step":2,"title":"Cron config","details":"verify Vercel cron schedule + auth header secret"},
  {"step":3,"title":"DB access","details":"verify service role key + RLS bypass for admin tables"},
  {"step":4,"title":"Fail-safe","details":"endpoint healthcheck بيرجع 200 حتى لو no work"}
]'),
('ai_gate_pressure_spike', 'زيادة login بدون تدمير activation', '[
  {"step":1,"title":"Interpretation","details":"ده مش \"مشكلة\" دا signal إن القيمة المطلوبة AI"},
  {"step":2,"title":"Tease","details":"اعرض preview insight مجاني (سطر واحد) بدون login"},
  {"step":3,"title":"Better gate copy","details":"\"احفظ رحلتك عشان الذكاء يكمّل الصورة\""},
  {"step":4,"title":"Reposition","details":"خلي AI CTA بعد أول نبضة بدل قبلها"}
]')
ON CONFLICT (rule_key) DO UPDATE SET expected_impact = EXCLUDED.expected_impact, checklist = EXCLUDED.checklist;

-- Helper View to get the latest incident status quickly
CREATE OR REPLACE VIEW public.v_active_alert_incidents AS
SELECT 
    i.id,
    i.rule_key,
    r.severity,
    i.segment,
    i.status,
    i.opened_at,
    i.last_seen_at,
    r.action_hint,
    p.checklist,
    p.expected_impact,
    i.fingerprint,
    i.evidence
FROM 
    public.alert_incidents i
JOIN 
    public.alert_rules r ON i.rule_key = r.rule_key
LEFT JOIN 
    public.alert_playbooks p ON i.rule_key = p.rule_key
WHERE 
    i.status IN ('open', 'ack')
ORDER BY 
    r.severity DESC, i.opened_at DESC;

COMMIT;
