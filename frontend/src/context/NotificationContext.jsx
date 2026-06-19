import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

const SOUND_COOLDOWN_MS = 3000;

function getAudioContext() {
    if (!window._sharedAudioCtx || window._sharedAudioCtx.state === 'closed') {
        window._sharedAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return window._sharedAudioCtx;
}

// Bell-like two-tone chime for app notifications
function playNotifSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        [[880, 0, 0.15], [1100, 0.15, 0.15]].forEach(([freq, delay, dur]) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + delay);
            gain.gain.setValueAtTime(0.18, now + delay);
            gain.gain.exponentialRampToValueAtTime(0.001, now + delay + dur);
            osc.start(now + delay);
            osc.stop(now + delay + dur + 0.05);
        });
    } catch (_) {}
}

// Soft "pop" for chat messages
function playChatSound() {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(700, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.2);
    } catch (_) {}
}

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
    const lastNotifSound = useRef(0);
    const lastChatSound = useRef(0);

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
                const now = Date.now();

                if (data.type === 'new_message') {
                    chatListenersRef.current.forEach(cb => cb(data));
                    if (now - lastChatSound.current > SOUND_COOLDOWN_MS) {
                        lastChatSound.current = now;
                        playChatSound();
                    }
                } else {
                    setLiveNotifications(prev => [data, ...prev]);
                    setLiveNotifCount(prev => prev + 1);
                    if (now - lastNotifSound.current > SOUND_COOLDOWN_MS) {
                        lastNotifSound.current = now;
                        playNotifSound();
                    }
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