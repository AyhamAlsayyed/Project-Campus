import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API, normalizeMessages } from '../../pages/chatsPage/chatUtils';

export function useChats() {
    const token = localStorage.getItem('access');
    const navigate = useNavigate();
    const { chatId } = useParams();
 
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [requestsCount, setRequestsCount] = useState(0);
    const [selectedChat, setSelectedChat] = useState(null);
    const [showRequests, setShowRequests] = useState(false);
    const [chatRequests, setChatRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestMessages, setRequestMessages] = useState([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
 
    const didAutoSelectRef = useRef(false);
 
    // ── Loaders ──────────────────────────────────────────────────────────────
 
    const loadUser = useCallback(async () => {
        if (!token) { setUserLoading(false); return; }
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) setUser(data);
        } catch {}
        finally { setUserLoading(false); }
    }, [token]);
 
    const fetchChats = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/chats/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            // Deduplicate by name+avatar, prefer the entry matching the current URL
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
            setChats(unique);
        } catch (err) {
            console.error('fetchChats error:', err);
        } finally {
            setLoadingChats(false);
        }
    }, [token, chatId]);
 
    // ── Bootstrap ─────────────────────────────────────────────────────────────
 
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
            .catch(() => {});
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
 
    // Auto-select chat from URL — runs once after chats load
    useEffect(() => {
        if (chatId && chats.length > 0 && !didAutoSelectRef.current) {
            didAutoSelectRef.current = true;
            const target = chats.find(c => c.id.toString() === chatId);
            if (target) setSelectedChat(target);
        }
    }, [chatId, chats]);
 
    // ── Derived state ─────────────────────────────────────────────────────────
 
    const academicGroups = useMemo(
        () => chats.filter(c => c.is_group && c.is_academic),
        [chats]
    );
 
    // Only sort here — text search and tab filter are deferred inside ChatListPanel
    // so typing never blocks the list render.
    const sortedChats = useMemo(() =>
        [...chats].sort((a, b) => {
            if (a.is_pinned && !b.is_pinned) return -1;
            if (!a.is_pinned && b.is_pinned) return 1;
            return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
        }),
        [chats]
    );
 
    // ── Chat actions ──────────────────────────────────────────────────────────
    // All callbacks are stable (no `chats` array dependency) so React.memo'd
    // children won't re-render when unrelated chats update.
 
    const selectChat = useCallback((chat) => {
        setSelectedChat(chat);
        navigate(`/chats/${chat.id}`);
    }, [navigate]);
 
    const togglePin = useCallback(async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/pin/`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok)
            setChats(prev => prev.map(c => c.id === id ? { ...c, is_pinned: !c.is_pinned } : c));
    }, [token]);
 
    // Receives the full chat object so we avoid a stale `chats` closure dep
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
            // Functional update — no selectedChat dep needed
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
 
    // ── Request actions ───────────────────────────────────────────────────────
 
    const openRequest = useCallback(async (req) => {
        setSelectedRequest(req);
        try {
            const res = await fetch(`${API}/api/chats/${req.conversation_id}/messages/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setRequestMessages(normalizeMessages(data));
        } catch {}
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
        // ─ state ─
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
        // ─ derived ─
        academicGroups, sortedChats,
        // ─ actions ─
        selectChat, togglePin, markUnread, clearChat, deleteChat,
        toggleMute, blockUser, reportUser,
        openRequest, acceptRequest, blockRequest, deleteRequest,
        markRead,
        // ─ router ─
        token, navigate,
    };
}