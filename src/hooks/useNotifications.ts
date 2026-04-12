import { useState, useEffect, useCallback } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        const result = await Notification.requestPermission();
        setPermission(result);
        return result;
      }
      return Notification.permission;
    }
    return 'denied' as NotificationPermission;
  }, []);

  const sendNotification = useCallback(async (title: string, options?: NotificationOptions) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        // If Service Worker is active, use it (works better on mobile)
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          if (registration) {
            await registration.showNotification(title, {
              icon: '/icons/icon-192x192.png',
              badge: '/icons/icon-192x192.png',
              ...options,
            });
            return;
          }
        }
        
        // Fallback to standard Notification
        new Notification(title, {
          icon: '/icons/icon-192x192.png',
          ...options,
        });
      } catch (err) {
        console.error("Failed to showcase notification", err);
      }
    }
  }, []);

  return {
    permission,
    requestPermission,
    sendNotification,
    hasPermission: permission === 'granted'
  };
}
