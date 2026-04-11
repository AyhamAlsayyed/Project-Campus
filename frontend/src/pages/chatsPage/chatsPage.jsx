import styles from './chatspage.module.css'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState, useEffect, useRef } from 'react';
import {
    Search, MoreHorizontal, Pin, BellOff, Mail, MinusCircle,
    Trash2, Ban, AlertCircle, ChevronLeft, Info, CheckSquare,
    Paperclip, Send, FileText
} from 'lucide-react';


    export default function ChatsPage() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState(null);
    const [chats, setChats] = useState([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [filter, setFilter] = useState("all")
    const [searchQuery, setSearchQuery] = useState("");
    const [openMenuId, setOpenMenuId] = useState(null);
    const [requestsCount, setRequestsCount] = useState(0);
    const [messages, setMessages] = useState([]);
    const menuRef = useRef(null);
    const [groups, setGroups] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [activeChatMenuOpen, setActiveChatMenuOpen] = useState(false);
    const activeChatMenuRef = useRef(null);
    const messagesEndRef = useRef(null);
    const messagesScrollRef = useRef(null);
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
    }); // ✅ no dependency array = runs after every render


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
        const res = await fetch(`/api/chats/${id}/pin/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
            setChats(prev =>
                prev.map(c =>
                    c.id === id ? { ...c, is_pinned: !c.is_pinned } : c
                )
            );
        }
    };
    const deleteChat = async (id) => {
        await fetch(`/api/chats/${id}/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });

        setChats(prev => prev.filter(c => c.id !== id));
    };
    const toggleMute = async (id) => {
        await fetch(`/api/chats/${id}/mute/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
    };
    const markUnread = async (id) => {
        await fetch(`/api/chats/${id}/mark-unread/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });

        setChats(prev =>
            prev.map(c =>
                c.id === id ? { ...c, unread_count: 1 } : c
            )
        );
    };
    const clearChat = async (id) => {
        await fetch(`/api/chats/${id}/clear/`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
    };
    const blockUser = async (id) => {
        await fetch(`/api/chats/${id}/block/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
    };
    const reportUser = async (id) => {
        await fetch(`/api/chats/${id}/report/`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
        });
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
                setChats(data);
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
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
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
                                                            <img src={chat.avatar} alt={chat.name} className={styles.chatAvatar} />
                                                        </div>
                                                        <div className={styles.chatIdentity}>
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
                            <div className={styles.innerChatContainer}>

                                <div className={styles.activeChatHeader}>
                                    <div className={styles.headerLeftWrapper}>
                                        <button className={styles.iconBtn} onClick={() => setSelectedChat(null)}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <img
                                            src={selectedChat.avatar}
                                            alt={selectedChat.name}
                                            className={styles.activeChatAvatar}
                                        />
                                        <div className={styles.headerTitleInfo}>
                                            <span className={styles.professorName}>Dr. Samer Sweileh</span>
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
                                                    <button className={styles.menuItem}><Info size={14} /> Group Info</button>
                                                    <button className={styles.menuItem}><BellOff size={14} /> Mute notifications</button>
                                                    <button className={styles.menuItem}><CheckSquare size={14} /> Select messages</button>
                                                    <div className={styles.menuDivider}></div>
                                                    <button className={`${styles.menuItem} ${styles.destructive}`}><AlertCircle size={14} /> Report group</button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>


                                <div className={styles.activeChatInnerContainer}>

                                    <div className={styles.chatArea}>
                                        <div className={styles.messagesScrollArea} ref={messagesScrollRef}>
                                            <div className={styles.dateSeparator}><span>Today</span></div>
                                            {messages.map((msg) => (
                                                <div key={msg.id} className={`${styles.messageWrapper} ${msg.senderId === 'me' ? styles.messageMineWrapper : styles.messageOtherWrapper}`}>
                                                    {msg.senderId === 'other' && (
                                                        <img src={msg.avatar} alt="Sender" className={styles.messageAvatar} />
                                                    )}
                                                    <div className={styles.messageContentBlock}>
                                                        <div className={`${styles.messageMeta} ${msg.senderId === 'me' ? styles.metaRight : styles.metaLeft}`}>
                                                            <span className={styles.msgSenderName}>{msg.senderId === 'me' ? 'You' : msg.sender}</span>
                                                            <span className={styles.msgTime}>{msg.time}</span>
                                                        </div>
                                                        <div className={`${styles.messageBubble} ${msg.senderId === 'me' ? styles.bubbleMine : styles.bubbleOther}`}>
                                                            {msg.type === 'file' ? (
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
                                                    </div>
                                                </div>
                                            ))}
                                            <div ref={messagesEndRef} />

                                        </div>


                                        <div className={styles.messageInputArea}>
                                            <button className={styles.iconBtn}><Paperclip size={20} /></button>
                                            <input type="text" placeholder="Type a message..." className={styles.messageInput} />
                                            <button className={styles.sendBtn}><Send size={18} /></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                <div className={styles.rightSection}>
                    <div className={styles.pill}>ACADEMIC GROUP CHATS</div>
                    <div className={styles.rightCard}>
                        <div className={styles.rightList}>
                            {groups.map((chat, index) => (
                                <div key={chat.id} className={styles.academicChatItem}>
                                    <div className={styles.academicAvatarWrapper}>
                                        <div className={styles.academicAvatarPlaceholder}>{chat.icon}</div>
                                    </div>
                                    <div className={styles.academicChatInfo}>

                                        <div className={styles.academicTopRow}>
                                            <span className={styles.academicTeacherName}>{chat.teacher}</span>
                                            <span className={styles.academicMessagePreview}>{chat.msg}</span>
                                        </div>

                                        <div className={styles.academicBottomRow}>
                                            <div className={styles.academicGroupName}>{chat.title}</div>
                                            <span className={styles.academicTimestamp}>{chat.time}</span>
                                        </div>
                                    </div>
                                    {index !== 5 && <div className={styles.academicDivider}></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>

    )
}