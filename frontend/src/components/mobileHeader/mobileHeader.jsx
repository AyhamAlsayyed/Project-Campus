import { useState, useEffect, useRef } from 'react';
import { Search, Menu, Volume2, Calendar, UserPlus, Heart, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import MessageSquareIcon from '../../Assets/icons/messages.png';
import BellIcon from '../../Assets/icons/notifications.png';
import BellActiveIcon from '../../Assets/icons/notifications-active.png';
import NotifsBottomSheet from '../dropDownMenus/NotificationsBottomSheet';
import ChatsBottomSheet from '../dropDownMenus/ChatsBottomSheet';

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
                    minWidth: 0
                }}>
                    <Search size={15} color="rgba(255,255,255,0.6)" style={{ flexShrink: 0 }} />
                    <input
                        style={{
                            flex: 1, background: "transparent", border: "none",
                            outline: "none", color: "#fff", fontSize: "0.85rem", minWidth: 0
                        }}
                        placeholder="Search..."
                    />
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