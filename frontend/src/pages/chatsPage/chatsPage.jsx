import styles from './chatspage.module.css'
import Header from '../../components/pagelayout/header/header';
import { Navigate, useNavigate } from 'react-router-dom';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef } from 'react';
import {
    Search, MoreHorizontal, Pin, BellOff, Mail, MinusCircle,
    Trash2, Ban, Reply, AlertCircle, ChevronLeft, Info, CheckSquare,
    Paperclip, Send, FileText
} from 'lucide-react';
import BackButton from '../../Assets/icons/arrow-left.png'
import CommentModal from '../../components/comments/commentsModal';
import GroupInfoPanel from '../../components/chatPageComponents/groupInfoPanel';
function MarqueeText({ text, className }) {
    const wrapperRef = useRef(null);
    const textRef = useRef(null);
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        if (wrapperRef.current && textRef.current) {
            setIsOverflowing(textRef.current.scrollWidth > wrapperRef.current.clientWidth);
        }
    }, [text]);

    return (
        <div ref={wrapperRef} className={`${className} ${isOverflowing ? styles.marqueeWrapper : ''}`}>
            <span
                ref={textRef}
                className={isOverflowing ? styles.marqueeText : styles.marqueeStatic}
            >
                {text}
            </span>
        </div>
    );
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
    const activeChatMenuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesScrollRef = useRef(null);
    const academicGroups = chats.filter(chat => chat.is_group);
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
    const navigate = useNavigate()


    const { chatId } = useParams();
    const [navOpen, setNavOpen] = useState(false);

    const handleSendMessage = async () => {
        if (!selectedChat) return;


        for (const pf of pendingFiles) {
            const formData = new FormData();
            formData.append("file", pf.file);
            formData.append("file_type", pf.type);

            await fetch(`${API}/api/chats/${selectedChat.id}/send-file/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            }).then(res => res.json()).then(newMsg => {
                setMessages(prev => [...prev, newMsg]);
            });
        }
        setPendingFiles([]);


        if (inputText.trim()) {
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


    useEffect(() => {
        fetch("/api/group-chats/", {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(setGroups);
    }, []);
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
            .then(data => setRequestsCount(data.length));
    }, []);
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
                    {!selectedChat ? (
                        <>
                            <h1 className={styles.title}>
                                <span className={styles.highlight}>Chats</span> section
                            </h1>

                            <div className={styles.filterContainer}>
                                <div className={styles.filters}>
                                    <button className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`} onClick={() => setFilter("all")}>All</button>
                                    <button className={`${styles.filterBtn} ${filter === "unread" ? styles.active : ""}`} onClick={() => setFilter("unread")}>Unread</button>
                                    <button className={`${styles.filterBtn} ${filter === "pinned" ? styles.active : ""}`} onClick={() => setFilter("pinned")}>Pinned</button>
                                    <button className={`${styles.filterBtn} ${filter === "groups" ? styles.active : ""}`} onClick={() => setFilter("groups")}>Groups</button>
                                </div>
                                <div className={styles.requestsLink}>
                                    <span>Requests</span> ({requestsCount})
                                </div>
                            </div>

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
                                                        headers: {
                                                            Authorization: `Bearer ${token}`,
                                                        },
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
                                                        <div className={styles.chatDetails}>
                                                            <span className={styles.chatPreview}>{chat.preview}</span>
                                                            <span className={styles.chatTime}>{chat.time}</span>
                                                        </div>
                                                        <div className={styles.chatActions}>
                                                            {chat.is_pinned && <Pin size={14} className={styles.actionIcon} />}
                                                            {chat.is_muted && <BellOff size={14} className={styles.actionIcon} />}
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
                                                                    <div className={styles.dropdownMenu} style={{ top: menuPosition.top, right: menuPosition.right }}>
                                                                        <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); togglePin(chat.id); setOpenMenuId(null); }}>
                                                                            <Pin size={14} /> {chat.is_pinned ? 'Unpin chat' : 'Pin chat'}
                                                                        </button>
                                                                        <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); toggleMute(chat.id); setOpenMenuId(null); }}>
                                                                            <BellOff size={14} /> Mute notifications
                                                                        </button>
                                                                        {chat.preview && (
                                                                            <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); markUnread(chat.id); setOpenMenuId(null); }}>
                                                                                <Mail size={14} /> {chat.unread_count > 0 ? 'Mark as read' : 'Mark as unread'}
                                                                            </button>
                                                                        )}
                                                                        <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); clearChat(chat.id); setOpenMenuId(null); }}>
                                                                            <Trash2 size={14} /> Clear chat
                                                                        </button>
                                                                        <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); setOpenMenuId(null); }}>
                                                                            <Trash2 size={14} /> Delete chat
                                                                        </button>
                                                                        <div className={styles.menuDivider} />
                                                                        <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => { e.stopPropagation(); blockUser(chat.id); setOpenMenuId(null); }}>
                                                                            <Ban size={14} /> {chat.is_blocked ? 'Unblock user' : 'Block user'}
                                                                        </button>
                                                                        <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => { e.stopPropagation(); reportUser(chat.id); setOpenMenuId(null); }}>
                                                                            <AlertCircle size={14} /> Report user
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                {index !== sortedChats.length - 1 && <div className={styles.chatDivider}></div>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (

                        <div className={`${styles.chatList} ${styles.activeChatOuter}`}>
                            {showGroupInfo ? (
                                <GroupInfoPanel
                                    group={selectedChat}
                                    members={[]}
                                    onBack={() => setShowGroupInfo(false)}
                                    onClearChat={() => clearChat(selectedChat.id)}
                                    onDeleteGroup={() => deleteChat(selectedChat.id)}
                                    API={API}
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
                                                <button className={styles.iconBtn} onClick={() => setActiveChatMenuOpen(!activeChatMenuOpen)}>
                                                    <MoreHorizontal size={30} />
                                                </button>
                                                {activeChatMenuOpen && (
                                                    <div className={styles.dropdownMenu}>
                                                   
                                                        <button className={styles.menuItem} onClick={() => setActiveChatMenuOpen(false) || setShowGroupInfo(true)}>
                                                            <Info size={14} /> {selectedChat.is_group ? 'Group Info' : 'User Info'}
                                                        </button>

                                                        <button className={styles.menuItem}>
                                                            <BellOff size={14} /> Mute notifications
                                                        </button>
                                                        <button className={styles.menuItem}>
                                                            <CheckSquare size={14} /> Select messages
                                                        </button>
                                                        <div className={styles.menuDivider}></div>
                                                        <button className={`${styles.menuItem} ${styles.destructive}`}>
                                                            <AlertCircle size={14} /> {selectedChat.is_group ? 'Report group' : 'Report user'}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>


                                    <div className={styles.activeChatInnerContainer}>

                                        <div className={styles.chatArea}>
                                            <div className={styles.messagesScrollArea} ref={messagesScrollRef}>
                                                {(() => {
                                                    let lastDate = null;
                                                    return messages.map((msg) => {
                                                        const msgDate = msg.date ? new Date(msg.date) : null;
                                                        let dateLabel = null;
                                                        if (msgDate) {
                                                            const today = new Date();
                                                            const yesterday = new Date();
                                                            yesterday.setDate(today.getDate() - 1);

                                                            const isToday = msgDate.toDateString() === today.toDateString();
                                                            const isYesterday = msgDate.toDateString() === yesterday.toDateString();

                                                            const dateStr = msgDate.toDateString();

                                                            if (dateStr !== lastDate) {
                                                                lastDate = dateStr;
                                                                if (isToday) dateLabel = "Today";
                                                                else if (isYesterday) dateLabel = "Yesterday";
                                                                else dateLabel = msgDate.toLocaleDateString(undefined, {
                                                                    weekday: 'long', month: 'short', day: 'numeric'
                                                                });
                                                            }
                                                        }

                                                        return (
                                                            <div key={msg.id} ref={(el) => (messageRefs.current[msg.id] = el)}>
                                                                {dateLabel && (
                                                                    <div className={styles.dateSeparator}>
                                                                        <span>{dateLabel}</span>
                                                                    </div>
                                                                )}
                                                                <div className={`${styles.messageWrapper} ${msg.senderId === 'me' ? styles.messageMineWrapper : styles.messageOtherWrapper}`}>
                                                                    {msg.senderId === 'other' && (
                                                                        <img
                                                                            src={msg.avatar?.startsWith('http') ? msg.avatar : `${API}${msg.avatar}`}
                                                                            alt="Sender"
                                                                            className={styles.messageAvatar}
                                                                        />
                                                                    )}
                                                                    <div className={styles.messageContentBlock}>
                                                                        <div className={`${styles.messageMeta} ${msg.senderId === 'me' ? styles.metaRight : styles.metaLeft}`}>
                                                                            <span className={styles.msgSenderName}>{msg.senderId === 'me' ? 'You' : msg.sender}</span>
                                                                            <span className={styles.msgTime}>{msg.time}</span>
                                                                        </div>
                                                                        <div className={styles.messageRow}>
                                                                            <div className={`${styles.messageBubble} ${msg.senderId === 'me' ? styles.bubbleMine : styles.bubbleOther}`}>
                                                                                {msg.reply_to_details && (
                                                                                    <div className={styles.replyQuoteBox} onClick={() => scrollToMessage(msg.reply_to_details.id)}>

                                                                                        <span className={styles.replySender}>
                                                                                            {(msg.reply_to_details.senderId === 'me' || msg.reply_to_details.sender_name === user?.username)
                                                                                                ? 'You '
                                                                                                : msg.reply_to_details.sender_name}
                                                                                        </span>
                                                                                        <p className={styles.replyTextPreview}>{msg.reply_to_details.text}</p>
                                                                                    </div>
                                                                                )}
                                                                                {msg.post ? (
                                                                                    <div
                                                                                        onClick={() => setOpenPost(msg.post)}
                                                                                        style={{
                                                                                            cursor: "pointer",
                                                                                            background: "rgba(255,255,255,0.06)",
                                                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                                                            borderRadius: 14,
                                                                                            overflow: "hidden",
                                                                                            maxWidth: 280,
                                                                                            transition: "background 0.2s"
                                                                                        }}
                                                                                        onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                                                                                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                                                    >
                                                                                        {/* Banner/image */}
                                                                                        {(msg.post.media?.[0]?.url || msg.post.image) && (
                                                                                            <img
                                                                                                src={msg.post.media?.[0]?.url || msg.post.image}
                                                                                                alt=""
                                                                                                style={{ width: "100%", height: 140, objectFit: "cover", display: "block" }}
                                                                                            />
                                                                                        )}
                                                                                        <div style={{ padding: "10px 12px" }}>
                                                                                            {/* Author row */}
                                                                                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                                                                                                <img
                                                                                                    src={msg.post.author?.avatar || "/default-avatar.png"}
                                                                                                    alt=""
                                                                                                    style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }}
                                                                                                />
                                                                                                <span style={{ color: "white", fontWeight: 600, fontSize: "0.82rem" }}>
                                                                                                    {msg.post.author?.username || "User"}
                                                                                                </span>
                                                                                            </div>
                                                                                            {/* Post text preview */}
                                                                                            {msg.post.content_text && (
                                                                                                <p style={{
                                                                                                    color: "rgba(255,255,255,0.75)",
                                                                                                    fontSize: "0.78rem",
                                                                                                    margin: 0,
                                                                                                    lineHeight: 1.4,
                                                                                                    display: "-webkit-box",
                                                                                                    WebkitLineClamp: 3,
                                                                                                    WebkitBoxOrient: "vertical",
                                                                                                    overflow: "hidden"
                                                                                                }}>
                                                                                                    {msg.post.content_text}
                                                                                                </p>
                                                                                            )}
                                                                                            <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", marginTop: 6, display: "block" }}>
                                                                                                Tap to view post
                                                                                            </span>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : msg.type === 'file' ? (
                                                                                    <div className={styles.fileAttachment}>
                                                                                        <div className={styles.fileIcon}><FileText size={24} /></div>
                                                                                        <div className={styles.fileDetails}>
                                                                                            <strong>{msg.text}</strong>
                                                                                            <p>{msg.subtext}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                                                                                )}
                                                                            </div>
                                                                            <button
                                                                                className={styles.replyIconButton}
                                                                                onClick={() => setReplyingTo(msg)}
                                                                            >
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
                            {academicGroups.map((chat, index) => (
                                <div key={chat.id} className={styles.academicChatItem} onClick={() => setSelectedChat(chat)}>
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
                                            <span className={styles.academicMessagePreview}>{chat.preview}</span>
                                        </div>
                                        <div className={styles.academicBottomRow}>
                                            <MarqueeText text={chat.name} className={styles.academicGroupName} />
                                            <span className={styles.academicTimestamp}>{chat.time}</span>
                                        </div>
                                    </div>
                                    {index !== academicGroups.length - 1 && <div className={styles.academicDivider}></div>}
                                </div>
                            ))}
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
        </div>

    )
}