import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { API, normalizeMessages } from '../../pages/chatsPage/chatUtils';
import { useNotificationContext } from '../../context/NotificationContext';

export function useChats() {
    const token = localStorage.getItem('access');
    const navigate = useNavigate();
    const { chatId } = useParams();
    const [searchParams, setSearchParams] = useSearchParams();

    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [filter, _setFilter] = useState(searchParams.get('filter') || 'all');
    const setFilter = useCallback((f) => {
        _setFilter(f);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (f === 'all') next.delete('filter'); else next.set('filter', f);
            return next;
        }, { replace: true });
    }, [setSearchParams]);
    const [searchQuery, setSearchQuery] = useState('');
    const [requestsCount, setRequestsCount] = useState(0);
    const [selectedChat, setSelectedChat] = useState(null);
    const [showRequests, _setShowRequests] = useState(searchParams.get('view') === 'requests');
    const setShowRequests = useCallback((val) => {
        _setShowRequests(val);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (val) next.set('view', 'requests'); else next.delete('view');
            return next;
        }, { replace: true });
    }, [setSearchParams]);
    const [chatRequests, setChatRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestMessages, setRequestMessages] = useState([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    const didAutoSelectRef = useRef(false);
    // Ref to avoid stale closure in the chat listener callback
    const selectedChatRef = useRef(null);
    useEffect(() => { selectedChatRef.current = selectedChat; }, [selectedChat]);

    // ── Notification context — one shared WS for the whole app ────────────
    const { registerChatListener } = useNotificationContext();

    useEffect(() => {
        const unregister = registerChatListener((data) => {
            const { conversation_id, preview, sender_username } = data;
            setChats(prev => prev.map(chat => {
                if (chat.id !== conversation_id) return chat;
                const isActive = selectedChatRef.current?.id === conversation_id;
                return {
                    ...chat,
                    unread_count: isActive ? chat.unread_count : (chat.unread_count || 0) + 1,
                    preview: preview ? `${sender_username}: ${preview}` : chat.preview,
                    last_message_time: new Date().toISOString(),
                };
            }));
        });
        return unregister;
    }, [registerChatListener]);

    // ── Loaders ───────────────────────────────────────────────────────────

    const loadUser = useCallback(async () => {
        if (!token) { setUserLoading(false); return; }
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) setUser(data);
        } catch { }
        finally { setUserLoading(false); }
    }, [token]);

    const fetchChats = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/chats/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            const unique = data.reduce((acc, chat) => {
                const key = chat.name + chat.avatar;
                const existing = acc.find(c => c.name + c.avatar === key);
                if (!existing) {
                    acc.push(chat);
                } else if (
                    chat.id.toString() === chatId ||
                    (chat.last_message_time &&
                        (!existing.last_message_time ||
                            new Date(chat.last_message_time) > new Date(existing.last_message_time)))
                ) {
                    acc[acc.indexOf(existing)] = chat;
                }
                return acc;
            }, []);

            setChats(unique.map(chat => ({
                ...chat,
                userId: chat.other_member_id || chat.user_id || null,
            })));
        } catch (err) {
            console.error('fetchChats error:', err);
        } finally {
            setLoadingChats(false);
        }
    }, [token, chatId]);

    // ── Bootstrap ─────────────────────────────────────────────────────────

    useEffect(() => {
        Promise.all([fetchChats(), loadUser()]);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        fetch(`${API}/api/chat-requests/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => r.json())
            .then(data => {
                setRequestsCount(data.length);
                setChatRequests(data);
            })
            .catch(() => { });
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Auto-select chat from URL
    useEffect(() => {
        if (chatId && chats.length > 0 && !didAutoSelectRef.current) {
            didAutoSelectRef.current = true;
            const target = chats.find(c => c.id.toString() === chatId);
            if (target) setSelectedChat(target);
        }
    }, [chatId, chats]);

    // ── Derived state ─────────────────────────────────────────────────────

    const academicGroups = useMemo(
        () => chats.filter(c => c.is_group && c.is_academic),
        [chats]
    );

    const sortedChats = useMemo(() =>
        [...chats].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
        }),
        [chats]
    );

    // ── Chat actions ──────────────────────────────────────────────────────

    const selectChat = useCallback((chat) => {
        setSelectedChat(chat);
        navigate(`/chats/${chat.id}`);
        // Clear unread immediately when opening
        setChats(prev => prev.map(c =>
            c.id === chat.id ? { ...c, unread_count: 0 } : c
        ));
    }, [navigate]);

    const togglePin = useCallback(async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/pin/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok)
            setChats(prev => prev.map(c => c.id === id ? { ...c, is_pinned: !c.is_pinned } : c));
    }, [token]);

    const markUnread = useCallback(async (chat) => {
        const isCurrentlyUnread = chat.unread_count > 0;
        const endpoint = isCurrentlyUnread ? 'mark-read' : 'mark-unread';
        const res = await fetch(`${API}/api/chats/${chat.id}/${endpoint}/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok)
            setChats(prev =>
                prev.map(c =>
                    c.id === chat.id
                        ? { ...c, unread_count: isCurrentlyUnread ? 0 : (c.unread_count || 0) + 1 }
                        : c
                )
            );
    }, [token]);

    const clearChat = useCallback(async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/clear/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok)
            setChats(prev =>
                prev.map(c =>
                    c.id === id ? { ...c, preview: null, last_message_time: null, time: null } : c
                )
            );
    }, [token]);

    const deleteChat = useCallback(async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChats(prev => prev.filter(c => c.id !== id));
            setSelectedChat(prev => (prev?.id === id ? null : prev));
        }
    }, [token]);

    const toggleMute = useCallback(async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/mute/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok)
            setChats(prev => prev.map(c => c.id === id ? { ...c, is_muted: !c.is_muted } : c));
    }, [token]);

    const blockUser = useCallback(async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/block/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok)
            setChats(prev => prev.map(c => c.id === id ? { ...c, is_blocked: !c.is_blocked } : c));
    }, [token]);

    const reportUser = useCallback(async (id) => {
        await fetch(`${API}/api/chats/${id}/report/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
    }, [token]);

    // ── Request actions ───────────────────────────────────────────────────

    const openRequest = useCallback(async (req) => {
        setSelectedRequest(req);
        try {
            const res = await fetch(`${API}/api/chats/${req.conversation_id}/messages/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setRequestMessages(normalizeMessages(data));
        } catch { }
    }, [token]);

    const acceptRequest = useCallback(async (conversationId) => {
        const res = await fetch(`${API}/api/chats/${conversationId}/accept/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChatRequests(prev => prev.filter(r => r.conversation_id !== conversationId));
            setRequestsCount(prev => prev - 1);
            setSelectedRequest(null);
            setShowRequests(false);
        }
    }, [token]);

    const blockRequest = useCallback(async (conversationId) => {
        const res = await fetch(`${API}/api/chats/${conversationId}/block/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChatRequests(prev => prev.filter(r => r.conversation_id !== conversationId));
            setRequestsCount(prev => prev - 1);
            setSelectedRequest(null);
        }
    }, [token]);

    const deleteRequest = useCallback(async (conversationId) => {
        const res = await fetch(`${API}/api/chats/${conversationId}/`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChatRequests(prev => prev.filter(r => r.conversation_id !== conversationId));
            setRequestsCount(prev => prev - 1);
        }
    }, [token]);

    const markRead = useCallback((id) => {
        setChats(prev => prev.map(c => c.id === id ? { ...c, unread_count: 0 } : c));
    }, []);

    return {
        user, userLoading, chats, loadingChats,
        filter, setFilter,
        searchQuery, setSearchQuery,
        requestsCount,
        selectedChat, setSelectedChat,
        showRequests, setShowRequests,
        chatRequests, setChatRequests,
        selectedRequest, setSelectedRequest,
        requestMessages,
        showCreateGroup, setShowCreateGroup,
        academicGroups, sortedChats,
        selectChat, togglePin, markUnread, clearChat, deleteChat,
        toggleMute, blockUser, reportUser,
        openRequest, acceptRequest, blockRequest, deleteRequest,
        markRead,
        token, navigate,
    };
}