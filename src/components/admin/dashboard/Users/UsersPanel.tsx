import type { FC } from "react";
import { useState, useEffect } from "react";
import { Users, Loader2, X } from "lucide-react";
import { isSupabaseReady, supabase } from "../../../../services/supabaseClient";
import {
    fetchUsers,
    fetchVisitorSessions,
    updateUserRole,
    fetchJourneyMap,
    fetchSessionEvents,
    type SessionEventRow,
    type VisitorSessionSummary,
    type JourneyMapSnapshot
} from "../../../../services/adminApi";
import {
    getTrackingMode,
    getSessionsWithProgress,
    setTrackingMode,
    getSessionTimelineEvents,
    getTrackingSessionId
} from "../../../../services/journeyTracking";
import { loadStoredState } from "../../../../services/localStore";
import { runtimeEnv } from "../../../../config/runtimeEnv";

const EVENT_LABELS: Record<string, string> = {
    flow_event: "خطوة في الرحلة",
    path_started: "بدأ مسار",
    task_started: "بدأ مهمة",
    task_completed: "أكمل مهمة",
    path_regenerated: "إعادة توليد المسار",
    node_added: "إضافة شخص",
    mood_logged: "تسجيل مزاج"
};

const FLOW_STEP_LABELS: Record<string, string> = {
    landing_viewed: "دخل الصفحة الرئيسية",
    landing_clicked_start: "ضغط ابدأ",
    auth_login_success: "سجل دخول",
    install_clicked: "ضغط تثبيت التطبيق",
    pulse_opened: "فتح البوصلة",
    pulse_completed: "أكمل البوصلة",
    add_person_opened: "فتح إضافة شخص",
    add_person_done_show_on_map: "أكمل إضافة الشخص",
    tools_opened: "فتح الأدوات"
};

const summarizeEvent = (event: SessionEventRow): string => {
    if (event.type === "flow_event") {
        const step = (event.payload as any)?.step || "";
        return FLOW_STEP_LABELS[step] ?? step;
    }
    return event.type;
};

export const UsersPanel: FC = () => {
    const [query, setQuery] = useState("");
    const trackingMode = getTrackingMode();
    const sessions = getSessionsWithProgress();
    const [remoteUsers, setRemoteUsers] = useState<any[] | null>(null);
    const [visitorSessions, setVisitorSessions] = useState<VisitorSessionSummary[] | null>(null);
    const [loading, setLoading] = useState(false);
    const [visitorLoading, setVisitorLoading] = useState(false);
    const [godViewOpen, setGodViewOpen] = useState(false);
    const [godViewLoading, setGodViewLoading] = useState(false);
    const [godViewError, setGodViewError] = useState("");
    const [godViewSnapshot, setGodViewSnapshot] = useState<JourneyMapSnapshot | null>(null);
    const [godViewSessionId, setGodViewSessionId] = useState<string | null>(null);
    const [journeyLogOpen, setJourneyLogOpen] = useState(false);
    const [journeyLogLoading, setJourneyLogLoading] = useState(false);
    const [journeyLogError, setJourneyLogError] = useState("");
    const [journeyLogSessionId, setJourneyLogSessionId] = useState<string | null>(null);
    const [journeyLogEvents, setJourneyLogEvents] = useState<SessionEventRow[]>([]);

    useEffect(() => {
        if (!isSupabaseReady) return;
        setLoading(true);
        fetchUsers().then(setRemoteUsers).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!isSupabaseReady) return;
        const refresh = () => {
            setVisitorLoading(true);
            fetchVisitorSessions(300).then(setVisitorSessions).finally(() => setVisitorLoading(false));
        };
        refresh();
        const timer = setInterval(refresh, 30000);
        return () => clearInterval(timer);
    }, []);

    const openGodView = async (sessionId: string) => {
        setGodViewSessionId(sessionId);
        setGodViewSnapshot(null);
        setGodViewOpen(true);
        setGodViewLoading(true);
        try {
            if (isSupabaseReady) {
                const data = await fetchJourneyMap(sessionId);
                if (data) setGodViewSnapshot(data);
                else setGodViewError("لا توجد بيانات خريطة.");
            }
        } catch {
            setGodViewError("خطأ في التحميل.");
        } finally {
            setGodViewLoading(false);
        }
    };

    const openJourneyLog = async (sessionId: string) => {
        setJourneyLogSessionId(sessionId);
        setJourneyLogOpen(true);
        setJourneyLogLoading(true);
        try {
            if (isSupabaseReady) {
                const data = await fetchSessionEvents(sessionId, 300);
                if (data) setJourneyLogEvents(data);
            }
        } finally {
            setJourneyLogLoading(false);
        }
    };

    return (
        <div className="space-y-6 text-slate-200">
            <div className="admin-glass-card p-5 space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    شؤون المسافرين
                </h3>
                <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ابحث برقم الجلسة أو البريد..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
                />
            </div>

            <div className="admin-glass-card p-5 space-y-4">
                {visitorSessions?.map((s) => (
                    <div key={s.sessionId} className="flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2">
                        <div>
                            <p className="font-semibold">{s.sessionId}</p>
                            <p className="text-[10px] text-slate-500">أحداث: {s.eventsCount}</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => openJourneyLog(s.sessionId)} className="text-[11px] border border-slate-700 px-2 py-1 rounded-full hover:border-teal-400">سجل</button>
                            <button onClick={() => openGodView(s.sessionId)} className="text-[11px] border border-slate-700 px-2 py-1 rounded-full hover:border-teal-400">نظرة</button>
                        </div>
                    </div>
                ))}
            </div>

            <GodViewModal isOpen={godViewOpen} onClose={() => setGodViewOpen(false)} loading={godViewLoading} error={godViewError} snapshot={godViewSnapshot} sessionId={godViewSessionId} />
            <VisitorJourneyModal isOpen={journeyLogOpen} onClose={() => setJourneyLogOpen(false)} loading={journeyLogLoading} error={journeyLogError} events={journeyLogEvents} />
        </div>
    );
};

const GodViewModal: FC<any> = ({ isOpen, onClose, loading, error, snapshot, sessionId }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">نظرة الإله</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="text-xs text-slate-300">
                    {loading ? <Loader2 className="animate-spin" /> : JSON.stringify(snapshot?.nodes?.length || 0) + " nodes"}
                </div>
            </div>
        </div>
    );
};

const VisitorJourneyModal: FC<any> = ({ isOpen, onClose, loading, events }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
            <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold">سجل الرحلة</h3>
                    <button onClick={onClose}><X /></button>
                </div>
                <div className="space-y-2 max-h-[60vh] overflow-auto">
                    {events.map((e: any) => (
                        <div key={e.id} className="border-b border-slate-800 py-2">
                            <p className="font-semibold">{e.type}</p>
                            <p className="text-[10px] text-slate-500">{new Date(e.createdAt).toLocaleString("ar-EG")}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
