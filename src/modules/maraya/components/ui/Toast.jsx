import React, { useEffect, useState } from 'react';
import './Toast.css';

const ICONS = {
  info: 'i',
  success: 'ok',
  warning: '!',
  error: 'x',
};

export function Toast({ id, type = 'info', message, duration = 5000, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (isPaused) return undefined;
    const timeoutId = setTimeout(() => {
      onDismiss?.(id);
    }, duration);
    return () => clearTimeout(timeoutId);
  }, [isPaused, id, duration, onDismiss]);

  return (
    <div
      className={`toast toast--${type}`}
      role={type === 'error' ? 'alert' : 'status'}
      aria-live={type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <span className="toast__icon" aria-hidden="true">{ICONS[type] || ICONS.info}</span>
      <span className="toast__message">{message}</span>
      <button type="button" className="toast__close" aria-label="Dismiss notification" onClick={() => onDismiss?.(id)}>
        x
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="toast-container" aria-label="Notifications">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

export default Toast;
