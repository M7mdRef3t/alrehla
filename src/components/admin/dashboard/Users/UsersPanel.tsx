import type { FC } from "react";
import { useState, useEffect } from "react";
import { Users, Loader2, X } from "lucide-react";
import { isSupabaseReady } from "../../../../services/supabaseClient";
import {
  fetchVisitorSessions,
  fetchJourneyMap,
  fetchSessionEvents,
  type SessionEventRow,
  type VisitorSessionSummary,
  type JourneyMapSnapshot,
} from "../../../../services/adminApi";

export const UsersPanel: FC = () => {
  const [query, setQuery] = useState("");
  const [visitorSessions, setVisitorSessions] = useState<VisitorSessionSummary[] | null>(null);
  const [godViewOpen, setGodViewOpen] = useState(false);
  const [godViewLoading, setGodViewLoading] = useState(false);
  const [godViewError, setGodViewError] = useState("");
  const [godViewSnapshot, setGodViewSnapshot] = useState<JourneyMapSnapshot | null>(null);
  const [godViewSessionId, setGodViewSessionId] = useState<string | null>(null);
  const [journeyLogOpen, setJourneyLogOpen] = useState(false);
  const [journeyLogLoading, setJourneyLogLoading] = useState(false);
  const [journeyLogEvents, setJourneyLogEvents] = useState<SessionEventRow[]>([]);

  useEffect(() => {
    if (!isSupabaseReady) return;
    const refresh = () => {
      fetchVisitorSessions(300).then(setVisitorSessions);
    };
    refresh();
    const timer = setInterval(refresh, 30000);
    return () => clearInterval(timer);
  }, []);

  const openGodView = async (sessionId: string) => {
    setGodViewSessionId(sessionId);
    setGodViewSnapshot(null);
    setGodViewError("");
    setGodViewOpen(true);
    setGodViewLoading(true);
    try {
      if (isSupabaseReady) {
        const data = await fetchJourneyMap(sessionId);
        if (data) setGodViewSnapshot(data);
        else setGodViewError("?? ???? ?????? ?????.");
      }
    } catch {
      setGodViewError("??? ?? ???????.");
    } finally {
      setGodViewLoading(false);
    }
  };

  const openJourneyLog = async (sessionId: string) => {
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

  const filteredSessions = (visitorSessions ?? []).filter((s) =>
    query.trim().length === 0 ? true : s.sessionId.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-200">
      <div className="admin-glass-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Users className="w-4 h-4" />
          ???? ?????????
        </h3>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="???? ???? ??????..."
          className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-200"
        />
      </div>

      <div className="admin-glass-card p-5 space-y-4">
        {filteredSessions.map((s) => (
          <div key={s.sessionId} className="flex items-center justify-between border border-slate-800 rounded-xl px-3 py-2">
            <div>
              <p className="font-semibold">{s.sessionId}</p>
              <p className="text-[10px] text-slate-500">?????: {s.eventsCount}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => openJourneyLog(s.sessionId)} className="text-[11px] border border-slate-700 px-2 py-1 rounded-full hover:border-teal-400">???</button>
              <button onClick={() => openGodView(s.sessionId)} className="text-[11px] border border-slate-700 px-2 py-1 rounded-full hover:border-teal-400">????</button>
            </div>
          </div>
        ))}
      </div>

      <GodViewModal isOpen={godViewOpen} onClose={() => setGodViewOpen(false)} loading={godViewLoading} error={godViewError} snapshot={godViewSnapshot} sessionId={godViewSessionId} />
      <VisitorJourneyModal isOpen={journeyLogOpen} onClose={() => setJourneyLogOpen(false)} loading={journeyLogLoading} events={journeyLogEvents} />
    </div>
  );
};

interface GodViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  error: string;
  snapshot: JourneyMapSnapshot | null;
  sessionId: string | null;
}

const GodViewModal: FC<GodViewModalProps> = ({ isOpen, onClose, loading, error, snapshot, sessionId }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">???? ?????</h3>
          <button onClick={onClose}><X /></button>
        </div>
        {sessionId && <p className="text-[11px] text-slate-500 mb-2">{sessionId}</p>}
        <div className="text-xs text-slate-300">
          {loading ? <Loader2 className="animate-spin" /> : `${snapshot?.nodes?.length || 0} nodes`}
        </div>
        {error && <p className="text-xs text-rose-400 mt-2">{error}</p>}
      </div>
    </div>
  );
};

interface VisitorJourneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  events: SessionEventRow[];
}

const VisitorJourneyModal: FC<VisitorJourneyModalProps> = ({ isOpen, onClose, loading, events }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-2xl rounded-3xl border border-slate-800 bg-slate-950 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold">??? ??????</h3>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="space-y-2 max-h-[60vh] overflow-auto">
          {loading ? (
            <Loader2 className="animate-spin" />
          ) : (
            events.map((e) => (
              <div key={e.id} className="border-b border-slate-800 py-2">
                <p className="font-semibold">{e.type}</p>
                <p className="text-[10px] text-slate-500">
                  {e.createdAt ? new Date(e.createdAt).toLocaleString("ar-EG") : "-"}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
