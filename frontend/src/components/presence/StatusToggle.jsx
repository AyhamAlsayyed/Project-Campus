/**
 * StatusToggle.jsx
 *
 * Example UI component: lets the current user manually change their own status.
 * Also shows the connection health indicator.
 *
 * Wiring example — add <PresenceProvider> once, high in your tree:
 *
 *   // main.jsx / App.jsx
 *   import { PresenceProvider } from './PresenceContext';
 *
 *   <PresenceProvider>
 *     <App />
 *   </PresenceProvider>
 *
 * Then anywhere inside:
 *
 *   import StatusDot   from './StatusDot';
 *   import StatusToggle from './StatusToggle';
 *
 *   <StatusDot userId={42} size="md" />
 *   <StatusToggle myUserId={42} />
 */

import React, { useState } from 'react';
import { usePresence } from './PresenceContext';
import StatusDot from './StatusDot';

// ─── Available statuses the user can toggle to ────────────────────────────────

const STATUSES = [
  { value: 'online', label: '🟢  Online'         },
  { value: 'away',   label: '🟡  Away'           },
  { value: 'dnd',    label: '🔴  Do Not Disturb' },
  { value: 'offline',label: '⚫  Appear Offline'  },
];

// ─── Connection badge ─────────────────────────────────────────────────────────

const CONNECTION_BADGE = {
  connected:    { bg: '#dcfce7', text: '#15803d', dot: '#22c55e', label: 'Live' },
  connecting:   { bg: '#fef9c3', text: '#854d0e', dot: '#eab308', label: 'Connecting…' },
  disconnected: { bg: '#f1f5f9', text: '#475569', dot: '#94a3b8', label: 'Offline' },
  error:        { bg: '#fee2e2', text: '#b91c1c', dot: '#ef4444', label: 'Error' },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StatusToggle({ myUserId }) {
  const { changeMyStatus, connectionStatus, onlineUsers } = usePresence();
  const [open, setOpen] = useState(false);

  const myStatus = onlineUsers[myUserId] ?? 'online';
  const badge    = CONNECTION_BADGE[connectionStatus] ?? CONNECTION_BADGE.disconnected;

  const handleSelect = (status) => {
    changeMyStatus(status);
    setOpen(false);
  };

  return (
    <div style={{ display: 'inline-block', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>

      {/* ── Trigger button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 12px',
          border: '1px solid #e2e8f0',
          borderRadius: 8,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          color: '#1e293b',
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <StatusDot userId={myUserId} size="md" />
        <span>My Status</span>
        <span style={{ fontSize: 10, color: '#94a3b8' }}>▾</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 190,
            margin: 0,
            padding: '4px 0',
            border: '1px solid #e2e8f0',
            borderRadius: 8,
            background: '#fff',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
            listStyle: 'none',
            zIndex: 999,
          }}
        >
          {STATUSES.map(({ value, label }) => (
            <li
              key={value}
              role="option"
              aria-selected={myStatus === value}
              onClick={() => handleSelect(value)}
              style={{
                padding: '8px 14px',
                cursor: 'pointer',
                fontSize: 13,
                color: '#1e293b',
                background: myStatus === value ? '#f1f5f9' : 'transparent',
                fontWeight: myStatus === value ? 600 : 400,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f8fafc')}
              onMouseLeave={(e) => (e.currentTarget.style.background = myStatus === value ? '#f1f5f9' : 'transparent')}
            >
              {label}
            </li>
          ))}
        </ul>
      )}

      {/* ── Connection health badge ── */}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginLeft: 10,
          padding: '3px 8px',
          borderRadius: 999,
          background: badge.bg,
          fontSize: 11,
          fontWeight: 600,
          color: badge.text,
          verticalAlign: 'middle',
          letterSpacing: '0.02em',
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: badge.dot, flexShrink: 0,
        }} />
        {badge.label}
      </span>
    </div>
  );
}

// ─── Quick demo: UserCard consuming presence ──────────────────────────────────

/**
 * Example of how any component in the tree can show a live status dot
 * for any user — zero prop drilling needed.
 */
export function UserCard({ userId, username, avatarUrl }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 14px', border: '1px solid #e2e8f0',
      borderRadius: 10, width: 220, background: '#fff',
      fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Avatar with dot overlay */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img
          src={avatarUrl ?? `https://ui-avatars.com/api/?name=${username}&size=40&rounded=true`}
          alt={username}
          style={{ width: 40, height: 40, borderRadius: '50%', display: 'block' }}
        />
        {/* Dot pinned to bottom-right of avatar */}
        <span style={{
          position: 'absolute', bottom: 0, right: 0,
          border: '2px solid #fff', borderRadius: '50%',
          lineHeight: 0,
        }}>
          <StatusDot userId={userId} size="sm" />
        </span>
      </div>

      <div>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>{username}</div>
        <StatusDot userId={userId} size="sm" showLabel />
      </div>
    </div>
  );
}