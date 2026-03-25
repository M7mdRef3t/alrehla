"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell } from "lucide-react";
import {
  getNotificationPermission,
  enableNotificationsWithPrompt,
  type NotificationPermission,
} from "../services/pushNotifications";

/**
 * NotificationEnableButton
 * A floating pill button to enable browser push notifications.
 * Shows only if permission is "default" (not yet decided).
 * Hides after the user grants or denies.
 */
export function NotificationEnableButton() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setPermission(getNotificationPermission());
  }, []);

  // Only show if not yet decided
  if (permission !== "default") return null;

  const handleEnable = async () => {
    setLoading(true);
    const result = await enableNotificationsWithPrompt();
    setPermission(result);
    setLoading(false);
  };

  return (
    <AnimatePresence>
      <motion.button
        key="notif-btn"
        initial={{ opacity: 0, y: 20, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        transition={{ delay: 2, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onClick={handleEnable}
        disabled={loading}
        className={`
          fixed bottom-24 left-4 z-40 
          flex items-center gap-2 
          px-4 py-2.5 rounded-full 
          bg-slate-800/90 backdrop-blur-xl
          border border-white/10
          text-slate-300 text-xs font-bold
          shadow-[0_8px_32px_rgba(0,0,0,0.4)]
          transition-all hover:bg-slate-700/90
          md:bottom-6 md:left-6
          disabled:opacity-60
        `}
        aria-label="تفعيل الإشعارات"
      >
        {loading ? (
          <Bell className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <Bell className="w-3.5 h-3.5 text-teal-400" />
        )}
        <span>الإشعارات</span>
      </motion.button>
    </AnimatePresence>
  );
}
