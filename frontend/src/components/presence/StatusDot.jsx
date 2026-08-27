/**
 * StatusDot.jsx
 *
 * A reusable presence indicator dot.
 * Reads live status from PresenceContext — no props needed beyond userId.
 *
 * Usage:
 *   <StatusDot userId={12} />
 *   <StatusDot userId={12} size="lg" showLabel />
 */

import React from 'react';
import { usePresence } from '../../context/presenceContext';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  online:  { color: '#22c55e', label: 'Online'  },   // green
  away:    { color: '#f59e0b', label: 'Away'    },   // amber
  dnd:     { color: '#ef4444', label: 'Do Not Disturb' }, // red
  offline: { color: '#94a3b8', label: 'Offline' },   // slate
};

const SIZE_MAP = {
  sm: 8,
  md: 10,
  lg: 13,
};

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * @param {{ userId: number|string, size?: 'sm'|'md'|'lg', showLabel?: boolean }} props
 */
export default function StatusDot({ userId, size = 'md', showLabel = false }) {
  const { onlineUsers } = usePresence();

  const status = onlineUsers[String(userId)] ?? 'offline';
  const { color, label } = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;
  const px = SIZE_MAP[size] ?? SIZE_MAP.md;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
      title={label}
      aria-label={label}
    >
      <span
        style={{
          display: 'inline-block',
          width:  px,
          height: px,
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
          // Subtle pulse for 'online' only
          animation: status === 'online' ? 'presence-pulse 2.5s ease-in-out infinite' : 'none',
          boxShadow: status === 'online' ? `0 0 0 0 ${color}` : 'none',
        }}
      />
      {showLabel && (
        <span style={{ fontSize: 12, color: '#64748b', userSelect: 'none' }}>
          {label}
        </span>
      )}

      {/* Keyframes injected once; harmless if duplicated */}
      <style>{`
        @keyframes presence-pulse {
          0%   { box-shadow: 0 0 0 0 ${color}88; }
          70%  { box-shadow: 0 0 0 5px ${color}00; }
          100% { box-shadow: 0 0 0 0 ${color}00; }
        }
      `}</style>
    </span>
  );
}