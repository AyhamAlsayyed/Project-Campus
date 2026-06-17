import { useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const WS_BASE = API_URL.replace('https://', 'wss://').replace('http://', 'ws://');

export function useChatSocket({ conversationId, token, onMessage, onTyping }) {
    const wsRef = useRef(null);
    const reconnectTimer = useRef(null);
    const intentionalClose = useRef(false);

    // ← Store callbacks in refs so they never cause reconnects
    const onMessageRef = useRef(onMessage);
    const onTypingRef = useRef(onTyping);

    useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
    useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);

    const connect = useCallback(() => {
        if (!conversationId || !token) return;
        if (wsRef.current?.readyState === WebSocket.OPEN ||
            wsRef.current?.readyState === WebSocket.CONNECTING) return;

        const ws = new WebSocket(`${WS_BASE}/ws/chat/${conversationId}/?token=${encodeURIComponent(token)}`);
        wsRef.current = ws;

        ws.onopen = () => {
            console.info(`[Chat WS] Connected to conversation ${conversationId}`);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[Chat WS] received:', data);
                if (data.type === 'typing') {
                    onTypingRef.current?.(data);
                } else {
                    onMessageRef.current?.(data);
                }
            } catch (e) {
                console.error('[Chat WS] Bad payload', e);
            }
        };

        ws.onclose = (event) => {
            console.info(`[Chat WS] Closed (code=${event.code})`);
            wsRef.current = null;
            if (!intentionalClose.current) {
                reconnectTimer.current = setTimeout(connect, 3000);
            }
        };

        ws.onerror = (err) => {
            console.error('[Chat WS] Error', err);
        };
    }, [conversationId, token]); // ← only these two, no callbacks

    const sendMessage = useCallback((content, replyToId = null) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
            console.warn('[Chat WS] Socket not open');
            return false;
        }
        wsRef.current.send(JSON.stringify({
            action: 'message',
            content,
            parent_message_id: replyToId || null,
        }));
        return true;
    }, []);

    const sendTyping = useCallback((isTyping) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({
            action: 'typing',
            is_typing: isTyping,
        }));
    }, []);

    useEffect(() => {
        intentionalClose.current = false;
        connect();

        return () => {
            intentionalClose.current = true;
            clearTimeout(reconnectTimer.current);
            wsRef.current?.close(1000, 'Leaving chat');
            wsRef.current = null;
        };
    }, [connect]);

    return { sendMessage, sendTyping };
}