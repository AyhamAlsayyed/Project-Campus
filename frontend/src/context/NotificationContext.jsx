import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
    const token = localStorage.getItem('access');

    // ── Real-time app notifications (likes, comments, follows, etc.) ──
    const [liveNotifications, setLiveNotifications] = useState([]);
    const [liveNotifCount, setLiveNotifCount] = useState(0);

    // ── Chat message listeners (registered by Usechats) ──
    const chatListenersRef = useRef([]);

    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const intentionalClose = useRef(false);

    const connect = useCallback(() => {
        if (!token) return;
        if (
            wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING
        ) return;

        const ws = new WebSocket(
            `${WS_BASE}/ws/notifications/?token=${encodeURIComponent(token)}`
        );
        wsRef.current = ws;

        ws.onopen = () => console.info('[NotifWS] Connected');

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                if (data.type === 'new_message') {
                    // Route to all registered chat listeners (Usechats)
                    chatListenersRef.current.forEach(cb => cb(data));
                } else {
                    // Regular app notification → update bell
                    setLiveNotifications(prev => [data, ...prev]);
                    setLiveNotifCount(prev => prev + 1);
                }
            } catch (e) {
                console.error('[NotifWS] Bad payload', e);
            }
        };

        ws.onclose = () => {
            wsRef.current = null;
            if (!intentionalClose.current) {
                reconnectTimer.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = (err) => console.error('[NotifWS] Error', err);
    }, [token]);

    useEffect(() => {
        intentionalClose.current = false;
        connect();
        return () => {
            intentionalClose.current = true;
            clearTimeout(reconnectTimer.current);
            wsRef.current?.close(1000, 'Unmounting');
            wsRef.current = null;
        };
    }, [connect]);

    // Usechats registers a callback to receive chat message events
    const registerChatListener = useCallback((cb) => {
        chatListenersRef.current.push(cb);
        return () => {
            chatListenersRef.current = chatListenersRef.current.filter(c => c !== cb);
        };
    }, []);

    const clearLiveNotifCount = useCallback(() => setLiveNotifCount(0), []);

    return (
        <NotificationContext.Provider value={{
            liveNotifications,
            liveNotifCount,
            clearLiveNotifCount,
            registerChatListener,
        }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotificationContext() {
    return useContext(NotificationContext);
}