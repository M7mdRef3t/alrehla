const USER_ID_KEY = 'maraya_user_id';
const SESSION_ID_KEY = 'maraya_session_id';
const DISPLAY_NAME_KEY = 'maraya_display_name';

function createId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateUserId() {
  const existing = localStorage.getItem(USER_ID_KEY);
  if (existing) return existing;
  const next = createId('mr_user');
  localStorage.setItem(USER_ID_KEY, next);
  return next;
}

export function getOrCreateSessionId() {
  const existing = localStorage.getItem(SESSION_ID_KEY);
  if (existing) return existing;
  const next = createId('mr_sess');
  localStorage.setItem(SESSION_ID_KEY, next);
  return next;
}

export function rotateSessionId() {
  const next = createId('mr_sess');
  localStorage.setItem(SESSION_ID_KEY, next);
  return next;
}

export function getDefaultDisplayName() {
  const userId = getOrCreateUserId();
  return `Mirror-${userId.slice(-4)}`;
}

export function getStoredDisplayName() {
  const existing = localStorage.getItem(DISPLAY_NAME_KEY);
  if (existing) return existing;
  const fallback = getDefaultDisplayName();
  localStorage.setItem(DISPLAY_NAME_KEY, fallback);
  return fallback;
}

export function setStoredDisplayName(name) {
  const normalized = String(name || '').trim();
  const next = normalized || getDefaultDisplayName();
  localStorage.setItem(DISPLAY_NAME_KEY, next);
  return next;
}
