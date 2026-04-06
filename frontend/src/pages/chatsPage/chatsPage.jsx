import styles from './chatspage.module.css'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState, useEffect, useRef } from 'react';
import { Search, MoreHorizontal, Pin, BellOff, Mail, MinusCircle, Trash2, Ban, AlertCircle } from 'lucide-react';


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
    const menuRef = useRef(null);
    const [groups, setGroups] = useState([]);


    const API = "http://localhost:8000"
    const token = localStorage.getItem("access")
    const searchedChats = chats.filter(chat =>
        chat.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredChats = searchedChats.filter(chat => {
        if (filter === "unread") return chat.unread_count > 0;
        if (filter === "pinned") return chat.is_pinned;
        if (filter === "groups") return chat.is_group;
        return true; // "all"
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
                    <h1 className={styles.title}>
                        <span className={styles.highlight}>Chats</span> section

                    </h1>
                    <div className={styles.filterContainer}>
                        <div className={styles.filters}>
                            <button
                                className={`${styles.filterBtn} ${filter === "all" ? styles.active : ""}`}
                                onClick={() => setFilter("all")}
                            >
                                All
                            </button>

                            <button
                                className={`${styles.filterBtn} ${filter === "unread" ? styles.active : ""}`}
                                onClick={() => setFilter("unread")}
                            >
                                Unread
                            </button>

                            <button
                                className={`${styles.filterBtn} ${filter === "pinned" ? styles.active : ""}`}
                                onClick={() => setFilter("pinned")}
                            >
                                Pinned
                            </button>

                            <button
                                className={`${styles.filterBtn} ${filter === "groups" ? styles.active : ""}`}
                                onClick={() => setFilter("groups")}
                            >
                                Groups
                            </button>
                        </div>

                        {/* New Requests Link */}
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


                                        <div className={styles.chatItem}>

                                            {/* Left Side: Avatar & Identity */}
                                            <div className={styles.chatItemLeft}>
                                                <div className={styles.avatarWrapper}>
                                                    <img src={chat.avatar} alt={chat.name} className={styles.chatAvatar} />
                                                    <span className={`${styles.statusDot} ${styles[chat.dotStyle]}`}></span>
                                                </div>
                                                <div className={styles.chatIdentity}>
                                                    <span className={styles.chatStatusText}>{chat.status}</span>
                                                    <div className={styles.chatNameWrapper}>
                                                        <span className={styles.chatName}>{chat.name}</span>
                                                        {chat.isVerified && <span className={styles.verifiedBadge}>✔</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Side: Message & Actions */}
                                            <div className={styles.chatItemRight}>
                                                <div className={styles.chatDetails}>
                                                    <span className={styles.chatPreview}>{chat.preview}</span>
                                                    <span className={styles.chatTime}>{chat.time}</span>
                                                </div>

                                                <div className={styles.chatActions}>
                                                    {chat.isPinned && <Pin size={16} className={styles.actionIcon} />}

                                                    {/* 3-Dot Menu Button */}
                                                    <div className={styles.menuWrapper} ref={openMenuId === chat.id ? menuRef : null}>
                                                        <button
                                                            className={styles.moreButton}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setOpenMenuId(openMenuId === chat.id ? null : chat.id);
                                                            }}
                                                        >
                                                            <MoreHorizontal size={20} />
                                                        </button>

                                                        {/* Dropdown Menu */}
                                                        {openMenuId === chat.id && (
                                                            <div className={styles.dropdownMenu}>
                                                                <button className={styles.menuItem} onClick={() => togglePin(chat.id)}>
                                                                    <Pin size={14} /> Pin chat
                                                                </button>
                                                                <button className={styles.menuItem} onClick={() => toggleMute(chat.id)}>
                                                                    <BellOff size={14} /> Mute notifications
                                                                </button>
                                                                <button className={styles.menuItem} onClick={() => markUnread(chat.id)}>
                                                                    <Mail size={14} /> Mark as unread
                                                                </button>
                                                                <button className={styles.menuItem} onClick={() => clearChat(chat.id)}>
                                                                    <MinusCircle size={14} /> Clear chat
                                                                </button>
                                                                <button className={styles.menuItem} onClick={() => deleteChat(chat.id)}>
                                                                    <Trash2 size={14} /> Delete chat
                                                                </button>
                                                                <div className={styles.menuDivider}></div>
                                                                <button className={`${styles.menuItem} ${styles.destructive}`} onClick={() => blockUser(chat.id)}>
                                                                    <Ban size={14} /> Block user
                                                                </button>
                                                                <button className={`${styles.menuItem} ${styles.destructive}`} onClick={() => reportUser(chat.id)}>
                                                                    <AlertCircle size={14} /> Report user
                                                                </button>
                                                            </div>
                                                        )}

                                                    </div>
                                                </div>
                                            </div>


                                        </div>
                                        {index !== sortedChats.length - 1 && (
                                            <div className={styles.chatDivider}></div>
                                        )}
                                    </div>




                                ))}

                            </div>


                        </div>

                    </div>

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
                                        {/* Top row: Teacher Name on Left, Message Preview on Right */}
                                        <div className={styles.academicTopRow}>
                                            <span className={styles.academicTeacherName}>{chat.teacher}</span>
                                            <span className={styles.academicMessagePreview}>{chat.msg}</span>
                                        </div>
                                        {/* Middle row: Group Title on Left, Timestamp on Right */}
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