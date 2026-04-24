-- Behavioral Analysis Schema
-- Tables to store identified patterns, time-series metrics, and proactive alerts.

BEGIN;

-- 1. behavioral_patterns
CREATE TABLE IF NOT EXISTS public.behavioral_patterns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    sentiment text CHECK (sentiment IN ('positive', 'negative', 'recurring')) NOT NULL,
    icon text NOT NULL,
    frequency integer DEFAULT 1,
    linked_quiz text,
    is_sensitive boolean DEFAULT false,
    resource_tab text,
    resource_search text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. behavioral_metrics
CREATE TABLE IF NOT EXISTS public.behavioral_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    day text NOT NULL, -- Label like 'الأحد', 'أسبوع 1', 'يناير'
    connection integer CHECK (connection BETWEEN 0 AND 100),
    withdrawal integer CHECK (withdrawal BETWEEN 0 AND 100),
    stability integer CHECK (stability BETWEEN 0 AND 100),
    period text CHECK (period IN ('morning', 'evening')),
    metric_type text NOT NULL, -- 'week', 'month', 'year'
    created_at timestamp with time zone DEFAULT now()
);

-- 3. behavioral_alerts
CREATE TABLE IF NOT EXISTS public.behavioral_alerts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message text NOT NULL,
    pattern_id uuid REFERENCES public.behavioral_patterns(id) ON DELETE SET NULL,
    resource_tab text,
    resource_key text,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.behavioral_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.behavioral_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own patterns" ON public.behavioral_patterns
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own metrics" ON public.behavioral_metrics
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own alerts" ON public.behavioral_alerts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts" ON public.behavioral_alerts
    FOR UPDATE USING (auth.uid() = user_id);

-- Service role can manage everything
CREATE POLICY "Service role can manage patterns" ON public.behavioral_patterns
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage metrics" ON public.behavioral_metrics
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage alerts" ON public.behavioral_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- Indices
CREATE INDEX IF NOT EXISTS idx_behavioral_patterns_user ON public.behavioral_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_metrics_user_type ON public.behavioral_metrics(user_id, metric_type);
CREATE INDEX IF NOT EXISTS idx_behavioral_alerts_user_unread ON public.behavioral_alerts(user_id) WHERE (is_read = false);

COMMIT;
