/**
 * PresenceContext.jsx
 *
 * Real-time user presence/status system using native WebSockets.
 * Connects to Django Channels ASGI backend with JWT auth via query param.
 *
 * Usage: Wrap your app (or a sub-tree) with <PresenceProvider />,
 * then consume via the usePresence() hook.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// ─── Constants ───────────────────────────────────────────────────────────────

const WS_URL            = 'ws://localhost:8000/ws/status/';
const TOKEN_KEY         = 'access';   
const INITIAL_BACKOFF   = 1_000;            // 1 s
const MAX_BACKOFF       = 30_000;           // 30 s
const MAX_RETRY_COUNT   = 10;

// WS close codes we should NOT retry after
const FATAL_CLOSE_CODES = new Set([
  4001, // Auth error (our custom backend code)
  4003, // Forbidden
  1008, // Policy violation
]);

// ─── Context ─────────────────────────────────────────────────────────────────

const PresenceContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────

/**
 * @typedef {'connecting' | 'connected' | 'disconnected' | 'error'} ConnectionStatus
 * @typedef {'online' | 'away' | 'dnd' | 'offline'} UserStatus
 * @typedef {Record<number|string, UserStatus>} OnlineUsersMap  userId → status
 */

export function PresenceProvider({ children }) {
  /** @type {[OnlineUsersMap, Function]} */
  const [onlineUsers, setOnlineUsers] = useState({});

  /** @type {[ConnectionStatus, Function]} */
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // ── Refs (don't trigger re-renders) ──────────────────────────────────────
  const wsRef              = useRef(null);   // live WebSocket instance
  const retryCountRef      = useRef(0);
  const retryTimerRef      = useRef(null);
  const intentionalClose   = useRef(false);  // true when WE closed the socket
  const myStatusRef        = useRef('online'); // tracks last status sent by this user

  // ── Helpers ───────────────────────────────────────────────────────────────

  const getToken = () => localStorage.getItem(TOKEN_KEY);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  // ── Core: connect ─────────────────────────────────────────────────────────

  const connect = useCallback(() => {
    const token = getToken();

    if (!token) {
      console.warn('[Presence] No JWT token found — skipping connection.');
      setConnectionStatus('disconnected');
      return;
    }

    // Already open or mid-handshake? bail.
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    intentionalClose.current = false;
    setConnectionStatus('connecting');

    const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(token)}`);
    wsRef.current = ws;

    // ── onopen ──────────────────────────────────────────────────────────────
    ws.onopen = () => {
      console.info('[Presence] WebSocket connected.');
      setConnectionStatus('connected');
      retryCountRef.current = 0; // reset backoff on success
    };

    // ── onmessage ───────────────────────────────────────────────────────────
    ws.onmessage = (event) => {
      let data;
      try {
        data = JSON.parse(event.data);
      } catch {
        console.error('[Presence] Received non-JSON payload:', event.data);
        return;
      }

      const { user_id, status } = data;

      if (!user_id || !status) {
        console.warn('[Presence] Malformed payload:', data);
        return;
      }

      setOnlineUsers((prev) => {
        // Remove user from map when they go fully offline
        if (status === 'offline') {
          const next = { ...prev };
          delete next[user_id];
          return next;
        }
        // Update or insert status
        if (prev[user_id] === status) return prev; // no-op — avoid unnecessary re-render
        return { ...prev, [user_id]: status };
      });
    };

    // ── onclose ─────────────────────────────────────────────────────────────
    ws.onclose = (event) => {
      console.info(`[Presence] WebSocket closed (code=${event.code}, reason="${event.reason}").`);
      wsRef.current = null;
      setConnectionStatus('disconnected');

      // Don't retry if we closed on purpose, or if the server sent a fatal code
      if (intentionalClose.current) return;
      if (FATAL_CLOSE_CODES.has(event.code)) {
        console.error('[Presence] Fatal close code — not retrying.');
        setConnectionStatus('error');
        return;
      }

      scheduleReconnect();
    };

    // ── onerror ─────────────────────────────────────────────────────────────
    ws.onerror = (err) => {
      // onerror always precedes onclose — log here, handle retry in onclose
      console.error('[Presence] WebSocket error:', err);
      setConnectionStatus('error');
    };
  }, []); // no deps — uses refs + localStorage, stable forever

  // ── Reconnect with exponential backoff ───────────────────────────────────

  const scheduleReconnect = useCallback(() => {
    if (retryCountRef.current >= MAX_RETRY_COUNT) {
      console.error('[Presence] Max reconnect attempts reached. Giving up.');
      setConnectionStatus('error');
      return;
    }

    const delay = Math.min(
      INITIAL_BACKOFF * 2 ** retryCountRef.current,
      MAX_BACKOFF
    );
    retryCountRef.current += 1;

    console.info(
      `[Presence] Scheduling reconnect #${retryCountRef.current} in ${delay}ms…`
    );

    retryTimerRef.current = setTimeout(() => {
      if (!intentionalClose.current && getToken()) {
        connect();
      }
    }, delay);
  }, [connect]);

  // ── Core: disconnect (clean logout / unmount) ────────────────────────────

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    clearRetryTimer();

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnecting intentionally.');
      wsRef.current = null;
    }

    setOnlineUsers({});
    setConnectionStatus('disconnected');
  }, []);

  // ── Outbound: change my status ───────────────────────────────────────────

  /**
   * Send a manual status change to the backend.
   * @param {UserStatus} newStatus
   */
  const changeMyStatus = useCallback((newStatus) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[Presence] Cannot send status update — socket is not open.');
      return;
    }
    myStatusRef.current = newStatus;
    wsRef.current.send(JSON.stringify({ status: newStatus }));
    console.info(`[Presence] Sent status: ${newStatus}`);
  }, []);

  // ── Lifecycle: mount / unmount ───────────────────────────────────────────

  useEffect(() => {
    if (getToken()) {
      connect();
    }

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // runs once on mount

  // ── Lifecycle: tab visibility (auto away) ────────────────────────────────

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      if (document.hidden) {
        changeMyStatus('away');
      } else {
        // Restore to whatever the user had set before, not always 'online'
        const restored = myStatusRef.current === 'away' ? 'online' : myStatusRef.current;
        changeMyStatus(restored);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [changeMyStatus]);

  // ── Lifecycle: allow re-connect if token appears later ───────────────────
  // (e.g. user logs in mid-session without a full page reload)

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== TOKEN_KEY) return;

      if (e.newValue) {
        // Token was added → connect
        intentionalClose.current = false;
        retryCountRef.current = 0;
        connect();
      } else {
        // Token was removed → treat as logout
        disconnect();
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [connect, disconnect]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    /** Live map of userId → status for all users currently known to be non-offline */
    onlineUsers,
    /** Current WebSocket connection state */
    connectionStatus,
    /** Send a manual status toggle to the server */
    changeMyStatus,
    /** Manually trigger (re-)connection, e.g. after login */
    connect,
    /** Cleanly close the socket, e.g. on logout */
    disconnect,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

// ─── Consumer Hook ────────────────────────────────────────────────────────────

/**
 * Access real-time presence state and controls from any component
 * inside <PresenceProvider />.
 *
 * @returns {{
 *   onlineUsers: OnlineUsersMap,
 *   connectionStatus: ConnectionStatus,
 *   changeMyStatus: (status: UserStatus) => void,
 *   connect: () => void,
 *   disconnect: () => void,
 * }}
 */
export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence() must be used inside <PresenceProvider />.');
  }
  return ctx;
}