import React, { useState, useEffect } from 'react';
import { Activity, Zap, ShieldAlert, Cpu, BarChart3, Clock } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

interface TelemetryPoint {
    service_name: string;
    total_calls: number;
    avg_latency: number;
    rejection_count: number;
    success_count: number;
    last_pulse: string;
}

export const LiveTelemetry: React.FC = () => {
    const [data, setData] = useState<TelemetryPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [resilience, setResilience] = useState({ insulated_count: 0, total: 10, percentage: 0 });
    const [broadcastLatency, setBroadcastLatency] = useState<number | null>(null);

    useEffect(() => {
        const fetchTelemetry = async () => {
            if (!supabase) return;
            const { data: logs, error } = await supabase
                .from('live_swarm_telemetry')
                .select('*');

            if (!error && logs) {
                setData(logs);
                const broadcast = logs.find(d => d.action === 'swarm_broadcast');
                if (broadcast) setBroadcastLatency(broadcast.avg_latency);
            }

            // Fetch Resilience Metrics
            const { data: resMetrics } = await supabase
                .from('swarm_resilience_metrics')
                .select('*')
                .single();

            if (resMetrics) {
                setResilience({
                    insulated_count: resMetrics.insulated_count,
                    total: resMetrics.total_pioneers,
                    percentage: resMetrics.resilience_percentage
                });
            }
            setLoading(false);
        };

        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 5000); // Pulse every 5s
        return () => clearInterval(interval);
    }, []);

    if (loading) return <div className="p-12 text-center text-cyan-400 animate-pulse">Initializing Pulse Link...</div>;

    const workerStats = data.find(d => d.service_name === 'awareness-worker');
    const evaluatorStats = data.find(d => d.service_name === 'chat-evaluator');

    const fairnessData = [
        { name: 'Approvals', value: evaluatorStats?.success_count || 0, color: '#10b981' },
        { name: 'Rejections', value: evaluatorStats?.rejection_count || 0, color: '#ef4444' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 bg-black min-h-screen text-slate-100 font-mono">
            {/* Header: Industrial Aesthetics */}
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter flex items-center gap-3">
                        <Activity className="text-emerald-400 w-8 h-8" />
                        SYSTEM_TELEMETRY: T-ZERO
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-2">
                        Monitoring Cluster: Alpha-Zero Pioneer Cohort (10/10)
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">Pulse Sync</span>
                    <span className="text-xs font-black text-white px-2 py-1 bg-white/5 rounded">ONLINE</span>
                </div>
            </div>

            {/* Top Grid: Real-time Pulses */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PulseCard
                    title="Edge Latency"
                    value={`${workerStats?.avg_latency.toFixed(0) || 0}ms`}
                    icon={<Zap className="w-5 h-5 text-amber-400" />}
                    trend="+12ms"
                    status="OPTIMAL"
                />
                <PulseCard
                    title="Resilience Buffer"
                    value={`${resilience.insulated_count}/${resilience.total}`}
                    icon={<ShieldAlert className={`w-5 h-5 ${resilience.insulated_count > 0 ? 'text-amber-400' : 'text-slate-600'}`} />}
                    trend={`${resilience.percentage.toFixed(0)}% Ready`}
                    status={resilience.insulated_count > 0 ? 'ARMORED' : 'VULNERABLE'}
                />
                <PulseCard
                    title="Broadcast Latency"
                    value={broadcastLatency ? `${Math.round(broadcastLatency)}ms` : 'N/A'}
                    icon={<Zap className="w-5 h-5 text-[var(--soft-teal)]" />}
                    trend="Syncing"
                    status={broadcastLatency ? 'ACTIVE' : 'IDLE'}
                />
                <PulseCard
                    title="System Stress"
                    value={`${data.reduce((acc, d) => acc + d.total_calls, 0)} Req/Hr`}
                    icon={<Cpu className="w-5 h-5 text-[var(--soft-teal)]" />}
                    trend="+5%"
                    status="SCALING"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Latency History */}
                <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-white/5">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Latency Pulse (Awareness Worker)
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="service_name" hide />
                                <YAxis stroke="#444" fontSize={10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#000', border: '1px solid #333' }}
                                    itemStyle={{ fontSize: 10, color: '#fff' }}
                                />
                                <Line type="monotone" dataKey="avg_latency" stroke="#fbbf24" strokeWidth={3} dot={{ fill: '#fbbf24' }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Fairness Breakdown */}
                <div className="p-8 bg-slate-900/40 rounded-[2rem] border border-white/5">
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-8 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Approval vs Rejection Ratio
                    </h3>
                    <div className="h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={fairnessData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                                <XAxis dataKey="name" stroke="#444" fontSize={10} />
                                <YAxis stroke="#444" fontSize={10} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    {fairnessData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Bottom Log Feed (Simulated for brevity) */}
            <div className="p-6 bg-slate-950/80 rounded-3xl border border-white/5">
                <h4 className="text-[10px] font-black text-[var(--soft-teal)] uppercase tracking-[0.3em] mb-4">Latest Evaluation Events</h4>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <span className="text-[8px] font-black text-slate-500 uppercase">14:02:15</span>
                                <span className="text-xs font-bold text-white">REJECTION: [User: P-00{i}] Semantic Inconsistency</span>
                            </div>
                            <span className="text-[8px] font-black px-2 py-0.5 bg-red-500/10 text-red-400 rounded">Evaluator Gate</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const PulseCard: React.FC<{ title: string, value: string, icon: React.ReactNode, trend: string, status: string }> = ({ title, value, icon, trend, status }) => (
    <div className="p-6 bg-slate-900/40 rounded-3xl border border-white/5 relative overflow-hidden group">
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <span className="text-[9px] font-black text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{status}</span>
        </div>
        <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</span>
            <div className="flex items-end gap-3">
                <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
                <span className="text-[10px] font-bold text-emerald-400 mb-1">{trend}</span>
            </div>
        </div>
    </div>
);


