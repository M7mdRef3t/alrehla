import { memo, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ShieldAlert, Zap as Sparkles, X, Activity } from "lucide-react";

export interface SystemNotification {
  id: string;
  type: "system" | "journey" | "alert";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export const useInAppNotifications = () => {
  // Mocked state for the new In-App Notification Center
  const [notifications, setNotifications] = useState<SystemNotification[]>([
    {
      id: "1",
      type: "alert",
      title: "Pulse Anomaly Detected",
      message: "Jarvis noticed a spike in stress levels. Take a breath.",
      timestamp: Date.now() - 1000 * 60 * 5,
      read: false
    },
    {
      id: "2",
      type: "journey",
      title: "New Pathway Unlocked",
      message: "You've gained access to the Deep Reflection node.",
      timestamp: Date.now() - 1000 * 60 * 60,
      read: false
    }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return { notifications, unreadCount, markAllAsRead, markAsRead, clearNotification };
};

export const InAppNotificationCenter = memo(function InAppNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const { notifications, unreadCount, markAllAsRead, markAsRead, clearNotification } = useInAppNotifications();

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node) && bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const toggleOpen = () => setIsOpen(prev => !prev);

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative z-50">
      <motion.button
        ref={bellRef}
        type="button"
        whileTap={{ scale: 0.9 }}
        onClick={toggleOpen}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all bg-white/[0.05] hover:bg-white/[0.1] ${unreadCount > 0 ? 'text-teal-400' : 'text-slate-400'}`}
      >
        <Bell className="w-5 h-5" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-teal-400 ring-2 ring-slate-900 border-2 border-[var(--page-bg)] animate-pulse"
            />
          )}
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute left-0 top-12 w-80 rounded-2xl overflow-hidden bg-[#0A0E17]/80 backdrop-blur-3xl border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
            dir="rtl"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">System Logs</h3>
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-teal-400 hover:text-teal-300 font-bold uppercase tracking-widest transition-colors">
                    Mark Read
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-slate-400 text-xs">No active alerts.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  <AnimatePresence>
                    {notifications.map(n => (
                      <motion.div 
                        key={n.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => markAsRead(n.id)}
                        className={`p-4 border-b border-white/[0.05] cursor-pointer hover:bg-white/[0.02] flex items-start gap-3 transition-colors ${!n.read ? 'bg-teal-500/[0.03]' : ''}`}
                      >
                        <div className="mt-0.5 relative shrink-0">
                          {n.type === 'alert' && <ShieldAlert className={`w-4 h-4 ${!n.read ? 'text-rose-400' : 'text-slate-500'}`} />}
                          {n.type === 'journey' && <Sparkles className={`w-4 h-4 ${!n.read ? 'text-amber-400' : 'text-slate-500'}`} />}
                          {n.type === 'system' && <Bell className={`w-4 h-4 ${!n.read ? 'text-teal-400' : 'text-slate-500'}`} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`text-xs font-bold mb-1 ${!n.read ? 'text-white' : 'text-slate-300'}`}>{n.title}</h4>
                          <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{n.message}</p>
                          <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase">{formatTime(n.timestamp)}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); clearNotification(n.id); }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded"
                        >
                          <X className="w-3 h-3 text-slate-500 hover:text-rose-400" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
