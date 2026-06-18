import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './chatspage.module.css';
import {
    Search, MoreHorizontal, BellOff, MinusCircle,
    Ban, Reply, AlertCircle, Info, CheckSquare,
    Paperclip, Send, FileText, Pencil
} from 'lucide-react';
import { Download } from 'lucide-react';
import BackButton from '../../Assets/icons/arrow-left.png';
import CommentModal from '../../components/comments/commentsModal';
import GroupInfoPanel from '../../components/chat/groupInfoPanel';
import { API, normalizeMessages, getSenderName } from './chatUtils';
import ReportModal from '../../components/posts/ReportModal';
import { useChatSocket } from '../../hooks/useChatSocket';
import SharedAdModal from '../../components/chat/SharedAdModal';
import StatusDot from '../../components/presence/StatusDot';

function dotStyle(i) {
    return {
        display: 'inline-block',
        width: 7, height: 7,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.5)',
        animation: `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
    };
}

export default function ActiveChat({
    selectedChat, user, token,
    onBack, onClearChat, onDeleteChat, onMarkRead
}) {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]);
    const [pollOpen, setPollOpen] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [fullGroupData, setFullGroupData] = useState(null);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const [openPost, setOpenPost] = useState(null);
    const [openAdPost, setOpenAdPost] = useState(null);
    const [activeChatMenuOpen, setActiveChatMenuOpen] = useState(false);
    const [activeChatMenuRect, setActiveChatMenuRect] = useState(null);
    const [chatSearchOpen, setChatSearchOpen] = useState(false);
    const [chatSearchQuery, setChatSearchQuery] = useState('');
    const [searchResultIndex, setSearchResultIndex] = useState(0);
    const [visibleCount, setVisibleCount] = useState(50);
    const [reportTargetId, setReportTargetId] = useState(null);
    const [typingInfo, setTypingInfo] = useState(null);
    const [isMuted, setIsMuted] = useState(selectedChat?.is_muted || false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedMessages, setSelectedMessages] = useState(new Set());

    const messagesScrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messageRefs = useRef({});
    const activeChatMenuRef = useRef(null);
    const activeChatMenuBtnRef = useRef(null);
    const attachmentRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const typingTimer = useRef(null);
    const typingClearTimer = useRef(null);

    // ── scrollToBottom must be defined before handleWsMessage ──
    const scrollToBottom = useCallback(() => {
        if (chatSearchOpen) return;
        setTimeout(() => {
            if (messagesScrollRef.current)
                messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
        }, 50);
    }, [chatSearchOpen]);
    
    const handleWsMessage = useCallback((data) => {
        if (data.type !== 'chat_message') return;
        clearTimeout(typingClearTimer.current);
        setTypingInfo(null);

        const newMsg = {
            id: data.message_id,
            text: data.content,
            content: data.content,
            senderId: data.sender_id,
            sender: data.username,
            avatar: data.avatar || null,
            time: new Date(data.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: data.sent_at,
            reply_to_details: null,
            post: data.shared_post || null,
            type: 'text',
            media: [],
        };

        setMessages(prev => {
            const exists = prev.some(m => m.id === newMsg.id);
            return exists ? prev : [...prev, newMsg];
        });
        scrollToBottom();
    }, [scrollToBottom, token]);

    const handleWsTyping = useCallback((data) => {
        if (data.is_typing) {
            setTypingInfo({ username: data.username, avatar: data.avatar });
            clearTimeout(typingClearTimer.current);
            typingClearTimer.current = setTimeout(() => setTypingInfo(null), 3000);
        } else {
            clearTimeout(typingClearTimer.current);
            setTypingInfo(null);
        }
    }, []);

    const { sendMessage, sendTyping } = useChatSocket({
        conversationId: selectedChat?.id,
        token,
        onMessage: handleWsMessage,
        onTyping: handleWsTyping,
    });

    // ── Load messages on mount / chat change ──
    useEffect(() => {
        setMessages([]);
        setVisibleCount(50);
        setReplyingTo(null);
        setEditingMessage(null);
        setInputText('');
        setPendingFiles([]);
        setShowGroupInfo(false);

        const fetchMessages = async () => {
            try {
                const res = await fetch(`${API}/api/chats/${selectedChat.id}/messages/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setMessages(normalizeMessages(data));
            } catch (err) {
                console.error('Failed to load messages:', err);
            }
        };
        fetchMessages();
    }, [selectedChat.id]);

    // ── Fetch group details ──
    useEffect(() => {
        if (!selectedChat.is_group) return;
        const fetchGroupDetails = async () => {
            try {
                const res = await fetch(`${API}/api/groups/${selectedChat.id}/edit-details/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setFullGroupData(await res.json());
            } catch (err) {
                console.error('Failed to fetch group details', err);
            }
        };
        fetchGroupDetails();
    }, [selectedChat.id]);

    // ── Active chat menu position tracking ──
    useEffect(() => {
        if (!activeChatMenuOpen) return;
        const update = () => {
            if (activeChatMenuBtnRef.current)
                setActiveChatMenuRect(activeChatMenuBtnRef.current.getBoundingClientRect());
        };
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [activeChatMenuOpen]);

    // ── Outside click ──
    useEffect(() => {
        const handle = (e) => {
            if (attachmentMenuOpen && attachmentRef.current && !attachmentRef.current.contains(e.target))
                setAttachmentMenuOpen(false);
            if (activeChatMenuOpen && activeChatMenuRef.current && !activeChatMenuRef.current.contains(e.target)) {
                setActiveChatMenuOpen(false);
                setActiveChatMenuRect(null);
            }
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [attachmentMenuOpen, activeChatMenuOpen]);

    // ── Scroll to bottom on chat change ──
    useEffect(() => {
        if (!chatSearchOpen && messagesScrollRef.current)
            messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }, [selectedChat.id, messages.length]);

    // ── Search ──
    const searchedMessages = useMemo(() =>
        chatSearchQuery.trim()
            ? messages.filter(msg => msg.text?.toLowerCase().includes(chatSearchQuery.toLowerCase()))
            : [],
        [messages, chatSearchQuery]
    );

    useEffect(() => {
        if (searchedMessages.length > 0)
            scrollToMessage(searchedMessages[searchResultIndex]?.id);
    }, [chatSearchQuery]);

    const scrollToMessage = (id) => {
        const el = messageRefs.current[id];
        if (el && messagesScrollRef.current) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add(styles.highlightMessage);
            setTimeout(() => el.classList.remove(styles.highlightMessage), 1500);
        }
    };

    const handleMessageScroll = () => {
        if (messagesScrollRef.current?.scrollTop === 0)
            setVisibleCount(prev => prev + 50);
    };

    // ── Send message ──
    const handleSendMessage = async () => {
        sendTyping(false);
        clearTimeout(typingTimer.current);
        setTypingInfo(null);

        if (pendingFiles.length > 0) {
            const formData = new FormData();
            pendingFiles.forEach(pf => formData.append('images', pf.file));
            formData.append('file_type', pendingFiles[0].type);
            formData.append('text', inputText.trim());
            if (replyingTo) formData.append('reply_to', replyingTo.id);
            try {
                const res = await fetch(`${API}/api/chats/${selectedChat.id}/send/`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });
                if (res.ok) {
                    const newMsg = await res.json();
                    setMessages(prev => [...prev, ...normalizeMessages([newMsg])]);
                    setInputText(''); setPendingFiles([]); setReplyingTo(null);
                }
            } catch (err) { console.error('Error sending attachments:', err); }
        } else if (inputText.trim()) {
            const sent = sendMessage(inputText.trim(), replyingTo?.id ?? null);
            if (sent) {
                setInputText('');
                setReplyingTo(null);
                onMarkRead(selectedChat.id);
            } else {
                // fallback to REST if WS not open
                try {
                    const res = await fetch(`${API}/api/chats/${selectedChat.id}/send/`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ text: inputText, reply_to: replyingTo?.id ?? null }),
                    });
                    if (res.ok) {
                        const newMessage = await res.json();
                        setMessages(prev => [...prev, ...normalizeMessages([newMessage])]);
                        setInputText('');
                        setReplyingTo(null);
                        onMarkRead(selectedChat.id);
                    }
                } catch (err) { console.error('Error sending text:', err); }
            }
        }
        scrollToBottom();
    };

    // ── Edit Message ──
    const handleEditMessage = async () => {
        if (!inputText.trim() || !editingMessage) return;
        try {
            const res = await fetch(`${API}/api/messages/${editingMessage.id}/edit/`, {
                method: 'PATCH', // Assumes a standard REST PATCH/PUT method; change to POST if backend strictly requires it.
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ text: inputText.trim() })
            });
            
            if (res.ok) {
                setMessages(prev => prev.map(m => 
                    m.id === editingMessage.id 
                        ? { ...m, text: inputText.trim(), content: inputText.trim(), is_edited: true } 
                        : m
                ));
                setEditingMessage(null);
                setInputText('');
            }
        } catch (err) {
            console.error('Error editing message:', err);
        }
    };

    const handleFileSelect = (e, type) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => ({
            file, type,
            previewUrl: type === 'image' ? URL.createObjectURL(file) : null,
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            id: Math.random().toString(36).substr(2, 9)
        }));
        setPendingFiles(prev => [...prev, ...previews]);
        setAttachmentMenuOpen(false);
        e.target.value = '';
    };

    const removePendingFile = (id) => {
        setPendingFiles(prev => {
            const file = prev.find(f => f.id === id);
            if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
            return prev.filter(f => f.id !== id);
        });
    };

    const addPollOption = () => { if (pollOptions.length < 6) setPollOptions(prev => [...prev, '']); };
    const removePollOption = (index) => {
        if (pollOptions.length > 2) setPollOptions(prev => prev.filter((_, i) => i !== index));
    };

    const handleToggleMute = async () => {
        try {
            const res = await fetch(`${API}/api/chats/${selectedChat.id}/mute/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setIsMuted(prev => !prev);
        } catch (err) { console.error('Mute failed', err); }
    };

    const toggleMessageSelection = (msgId) => {
        setSelectedMessages(prev => {
            const next = new Set(prev);
            if (next.has(msgId)) next.delete(msgId);
            else next.add(msgId);
            return next;
        });
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedMessages(new Set());
    };

    const deleteSelectedMessages = async () => {
        const ids = [...selectedMessages];
        try {
            await Promise.all(ids.map(id =>
                fetch(`${API}/api/messages/${id}/delete/`, {
                    method: 'DELETE',
                    headers: { Authorization: `Bearer ${token}` },
                })
            ));
            setMessages(prev => prev.filter(m => !selectedMessages.has(m.id)));
        } catch (err) { console.error('Delete failed', err); }
        exitSelectionMode();
    };

    const copySelectedMessages = () => {
        const texts = messages
            .filter(m => selectedMessages.has(m.id))
            .map(m => m.text || m.content)
            .join('\n');
        navigator.clipboard.writeText(texts).catch(console.error);
        exitSelectionMode();
    };

    const visibleMessages = messages.slice(-visibleCount);
    const resolveUrl = (url) => url?.startsWith('http') ? url : `${API}${url}`;

    return (
        <div className={`${styles.chatList} ${styles.activeChatOuter}`}>
            <style>{`
                @keyframes typingBounce {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
                    30% { transform: translateY(-6px); opacity: 1; }
                }
            `}</style>
            {showGroupInfo ? (
                <GroupInfoPanel
                    group={fullGroupData || selectedChat}
                    API={API}
                    members={fullGroupData?.members || []}
                    currentUser={user}
                    token={token}
                    messages={messages}
                    otherMemberId={selectedChat?.other_member_id}
                    onBack={() => setShowGroupInfo(false)}
                    onMakeMemberAdmin={async (member) => {
                        await fetch(`${API}/api/groups/${selectedChat.id}/toggle-admin/`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ member_id: member.id })
                        });
                    }}
                    onRemoveMember={async (member) => {
                        const res = await fetch(`${API}/api/groups/${selectedChat.id}/remove-member/`, {
                            method: 'POST',
                            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                            body: JSON.stringify({ member_id: member.id })
                        });
                        if (res.ok) window.location.reload();
                    }}
                    onClearChat={() => onClearChat(selectedChat.id)}
                    onDeleteGroup={() => onDeleteChat(selectedChat.id)}
                />
            ) : (
                <div className={styles.innerChatContainer}>
                    {/* ── Header ── */}
                    {selectionMode ? (
                        <div className={styles.activeChatHeader} style={{ background: 'linear-gradient(-90deg, rgba(166,39,156,0.2), rgba(49,32,169,0.2))' }}>
                            <div className={styles.headerLeftWrapper}>
                                <button className={styles.iconBtn} onClick={exitSelectionMode}>
                                    <MinusCircle size={22} />
                                </button>
                                <span style={{ color: '#fff', fontWeight: 600, fontSize: '1.1rem' }}>
                                    {selectedMessages.size} selected
                                </span>
                            </div>
                            <div className={styles.headerRightWrapper}>
                                {selectedMessages.size > 0 && (
                                    <>
                                        <button className={styles.iconBtn} onClick={copySelectedMessages} title="Copy">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                            </svg>
                                        </button>
                                        <button className={`${styles.iconBtn}`} onClick={deleteSelectedMessages} title="Delete" style={{ color: '#ff4d4d' }}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                            </svg>
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.activeChatHeader}>
                            <div className={styles.headerLeftWrapper}>
                                <button className={styles.iconBtn} onClick={onBack}>
                                    <img src={BackButton} alt="" style={{ width: 22, height: 22, filter: 'brightness(0) invert(1) opacity(0.9)' }} />
                                </button>
                                <div className={styles.avatarStatusWrapper}>
                                    <img
                                        src={resolveUrl(selectedChat.avatar)}
                                        alt={selectedChat.name}
                                        className={styles.activeChatAvatar}
                                        onClick={() => {
                                            if (!selectedChat.is_group && selectedChat.other_member_id)
                                                window.location.href = `/profile/${selectedChat.other_member_id}`;
                                        }}
                                        style={!selectedChat.is_group ? { cursor: 'pointer' } : {}}
                                    />
                                    {!selectedChat.is_group && selectedChat.other_member_id && (
                                        <span className={styles.headerStatusDot}>
                                            <StatusDot userId={selectedChat.other_member_id} size="lg" />
                                        </span>
                                    )}
                                </div>
                                {!chatSearchOpen && (
                                    <div className={styles.headerTitleInfo}>
                                        {selectedChat.is_group && (
                                            <span className={styles.professorName}>{selectedChat.conversations_owner}</span>
                                        )}
                                        <h2 className={styles.groupName}>{selectedChat.name}</h2>
                                        {!selectedChat.is_group && selectedChat.full_name && (
                                            <span className={styles.headerFullName}>{selectedChat.full_name}</span>
                                        )}
                                        <p className={styles.memberSubtitle}>{selectedChat.members}</p>
                                    </div>
                                )}
                            </div>

                            {chatSearchOpen && (
                                <div className={styles.headerSearchExpanded}>
                                    <div className={styles.headerSearchInner}>
                                        <Search size={16} className={styles.headerSearchIcon} />
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="Search messages..."
                                            className={styles.headerSearchInput}
                                            value={chatSearchQuery}
                                            onChange={e => { setChatSearchQuery(e.target.value); setSearchResultIndex(0); }}
                                            onKeyDown={e => {
                                                if (e.key === 'Escape') { setChatSearchOpen(false); setChatSearchQuery(''); setSearchResultIndex(0); }
                                                if (e.key === 'Enter' && searchedMessages.length > 0) {
                                                    const next = (searchResultIndex + 1) % searchedMessages.length;
                                                    setSearchResultIndex(next);
                                                    scrollToMessage(searchedMessages[next].id);
                                                }
                                            }}
                                        />
                                        {chatSearchQuery.trim() && (
                                            <span className={styles.searchResultCount}>
                                                {searchedMessages.length === 0 ? 'No results' : `${searchResultIndex + 1} / ${searchedMessages.length}`}
                                            </span>
                                        )}
                                        {searchedMessages.length > 1 && (
                                            <>
                                                <button className={styles.searchNavBtn} onClick={() => {
                                                    const prev = (searchResultIndex - 1 + searchedMessages.length) % searchedMessages.length;
                                                    setSearchResultIndex(prev); scrollToMessage(searchedMessages[prev].id);
                                                }}>▲</button>
                                                <button className={styles.searchNavBtn} onClick={() => {
                                                    const next = (searchResultIndex + 1) % searchedMessages.length;
                                                    setSearchResultIndex(next); scrollToMessage(searchedMessages[next].id);
                                                }}>▼</button>
                                            </>
                                        )}
                                        {searchedMessages.length === 1 && chatSearchQuery.trim() && (
                                            <button className={styles.searchNavBtn} onClick={() => scrollToMessage(searchedMessages[0].id)}>↵</button>
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className={styles.headerRightWrapper}>
                                <button className={`${styles.iconBtn} ${chatSearchOpen ? styles.iconBtnActive : ''}`}
                                    onClick={() => { setChatSearchOpen(prev => !prev); setChatSearchQuery(''); setSearchResultIndex(0); }}>
                                    <Search size={30} />
                                </button>
                                <div className={styles.menuWrapper} ref={activeChatMenuRef}>
                                    <button ref={activeChatMenuBtnRef} className={styles.iconBtn}
                                        onClick={(e) => {
                                            if (activeChatMenuOpen) { setActiveChatMenuOpen(false); setActiveChatMenuRect(null); }
                                            else { setActiveChatMenuOpen(true); setActiveChatMenuRect(e.currentTarget.getBoundingClientRect()); }
                                        }}>
                                        <MoreHorizontal size={30} />
                                    </button>
                                    {activeChatMenuOpen && activeChatMenuRect && createPortal(
                                        <div className={styles.dropdownMenu}
                                            style={{ position: 'fixed', top: activeChatMenuRect.bottom + 8, right: window.innerWidth - activeChatMenuRect.right, zIndex: 999999 }}
                                            onMouseDown={e => e.stopPropagation()}>
                                            <button className={styles.menuItem} onClick={() => { setActiveChatMenuOpen(false); setActiveChatMenuRect(null); setShowGroupInfo(true); }}>
                                                <Info size={14} /> {selectedChat.is_group ? 'Group Info' : 'Chat Info'}
                                            </button>
                                            <button className={styles.menuItem} onClick={() => { handleToggleMute(); setActiveChatMenuOpen(false); setActiveChatMenuRect(null); }}>
                                                <BellOff size={14} /> {isMuted ? 'Unmute notifications' : 'Mute notifications'}
                                            </button>
                                            <button className={styles.menuItem} onClick={() => { setSelectionMode(true); setActiveChatMenuOpen(false); setActiveChatMenuRect(null); }}>
                                                <CheckSquare size={14} /> Select messages
                                            </button>
                                            <div className={styles.menuDivider} />
                                            <button className={`${styles.menuItem} ${styles.destructive}`} onClick={() => {
                                                setReportTargetId(selectedChat.is_group ? selectedChat.id : selectedChat.other_member_id);
                                                setActiveChatMenuOpen(false);
                                                setActiveChatMenuRect(null);
                                            }}>
                                                <AlertCircle size={14} /> {selectedChat.is_group ? 'Report group' : 'Report user'}
                                            </button>
                                        </div>,
                                        document.body
                                    )}
                                </div>
                            </div>
                        </div>
                    )} {/* end selectionMode conditional header */}

                    {/* ── Messages ── */}
                    <div className={styles.activeChatInnerContainer}>
                        <div className={styles.chatArea}>
                            <div className={styles.messagesScrollArea} ref={messagesScrollRef} onScroll={handleMessageScroll}>
                                {(() => {
                                    let lastDate = null;
                                    return visibleMessages.map((msg, msgIndex) => {
                                        const isMine = msg.senderId === 'me' || msg.senderId === user?.id;
                                        const msgDate = msg.date ? new Date(msg.date) : null;
                                        let dateLabel = null;
                                        if (msgDate) {
                                            const today = new Date();
                                            const yesterday = new Date();
                                            yesterday.setDate(today.getDate() - 1);
                                            const dateStr = msgDate.toDateString();
                                            if (dateStr !== lastDate) {
                                                lastDate = dateStr;
                                                if (msgDate.toDateString() === today.toDateString()) dateLabel = 'Today';
                                                else if (msgDate.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday';
                                                else dateLabel = msgDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                                            }
                                        }

                                        const prevMsg = msgIndex > 0 ? visibleMessages[msgIndex - 1] : null;
                                        const nextMsg = msgIndex < visibleMessages.length - 1 ? visibleMessages[msgIndex + 1] : null;
                                        const isGrouped = !dateLabel && prevMsg && prevMsg.senderId === msg.senderId;
                                        const nextMsgDate = nextMsg?.date ? new Date(nextMsg.date) : null;
                                        const currentMsgDate = msg.date ? new Date(msg.date) : null;
                                        const nextHasDateSeparator = nextMsgDate && currentMsgDate && nextMsgDate.toDateString() !== currentMsgDate.toDateString();
                                        const isLastInGroup = !nextMsg || nextMsg.senderId !== msg.senderId || nextHasDateSeparator;

                                        return (
                                            <div key={msg.id} ref={el => (messageRefs.current[msg.id] = el)}
                                                style={{ position: 'relative' }}>
                                                {dateLabel && <div className={styles.dateSeparator}><span>{dateLabel}</span></div>}
                                                {selectionMode && selectedMessages.has(msg.id) && (
                                                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(166,39,156,0.08)', pointerEvents: 'none', borderRadius: 8, zIndex: 0 }} />
                                                )}
                                                <div
                                                    className={`${styles.messageWrapper} ${isMine ? styles.messageMineWrapper : styles.messageOtherWrapper} ${isGrouped ? styles.messageGrouped : ''}`}
                                                    onClick={selectionMode ? () => toggleMessageSelection(msg.id) : undefined}
                                                    style={selectionMode ? { cursor: 'pointer', userSelect: 'none', position: 'relative', zIndex: 1 } : undefined}
                                                >
                                                    {/* Selection circle */}
                                                    {selectionMode && (
                                                        <div style={{
                                                            display: 'flex', alignItems: 'center', flexShrink: 0,
                                                            order: isMine ? 3 : -1,
                                                            padding: isMine ? '0 0 0 8px' : '0 8px 0 0',
                                                        }}>
                                                            <div style={{
                                                                width: 22, height: 22, borderRadius: '50%',
                                                                border: `2px solid ${selectedMessages.has(msg.id) ? '#A6279C' : 'rgba(255,255,255,0.35)'}`,
                                                                background: selectedMessages.has(msg.id) ? '#A6279C' : 'transparent',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                transition: 'all 0.15s ease', flexShrink: 0,
                                                            }}>
                                                                {selectedMessages.has(msg.id) && (
                                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                                                                        <polyline points="20 6 9 17 4 12" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {!isMine && (
                                                        isLastInGroup
                                                            ? <img src={resolveUrl(msg.avatar)} alt="Sender" className={styles.messageAvatar} />
                                                            : <div className={styles.messageAvatarSpacer} />
                                                    )}
                                                    <div className={styles.messageContentBlock}>
                                                        {!isGrouped && (
                                                            <div className={`${styles.messageMeta} ${isMine ? styles.metaRight : styles.metaLeft}`}>
                                                                <span className={styles.msgSenderName}>{isMine ? 'You' : getSenderName(msg.sender)}</span>
                                                                <span className={styles.msgTime}>{msg.time}</span>
                                                            </div>
                                                        )}
                                                        <div className={styles.messageRow}>
                                                            <div className={`
                                                                ${styles.messageBubble}
                                                                ${msg.post ? styles.bubblePost : isMine ? styles.bubbleMine : styles.bubbleOther}
                                                                ${isGrouped ? styles.bubbleGrouped : ''}
                                                                ${isLastInGroup ? styles.bubbleLastInGroup : ''}
                                                                ${msg.type === 'media' && msg.media?.every(m => (m.media_type || m.type) === 'image' || (m.media_type || m.type) === 'video') && !msg.text && !msg.reply_to_details ? styles.bubbleTransparent : ''}
                                                                ${msg.type === 'media' && msg.media?.some(m => !['image','video'].includes(m.media_type || m.type)) ? styles.bubbleFile : ''}
                                                            `}>
                                                                {msg.reply_to_details && (
                                                                    <div className={styles.replyQuoteBox} onClick={() => scrollToMessage(msg.reply_to_details.id)}>
                                                                        <span className={styles.replySender}>
                                                                            {(msg.reply_to_details.senderId === 'me' || msg.reply_to_details.senderId === user?.id || msg.reply_to_details.sender_name === user?.username)
                                                                                ? 'You' : getSenderName(msg.reply_to_details.sender_name || msg.reply_to_details.sender)}
                                                                        </span>
                                                                        <p className={styles.replyTextPreview}>{msg.reply_to_details.text}</p>
                                                                    </div>
                                                                )}

                                                                {msg.type === 'media' && msg.media?.length > 0 ? (
                                                                    <div className={styles.mediaAttachment}>
                                                                        {msg.media.map((m, i) => {
                                                                            const src = m.media_file || m.url;
                                                                            const type = m.media_type || m.type;
                                                                            return type === 'image' ? (
                                                                                <img key={m.id ?? i} src={resolveUrl(src)} alt="attachment" className={styles.mediaImage} onClick={() => setLightboxUrl(resolveUrl(src))} />
                                                                            ) : type === 'video' ? (
                                                                                <video key={m.id ?? i} src={resolveUrl(src)} controls className={styles.mediaVideo} />
                                                                            ) : (
                                                                                <a key={m.id ?? i} href={resolveUrl(src)} target="_blank" rel="noreferrer" className={styles.fileAttachment} style={isMine ? { background: 'rgba(28,28,28,0.85)', border: '1px solid rgba(255,255,255,0.08)' } : {}}>
                                                                                    {(() => { const ext = src?.split('.').pop()?.toLowerCase(); const iconBg = (ext === 'zip' || ext === 'rar') ? 'rgba(220,50,50,0.85)' : 'rgba(150,40,220,0.75)'; return <div className={styles.fileIconWrapper} style={{ background: iconBg }}><span className={styles.pdfLabel}>{ext?.toUpperCase() ?? 'FILE'}</span></div>; })()}
                                                                                    <div className={styles.fileDetails}><strong className={styles.fileName}>{src?.split('/').pop()}</strong><span className={styles.fileMeta}>{type ?? 'file'}</span></div>
                                                                                    <div className={styles.downloadWrapper}><Download size={20} strokeWidth={2.5} /></div>
                                                                                </a>
                                                                            );
                                                                        })}
                                                                        {msg.text && <span style={{ whiteSpace: 'pre-wrap', display: 'block', marginTop: 6 }}>{msg.text}</span>}
                                                                    </div>
                                                                ) : msg.post ? (
                                                                    msg.post.post_type === 'advertisement' ? (
                                                                        /* ── Shared Ad bubble ── */
                                                                        <div
                                                                            onClick={() => setOpenAdPost(msg.post)}
                                                                            style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(199,44,255,0.25)', borderRadius: 14, overflow: 'hidden', maxWidth: 320, transition: 'background 0.2s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                                                        >
                                                                            {/* Ad image with Sponsored badge overlay */}
                                                                            {(msg.post.media?.[0]?.url || msg.post.image) && (
                                                                                <div style={{ position: 'relative', width: '100%', height: 140 }}>
                                                                                    <img src={msg.post.media?.[0]?.url || msg.post.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                                                                    <span style={{ position: 'absolute', top: 8, left: 8, background: 'linear-gradient(90deg, #c72cff, #8b2dff)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 999 }}>Sponsored</span>
                                                                                </div>
                                                                            )}
                                                                            <div style={{ padding: '10px 12px' }}>
                                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                                    <img src={msg.post.author?.avatar || '/default-avatar.png'} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                                                                    <div>
                                                                                        <span style={{ color: 'white', fontWeight: 600, fontSize: '0.82rem', display: 'block' }}>{msg.post.author?.username || 'Page'}</span>
                                                                                        <span style={{ color: 'rgba(199,44,255,0.9)', fontSize: '0.68rem', fontWeight: 600 }}>Ad · Shared with you</span>
                                                                                    </div>
                                                                                </div>
                                                                                {msg.post.title && (
                                                                                    <p style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600, margin: '0 0 4px' }}>
                                                                                        {msg.post.title}
                                                                                    </p>
                                                                                )}
                                                                                <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: 4, display: 'block' }}>Tap to view ad</span>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                    /* ── Shared regular post bubble ── */
                                                                    <div onClick={() => setOpenPost(msg.post)}
                                                                        style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, overflow: 'hidden', maxWidth: 320, transition: 'background 0.2s' }}
                                                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                                                        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
                                                                        {(msg.post.media?.[0]?.url || msg.post.image) && (
                                                                            <img src={msg.post.media?.[0]?.url || msg.post.image} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
                                                                        )}
                                                                        <div style={{ padding: '10px 12px' }}>
                                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                                                <img src={msg.post.author?.avatar || '/default-avatar.png'} alt="" style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }} />
                                                                                <span style={{ color: 'white', fontWeight: 600, fontSize: '0.82rem' }}>{msg.post.author?.username || 'User'}</span>
                                                                            </div>
                                                                            {msg.post.content_text && (
                                                                                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.78rem', margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                                    {msg.post.content_text}
                                                                                </p>
                                                                            )}
                                                                            <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', marginTop: 6, display: 'block' }}>Tap to view post</span>
                                                                        </div>
                                                                    </div>
                                                                    )
                                                                ) : (
                                                                    <span style={{ whiteSpace: 'pre-wrap' }}>
                                                                        {msg.text}
                                                                        {msg.is_edited && (
                                                                            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)', marginLeft: '8px', fontStyle: 'italic' }}>
                                                                                (edited)
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, justifyContent: 'center' }}>
                                                                {isLastInGroup && (
                                                                    <button className={styles.replyIconButton} onClick={() => setReplyingTo(msg)}>
                                                                        <Reply size={16} />
                                                                    </button>
                                                                )}
                                                                {isMine && msg.type !== 'media' && !msg.post && (
                                                                    <button 
                                                                        className={styles.replyIconButton} 
                                                                        onClick={() => { 
                                                                            setEditingMessage(msg); 
                                                                            setInputText(msg.text || msg.content); 
                                                                            setReplyingTo(null); 
                                                                        }} 
                                                                        title="Edit message"
                                                                    >
                                                                        <Pencil size={15} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    });
                                })()}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Typing indicator ── */}
                            {typingInfo && (
                                <div style={{
                                    display: 'flex', alignItems: 'flex-end', gap: 8,
                                    padding: '4px 16px 8px',
                                }}>
                                    <img
                                        src={typingInfo.avatar
                                            ? (typingInfo.avatar.startsWith('http')
                                                ? typingInfo.avatar
                                                : `${API}${typingInfo.avatar}`)
                                            : `${API}/media/default-pfp.png`
                                        }
                                        alt={typingInfo.username}
                                        style={{
                                            width: 36, height: 36,
                                            borderRadius: '50%',
                                            objectFit: 'cover',
                                            flexShrink: 0,
                                            display: 'block',
                                            border: '2px solid rgba(255,255,255,0.1)',
                                        }}
                                    />
                                    <div style={{
                                        display: 'flex', alignItems: 'center', gap: 5,
                                        background: 'rgba(255,255,255,0.08)',
                                        borderRadius: '18px 18px 18px 4px',
                                        padding: '12px 16px',
                                    }}>
                                        <span style={dotStyle(0)} />
                                        <span style={dotStyle(1)} />
                                        <span style={dotStyle(2)} />
                                    </div>
                                </div>
                            )}

                            {/* ── Pending files ── */}
                            {pendingFiles.length > 0 && (
                                <div className={styles.pendingFilesBar}>
                                    {pendingFiles.map(pf => (
                                        <div key={pf.id} className={styles.pendingFileItem}>
                                            {pf.type === 'image'
                                                ? <img src={pf.previewUrl} alt={pf.name} className={styles.pendingImageThumb} />
                                                : <div className={styles.pendingFileThumb}><FileText size={20} /></div>}
                                            <div className={styles.pendingFileInfo}>
                                                <span className={styles.pendingFileName}>{pf.name}</span>
                                                <span className={styles.pendingFileSize}>{pf.size}</span>
                                            </div>
                                            <button className={styles.removePendingFile} onClick={() => removePendingFile(pf.id)}>
                                                <MinusCircle size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* ── Poll creator ── */}
                            {pollOpen && (
                                <div className={styles.pollCreator}>
                                    <div className={styles.pollHeader}>
                                        <span>Create a Poll</span>
                                        <button className={styles.cancelReply} onClick={() => { setPollOpen(false); setPollQuestion(''); setPollOptions(['', '']); }}>
                                            <MinusCircle size={16} />
                                        </button>
                                    </div>
                                    <input className={styles.pollQuestionInput} placeholder="Ask a question..." value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} />
                                    {pollOptions.map((opt, i) => (
                                        <div key={i} className={styles.pollOptionRow}>
                                            <input className={styles.pollOptionInput} placeholder={`Option ${i + 1}`} value={opt}
                                                onChange={e => { const updated = [...pollOptions]; updated[i] = e.target.value; setPollOptions(updated); }} />
                                            {pollOptions.length > 2 && (
                                                <button className={styles.cancelReply} onClick={() => removePollOption(i)}><MinusCircle size={14} /></button>
                                            )}
                                        </div>
                                    ))}
                                    {pollOptions.length < 6 && <button className={styles.addPollOption} onClick={addPollOption}>+ Add option</button>}
                                    <button className={styles.sendPollBtn} onClick={() => { setPollOpen(false); setPollQuestion(''); setPollOptions(['', '']); }}>Send Poll</button>
                                </div>
                            )}

                            {/* ── Edit or Reply preview ── */}
                            {editingMessage ? (
                                <div className={styles.replyPreviewBar}>
                                    <div className={styles.replyPreviewContent}>
                                        <span>Editing message</span>
                                        <p>{editingMessage.text || editingMessage.content}</p>
                                    </div>
                                    <button onClick={() => { setEditingMessage(null); setInputText(''); }} className={styles.cancelReply}><MinusCircle size={18} /></button>
                                </div>
                            ) : replyingTo ? (
                                <div className={styles.replyPreviewBar}>
                                    <div className={styles.replyPreviewContent}>
                                        <span>Replying to <strong>{getSenderName(replyingTo.sender)}</strong></span>
                                        <p>{replyingTo.text}</p>
                                    </div>
                                    <button onClick={() => setReplyingTo(null)} className={styles.cancelReply}><MinusCircle size={18} /></button>
                                </div>
                            ) : null}

                            {/* ── Input area / Selection action bar ── */}
                            {selectionMode ? (
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '12px 20px 16px',
                                    background: 'rgba(30,30,30,0.8)',
                                    borderTop: '1px solid rgba(255,255,255,0.06)',
                                }}>
                                    <button onClick={exitSelectionMode} style={{
                                        background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ccc',
                                        padding: '10px 20px', borderRadius: 22, cursor: 'pointer', fontSize: '0.9rem',
                                    }}>
                                        Cancel
                                    </button>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                                        {selectedMessages.size === 0 ? 'Tap messages to select' : `${selectedMessages.size} selected`}
                                    </span>
                                    <div style={{ display: 'flex', gap: 10 }}>
                                        {selectedMessages.size > 0 && (
                                            <>
                                                <button onClick={copySelectedMessages} style={{
                                                    background: 'rgba(255,255,255,0.08)', border: 'none', color: '#ccc',
                                                    padding: '10px 18px', borderRadius: 22, cursor: 'pointer', fontSize: '0.9rem',
                                                }}>
                                                    Copy
                                                </button>
                                                <button onClick={deleteSelectedMessages} style={{
                                                    background: 'rgba(255,77,77,0.15)', border: '1px solid rgba(255,77,77,0.3)',
                                                    color: '#ff4d4d', padding: '10px 18px', borderRadius: 22,
                                                    cursor: 'pointer', fontSize: '0.9rem',
                                                }}>
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ) : (() => {
                                const canSend = !selectedChat?.is_group || !fullGroupData ||
                                    fullGroupData.allow_members_to_send_messages ||
                                    fullGroupData.members?.find(m => m.id === user?.id)?.is_admin ||
                                    fullGroupData.admins?.some(a => a.id === user?.id);

                                return canSend ? (
                                    <div className={styles.messageInputArea}>
                                        <input ref={imageInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'image')} />
                                        <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.zip" multiple style={{ display: 'none' }} onChange={e => handleFileSelect(e, 'file')} />
                                        <div className={styles.attachmentWrapper} ref={attachmentRef}>
                                            <button className={styles.iconBtn} onClick={() => setAttachmentMenuOpen(!attachmentMenuOpen)}>
                                                <Paperclip size={20} />
                                            </button>
                                            {attachmentMenuOpen && (
                                                <div className={styles.attachmentMenu}>
                                                    <button className={styles.attachmentMenuItem} onClick={() => imageInputRef.current.click()}>🖼️ Image</button>
                                                    <button className={styles.attachmentMenuItem} onClick={() => fileInputRef.current.click()}>📄 File / PDF</button>
                                                </div>
                                            )}
                                        </div>
                                        <input type="text" placeholder="Type a message..." className={styles.messageInput}
                                            value={inputText} onChange={e => {
                                                setInputText(e.target.value);
                                                sendTyping(true);
                                                clearTimeout(typingTimer.current);
                                                typingTimer.current = setTimeout(() => sendTyping(false), 1500);
                                            }}
                                            onKeyDown={e => { if (e.key === 'Enter') editingMessage ? handleEditMessage() : handleSendMessage(); }} />
                                        <button className={styles.sendBtn} onClick={() => editingMessage ? handleEditMessage() : handleSendMessage()}><Send size={18} /></button>
                                    </div>
                                ) : (
                                    <div className={styles.adminsOnlyBar}>
                                        <Ban size={16} className={styles.adminsOnlyIcon} />
                                        <span>Only admins can send messages in this group</span>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}

            {/* ── Comment modal ── */}
            {openPost && <CommentModal post={openPost} onClose={() => setOpenPost(null)} currentUser={user} />}
            {openAdPost && <SharedAdModal post={openAdPost} onClose={() => setOpenAdPost(null)} currentUser={user} />}

            {/* ── Lightbox ── */}
            {lightboxUrl && (
                <div onClick={() => setLightboxUrl(null)}
                    style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}>
                    <img src={lightboxUrl} alt="full" onClick={e => e.stopPropagation()}
                        style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.8)' }} />
                    <button onClick={() => setLightboxUrl(null)}
                        style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 40, height: 40, color: '#fff', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        ✕
                    </button>
                </div>
            )}
            {reportTargetId && (
                <ReportModal
                    contentId={selectedChat.is_group ? selectedChat.id : reportTargetId}
                    contentType={selectedChat.is_group ? 'group' : 'user'}
                    onClose={() => setReportTargetId(null)}
                />
            )}
        </div>
    );
}