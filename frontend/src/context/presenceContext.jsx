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

const WS_URL = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/status/';
const TOKEN_KEY = 'access';
const INITIAL_BACKOFF = 1_000;
const MAX_BACKOFF = 30_000;
const MAX_RETRY_COUNT = 10;

const FATAL_CLOSE_CODES = new Set([
  4001,
  4003,
  1008,
]);

// ─── Context ─────────────────────────────────────────────────────────────────

const PresenceContext = createContext(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function PresenceProvider({ children }) {
  const [onlineUsers, setOnlineUsers] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  const wsRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef(null);
  const intentionalClose = useRef(false);
  const myStatusRef = useRef('online');

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

    ws.onopen = () => {
      console.info('[Presence] WebSocket connected.');
      setConnectionStatus('connected');
      retryCountRef.current = 0;
    };

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
        const key = String(user_id);
        if (status === 'offline') {
          const next = { ...prev };
          delete next[key];
          return next;
        }
        if (prev[key] === status) return prev;
        return { ...prev, [key]: status };
      });
    };

    ws.onclose = (event) => {
      console.info(`[Presence] WebSocket closed (code=${event.code}, reason="${event.reason}").`);
      wsRef.current = null;
      setConnectionStatus('disconnected');

      if (intentionalClose.current) return;
      if (FATAL_CLOSE_CODES.has(event.code)) {
        console.error('[Presence] Fatal close code — not retrying.');
        setConnectionStatus('error');
        return;
      }

      scheduleReconnect();
    };

    ws.onerror = (err) => {
      console.error('[Presence] WebSocket error:', err);
      setConnectionStatus('error');
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

    console.info(`[Presence] Scheduling reconnect #${retryCountRef.current} in ${delay}ms…`);

    retryTimerRef.current = setTimeout(() => {
      if (!intentionalClose.current && getToken()) {
        connect();
      }
    }, delay);
  }, [connect]);

  // ── Core: disconnect ─────────────────────────────────────────────────────

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
  }, []);

  // ── Lifecycle: tab visibility (auto away) ────────────────────────────────

  useEffect(() => {
    const onVisibilityChange = () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      if (document.hidden) {
        changeMyStatus('away');
      } else {
        const restored = myStatusRef.current === 'away' ? 'online' : myStatusRef.current;
        changeMyStatus(restored);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [changeMyStatus]);

  // ── Lifecycle: auth event listeners ──────────────────────────────────────
  //
  // window.storage only fires in OTHER tabs, so we use custom DOM events
  // for same-tab login/logout:
  //
  //   Login handler:   localStorage.setItem('access', token);
  //                    window.dispatchEvent(new Event('auth:login'));
  //
  //   Logout handler:  window.dispatchEvent(new Event('auth:logout'));
  //                    localStorage.removeItem('access');

  useEffect(() => {
    const onLogin = () => {
      if (!getToken()) return;
      intentionalClose.current = false;
      retryCountRef.current = 0;
      connect();
    };

    const onLogout = () => {
      disconnect();
    };

    // Same-tab login/logout
    window.addEventListener('auth:login', onLogin);
    window.addEventListener('auth:logout', onLogout);

    // Cross-tab sync (storage event works correctly across tabs)
    const onStorage = (e) => {
      if (e.key !== TOKEN_KEY) return;
      if (e.newValue) onLogin();
      else onLogout();
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('auth:login', onLogin);
      window.removeEventListener('auth:logout', onLogout);
      window.removeEventListener('storage', onStorage);
    };
  }, [connect, disconnect]);

  // ── Context value ─────────────────────────────────────────────────────────

  const value = {
    onlineUsers,
    connectionStatus,
    changeMyStatus,
    connect,
    disconnect,
  };

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
}

// ─── Consumer Hook ────────────────────────────────────────────────────────────

export function usePresence() {
  const ctx = useContext(PresenceContext);
  if (!ctx) {
    throw new Error('usePresence() must be used inside <PresenceProvider />.');
  }
  return ctx;
}