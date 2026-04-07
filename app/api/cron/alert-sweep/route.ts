import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Vercel Cron Job to sweep alerts every 10 minutes
// Required ENV variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, CRON_SECRET, ENGINE_MODE
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

const DEFAULT_SWEEP_RETENTION_DAYS = 30;
type SweepDetails = {
    evaluated_count?: number;
    results?: unknown[];
    duration_ms?: number;
    error?: string;
};
type MetricPoint = { value: number; samples: number };
type AlertRule = {
    rule_key: string;
    segment: string;
    threshold: number;
    min_samples: number;
    metric_name: string;
    window_minutes: number;
};

function createSweepClient(url: string, key: string) {
    return createClient(url, key, { auth: { persistSession: false } });
}

function buildSweepClient(): ReturnType<typeof createSweepClient> | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
    if (!url || !key) {
        return null;
    }
    return createSweepClient(url, key);
}

type SweepClient = ReturnType<typeof createSweepClient>;

function toErrorMessage(error: unknown): string {
    console.error(error);
    return 'An internal server error occurred.';
}

function normalizeMetric(input: unknown): MetricPoint {
    if (!input || typeof input !== 'object') return { value: 0, samples: 0 };
    const candidate = input as { value?: unknown; samples?: unknown };
    return {
        value: Number(candidate.value ?? 0),
        samples: Number(candidate.samples ?? 0)
    };
}

export async function GET(request: Request) {
    const startTime = Date.now();
    let sweepDetails: SweepDetails = {};
    const supabase = buildSweepClient();
    if (!supabase) {
        return NextResponse.json({ error: 'Supabase not configured' }, { status: 503 });
    }

    try {
        // 1. Authenticate
        const authHeader = request.headers.get('authorization');
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Fetch Active Rules
        const { data: rules, error: rulesError } = await supabase
            .from('alert_rules')
            .select('*')
            .eq('enabled', true);

        if (rulesError) throw rulesError;

        const results = [];
        if (rules) {
            for (const rule of rules) {
                try {
                    const result = await evaluateRule(supabase, rule as AlertRule);
                    results.push(result);
                } catch (err) {
                    results.push({ rule_key: rule.rule_key, status: 'error', error: String(err) });
                }
            }
        }

        sweepDetails = {
            evaluated_count: rules?.length || 0,
            results,
            duration_ms: Date.now() - startTime
        };

        // 3. Log the success run
        await supabase.from('alert_sweep_runs').insert({
            status: 'ok',
            details: sweepDetails
        });
        await enforceSweepRetention(supabase);

        return NextResponse.json({ success: true, ...sweepDetails });
    } catch (error: unknown) {
        sweepDetails = { error: toErrorMessage(error), duration_ms: Date.now() - startTime };

        // Log the failure run
        await supabase.from('alert_sweep_runs').insert({
            status: 'error',
            details: sweepDetails
        });
        await enforceSweepRetention(supabase);

        return NextResponse.json({ success: false, ...sweepDetails }, { status: 500 });
    }
}

async function enforceSweepRetention(supabase: SweepClient) {
    const retentionDays = Number(process.env.ALERT_SWEEP_RETENTION_DAYS || DEFAULT_SWEEP_RETENTION_DAYS);
    const safeRetentionDays = Number.isFinite(retentionDays) && retentionDays > 0
        ? Math.floor(retentionDays)
        : DEFAULT_SWEEP_RETENTION_DAYS;

    const { error: rpcError } = await supabase.rpc('prune_alert_sweep_runs', { retention_days: safeRetentionDays });
    if (!rpcError) return;

    // Fallback cleanup if function is not deployed yet.
    const cutoff = new Date(Date.now() - safeRetentionDays * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('alert_sweep_runs').delete().lt('ran_at', cutoff);
}

async function evaluateRule(supabase: SweepClient, rule: AlertRule) {
    const isMock = process.env.ENGINE_MODE === 'mock';
    const fingerprint = `${rule.rule_key}:${rule.segment}`;

    let currentMetric: MetricPoint = { value: 0, samples: 0 };

    if (isMock) {
        // In MOCK mode, we simulate a trigger for a specific rule to test UI
        // If the rule is 'activation_yield_drop', we force it to trigger
        if (rule.rule_key === 'activation_yield_drop') {
            currentMetric = { value: 0.65, samples: 100 }; // Trigger: 0.65 < 0.70
        } else {
            const healthyValue =
                rule.rule_key.includes('drop') || rule.rule_key.includes('gap')
                    ? Number(rule.threshold) + 0.1
                    : Math.max(Number(rule.threshold) - 0.1, 0);
            currentMetric = { value: healthyValue, samples: 100 };
        }
    } else {
        // Real mode: Calls RPC (which needs to be defined in Supabase)
        const windowStart = new Date(Date.now() - rule.window_minutes * 60000).toISOString();
        const { data, error } = await supabase.rpc('calculate_metric', {
            metric_name: rule.metric_name,
            segment: rule.segment,
            since: windowStart,
        });

        if (error) {
            if (error.code === 'PGRST202') return { rule_key: rule.rule_key, status: 'skipped', reason: 'Missing metric function' };
            throw error;
        }
        currentMetric = normalizeMetric(data);
    }

    if (currentMetric.samples < rule.min_samples) {
        return { rule_key: rule.rule_key, status: 'skipped', reason: 'insufficient_data' };
    }

    const isTriggered = checkThreshold(currentMetric.value, rule.threshold, rule.rule_key);

    const { data: existingIncidents } = await supabase
        .from('alert_incidents')
        .select('id, status, last_seen_at')
        .eq('fingerprint', fingerprint)
        .in('status', ['open', 'ack'])
        .order('opened_at', { ascending: false })
        .limit(1);

    const activeIncident = existingIncidents?.[0];

    const { data: historicalIncidents } = await supabase
        .from('alert_incidents')
        .select('id, status')
        .eq('fingerprint', fingerprint)
        .order('opened_at', { ascending: false })
        .limit(1);

    const historicalIncident = historicalIncidents?.[0];

    if (isTriggered) {
        if (!activeIncident) {
            const incidentPayload = {
                rule_key: rule.rule_key,
                segment: rule.segment,
                status: 'open',
                opened_at: new Date().toISOString(),
                last_seen_at: new Date().toISOString(),
                resolved_at: null,
                resolution_reason: null,
                evidence: { value: currentMetric.value, threshold: rule.threshold, samples: currentMetric.samples },
                fingerprint
            };

            if (historicalIncident) {
                const { error: reopenError } = await supabase
                    .from('alert_incidents')
                    .update({
                        ...incidentPayload,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', historicalIncident.id);

                if (reopenError) throw reopenError;
                await logIncidentHistoryEntry(supabase, historicalIncident.id, historicalIncident.status, 'open', 'Incident reopened by alert sweep');
                return { rule_key: rule.rule_key, status: 'incident_reopened', id: historicalIncident.id };
            }

            const { data: newInc, error: insertError } = await supabase
                .from('alert_incidents')
                .insert(incidentPayload)
                .select()
                .single();
            if (insertError) throw insertError;
            await logIncidentHistoryEntry(supabase, newInc?.id, null, 'open', 'Incident opened by alert sweep');
            return { rule_key: rule.rule_key, status: 'incident_opened', id: newInc?.id };
        } else {
            await supabase.from('alert_incidents').update({ last_seen_at: new Date().toISOString() }).eq('id', activeIncident.id);
            return { rule_key: rule.rule_key, status: 'incident_updated', id: activeIncident.id };
        }
    } else if (activeIncident) {
        await supabase.from('alert_incidents').update({
            status: 'resolved',
            resolved_at: new Date().toISOString(),
            resolution_reason: 'Auto-resolved: Healthy state'
        }).eq('id', activeIncident.id);
        await logIncidentHistoryEntry(supabase, activeIncident.id, activeIncident.status, 'resolved', 'Auto-resolved by alert sweep');
        return { rule_key: rule.rule_key, status: 'incident_resolved', id: activeIncident.id };
    }

    return { rule_key: rule.rule_key, status: 'healthy' };
}

function checkThreshold(value: number, threshold: number, key: string) {
    if (key.includes('drop') || key.includes('gap')) return value < threshold;
    return value > threshold;
}

async function logIncidentHistoryEntry(
    supabase: SweepClient,
    incidentId: string | undefined,
    fromStatus: string | null,
    toStatus: 'open' | 'ack' | 'resolved',
    reason: string
) {
    if (!incidentId) return;
    await supabase.from('alert_incident_history').insert({
        incident_id: incidentId,
        from_status: fromStatus,
        to_status: toStatus,
        changed_by: 'system-sweep',
        changed_by_role: 'system',
        reason
    });
}
