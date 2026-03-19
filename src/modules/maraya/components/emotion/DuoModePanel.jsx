import React from 'react';

export default function DuoModePanel({
  uiLanguage = 'en',
  roomId = '',
  status = 'idle',
  role = 'solo',
  selfName = '',
  partnerName = '',
  notice = '',
  error = '',
  joinCode = '',
  storyStarted = false,
  onNameChange,
  onJoinCodeChange,
  onHost,
  onJoin,
  onLeave,
}) {
  const isActive = role === 'host' || role === 'guest';
  const copy = uiLanguage === 'en'
    ? {
      heading: 'Duo Mode',
      host: 'Host room',
      join: 'Join room',
      leave: 'Leave duo',
      create: 'Create a room or join a partner with a code.',
      waitingGuest: `Room ${roomId} is waiting for a second traveler.`,
      waitingHost: `Joined ${roomId}. Waiting for ${partnerName || 'the host'} to start.`,
      connected: `Connected with ${partnerName || 'your partner'} in room ${roomId}.`,
      reconnecting: `Waiting for ${partnerName || 'your partner'} to reconnect.`,
      mirrorName: 'Your mirror name',
      mirrorPlaceholder: 'Mirror name',
      room: 'Room',
      role: 'Role',
      code: 'Code',
    }
    : {
      heading: 'الوضع الثنائي',
      host: 'أنشئ غرفة',
      join: 'انضم للغرفة',
      leave: 'غادر الوضع الثنائي',
      create: 'أنشئ غرفة أو انضم لشريك عبر الكود.',
      waitingGuest: `الغرفة ${roomId} تنتظر المسافر الثاني.`,
      waitingHost: `انضممت إلى ${roomId}. بانتظار ${partnerName || 'المضيف'} ليبدأ.`,
      connected: `متصل مع ${partnerName || 'شريكك'} في الغرفة ${roomId}.`,
      reconnecting: `بانتظار ${partnerName || 'شريكك'} ليعيد الاتصال.`,
      mirrorName: 'اسمك في المرآة',
      mirrorPlaceholder: 'اسمك',
      room: 'الغرفة',
      role: 'الدور',
      code: 'الكود',
    };

  const statusText = (() => {
    if (!isActive) return copy.create;
    if (status === 'reconnecting') return copy.reconnecting;
    if (role === 'host' && !partnerName) return copy.waitingGuest;
    if (role === 'guest' && !storyStarted) return copy.waitingHost;
    return copy.connected;
  })();

  return (
    <section className={`duo-mode-panel ${isActive ? 'duo-mode-panel--active' : ''}`} aria-label={copy.heading}>
      <div className="duo-mode-panel__header">
        <p className="duo-mode-panel__eyebrow">{copy.heading}</p>
        <p className="duo-mode-panel__status">{error || notice || statusText}</p>
      </div>

      <label className="duo-mode-panel__field">
        <span>{copy.mirrorName}</span>
        <input
          type="text"
          value={selfName}
          maxLength={32}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={copy.mirrorPlaceholder}
        />
      </label>

      {!isActive && (
        <div className="duo-mode-panel__actions">
          <button type="button" className="duo-mode-panel__btn duo-mode-panel__btn--primary" onClick={onHost}>
            {copy.host}
          </button>
          <div className="duo-mode-panel__join">
            <input
              type="text"
              value={joinCode}
              maxLength={6}
              onChange={(event) => onJoinCodeChange(event.target.value)}
              placeholder={copy.code}
            />
            <button type="button" className="duo-mode-panel__btn" onClick={onJoin}>
              {copy.join}
            </button>
          </div>
        </div>
      )}

      {isActive && (
        <div className="duo-mode-panel__room">
          <div className="duo-mode-panel__chip">
            <span>{copy.room}</span>
            <strong>{roomId}</strong>
          </div>
          <div className="duo-mode-panel__chip">
            <span>{copy.role}</span>
            <strong>{role}</strong>
          </div>
          <button type="button" className="duo-mode-panel__btn duo-mode-panel__btn--ghost" onClick={onLeave}>
            {copy.leave}
          </button>
        </div>
      )}
    </section>
  );
}

