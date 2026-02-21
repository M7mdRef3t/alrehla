-- AI Meta-Orchestrator Schema
-- This schema allows Dawayir to dynamically select AI models based on task type, cost, and availability.

-- 1. Table to store available AI models and their capabilities
create table if not exists public.ai_models (
    model_id text primary key, -- The exact model string to use (e.g. gemini-1.5-pro, claude-3-5-sonnet)
    provider text not null, -- e.g., google, anthropic, openai
    cost_per_1m_input numeric not null default 0,
    cost_per_1m_output numeric not null default 0,
    context_window_size int not null default 8192,
    is_active boolean not null default true,
    capabilities text[] not null default '{}', -- e.g., ['reasoning', 'coding', 'fast', 'vision', 'arabic_native']
    last_updated timestamptz not null default now()
);

-- 2. Table to store routing rules for different features in the application
create table if not exists public.ai_routing_rules (
    feature_name text primary key, -- e.g., 'predictive_oracle', 'facilitator_chat', 'fast_categorization'
    required_capabilities text[] not null default '{}',
    primary_model_id text references public.ai_models(model_id),
    fallback_model_id text references public.ai_models(model_id),
    max_cost_allowed numeric, -- The maximum allowed cost for this feature
    updated_at timestamptz not null default now()
);

-- Initial Seed Data (The 2026 Starting Point)
insert into public.ai_models (model_id, provider, cost_per_1m_input, cost_per_1m_output, context_window_size, capabilities)
values 
    ('gemini-1.5-pro', 'google', 1.25, 5.00, 2000000, ARRAY['reasoning', 'complex', 'native_arabic']),
    ('gemini-1.5-flash', 'google', 0.075, 0.30, 1000000, ARRAY['fast', 'cheap', 'native_arabic']),
    ('claude-3.5-sonnet', 'anthropic', 3.00, 15.00, 200000, ARRAY['coding', 'agentic', 'reasoning']),
    ('gpt-4o', 'openai', 5.00, 15.00, 128000, ARRAY['reasoning', 'agentic'])
on conflict (model_id) do nothing;

-- Default Routing for Dawayir Core Features
insert into public.ai_routing_rules (feature_name, required_capabilities, primary_model_id, fallback_model_id)
values
    ('predictive_oracle', ARRAY['reasoning'], 'gemini-1.5-pro', 'gpt-4o'),
    ('facilitator_chat', ARRAY['reasoning', 'agentic'], 'gemini-1.5-pro', 'claude-3.5-sonnet'),
    ('quick_analysis', ARRAY['fast'], 'gemini-1.5-flash', 'gemini-1.5-flash')
on conflict (feature_name) do nothing;
