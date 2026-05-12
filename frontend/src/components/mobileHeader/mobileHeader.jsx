import { useState, useEffect, useRef } from 'react';
import { Search, Menu, Volume2, Calendar, UserPlus, Heart, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import MessageSquareIcon from '../../Assets/icons/messages.png';
import BellIcon from '../../Assets/icons/notifications.png';
import BellActiveIcon from '../../Assets/icons/notifications-active.png';
import NotifsBottomSheet from '../dropDownMenus/NotificationsBottomSheet';
import ChatsBottomSheet from '../dropDownMenus/ChatsBottomSheet';
import { createPortal } from 'react-dom';
import { Users, User, BookOpen, X } from 'lucide-react';
export default function MobileHeader({ avatarSrc, user, setMobileMenuOpen, token, API, homeMode = false }) {
    const navigate = useNavigate();
    const avatarDropdownRef = useRef(null);

    // ── UI state ──
    const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
    const [showDrawerChats, setShowDrawerChats] = useState(false);
    const [showDrawerNotifs, setShowDrawerNotifs] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

    // ── Notifications state ──
    const [drawerNotifications, setDrawerNotifications] = useState([]);
    const [drawerNotifsLoading, setDrawerNotifsLoading] = useState(false);
    const [drawerOpenMenuId, setDrawerOpenMenuId] = useState(null);

    // ── Chats state ──
    const [drawerChats, setDrawerChats] = useState([]);
    const [drawerChatsLoading, setDrawerChatsLoading] = useState(false);
    const [drawerSearchQuery, setDrawerSearchQuery] = useState('');
    //search results are filtered client-side from drawerChats
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [searchBoxRect, setSearchBoxRect] = useState(null);
    const searchInputRef = useRef(null);
    const searchTimer = useRef(null);
    const fetchSearch = async (query) => {
        setSearchLoading(true);
        try {
            const res = await fetch(
                `${API}/api/search/?q=${encodeURIComponent(query)}&dropdown=true`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) setSearchResults(await res.json());
        } catch (e) { console.error(e); }
        finally { setSearchLoading(false); }
    };

    const handleSearchChange = (e) => {
        const val = e.target.value;

        setSearchQuery(val);
        setSearchBoxRect(searchInputRef.current?.getBoundingClientRect());
        if (!val.trim()) { setSearchResults(null); setShowSearchDropdown(false); return; }
        setShowSearchDropdown(true);
        clearTimeout(searchTimer.current);
        searchTimer.current = setTimeout(() => fetchSearch(val.trim()), 350);
    };

    const handleResultClick = (type, item) => {
        setShowSearchDropdown(false);
        setSearchQuery('');
        setSearchResults(null);
        if (type === 'person' || type === 'page') navigate(`/profile/${item.id}`);
        else if (type === 'community') navigate(`/communities/${item.id}`);
        else if (type === 'all') navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    };
    // ── Helpers ──
    const timeAgo = (dateString) => {
        if (!dateString) return '';
        let date;
        if (typeof dateString === 'string' && dateString.length === 5 && dateString.includes(':')) {
            const [h, m] = dateString.split(':');
            date = new Date();
            date.setHours(parseInt(h), parseInt(m), 0, 0);
        } else { date = new Date(dateString); }
        if (isNaN(date.getTime())) return dateString;
        const now = new Date();
        const s = Math.floor((now - date) / 1000);
        if (s < 60) return 'Just now';
        const min = Math.floor(s / 60);
        if (min < 60) return `${min} min. ago`;
        const hr = Math.floor(min / 60);
        if (hr < 24) return `${hr} hr. ago`;
        const d = Math.floor(hr / 24);
        return d === 1 ? 'Yesterday' : `${d} d. ago`;
    };

    const getNotificationIcon = (type) => {
        const t = (type || '').toLowerCase();
        if (t.includes('announcement')) return <Volume2 size={12} color="currentColor" />;
        if (t.includes('event')) return <Calendar size={12} color="currentColor" />;
        if (t.includes('friend') || t.includes('request')) return <UserPlus size={12} color="currentColor" />;
        if (t.includes('react') || t.includes('post')) return <Heart size={12} color="currentColor" />;
        return <Volume2 size={12} color="currentColor" />;
    };

    // ── Fetch functions ──
    const fetchNotifications = async () => {
        if (!token) return;
        setDrawerNotifsLoading(true);
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setDrawerNotifications(data.map(item => ({
                    id: item.notification_id || item.id,
                    is_read: item.is_read,
                    avatar: (item.actor_avatar || item.avatar)?.startsWith('http')
                        ? (item.actor_avatar || item.avatar)
                        : `${API}${item.actor_avatar || item.avatar}` || '/default-avatar.png',
                    type: item.type || 'Notification',
                    text: item.message || item.content,
                    actor_id: item.actor_id,
                    post_id: item.post_id,
                    event_id: item.event_id,
                    time: timeAgo(item.time) || item.time,
                })));
            }
        } catch (e) { console.error('Notif fetch failed', e); }
        finally { setDrawerNotifsLoading(false); }
    };

    const fetchChats = async () => {
        if (!token) return;
        setDrawerChatsLoading(true);
        try {
            const res = await fetch(`${API}/api/chats/`, {
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const data = await res.json();
                setDrawerChats(data.map(chat => ({
                    id: chat.id,
                    name: chat.name || chat.user_name || 'Unknown User',
                    avatar: chat.avatar?.startsWith('http') ? chat.avatar : `${API}${chat.avatar}` || '/default-avatar.png',
                    message: chat.preview || chat.last_message || 'No messages yet',
                    status: chat.is_online ? 'online' : 'offline',
                    dotStyle: chat.is_online ? 'online' : 'offline',
                    isGroup: chat.is_group || false,
                    unread: chat.unread_count || 0,
                    time: timeAgo(chat.last_message_time),
                })));
            }
        } catch (e) { console.error('Chat fetch failed', e); }
        finally { setDrawerChatsLoading(false); }
    };

    // ── Handlers ──
    const handleMarkAsRead = async (id) => {
        try {
            const res = await fetch(`${API}/api/notifications/${id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: true }),
            });
            if (res.ok) {
                setDrawerNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
                setDrawerOpenMenuId(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleDelete = async (id) => {
        try {
            const res = await fetch(`${API}/api/notifications/${id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                setDrawerNotifications(prev => prev.filter(n => n.id !== id));
                setDrawerOpenMenuId(null);
            }
        } catch (e) { console.error(e); }
    };

    const handleNotificationClick = (n) => {
        if (n.event_id) navigate(`/events/${n.event_id}`);
        else if (n.post_id) navigate(`/posts/${n.post_id}`);
        else if (n.actor_id) navigate(`/profile/${n.actor_id}`);
        setShowDrawerNotifs(false);
    };

    // ── Effects ──

    // Fetch once on mount for badge counts
    useEffect(() => {
        if (token) { fetchNotifications(); fetchChats(); }
    }, [token]);

    // Re-fetch when panels open
    useEffect(() => {
        if (showDrawerChats) { setDrawerSearchQuery(''); fetchChats(); }
    }, [showDrawerChats]);

    useEffect(() => {
        if (showDrawerNotifs) { fetchNotifications(); }
    }, [showDrawerNotifs]);

    // Outside-click: only close avatar dropdown when no sub-panel is open
    useEffect(() => {
        const handleOutside = (e) => {
            if (showDrawerChats || showDrawerNotifs) return;
            if (avatarDropdownRef.current && !avatarDropdownRef.current.contains(e.target)) {
                setShowAvatarDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleOutside);
        return () => document.removeEventListener('mousedown', handleOutside);
    }, [showDrawerChats, showDrawerNotifs]);

    // ── Derived ──
    const drawerUnreadCount = drawerNotifications.filter(n => !n.is_read).length;
    const drawerUnreadChats = drawerChats.reduce((sum, c) => sum + c.unread, 0);
    const filteredDrawerChats = drawerChats.filter(c =>
        c.name.toLowerCase().includes(drawerSearchQuery.toLowerCase())
    );

    return (
        <>
            <div style={{
                position: "sticky", top: 0, zIndex: 500,
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px",
                background: "#1a1a1a",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                boxSizing: "border-box", width: "100%"
            }}>
                {/* Hamburger */}
                <button
                    onClick={() => setMobileMenuOpen(true)}
                    style={{
                        flexShrink: 0, width: 38, height: 38,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "transparent", border: "none", cursor: "pointer",
                        borderRadius: "50%"
                    }}
                >
                    <Menu size={22} color="white" />
                </button>

                {/* Logo */}
                <img src={darkModeIcon} alt="Logo" style={{ height: 32, flexShrink: 0 }} />

                {/* Search bar */}
                <div style={{
                    flex: 1, display: "flex", alignItems: "center", gap: 8,
                    background: "#535353", borderRadius: 999, padding: "7px 14px",
                    minWidth: 0, position: "relative"
                }}>
                    <Search size={15} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
                    <input
                        ref={searchInputRef}
                        style={{
                            flex: 1, background: "transparent", border: "none",
                            outline: "none", color: "#fff", fontSize: "0.85rem", minWidth: 0
                        }}
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        onFocus={() => {
                            if (searchQuery.trim()) {
                                setShowSearchDropdown(true);
                                setSearchBoxRect(searchInputRef.current?.getBoundingClientRect());
                            }
                        }}
                    />
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearchDropdown(false); }}
                            style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 0, display: "flex" }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Avatar — opens 3-option dropdown */}
                <div ref={avatarDropdownRef} style={{ position: "relative", flexShrink: 0 }}>
                    <button
                        onClick={() => setShowAvatarDropdown(p => !p)}
                        style={{
                            width: 36, height: 36, borderRadius: "50%",
                            border: homeMode ? "1px solid rgba(255,255,255,0.12)" : "2px solid rgba(255,255,255,0.2)",
                            padding: 0, background: homeMode ? "rgba(255,255,255,0.07)" : "transparent",
                            cursor: "pointer",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            overflow: "hidden"
                        }}
                    >
                        {homeMode
                            ? <Home size={20} color="white" />
                            : <img src={avatarSrc} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        }
                    </button>

                    {showAvatarDropdown && (
                        <div style={{
                            position: "absolute", top: "calc(100% + 8px)", right: 0,
                            background: "#2a2a2a", border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 16, padding: 8, zIndex: 600,
                            boxShadow: "0 10px 30px rgba(0,0,0,0.6)",
                            display: "flex", flexDirection: "column", gap: 4, minWidth: 160
                        }}>
                            {/* Profile / Home — depends on page */}
                            {homeMode ? (
                                <button
                                    onClick={() => { navigate('/home'); setShowAvatarDropdown(false); }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        background: "transparent", border: "none", color: "#fff",
                                        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                                        fontSize: "0.9rem", fontWeight: 500, textAlign: "left"
                                    }}
                                >
                                    <Home size={20} color="white" />
                                    Home
                                </button>
                            ) : (
                                <button
                                    onClick={() => { navigate(`/profile/${user?.id}`); setShowAvatarDropdown(false); }}
                                    style={{
                                        display: "flex", alignItems: "center", gap: 10,
                                        background: "transparent", border: "none", color: "#fff",
                                        padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                                        fontSize: "0.9rem", fontWeight: 500, textAlign: "left"
                                    }}
                                >
                                    <img src={avatarSrc} alt=""
                                        style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover" }} />
                                    Profile
                                </button>
                            )}

                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "2px 0" }} />

                            {/* Messages */}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                                    setShowDrawerChats(prev => !prev);
                                    setShowDrawerNotifs(false);
                                }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    background: "transparent", border: "none", color: "#fff",
                                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                                    fontSize: "0.9rem", fontWeight: 500, textAlign: "left",
                                    position: "relative"
                                }}
                            >
                                <img src={MessageSquareIcon} width={22} height={22} alt="" style={{ filter: "invert(1)" }} />
                                Messages
                                {drawerUnreadChats > 0 && (
                                    <span style={{
                                        marginLeft: "auto", background: "#ff4d4d", color: "#fff",
                                        fontSize: 10, fontWeight: 700, width: 18, height: 18,
                                        borderRadius: "50%", display: "grid", placeItems: "center"
                                    }}>{drawerUnreadChats}</span>
                                )}
                            </button>

                            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "2px 0" }} />

                            {/* Notifications */}
                            <button
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setDropdownPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
                                    setShowDrawerNotifs(prev => !prev);
                                    setShowDrawerChats(false);
                                }}
                                style={{
                                    display: "flex", alignItems: "center", gap: 10,
                                    background: "transparent", border: "none", color: "#fff",
                                    padding: "10px 12px", borderRadius: 10, cursor: "pointer",
                                    fontSize: "0.9rem", fontWeight: 500, textAlign: "left"
                                }}
                            >
                                <img
                                    src={drawerUnreadCount > 0 ? BellActiveIcon : BellIcon}
                                    width={22} height={22} alt="" style={{ filter: "invert(1)" }}
                                />
                                Notifications
                                {drawerUnreadCount > 0 && (
                                    <span style={{
                                        marginLeft: "auto", background: "#ff4d94", color: "#fff",
                                        fontSize: 10, fontWeight: 700, width: 18, height: 18,
                                        borderRadius: "50%", display: "grid", placeItems: "center"
                                    }}>{drawerUnreadCount}</span>
                                )}
                            </button>
                        </div>
                    )}
                </div>
                {showSearchDropdown && searchQuery.trim() && searchBoxRect && createPortal(
                    <div id="mobile-search-portal" style={{
                        position: "fixed",
                        top: searchBoxRect.bottom + 6,
                        left: searchBoxRect.left + 8,     
                        width: `calc(${searchBoxRect.width}px - 16px)`,
                        maxWidth: "500px",
                       
                        minWidth: "280px",
                        /* ------------------------ */

                        background: "#333333",
                        borderRadius: 16,
                        border: "1px solid rgba(255,255,255,0.1)",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
                        zIndex: 99999,
                        overflow: "hidden",
                        maxHeight: "60vh",
                        overflowY: "auto"
                    }}>
                        {/* See all */}
                        <div onMouseDown={() => handleResultClick("all")}
                            style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", cursor: "pointer", background: "rgba(139,45,255,0.08)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(139,45,255,0.18)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(139,45,255,0.08)"}
                        >
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(-90deg, rgba(166,39,156,0.8), rgba(49,32,169,0.8))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <Search size={14} color="white" />
                            </div>
                            <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem" }}>
                                See all results for "<span style={{ color: "#c084fc" }}>{searchQuery}</span>"
                            </span>
                        </div>

                        {searchLoading ? (
                            <div style={{ padding: 16, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>Searching…</div>
                        ) : searchResults ? (
                            <>
                                {searchResults.people?.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 16px 4px", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>People</div>
                                        {searchResults.people.slice(0, 3).map(person => (
                                            <div key={person.id} onMouseDown={() => handleResultClick("person", person)}
                                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                <img src={(() => { const av = person.profile?.profile_image || person.avatar_url || person.avatar; if (!av) return "/default-avatar.png"; return av.startsWith("http") ? av : `${API}${av}`; })()}
                                                    alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{person.profile?.full_name || person.full_name || person.username}</div>
                                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>@{person.username}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.communities?.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 16px 4px", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Communities</div>
                                        {searchResults.communities.slice(0, 3).map(community => (
                                            <div key={community.id} onMouseDown={() => handleResultClick("community", community)}
                                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                {community.avatar
                                                    ? <img src={community.avatar.startsWith("http") ? community.avatar : `${API}${community.avatar}`} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                                                    : <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(139,45,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><Users size={16} color="#c084fc" /></div>
                                                }
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{community.name}</div>
                                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{community.is_joined ? "✓ Joined" : community.is_private ? "🔒 Private" : "Not joined"}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.pages?.length > 0 && (
                                    <div>
                                        <div style={{ padding: "8px 16px 4px", color: "rgba(255,255,255,0.35)", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pages</div>
                                        {searchResults.pages.slice(0, 3).map(page => (
                                            <div key={page.id} onMouseDown={() => handleResultClick("page", page)}
                                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer" }}
                                                onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                            >
                                                {page.profile_image
                                                    ? <img src={page.profile_image.startsWith("http") ? page.profile_image : `${API}${page.profile_image}`} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                                                    : <div style={{ width: 34, height: 34, borderRadius: 8, background: "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={16} color="rgba(255,255,255,0.5)" /></div>
                                                }
                                                <div style={{ minWidth: 0 }}>
                                                    <div style={{ color: "#fff", fontWeight: 600, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{page.page_full_name || page.page_name || page.name}</div>
                                                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>{page.page_type || "Page"}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!searchLoading && searchResults && (searchResults.people?.length || 0) + (searchResults.communities?.length || 0) + (searchResults.pages?.length || 0) === 0 && (
                                    <div style={{ padding: 16, textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>No results found</div>
                                )}
                            </>
                        ) : null}
                    </div>,
                    document.body
                )}
            </div>

            {/* Dropdowns — rendered outside sticky bar so they're never clipped */}
            {showDrawerChats && (
                <ChatsBottomSheet
                    setShowDrawerChats={setShowDrawerChats}
                    dropdownPosition={dropdownPosition}
                    drawerSearchQuery={drawerSearchQuery}
                    setDrawerSearchQuery={setDrawerSearchQuery}
                    drawerChatsLoading={drawerChatsLoading}
                    filteredDrawerChats={filteredDrawerChats}
                    navigate={navigate}
                />
            )}
            {showDrawerNotifs && (
                <NotifsBottomSheet
                    setShowDrawerNotifs={setShowDrawerNotifs}
                    dropdownPosition={dropdownPosition}
                    drawerNotifsLoading={drawerNotifsLoading}
                    drawerNotifications={drawerNotifications}
                    handleDrawerNotificationClick={handleNotificationClick}
                    drawerOpenMenuId={drawerOpenMenuId}
                    setDrawerOpenMenuId={setDrawerOpenMenuId}
                    handleDrawerMarkAsRead={handleMarkAsRead}
                    handleDrawerDelete={handleDelete}
                    getNotificationIcon={getNotificationIcon}
                    navigate={navigate}
                />
            )}
        </>
    );
}