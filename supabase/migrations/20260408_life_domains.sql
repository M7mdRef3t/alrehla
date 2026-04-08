-- ================================================================
-- Life OS Schema — نظام تشغيل الحياة
-- ================================================================
-- Stores user life data: domain assessments, entries (problems,
-- decisions, goals), and life score history.
-- ================================================================

-- 1. Life Domain Assessments
CREATE TABLE IF NOT EXISTS life_domain_assessments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    domain_id TEXT NOT NULL CHECK (domain_id IN ('self', 'body', 'relations', 'work', 'finance', 'dreams', 'spirit', 'knowledge')),
    score SMALLINT NOT NULL CHECK (score >= 1 AND score <= 10),
    answers JSONB DEFAULT '[]'::jsonb,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_life_assessments_user_domain
    ON life_domain_assessments(user_id, domain_id, created_at DESC);

-- 2. Life Entries (unified: thoughts, problems, decisions, goals, notes, wins, lessons)
CREATE TABLE IF NOT EXISTS life_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_type TEXT NOT NULL CHECK (entry_type IN ('thought', 'problem', 'decision', 'goal', 'note', 'win', 'lesson')),
    content TEXT NOT NULL,
    domain_id TEXT NOT NULL CHECK (domain_id IN ('self', 'body', 'relations', 'work', 'finance', 'dreams', 'spirit', 'knowledge')),
    linked_entry_id UUID REFERENCES life_entries(id) ON DELETE SET NULL,
    tags TEXT[] DEFAULT '{}',
    priority SMALLINT DEFAULT 3 CHECK (priority >= 1 AND priority <= 5),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'archived', 'deferred')),
    
    -- Problem-specific fields
    impact TEXT CHECK (impact IS NULL OR impact IN ('low', 'medium', 'high', 'critical')),
    affected_domains TEXT[] DEFAULT '{}',
    root_cause TEXT,
    suggested_actions JSONB DEFAULT '[]'::jsonb,
    is_recurring BOOLEAN DEFAULT false,
    occurrence_count SMALLINT DEFAULT 1,
    
    -- Decision-specific fields
    urgency TEXT CHECK (urgency IS NULL OR urgency IN ('can_wait', 'this_week', 'today', 'now')),
    outcome TEXT CHECK (outcome IS NULL OR outcome IN ('pending', 'decided', 'executed', 'reviewed')),
    options JSONB DEFAULT '[]'::jsonb,
    chosen_option_id TEXT,
    ai_analysis TEXT,
    retrospective TEXT,
    deadline TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_life_entries_user_status
    ON life_entries(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_life_entries_user_domain
    ON life_entries(user_id, domain_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_life_entries_user_type
    ON life_entries(user_id, entry_type, created_at DESC);

-- 3. Life Score Snapshots (daily)
CREATE TABLE IF NOT EXISTS life_score_snapshots (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    overall_score SMALLINT NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    domain_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
    trend TEXT DEFAULT 'stable' CHECK (trend IN ('improving', 'stable', 'declining')),
    weakest_domain TEXT,
    strongest_domain TEXT,
    active_problems SMALLINT DEFAULT 0,
    pending_decisions SMALLINT DEFAULT 0,
    snapshot_date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    
    UNIQUE(user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_life_scores_user_date
    ON life_score_snapshots(user_id, snapshot_date DESC);

-- ================================================================
-- RLS Policies
-- ================================================================

ALTER TABLE life_domain_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE life_score_snapshots ENABLE ROW LEVEL SECURITY;

-- Users can only read/write their own data
CREATE POLICY "Users can manage own assessments"
    ON life_domain_assessments FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own entries"
    ON life_entries FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own score snapshots"
    ON life_score_snapshots FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Service role has full access (for admin/AI operations)
CREATE POLICY "Service role full access to assessments"
    ON life_domain_assessments FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to entries"
    ON life_entries FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access to scores"
    ON life_score_snapshots FOR ALL
    USING (auth.role() = 'service_role');

-- ================================================================
-- Updated_at trigger
-- ================================================================
CREATE OR REPLACE FUNCTION update_life_entries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_life_entries_updated_at ON life_entries;
CREATE TRIGGER trg_life_entries_updated_at
    BEFORE UPDATE ON life_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_life_entries_updated_at();
