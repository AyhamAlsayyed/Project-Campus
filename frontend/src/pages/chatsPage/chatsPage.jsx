import styles from './chatspage.module.css'
import Header from '../../components/pagelayout/header/header';
import { Navigate, useNavigate } from 'react-router-dom';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, MoreHorizontal, Pin2, BellOff, Mail, MinusCircle,
    Trash2, Ban, Reply, AlertCircle, ChevronLeft, Info, CheckSquare,
    Paperclip, Send, FileText,
} from 'lucide-react';
import { Download } from 'lucide-react';
import BackButton from '../../Assets/icons/arrow-left.png'
import CommentModal from '../../components/comments/commentsModal';
import GroupInfoPanel from '../../components/chatPageComponents/groupInfoPanel';
import CreateGroupIcon from '../../Assets/icons/create-group.png'
import GroupCreationFlow from '../../components/chatPageComponents/GroupCreationFlow';
import Pin from '../../Assets/icons/pin.png';
import Mute from '../../Assets/icons/mute.png';
import Unread from '../../Assets/icons/unread-message.png';
import clear from '../../Assets/icons/clear.png';
import deleteIcon from '../../Assets/icons/bin.png';
import block from '../../Assets/icons/block.png';
import Report from '../../Assets/icons/info.png';
function MarqueeText({ text, className }) {
    const wrapperRef = useRef(null);
    const textRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const check = () => {
            if (wrapperRef.current && textRef.current) {
                // Force a reflow before measuring
                const scrollW = textRef.current.scrollWidth;
                const clientW = wrapperRef.current.clientWidth;
                setIsOverflowing(scrollW > clientW);
            }
        };

        // Small delay to let the DOM fully paint
        const timer = setTimeout(check, 100);
        window.addEventListener('resize', check);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', check);
        };
    }, [text]);

    return (
        <div
            ref={wrapperRef}
            className={className}
            style={{ overflow: 'hidden', position: 'relative', maxWidth: '65%' }}
        >
            <span
                ref={textRef}
                style={isOverflowing ? {
                    display: 'inline-block',
                    whiteSpace: 'nowrap',
                    paddingRight: '30px',
                    animation: 'chatMarquee 5s linear infinite',
                } : {
                    display: 'block',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                }}
            >
                {text}
            </span>
        </div>
    );
}
function timeAgo(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds

    if (diff < 60) return 'just now';
    if (diff < 3600) {
        const m = Math.floor(diff / 60);
        return `${m} min ago`;
    }
    if (diff < 86400) {
        const h = Math.floor(diff / 3600);
        return `${h}h ago`;
    }
    if (diff < 604800) {
        const d = Math.floor(diff / 86400);
        return `${d} day${d > 1 ? 's' : ''} ago`;
    }
    if (diff < 2592000) {
        const w = Math.floor(diff / 604800);
        return `${w} week${w > 1 ? 's' : ''} ago`;
    }
    const mo = Math.floor(diff / 2592000);
    return `${mo} month${mo > 1 ? 's' : ''} ago`;
}
export default function ChatsPage() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState(null);
    const [chats, setChats] = useState([]);
    const [inputText, setInputText] = useState("");
    const [loadingChats, setLoadingChats] = useState(true);
    const [filter, setFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [replyingTo, setReplyingTo] = useState(null);
    const [requestsCount, setRequestsCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const [groups, setGroups] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [activeChatMenuOpen, setActiveChatMenuOpen] = useState(false);
    const [activeChatMenuRect, setActiveChatMenuRect] = useState(null);
    const activeChatMenuRef = useRef(null);
    const activeChatMenuBtnRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const academicGroups = chats.filter(chat => chat.is_group && chat.is_academic);
    const [attachmentMenuOpen, setAttachmentMenuOpen] = useState(false);
    const [pendingFiles, setPendingFiles] = useState([]); // files queued to send
    const [pollOpen, setPollOpen] = useState(false);
    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [showAttachments, setShowAttachments] = useState(false);
    const [openPost, setOpenPost] = useState(null);
    const attachmentRef = useRef(null);
    const attachmentMenuRef = useRef(null);
    const imageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const menuRef = useRef(null);
    const messageRefs = useRef({});
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
    const [showGroupInfo, setShowGroupInfo] = useState(false);
    const [lightboxUrl, setLightboxUrl] = useState(null);
    const navigate = useNavigate()
    const [showRequests, setShowRequests] = useState(false);
    const [chatRequests, setChatRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [requestMessages, setRequestMessages] = useState([]);
    const [showCreateGroup, setShowCreateGroup] = useState(false);
    const [fullGroupData, setFullGroupData] = useState(null);


    const { chatId } = useParams();
    const [navOpen, setNavOpen] = useState(false);
    useEffect(() => {
        if (!selectedChat?.is_group) return;
        const fetchGroupDetails = async () => {
            try {
                const res = await fetch(`${API}/api/groups/${selectedChat.id}/edit-details/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setFullGroupData(data);
                }
            } catch (err) {
                console.error('Failed to fetch group details', err);
            }
        };
        fetchGroupDetails();
    }, [selectedChat?.id]);

    const handleSendMessage = async () => {
        if (!selectedChat) return;


        if (pendingFiles.length > 0) {
            const formData = new FormData();


            pendingFiles.forEach(pf => {
                formData.append("images", pf.file);
            });


            formData.append("file_type", pendingFiles[0].type);


            formData.append("text", inputText.trim());

            if (replyingTo) {
                formData.append("reply_to", replyingTo.id);
            }

            try {
                const response = await fetch(`${API}/api/chats/${selectedChat.id}/send/`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData,
                });

                if (response.ok) {
                    const newMsg = await response.json();
                    setMessages(prev => [...prev, newMsg]);
                    setInputText("");
                    setPendingFiles([]);
                    setReplyingTo(null);
                }
            } catch (err) {
                console.error("Error sending message with attachments:", err);
            }
        }
        // 2. TEXT ONLY: If no files are attached, fall back to your normal JSON request
        else if (inputText.trim()) {
            try {
                const response = await fetch(`${API}/api/chats/${selectedChat.id}/send/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        text: inputText,
                        reply_to: replyingTo ? replyingTo.id : null
                    }),
                });

                if (response.ok) {
                    const newMessage = await response.json();
                    setMessages(prev => [...prev, newMessage]);
                    setInputText("");
                    setReplyingTo(null);
                    setChats(prev => prev.map(c =>
                        c.id === selectedChat.id ? { ...c, unread_count: 0 } : c
                    ));
                }
            } catch (err) {
                console.error("Error sending text message:", err);
            }
        }

        scrollToBottom();
    };
    useEffect(() => {
        const handleOutsideClick = (event) => {

            if (showAttachments &&
                attachmentRef.current &&
                !attachmentRef.current.contains(event.target)) {
                setShowAttachments(false);
            }

            if (
                attachmentMenuOpen &&
                attachmentRef.current &&
                !attachmentRef.current.contains(event.target)
            ) {
                setAttachmentMenuOpen(false);
            }


            if (activeChatMenuOpen &&
                activeChatMenuRef.current &&
                !activeChatMenuRef.current.contains(event.target)) {
                setActiveChatMenuOpen(false);
                setActiveChatMenuRect(null);
            }

            if (openMenuId &&
                menuRef.current &&
                !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };

    }, [showAttachments, attachmentMenuOpen, activeChatMenuOpen, openMenuId]);
    const scrollToBottom = () => {
        setTimeout(() => {
            if (messagesScrollRef.current) {
                messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
            }
        }, 50);
    };
    useEffect(() => {
        scrollToBottom();
    }, [selectedChat?.id]);
    useEffect(() => {
        if (selectedChat) {
            scrollToBottom();
        }
    });
    useEffect(() => {
        if (chatId && chats.length > 0) {
            const targetChat = chats.find(c => c.id.toString() === chatId);
            if (targetChat) {
                setSelectedChat(targetChat);
                fetch(`${API}/api/chats/${chatId}/messages/`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                    .then(res => res.json())
                    .then(data => setMessages(data))
                    .catch(err => console.error("Error fetching messages:", err));
            }
        }
    }, [chatId, chats]);


    const API = "http://localhost:8000"
    const token = localStorage.getItem("access")
    const searchedChats = chats.filter(chat =>
        chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredChats = searchedChats.filter(chat => {
        if (filter === "unread") return chat.unread_count > 0;
        if (filter === "pinned") return chat.is_pinned;
        if (filter === "groups") return chat.is_group;
        return true;
    });
    const sortedChats = [...filteredChats].sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0);
    });



    const togglePin = async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/pin/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChats(prev => prev.map(c =>
                c.id === id ? { ...c, is_pinned: !c.is_pinned } : c
            ));
        }
    };
    const deleteChat = async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChats(prev => prev.filter(c => c.id !== id));
            if (selectedChat?.id === id) setSelectedChat(null);
        }
    };
    const toggleMute = async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/mute/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChats(prev => prev.map(c =>
                c.id === id ? { ...c, is_muted: !c.is_muted } : c
            ));
        }
    };
    const markUnread = async (id) => {
        const chat = chats.find(c => c.id === id);
        const isUnread = chat?.unread_count > 0;

        const res = await fetch(`${API}/api/chats/${id}/${isUnread ? 'mark-read' : 'mark-unread'}/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChats(prev => prev.map(c =>
                c.id === id ? { ...c, unread_count: isUnread ? 0 : (c.unread_count || 0) + 1 } : c
            ));
        }
    };

    const clearChat = async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/clear/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            if (selectedChat?.id === id) setMessages([]);
            setChats(prev => prev.map(c =>
                c.id === id ? { ...c, preview: null, last_message_time: null, time: null } : c
            ));
        }
    };

    const blockUser = async (id) => {
        const res = await fetch(`${API}/api/chats/${id}/block/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChats(prev => prev.map(c =>
                c.id === id ? { ...c, is_blocked: !c.is_blocked } : c
            ));
        }
    };

    const reportUser = async (id) => {
        await fetch(`${API}/api/chats/${id}/report/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        setOpenMenuId(null);
    };

    useEffect(() => {
        fetch("http://localhost:8000/api/chat-requests/", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                setRequestsCount(data.length);
                setChatRequests(data);
            });
    }, []);
    useEffect(() => {
        if (!activeChatMenuOpen) return;

        const update = () => {
            if (activeChatMenuBtnRef.current) {
                setActiveChatMenuRect(activeChatMenuBtnRef.current.getBoundingClientRect());
            }
        };

        window.addEventListener('scroll', update, true);  // true = capture all scroll events
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [activeChatMenuOpen]);
    useEffect(() => {
        const fetchChats = async () => {
            try {
                const res = await fetch("http://localhost:8000/api/chats/", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const data = await res.json();

                const unique = data.reduce((acc, chat) => {
                    const key = chat.name + chat.avatar;
                    const existing = acc.find(c => c.name + c.avatar === key);
                    if (!existing) {
                        acc.push(chat);
                    } else if (
                        // Always prefer the chat we're trying to open
                        chat.id.toString() === chatId ||
                        (chat.last_message_time && (!existing.last_message_time ||
                            new Date(chat.last_message_time) > new Date(existing.last_message_time)))
                    ) {
                        const idx = acc.indexOf(existing);
                        acc[idx] = chat;
                    }
                    return acc;
                }, []);
                setChats(unique);

            } catch (err) {
                console.error(err);
            } finally {
                setLoadingChats(false);
            }
        };

        fetchChats();
    }, []);
    const loadUser = async () => {

        if (!token) {
            setUserLoading(false)
            setUserError("No token found")
            return
        }

        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            const data = await res.json().catch(() => ({}))

            if (!res.ok) {
                setUserError("Failed to load user")
                setUser(null)
                return
            }

            setUser(data)

        } catch (e) {
            setUserError("Something went wrong")
        } finally {
            setUserLoading(false)
        }
    }
    const acceptRequest = async (conversationId) => {
        const res = await fetch(`${API}/api/chats/${conversationId}/accept/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChatRequests(prev => prev.filter(r => r.conversation_id !== conversationId));
            setRequestsCount(prev => prev - 1);
            setSelectedRequest(null);
            setShowRequests(false);
        }
    };

    const blockRequest = async (conversationId) => {
        const res = await fetch(`${API}/api/chats/${conversationId}/block/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            setChatRequests(prev => prev.filter(r => r.conversation_id !== conversationId));
            setRequestsCount(prev => prev - 1);
            setSelectedRequest(null);
        }
    };

    const handleFileSelect = (e, type) => {
        const files = Array.from(e.target.files);
        const previews = files.map(file => ({
            file,
            type,
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

    const addPollOption = () => {
        if (pollOptions.length < 6) setPollOptions(prev => [...prev, '']);
    };

    const removePollOption = (index) => {
        if (pollOptions.length > 2) setPollOptions(prev => prev.filter((_, i) => i !== index));
    };
    const scrollToMessage = (id) => {
        const el = messageRefs.current[id];
        if (el && messagesScrollRef.current) {
            el.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            // Optional: highlight effect
            el.classList.add(styles.highlightMessage);
            setTimeout(() => {
                el.classList.remove(styles.highlightMessage);
            }, 1500);
        }
    };

    useEffect(() => {
        loadUser()
    }, [])



    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} setTheme={setTheme} user={user} />
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav />
                <div className={styles.mainContent}>
                    {showCreateGroup ? (
                        <GroupCreationFlow closeFlow={() => setShowCreateGroup(false)} />
                    ) :

                        !selectedChat ? (
                            <>
                                <h1 className={styles.title}>
                                    {showRequests
                                        ? <><span className={styles.highlight}>Chat</span> Requests</>
                                        : <><span className={styles.highlight}>Chats</span> section</>
                                    }
                                </h1>

                                {!showRequests && (
                                    <div className={styles.filterContainer}>
                                        <div className={styles.filters}>
                                            <button className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`} onClick={() => setFilter("all")}>All</button>
                                            <button className={`${styles.filterBtn} ${filter === "unread" ? styles.active : ""}`} onClick={() => setFilter("unread")}>Unread</button>
                                            <button className={`${styles.filterBtn} ${filter === "pinned" ? styles.active : ""}`} onClick={() => setFilter("pinned")}>Pinned</button>
                                            <button className={`${styles.filterBtn} ${filter === "groups" ? styles.active : ""}`} onClick={() => setFilter("groups")}>Groups</button>
                                        </div>
                                        <div className={styles.righSide} style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                                            <div
                                                className={styles.createGroup}
                                                onClick={() => setShowCreateGroup(true)}
                                                style={{
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    padding: "8px",
                                                    cursor: "pointer",
                                                    transition: "background 0.2s"
                                                }}
                                            >
                                                <img src={CreateGroupIcon} alt="" style={{ width: "25px", height: "25px", filter: 'brightness(0) invert(0.9)' }} />
                                            </div>

                                            <div
                                                className={styles.requestsLink}
                                                onClick={() => setShowRequests(true)}
                                                style={{ cursor: 'pointer' }}
                                            >
                                                <span style={{ borderBottom: '1.5px solid #F2F2F2' }}>Requests</span> ({requestsCount > 1 ? `+${requestsCount}` : requestsCount})                                         </div>
                                        </div>

                                    </div>
                                )}

                                {showRequests ? (
                                    <>
                                        <button
                                            onClick={() => { setShowRequests(false); setSelectedRequest(null); }}
                                            className={styles.iconBtn}
                                            style={{ marginBottom: 12 }}
                                        >
                                            <img
                                                src={BackButton}
                                                alt=""
                                                style={{
                                                    width: 22,
                                                    height: 22,
                                                    filter: "brightness(0) invert(1) opacity(0.9)"
                                                }}
                                            />
                                        </button>

                                        {selectedRequest ? (
                                            <div className={`${styles.chatList} ${styles.activeChatOuter}`}>
                                                <div className={styles.innerChatContainer}>
                                                    <div className={styles.activeChatHeader}>
                                                        <div className={styles.headerLeftWrapper}>
                                                            <button className={styles.iconBtn} onClick={() => setSelectedRequest(null)}>
                                                                <img src={BackButton} alt="" style={{ width: 22, height: 22, filter: "brightness(0) invert(1) opacity(0.9)" }} />
                                                            </button>
                                                            <div className={styles.headerTitleInfo}>
                                                                <h2 className={styles.groupName}>{selectedRequest.sender_username}</h2>
                                                                <p className={styles.memberSubtitle}>Wants to send you a message</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className={styles.activeChatInnerContainer}>
                                                        <div className={styles.chatArea}>
                                                            <div className={styles.messagesScrollArea}>
                                                                {requestMessages.map(msg => (
                                                                    <div key={msg.id} className={`${styles.messageWrapper} ${msg.senderId === 'me' || msg.senderId === user?.id ? styles.messageMineWrapper : styles.messageOtherWrapper}`}>
                                                                        <div className={styles.messageContentBlock}>
                                                                            <div className={`${styles.messageMeta} ${msg.senderId === 'me' ? styles.metaRight : styles.metaLeft}`}>
                                                                                <span className={styles.msgSenderName}>{msg.senderId === 'me' ? 'You' : msg.sender}</span>
                                                                                <span className={styles.msgTime}>{msg.time}</span>
                                                                            </div>
                                                                            <div className={styles.messageRow}>
                                                                                <div className={`${styles.messageBubble} ${msg.senderId === 'me' || msg.senderId === user?.id ? styles.bubbleMine : styles.bubbleOther}`}>
                                                                                    {msg.type === 'media' && msg.media?.length > 0 ? (
                                                                                        <div className={styles.mediaAttachment}>
                                                                                            {msg.media.map((m, i) => (
                                                                                                m.type === 'image' ? (
                                                                                                    <img key={m.id ?? i} src={m.url?.startsWith('http') ? m.url : `${API}${m.url}`}
                                                                                                        alt="attachment" className={styles.mediaImage}
                                                                                                        onClick={() => setLightboxUrl(m.url?.startsWith('http') ? m.url : `${API}${m.url}`)} />
                                                                                                ) : m.type === 'video' ? (
                                                                                                    <video key={m.id ?? i} src={m.url?.startsWith('http') ? m.url : `${API}${m.url}`} controls className={styles.mediaVideo} />
                                                                                                ) : (
                                                                                                    <a key={m.id ?? i} href={m.url?.startsWith('http') ? m.url : `${API}${m.url}`} target="_blank" rel="noreferrer" className={styles.fileAttachment}>
                                                                                                        <div className={styles.fileIconWrapper}><span className={styles.pdfLabel}>{m.url?.split('.').pop()?.toUpperCase() ?? 'FILE'}</span></div>
                                                                                                        <div className={styles.fileDetails}><strong className={styles.fileName}>{m.url?.split('/').pop()}</strong></div>
                                                                                                        <div className={styles.downloadWrapper}><Download size={20} strokeWidth={2.5} /></div>
                                                                                                    </a>
                                                                                                )
                                                                                            ))}
                                                                                            {msg.text && <span style={{ whiteSpace: 'pre-wrap', display: 'block', marginTop: 6 }}>{msg.text}</span>}
                                                                                        </div>
                                                                                    ) : msg.post ? (
                                                                                        <div
                                                                                            onClick={() => setOpenPost(msg.post)}
                                                                                            style={{
                                                                                                cursor: "pointer",
                                                                                                background: "#1a1a2e",
                                                                                                border: "1px solid rgba(255,255,255,0.12)",
                                                                                                borderRadius: 12,
                                                                                                overflow: "hidden",
                                                                                                maxWidth: 260,
                                                                                                margin: "-8px -12px",   // ← bleeds to bubble edges
                                                                                                transition: "background 0.2s",
                                                                                            }}
                                                                                            onMouseEnter={e => e.currentTarget.style.background = "#22223a"}
                                                                                            onMouseLeave={e => e.currentTarget.style.background = "#1a1a2e"}
                                                                                        >
                                                                                            {(msg.post.media?.[0]?.url || msg.post.image) && (
                                                                                                <img src={msg.post.media?.[0]?.url || msg.post.image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                                                                                            )}
                                                                                            <div style={{ padding: "10px 12px" }}>
                                                                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                                                                    <img src={msg.post.author?.avatar || "/default-avatar.png"} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                                                                                    <span style={{ color: "white", fontWeight: 600, fontSize: "0.82rem" }}>{msg.post.author?.username || "User"}</span>
                                                                                                </div>
                                                                                                {msg.post.content_text && (
                                                                                                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                                                                        {msg.post.content_text}
                                                                                                    </p>
                                                                                                )}
                                                                                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", marginTop: 6, display: "block" }}>Tap to view post</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            <div style={{
                                                                display: "flex", gap: 12, padding: "16px 20px",
                                                                borderTop: "1px solid rgba(255,255,255,0.07)",
                                                                background: "rgba(255,255,255,0.02)"
                                                            }}>
                                                                <p style={{ flex: 1, margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", alignSelf: "center" }}>
                                                                    Do you want to accept this message request?
                                                                </p>
                                                                <button
                                                                    onClick={() => acceptRequest(selectedRequest.conversation_id)}
                                                                    style={{
                                                                        padding: "10px 22px", borderRadius: 22, border: "none",
                                                                        background: "linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))",
                                                                        color: "#fff", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => blockRequest(selectedRequest.conversation_id)}
                                                                    style={{
                                                                        padding: "10px 22px", borderRadius: 22,
                                                                        border: "1px solid rgba(248,113,113,0.3)",
                                                                        background: "rgba(248,113,113,0.08)",
                                                                        color: "#f87171", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer"
                                                                    }}
                                                                >
                                                                    Block
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className={styles.chatList}>
                                                <div className={styles.innerContainer}>
                                                    <div className={styles.chatItemsContainer}>
                                                        {chatRequests.length === 0 ? (
                                                            <div style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.35)", fontSize: "0.9rem" }}>
                                                                No message requests
                                                            </div>
                                                        ) : chatRequests.map((req, index) => {
                                                            const reqAvatar = req.sender_avatar || req.avatar;
                                                            const avatarUrl = reqAvatar ? (reqAvatar.startsWith('http') ? reqAvatar : `${API}${reqAvatar}`) : null;
                                                            const isCurrentMenuOpen = openMenuId === req.conversation_id;

                                                            return (
                                                                <div key={req.conversation_id} className={styles.chatRow}>
                                                                    <div
                                                                        className={styles.chatItem}
                                                                        style={{ cursor: 'pointer' }}
                                                                        onClick={async () => {
                                                                            setSelectedRequest(req);
                                                                            const res = await fetch(`${API}/api/chats/${req.conversation_id}/messages/`, {
                                                                                headers: { Authorization: `Bearer ${token}` },
                                                                            });
                                                                            const data = await res.json();
                                                                            setRequestMessages(Array.isArray(data) ? data : []);
                                                                        }}
                                                                    >
                                                                        <div className={styles.chatItemLeft}>
                                                                            <div className={styles.avatarWrapper}>
                                                                                {avatarUrl ? (
                                                                                    <img src={avatarUrl} alt={req.sender_username} className={styles.chatAvatar} />
                                                                                ) : (
                                                                                    <div className={styles.chatAvatar} style={{
                                                                                        background: "rgba(255,255,255,0.08)", display: "flex",
                                                                                        alignItems: "center", justifyContent: "center",
                                                                                        color: "rgba(255,255,255,0.5)", fontSize: "1.1rem", fontWeight: 700
                                                                                    }}>
                                                                                        {req.sender_username?.[0]?.toUpperCase() || "?"}
                                                                                    </div>
                                                                                )}
                                                                                <span className={`${styles.statusDot} ${styles.offline}`} />
                                                                            </div>
                                                                            <div className={styles.chatIdentity}>
                                                                                <span className={styles.chatStatusText}>Message request</span>
                                                                                <div className={styles.chatNameWrapper}>
                                                                                    <span className={styles.chatName}>{req.sender_username}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>


                                                                        <div className={styles.chatItemRight}>
                                                                            <div className={styles.chatDetails}>
                                                                                <div className={styles.chatDetailsTop}>
                                                                                    <span className={styles.chatPreview}>{req.preview}</span>
                                                                                    <div className={styles.chatIndicators}>
                                                                                        {req.is_pinned && (
                                                                                            <div style={{
                                                                                                width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                                maskImage: `url(${Pin})`, WebkitMaskImage: `url(${Pin})`,
                                                                                                maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                                maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                                maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                                flexShrink: 0,
                                                                                            }} />
                                                                                        )}
                                                                                        {req.is_muted && (
                                                                                            <div style={{
                                                                                                width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                                maskImage: `url(${Mute})`, WebkitMaskImage: `url(${Mute})`,
                                                                                                maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                                maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                                maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                                flexShrink: 0,
                                                                                            }} />
                                                                                        )}
                                                                                    </div>
                                                                                    <span className={styles.chatTime}>{req.time}</span>
                                                                                </div>
                                                                            </div>

                                                                            <div className={styles.chatActions}>
                                                                                <div className={styles.menuWrapper} ref={isCurrentMenuOpen ? menuRef : null}>
                                                                                    <button
                                                                                        className={styles.moreButton}
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                                                            const dropdownHeight = 110;
                                                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                                                            const top = spaceBelow < dropdownHeight
                                                                                                ? rect.top - dropdownHeight + 35
                                                                                                : rect.bottom + 8;
                                                                                            setMenuPosition({ top, right: window.innerWidth - rect.right });
                                                                                            setOpenMenuId(openMenuId === req.conversation_id ? null : req.conversation_id);
                                                                                        }}
                                                                                    >
                                                                                        <MoreHorizontal size={16} />
                                                                                    </button>

                                                                                    {isCurrentMenuOpen && (
                                                                                        <div className={styles.dropdownMenu} style={{
                                                                                            top: menuPosition.top,
                                                                                            right: menuPosition.right,
                                                                                            background: '#333333',
                                                                                        }}>
                                                                                            <button className={styles.menuItem} onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                acceptRequest(req.conversation_id);
                                                                                                setOpenMenuId(null);
                                                                                            }}>
                                                                                                <CheckSquare size={14} /> Accept request
                                                                                            </button>
                                                                                            <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                            <button className={styles.menuItem} onClick={async (e) => {
                                                                                                e.stopPropagation();
                                                                                                await deleteChat(req.conversation_id);
                                                                                                setChatRequests(prev => prev.filter(r => r.conversation_id !== req.conversation_id));
                                                                                                setRequestsCount(prev => prev - 1);
                                                                                                setOpenMenuId(null);
                                                                                            }}>
                                                                                                <div style={{
                                                                                                    width: '14px', height: '14px', backgroundColor: '#CCCCCC',
                                                                                                    maskImage: `url(${deleteIcon})`, WebkitMaskImage: `url(${deleteIcon})`,
                                                                                                    maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                                    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                                    maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                                    flexShrink: 0,
                                                                                                }} />
                                                                                                Delete chat
                                                                                            </button>
                                                                                            <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                            <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => {
                                                                                                e.stopPropagation();
                                                                                                blockRequest(req.conversation_id);
                                                                                                setOpenMenuId(null);
                                                                                            }}>
                                                                                                <div style={{
                                                                                                    width: '14px', height: '14px', backgroundColor: '#D4145A',
                                                                                                    maskImage: `url(${block})`, WebkitMaskImage: `url(${block})`,
                                                                                                    maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                                    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                                    maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                                    flexShrink: 0,
                                                                                                }} />
                                                                                                Block sender
                                                                                            </button>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    {index !== chatRequests.length - 1 && <div className={styles.chatDivider} />}
                                                                </div>
                                                            );
                                                        })
                                                        }
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className={styles.chatList}>
                                        <div className={styles.innerContainer}>
                                            <div className={styles.searchContainer}>
                                                <Search size={18} className={styles.searchIcon} />
                                                <input
                                                    type="text"
                                                    className={styles.searchInput}
                                                    placeholder="Searching for someone?"
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                            <div className={styles.chatItemsContainer}>
                                                {sortedChats.map((chat, index) => (
                                                    <div key={chat.id} className={styles.chatRow}>
                                                        <div className={styles.chatItem} onClick={async () => {
                                                            setSelectedChat(chat);
                                                            navigate(`/chats/${chat.id}`);
                                                            const res = await fetch(`http://localhost:8000/api/chats/${chat.id}/messages/`, {
                                                                headers: { Authorization: `Bearer ${token}` },
                                                            });
                                                            const data = await res.json();
                                                            setMessages(data);
                                                        }} style={{ cursor: 'pointer' }}>

                                                            <div className={styles.chatItemLeft}>
                                                                <div className={styles.avatarWrapper}>
                                                                    <img
                                                                        src={chat.avatar?.startsWith('http') ? chat.avatar : `${API}${chat.avatar}`}
                                                                        alt={chat.name}
                                                                        className={styles.chatAvatar}
                                                                    />
                                                                    <span className={`${styles.statusDot} ${chat.is_group ? styles.groupDot :
                                                                        chat.is_blocked ? styles.blockedDot :
                                                                            chat.status === 'online' ? styles.online :
                                                                                chat.status === 'dnd' ? styles.dnd :
                                                                                    styles.offline
                                                                        }`} />
                                                                </div>
                                                                <div className={styles.chatIdentity}>
                                                                    <span className={styles.chatStatusText}>
                                                                        {chat.is_blocked ? 'Blocked' :
                                                                            chat.is_group ? 'Group Chat' :
                                                                                chat.status === 'online' ? 'Online' :
                                                                                    chat.status === 'dnd' ? 'Do Not Disturb' :
                                                                                        'Offline'}
                                                                    </span>
                                                                    <div className={styles.chatNameWrapper}>
                                                                        <span className={styles.chatName}>{chat.name}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className={styles.chatItemRight}>
                                                                <div className={styles.chatIndicators}>
                                                                    {chat.is_pinned && (
                                                                        <div style={{
                                                                            width: '25px', height: '25px', backgroundColor: '#CCCCCC',
                                                                            maskImage: `url(${Pin})`, WebkitMaskImage: `url(${Pin})`,
                                                                            maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                            maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                            maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                            flexShrink: 0,
                                                                        }} />
                                                                    )}
                                                                    {chat.is_muted && (
                                                                        <div style={{
                                                                            width: '25px', height: '25px', backgroundColor: '#CCCCCC',
                                                                            maskImage: `url(${Mute})`, WebkitMaskImage: `url(${Mute})`,
                                                                            maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                            maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                            maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                            flexShrink: 0,
                                                                        }} />
                                                                    )}
                                                                </div>
                                                                <div className={styles.chatDetails}>
                                                                    <span className={styles.chatPreview}>
                                                                        {chat.last_message_type === 'media' || chat.has_attachment
                                                                            ? '📎 sent an attachment'
                                                                            : chat.preview}
                                                                    </span>
                                                                    <div className={styles.chatDetailsTop}>

                                                                        <span className={styles.chatTime}>{chat.time}</span>
                                                                    </div>
                                                                </div>

                                                                <div className={styles.chatActions}>
                                                                    {chat.unread_count > 0 && (
                                                                        <span className={styles.unreadBadge}>{chat.unread_count}</span>
                                                                    )}
                                                                    <div className={styles.menuWrapper} ref={openMenuId === chat.id ? menuRef : null}>
                                                                        <button
                                                                            className={styles.moreButton}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                                const dropdownHeight = 280;
                                                                                const spaceBelow = window.innerHeight - rect.bottom;
                                                                                const top = spaceBelow < dropdownHeight
                                                                                    ? rect.top - dropdownHeight + 35
                                                                                    : rect.bottom + 8;
                                                                                setMenuPosition({ top, right: window.innerWidth - rect.right });
                                                                                setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                                                            }}
                                                                        >
                                                                            <MoreHorizontal size={16} />
                                                                        </button>

                                                                        {openMenuId === chat.id && (
                                                                            <div className={styles.dropdownMenu} style={{
                                                                                top: menuPosition.top,
                                                                                right: menuPosition.right,
                                                                                background: '#333333',
                                                                            }}>
                                                                                <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); togglePin(chat.id); setOpenMenuId(null); }}>
                                                                                    <div style={{
                                                                                        width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                        maskImage: `url(${Pin})`, WebkitMaskImage: `url(${Pin})`,
                                                                                        maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                        maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                        flexShrink: 0,
                                                                                    }} />
                                                                                    {chat.is_pinned ? 'Unpin chat' : 'Pin chat'}
                                                                                </button>
                                                                                <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); toggleMute(chat.id); setOpenMenuId(null); }}>
                                                                                    <div style={{
                                                                                        width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                        maskImage: `url(${Mute})`, WebkitMaskImage: `url(${Mute})`,
                                                                                        maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                        maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                        flexShrink: 0,
                                                                                    }} />
                                                                                    Mute notifications
                                                                                </button>
                                                                                <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                {chat.preview && (
                                                                                    <>
                                                                                        <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); markUnread(chat.id); setOpenMenuId(null); }}>
                                                                                            <div style={{
                                                                                                width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                                maskImage: `url(${Unread})`, WebkitMaskImage: `url(${Unread})`,
                                                                                                maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                                maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                                maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                                flexShrink: 0,
                                                                                            }} />
                                                                                            {chat.unread_count > 0 ? 'Mark as read' : 'Mark as unread'}
                                                                                        </button>
                                                                                        <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />
                                                                                    </>
                                                                                )}

                                                                                <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); clearChat(chat.id); setOpenMenuId(null); }}>
                                                                                    <div style={{
                                                                                        width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                        maskImage: `url(${clear})`, WebkitMaskImage: `url(${clear})`,
                                                                                        maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                        maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                        flexShrink: 0,
                                                                                    }} />
                                                                                    Clear chat
                                                                                </button>
                                                                                <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); setOpenMenuId(null); }}>
                                                                                    <div style={{
                                                                                        width: '18px', height: '18px', backgroundColor: '#CCCCCC',
                                                                                        maskImage: `url(${deleteIcon})`, WebkitMaskImage: `url(${deleteIcon})`,
                                                                                        maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                        maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                        flexShrink: 0,
                                                                                    }} />
                                                                                    Delete chat
                                                                                </button>
                                                                                <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => { e.stopPropagation(); blockUser(chat.id); setOpenMenuId(null); }}>
                                                                                    <div style={{
                                                                                        width: '18px', height: '18px', backgroundColor: '#D4145A',
                                                                                        maskImage: `url(${block})`, WebkitMaskImage: `url(${block})`,
                                                                                        maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                        maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                        flexShrink: 0,
                                                                                    }} />
                                                                                    {chat.is_blocked ? 'Unblock user' : 'Block user'}
                                                                                </button>
                                                                                <div style={{ width: '65%', height: '1px', background: '#4D4D4D', margin: '0 auto' }} />

                                                                                <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => { e.stopPropagation(); reportUser(chat.id); setOpenMenuId(null); }}>
                                                                                    <div style={{
                                                                                        width: '18px', height: '18px', backgroundColor: '#D4145A',
                                                                                        maskImage: `url(${Report})`, WebkitMaskImage: `url(${Report})`,
                                                                                        maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                                        maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                                        maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                                        flexShrink: 0,
                                                                                    }} />
                                                                                    Report user
                                                                                </button>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {index !== sortedChats.length - 1 && <div className={styles.chatDivider} />}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (

                            <div className={`${styles.chatList} ${styles.activeChatOuter}`}>
                                {showGroupInfo ? (
                                    <GroupInfoPanel

                                        group={fullGroupData || selectedChat}
                                        API={API}
                                        members={[]}
                                        currentUser={user}
                                        token={token}
                                        messages={messages}
                                        otherMemberId={selectedChat?.other_member_id}
                                        onBack={() => setShowGroupInfo(false)}
                                        onMakeMemberAdmin={async (member) => {
                                            await fetch(`${API}/api/groups/${selectedChat.id}/make-admin/`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ member_id: member.id })  // ← member_id not user_id
                                            });
                                        }}
                                        onRemoveMember={async (member) => {
                                            const res = await fetch(`${API}/api/groups/${selectedChat.id}/remove-member/`, {
                                                method: 'POST',
                                                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ member_id: member.id })
                                            });
                                            if (res.ok) {

                                                window.location.reload();
                                            }
                                        }}
                                        onClearChat={() => clearChat(selectedChat.id)}
                                        onDeleteGroup={() => deleteChat(selectedChat.id)}
                                    />
                                ) : (
                                    <div className={styles.innerChatContainer}>

                                        <div className={styles.activeChatHeader}>
                                            <div className={styles.headerLeftWrapper}>
                                                <button className={styles.iconBtn} onClick={() => {
                                                    setSelectedChat(null);
                                                    navigate('/chats');
                                                }}>
                                                    <img
                                                        src={BackButton}
                                                        alt=""
                                                        style={{
                                                            width: 22,
                                                            height: 22,
                                                            filter: "brightness(0) invert(1) opacity(0.9)"
                                                        }}
                                                    />
                                                </button>
                                                <img
                                                    src={selectedChat.avatar?.startsWith('http') ? selectedChat.avatar : `${API}${selectedChat.avatar}`}
                                                    alt={selectedChat.name}
                                                    className={styles.activeChatAvatar}
                                                    onClick={() => {
                                                        if (!selectedChat.is_group && selectedChat.other_member_id) {
                                                            navigate(`/profile/${selectedChat.other_member_id}`);
                                                        }
                                                    }}
                                                    style={!selectedChat.is_group ? { cursor: 'pointer' } : {}}
                                                />
                                                <div className={styles.headerTitleInfo}>
                                                    {selectedChat.is_group && (
                                                        <span className={styles.professorName}>
                                                            {selectedChat.conversations_owner}
                                                        </span>
                                                    )}
                                                    <h2 className={styles.groupName}>{selectedChat.name}</h2>
                                                    <p className={styles.memberSubtitle}>{selectedChat.members}</p>
                                                </div>
                                            </div>

                                            <div className={styles.headerRightWrapper}>
                                                <button className={styles.iconBtn}><Search size={30} /></button>
                                                <div className={styles.menuWrapper} ref={activeChatMenuRef}>
                                                    <button
                                                        ref={activeChatMenuBtnRef}
                                                        className={styles.iconBtn}
                                                        onClick={(e) => {
                                                            if (activeChatMenuOpen) {
                                                                setActiveChatMenuOpen(false);
                                                                setActiveChatMenuRect(null);
                                                            } else {
                                                                setActiveChatMenuOpen(true);
                                                                setActiveChatMenuRect(e.currentTarget.getBoundingClientRect());
                                                            }
                                                        }}
                                                    >
                                                        <MoreHorizontal size={30} />
                                                    </button>
                                                    {activeChatMenuOpen && activeChatMenuRect && createPortal(
                                                        <div
                                                            className={styles.dropdownMenu}
                                                            style={{
                                                                position: "fixed",
                                                                top: activeChatMenuRect.bottom + 8,
                                                                right: window.innerWidth - activeChatMenuRect.right,
                                                                zIndex: 999999,
                                                            }}
                                                            onMouseDown={(e) => e.stopPropagation()}
                                                        >
                                                            <button
                                                                className={styles.menuItem}
                                                                onClick={() => {
                                                                    setActiveChatMenuOpen(false);
                                                                    setActiveChatMenuRect(null);
                                                                    setShowGroupInfo(true);  // opens for both group and DM
                                                                }}
                                                            >
                                                                <Info size={14} /> {selectedChat.is_group ? 'Group Info' : 'Chat Info'}
                                                            </button>
                                                            <button className={styles.menuItem}>
                                                                <BellOff size={14} /> Mute notifications
                                                            </button>
                                                            <button className={styles.menuItem}>
                                                                <CheckSquare size={14} /> Select messages
                                                            </button>
                                                            <div className={styles.menuDivider} />
                                                            <button className={`${styles.menuItem} ${styles.destructive}`}>
                                                                <AlertCircle size={14} /> {selectedChat.is_group ? 'Report group' : 'Report user'}
                                                            </button>
                                                        </div>,
                                                        document.body
                                                    )}
                                                </div>
                                            </div>
                                        </div>


                                        <div className={styles.activeChatInnerContainer}>

                                            <div className={styles.chatArea}>
                                                <div className={styles.messagesScrollArea} ref={messagesScrollRef}>
                                                    {(() => {
                                                        let lastDate = null;
                                                        return messages.map((msg, msgIndex) => {
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
                                                                    if (msgDate.toDateString() === today.toDateString()) dateLabel = "Today";
                                                                    else if (msgDate.toDateString() === yesterday.toDateString()) dateLabel = "Yesterday";
                                                                    else dateLabel = msgDate.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                                                                }
                                                            }

                                                            const resolveUrl = (url) => url?.startsWith('http') ? url : `${API}${url}`;

                                                            const prevMsg = msgIndex > 0 ? messages[msgIndex - 1] : null;
                                                            // Grouped if same sender and no date separator breaks the chain
                                                            const isGrouped = !dateLabel && prevMsg && prevMsg.senderId === msg.senderId;

                                                            return (
                                                                <div key={msg.id} ref={(el) => (messageRefs.current[msg.id] = el)}>
                                                                    {dateLabel && (
                                                                        <div className={styles.dateSeparator}><span>{dateLabel}</span></div>
                                                                    )}
                                                                    <div className={`${styles.messageWrapper} ${isMine ? styles.messageMineWrapper : styles.messageOtherWrapper} ${isGrouped ? styles.messageGrouped : ''}`}>
                                                                        {!isMine && (
                                                                            isGrouped
                                                                                ? <div className={styles.messageAvatarSpacer} />
                                                                                : <img src={resolveUrl(msg.avatar)} alt="Sender" className={styles.messageAvatar} />
                                                                        )}
                                                                        <div className={styles.messageContentBlock}>
                                                                            {!isGrouped && (
                                                                                <div className={`${styles.messageMeta} ${isMine ? styles.metaRight : styles.metaLeft}`}>
                                                                                    <span className={styles.msgSenderName}>{isMine ? 'You' : msg.sender}</span>
                                                                                    <span className={styles.msgTime}>{msg.time}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className={styles.messageRow}>
                                                                                <div className={`${styles.messageBubble} ${msg.post ? styles.bubblePost : isMine ? styles.bubbleMine : styles.bubbleOther} ${isGrouped ? styles.bubbleGrouped : ''}`}>

                                                                                    {msg.reply_to_details && (
                                                                                        <div className={styles.replyQuoteBox} onClick={() => scrollToMessage(msg.reply_to_details.id)}>
                                                                                            <span className={styles.replySender}>
                                                                                                {(msg.reply_to_details.senderId === 'me' || msg.reply_to_details.senderId === user?.id || msg.reply_to_details.sender_name === user?.username)
                                                                                                    ? 'You' : msg.reply_to_details.sender_name}
                                                                                            </span>
                                                                                            <p className={styles.replyTextPreview}>{msg.reply_to_details.text}</p>
                                                                                        </div>
                                                                                    )}

                                                                                    {msg.type === 'media' && msg.media?.length > 0 ? (
                                                                                        <div className={styles.mediaAttachment}>
                                                                                            {msg.media.map((m, i) => (
                                                                                                m.type === 'image' ? (
                                                                                                    <img
                                                                                                        key={m.id ?? i}
                                                                                                        src={resolveUrl(m.url)}
                                                                                                        alt="attachment"
                                                                                                        className={styles.mediaImage}
                                                                                                        onClick={() => setLightboxUrl(resolveUrl(m.url))}
                                                                                                    />
                                                                                                ) : m.type === 'video' ? (
                                                                                                    <video key={m.id ?? i} src={resolveUrl(m.url)} controls className={styles.mediaVideo} />
                                                                                                ) : (
                                                                                                    <a

                                                                                                        key={m.id ?? i}
                                                                                                        href={resolveUrl(m.url)}
                                                                                                        target="_blank"
                                                                                                        rel="noreferrer"
                                                                                                        className={styles.fileAttachment}
                                                                                                    >
                                                                                                        <div className={styles.fileIconWrapper}>
                                                                                                            <span className={styles.pdfLabel}>
                                                                                                                {m.url?.split('.').pop()?.toUpperCase() ?? 'FILE'}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <div className={styles.fileDetails}>
                                                                                                            <strong className={styles.fileName}>{m.url?.split('/').pop()}</strong>
                                                                                                            <span className={styles.fileMeta}>{m.file_type ?? 'file'}</span>
                                                                                                        </div>
                                                                                                        <div className={styles.downloadWrapper}>
                                                                                                            <Download size={20} strokeWidth={2.5} />
                                                                                                        </div>
                                                                                                    </a>
                                                                                                )
                                                                                            ))}
                                                                                            {msg.text && <span style={{ whiteSpace: 'pre-wrap', display: 'block', marginTop: 6 }}>{msg.text}</span>}
                                                                                        </div>
                                                                                    ) : msg.post ? (
                                                                                        <div
                                                                                            onClick={() => setOpenPost(msg.post)}
                                                                                            style={{ cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14, overflow: "hidden", maxWidth: 280, transition: "background 0.2s" }}
                                                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                                                                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                                                        >
                                                                                            {(msg.post.media?.[0]?.url || msg.post.image) && (
                                                                                                <img src={msg.post.media?.[0]?.url || msg.post.image} alt="" style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }} />
                                                                                            )}
                                                                                            <div style={{ padding: "10px 12px" }}>
                                                                                                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                                                                    <img src={msg.post.author?.avatar || "/default-avatar.png"} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
                                                                                                    <span style={{ color: "white", fontWeight: 600, fontSize: "0.82rem" }}>{msg.post.author?.username || "User"}</span>
                                                                                                </div>
                                                                                                {msg.post.content_text && (
                                                                                                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.78rem", margin: 0, lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                                                                        {msg.post.content_text}
                                                                                                    </p>
                                                                                                )}
                                                                                                <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", marginTop: 6, display: "block" }}>Tap to view post</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    ) : msg.type === 'media' && msg.media?.length > 0 ? (
                                                                                        <div className={styles.mediaAttachment}>
                                                                                            {msg.media.map((m, i) => (
                                                                                                m.type === 'image' ? (
                                                                                                    <img
                                                                                                        key={m.id ?? i}
                                                                                                        src={m.url?.startsWith('http') ? m.url : `${API}${m.url}`}
                                                                                                        alt="attachment"
                                                                                                        className={styles.mediaImage}
                                                                                                        onClick={() => setLightboxUrl(m.url?.startsWith('http') ? m.url : `${API}${m.url}`)}
                                                                                                    />
                                                                                                ) : m.type === 'video' ? (
                                                                                                    <video key={m.id ?? i} src={m.url?.startsWith('http') ? m.url : `${API}${m.url}`} controls className={styles.mediaVideo} />
                                                                                                ) : (
                                                                                                    <a key={m.id ?? i} href={m.url?.startsWith('http') ? m.url : `${API}${m.url}`} target="_blank" rel="noreferrer" className={styles.fileAttachment}>
                                                                                                        <div className={styles.fileIconWrapper}>
                                                                                                            <span className={styles.pdfLabel}>{m.url?.split('.').pop()?.toUpperCase() ?? 'FILE'}</span>
                                                                                                        </div>
                                                                                                        <div className={styles.fileDetails}>
                                                                                                            <strong className={styles.fileName}>{m.url?.split('/').pop()}</strong>
                                                                                                            <span className={styles.fileMeta}>{m.file_type ?? 'file'}</span>
                                                                                                        </div>
                                                                                                        <div className={styles.downloadWrapper}><Download size={20} strokeWidth={2.5} /></div>
                                                                                                    </a>
                                                                                                )
                                                                                            ))}
                                                                                            {msg.text && <span style={{ whiteSpace: 'pre-wrap', display: 'block', marginTop: 6 }}>{msg.text}</span>}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                                                                                    )}
                                                                                </div>
                                                                                <button className={styles.replyIconButton} onClick={() => setReplyingTo(msg)}>
                                                                                    <Reply size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        });
                                                    })()}
                                                    <div ref={messagesEndRef} />
                                                </div>


                                                {pendingFiles.length > 0 && (
                                                    <div className={styles.pendingFilesBar}>
                                                        {pendingFiles.map(pf => (
                                                            <div key={pf.id} className={styles.pendingFileItem}>
                                                                {pf.type === 'image' ? (
                                                                    <img src={pf.previewUrl} alt={pf.name} className={styles.pendingImageThumb} />
                                                                ) : (
                                                                    <div className={styles.pendingFileThumb}>
                                                                        <FileText size={20} />
                                                                    </div>
                                                                )}
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


                                                {pollOpen && (
                                                    <div className={styles.pollCreator}>
                                                        <div className={styles.pollHeader}>
                                                            <span>Create a Poll</span>
                                                            <button className={styles.cancelReply} onClick={() => { setPollOpen(false); setPollQuestion(''); setPollOptions(['', '']); }}>
                                                                <MinusCircle size={16} />
                                                            </button>
                                                        </div>
                                                        <input
                                                            className={styles.pollQuestionInput}
                                                            placeholder="Ask a question..."
                                                            value={pollQuestion}
                                                            onChange={e => setPollQuestion(e.target.value)}
                                                        />
                                                        {pollOptions.map((opt, i) => (
                                                            <div key={i} className={styles.pollOptionRow}>
                                                                <input
                                                                    className={styles.pollOptionInput}
                                                                    placeholder={`Option ${i + 1}`}
                                                                    value={opt}
                                                                    onChange={e => {
                                                                        const updated = [...pollOptions];
                                                                        updated[i] = e.target.value;
                                                                        setPollOptions(updated);
                                                                    }}
                                                                />
                                                                {pollOptions.length > 2 && (
                                                                    <button className={styles.cancelReply} onClick={() => removePollOption(i)}>
                                                                        <MinusCircle size={14} />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        ))}
                                                        {pollOptions.length < 6 && (
                                                            <button className={styles.addPollOption} onClick={addPollOption}>+ Add option</button>
                                                        )}
                                                        <button className={styles.sendPollBtn} onClick={() => {
                                                            console.log('Poll:', pollQuestion, pollOptions);
                                                            setPollOpen(false); setPollQuestion(''); setPollOptions(['', '']);
                                                        }}>
                                                            Send Poll
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Reply preview - keep exactly as before */}
                                                {replyingTo && (
                                                    <div className={styles.replyPreviewBar}>
                                                        <div className={styles.replyPreviewContent}>
                                                            <span>Replying to <strong>{replyingTo.sender}</strong></span>
                                                            <p>{replyingTo.text}</p>
                                                        </div>
                                                        <button onClick={() => setReplyingTo(null)} className={styles.cancelReply}>
                                                            <MinusCircle size={18} />
                                                        </button>
                                                    </div>
                                                )}



                                                {(() => {
                                                    const canSend = !selectedChat?.is_group ||
                                                        !fullGroupData ||
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
                                                                    <div className={styles.attachmentMenu} ref={attachmentMenuRef}>
                                                                        <button className={styles.attachmentMenuItem} onClick={() => imageInputRef.current.click()}>
                                                                            🖼️ Image
                                                                        </button>
                                                                        <button className={styles.attachmentMenuItem} onClick={() => fileInputRef.current.click()}>
                                                                            📄 File / PDF
                                                                        </button>
                                                                        <button className={styles.attachmentMenuItem} onClick={() => { setPollOpen(true); setAttachmentMenuOpen(false); }}>
                                                                            📊 Poll
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <input
                                                                type="text"
                                                                placeholder="Type a message..."
                                                                className={styles.messageInput}
                                                                value={inputText}
                                                                onChange={(e) => setInputText(e.target.value)}
                                                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                                            />
                                                            <button className={styles.sendBtn} onClick={handleSendMessage}>
                                                                <Send size={18} />
                                                            </button>
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

                            </div>
                        )}
                </div>
                <div className={styles.rightSection}>
                    <div className={styles.pill}>ACADEMIC GROUP CHATS</div>
                    <div className={styles.rightCard}>
                        <div className={styles.rightList}>
                            {academicGroups.map((chat, index) => {
                                const isMineSender =
                                    chat.last_sender_id === 'me' ||
                                    chat.last_sender_id === user?.id ||
                                    chat.last_message_mine === true ||
                                    chat.is_mine === true ||
                                    chat.preview_sender === user?.username ||
                                    chat.preview_sender === 'me';
                                const isAttachment = chat.preview === null || chat.preview === undefined;
                                const lastSender = chat.last_sender || chat.last_message_sender || chat.sender || '';
                                const senderLabel = isMineSender ? 'You' : lastSender;

                                console.log('chat preview fields:', chat.name, chat.last_message_type, chat.has_attachment, chat.preview, chat.type);

                                return (
                                    <div key={chat.id} className={styles.academicChatItem} onClick={async () => {
                                        setShowGroupInfo(false);
                                        setSelectedChat(chat);
                                        navigate(`/chats/${chat.id}`);
                                        const res = await fetch(`${API}/api/chats/${chat.id}/messages/`, {
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        const data = await res.json();
                                        setMessages(data);
                                    }}>
                                        <div className={styles.academicAvatarWrapper}>
                                            <img
                                                src={chat.avatar?.startsWith('http') ? chat.avatar : `${API}${chat.avatar}`}
                                                className={styles.academicAvatar}
                                                alt=""
                                            />
                                        </div>
                                        <div className={styles.academicChatInfo}>
                                            <div className={styles.academicTopRow}>
                                                <span className={styles.academicTeacherName}>{chat.conversations_owner}</span>
                                                <MarqueeText
                                                    text={
                                                        isAttachment
                                                            ? `${senderLabel}: sent an attachment`
                                                            : isMineSender
                                                                ? `You: ${chat.preview || ''}`
                                                                : `${lastSender ? lastSender + ': ' : ''}${chat.preview || ''}`
                                                    }
                                                    className={styles.academicMessagePreview}
                                                />
                                            </div>
                                            <div className={styles.academicBottomRow}>
                                                <MarqueeText text={chat.name} className={styles.academicGroupName} />
                                                <span className={styles.academicTimestamp}>{timeAgo(chat.last_message_time)}</span>
                                            </div>
                                        </div>
                                        {index !== academicGroups.length - 1 && <div className={styles.academicDivider}></div>}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
            {openPost && (
                <CommentModal
                    post={openPost}
                    onClose={() => setOpenPost(null)}
                    currentUser={user}
                />
            )}
            {lightboxUrl && (
                <div
                    onClick={() => setLightboxUrl(null)}
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 9999,
                        background: 'rgba(0,0,0,0.92)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'zoom-out',
                    }}
                >
                    <img
                        src={lightboxUrl}
                        alt="full"
                        onClick={e => e.stopPropagation()}
                        style={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            borderRadius: 12,
                            objectFit: 'contain',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                        }}
                    />
                    <button
                        onClick={() => setLightboxUrl(null)}
                        style={{
                            position: 'absolute',
                            top: 20,
                            right: 24,
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            borderRadius: '50%',
                            width: 40,
                            height: 40,
                            color: '#fff',
                            fontSize: '1.2rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        ✕
                    </button>
                </div>
            )}
        </div>

    )
}