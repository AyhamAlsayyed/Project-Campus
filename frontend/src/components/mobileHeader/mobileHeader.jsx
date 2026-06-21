import { useState, useEffect, useRef } from 'react';
import { Search, Menu, Volume2, Calendar, UserPlus, Heart, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotificationContext } from '../../context/NotificationContext';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import MessageSquareIcon from '../../Assets/icons/messages.png';
import BellIcon from '../../Assets/icons/notifications.png';
import BellActiveIcon from '../../Assets/icons/notifications-active.png';
import NotifsBottomSheet from '../dropDownMenus/NotificationsBottomSheet';
import ChatsBottomSheet from '../dropDownMenus/ChatsBottomSheet';
import headerStyles from './mobileHeader.module.css';
import { createPortal } from 'react-dom';
import { Users, User, BookOpen, X } from 'lucide-react';
export default function MobileHeader({ avatarSrc, user, setMobileMenuOpen, token, API, homeMode = false }) {
    const navigate = useNavigate();
    const avatarDropdownRef = useRef(null);
    const { registerChatListener, liveNotifications, clearLiveNotifCount } = useNotificationContext();

    // ── UI state ──
    const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
    const [showDrawerChats, setShowDrawerChats] = useState(false);
    const [showDrawerNotifs, setShowDrawerNotifs] = useState(false);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
            const res = await fetch(`${API}/api/notifications/`, {
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
                     userId: chat.other_member_id || chat.user_id || null,
                    avatar: chat.avatar ? (chat.avatar.startsWith('http') ? chat.avatar : `${API}${chat.avatar}`) : DefaultPfp,
                    message: chat.preview || chat.last_message || 'No messages yet',
                    status: chat.is_online ? 'online' : 'offline',
                    dotStyle: chat.is_online ? 'online' : 'offline',
                    isGroup: chat.is_group || false,
                    isPage: chat.is_page || false,
                    unread: chat.unread_count || 0,
                    time: timeAgo(chat.last_message_time),
                    left_at: chat.left_at || null,
                })));
            }
        } catch (e) { console.error('Chat fetch failed', e); }
        finally { setDrawerChatsLoading(false); }
    };

    // ── Real-time chat updates via WebSocket ──
    useEffect(() => {
        const unregister = registerChatListener((data) => {
            const { conversation_id, preview, sender_username } = data;
            setDrawerChats(prev => prev.map(chat => {
                if (chat.id !== conversation_id) return chat;
                if (chat.left_at) return chat;
                return {
                    ...chat,
                    unread: (chat.unread || 0) + 1,
                    message: preview ? `${sender_username}: ${preview}` : chat.message,
                };
            }));
        });
        return unregister;
    }, [registerChatListener]);

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
        setShowDrawerNotifs(false);
        const type = (n.type || '').toLowerCase();
        const link = n.link || {};
        const communityId = link.community_id;
        const eventId = link.event_id || n.event_id;
        const postId = typeof link === 'number' ? link : (link.post?.post_id || link.post_id || n.post_id);
        const actorId = typeof link === 'number' ? link : n.actor_id;

        if (communityId) { navigate(`/communities/${communityId}`); return; }
        if (type.includes('friend')) { if (actorId) navigate(`/profile/${actorId}`); return; }
        if (type.includes('dm')) { navigate('/chats'); return; }
        if (postId) { navigate('/home', { state: { openPost: { postId } } }); return; }
        if (eventId) { navigate(`/events/${eventId}`); return; }
        if (actorId) navigate(`/profile/${actorId}`);
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
        if (showDrawerNotifs) { fetchNotifications(); clearLiveNotifCount(); }
    }, [showDrawerNotifs]);

    // Sync real-time WebSocket notifications into drawer list
    useEffect(() => {
        if (!liveNotifications || liveNotifications.length === 0) return;
        setDrawerNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const newNotifs = liveNotifications
                .filter(n => !existingIds.has(n.notification_id || n.id))
                .map(item => ({
                    id: item.notification_id || item.id,
                    is_read: false,
                    avatar: (item.actor_avatar || item.avatar)?.startsWith('http')
                        ? (item.actor_avatar || item.avatar)
                        : `${API}${item.actor_avatar || item.avatar}`,
                    type: item.type || 'Notification',
                    text: item.message || item.content,
                    actor_id: item.actor_id,
                    post_id: item.post_id,
                    event_id: item.event_id,
                    time: timeAgo(item.time) || item.time,
                }));
            if (newNotifs.length === 0) return prev;
            return [...newNotifs, ...prev];
        });
    }, [liveNotifications]);

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
            <div className={headerStyles.headerBar}>
                {/* Hamburger */}
                <button className={headerStyles.hamburgerBtn} onClick={() => setMobileMenuOpen(true)}>
                    <Menu size={22} className={headerStyles.hamburgerIcon} />
                </button>

                {/* Logo */}
                <img src={darkModeIcon} alt="Logo" className={headerStyles.logo} onClick={() => navigate('/home')} style={{ cursor: 'pointer' }} />

                {/* Search bar */}
                <div className={headerStyles.searchBar}>
                    <Search size={15}  style={{ flexShrink: 0 }} />
                    <input
                        ref={searchInputRef}
                        className={headerStyles.searchInput}
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
                        <button className={headerStyles.clearBtn}
                            onClick={() => { setSearchQuery(''); setSearchResults(null); setShowSearchDropdown(false); }}>
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* Avatar */}
                <div className={headerStyles.avatarWrap} ref={avatarDropdownRef}>
                    <button
                        onClick={() => setShowAvatarDropdown(p => !p)}
                        className={`${headerStyles.avatarBtn} ${homeMode ? headerStyles.avatarBtnHome : headerStyles.avatarBtnDefault}`}
                    >
                        {homeMode
                            ? <Home size={20} />
                            : <img src={avatarSrc} alt="Profile" className={headerStyles.avatarImg} />
                        }
                    </button>

                    {showAvatarDropdown && (
                        <div className={headerStyles.avatarDropdown}>
                            {homeMode ? (
                                <button className={headerStyles.dropdownItem}
                                    onClick={() => { navigate('/home'); setShowAvatarDropdown(false); }}>
                                    <Home size={20} />
                                    Home
                                </button>
                            ) : (
                                <button className={headerStyles.dropdownItem}
                                    onClick={() => {
                                        const loggedInType = localStorage.getItem('user_type');
                                        const isPageUser = loggedInType === 'page' || loggedInType === 'university';
                                        const id = isPageUser ? user?.page_id : user?.id;
                                        if (!id) return;
                                        navigate(isPageUser ? `/page/${id}` : `/profile/${id}`);
                                        setShowAvatarDropdown(false);
                                    }}>
                                    <img src={avatarSrc} alt="" className={headerStyles.dropdownAvatarImg} />
                                    Profile
                                </button>
                            )}

                            <div className={headerStyles.dropdownDivider} />

                            <button className={headerStyles.dropdownItem}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1; setDropdownPosition({ top: rect.bottom / z + 8, left: rect.right / z });
                                    setShowDrawerChats(prev => !prev);
                                    setShowDrawerNotifs(false);
                                }}>
                                <img src={MessageSquareIcon} width={22} height={22} alt="" className={headerStyles.dropdownIcon} />
                                Messages
                                {drawerUnreadChats > 0 && (
                                    <span className={`${headerStyles.unreadBadge} ${headerStyles.unreadBadgeMessages}`}>
                                        {drawerUnreadChats}
                                    </span>
                                )}
                            </button>

                            <div className={headerStyles.dropdownDivider} />

                            <button className={headerStyles.dropdownItem}
                                onClick={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1; setDropdownPosition({ top: rect.bottom / z + 8, left: rect.right / z });
                                    setShowDrawerNotifs(prev => !prev);
                                    setShowDrawerChats(false);
                                }}>
                                <img src={drawerUnreadCount > 0 ? BellActiveIcon : BellIcon}
                                    width={22} height={22} alt="" className={headerStyles.dropdownIcon} />
                                Notifications
                                {drawerUnreadCount > 0 && (
                                    <span className={`${headerStyles.unreadBadge} ${headerStyles.unreadBadgeNotifs}`}>
                                        {drawerUnreadCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Search portal */}
                {showSearchDropdown && searchQuery.trim() && searchBoxRect && createPortal(
                    <div className={headerStyles.searchPortal} style={{
                        top: searchBoxRect.bottom + 6,
                        left: searchBoxRect.left + 8,
                        width: `calc(${searchBoxRect.width}px - 16px)`,
                        maxWidth: '500px',
                    }}>
                        <div className={headerStyles.seeAllRow} onMouseDown={() => handleResultClick('all')}>
                            <div className={headerStyles.seeAllIconWrap}><Search size={14} color="white" /></div>
                            <span className={headerStyles.seeAllText}>
                                See all results for "<span className={headerStyles.seeAllHighlight}>{searchQuery}</span>"
                            </span>
                        </div>

                        {searchLoading ? (
                            <div className={headerStyles.searchStatus}>Searching…</div>
                        ) : searchResults ? (
                            <>
                                {searchResults.people?.length > 0 && (
                                    <div>
                                        <div className={headerStyles.sectionLabel}>People</div>
                                        {searchResults.people.slice(0, 3).map(person => {
                                            const av = person.profile?.profile_image || person.avatar_url || person.avatar;
                                            const src = !av ? DefaultPfp : av.startsWith('http') ? av : `${API}${av}`;
                                            return (
                                                <div key={person.id} className={headerStyles.resultRow}
                                                    onMouseDown={() => handleResultClick('person', person)}>
                                                    <img src={src} alt="" className={`${headerStyles.resultAvatar}${!av ? ' defaultPfp' : ''}`} onError={e => { e.currentTarget.src = DefaultPfp; e.currentTarget.classList.add('defaultPfp'); }} />
                                                    <div className={headerStyles.resultInfo}>
                                                        <div className={headerStyles.resultName}>{person.profile?.full_name || person.full_name || person.username}</div>
                                                        <div className={headerStyles.resultSub}>@{person.username}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {searchResults.communities?.length > 0 && (
                                    <div>
                                        <div className={headerStyles.sectionLabel}>Communities</div>
                                        {searchResults.communities.slice(0, 3).map(community => (
                                            <div key={community.id} className={headerStyles.resultRow}
                                                onMouseDown={() => handleResultClick('community', community)}>
                                                {community.avatar
                                                    ? <img src={community.avatar.startsWith('http') ? community.avatar : `${API}${community.avatar}`} alt="" className={headerStyles.resultAvatarSquare} />
                                                    : <div className={headerStyles.resultAvatarPlaceholderPurple}><Users size={16} color="#c084fc" /></div>
                                                }
                                                <div className={headerStyles.resultInfo}>
                                                    <div className={headerStyles.resultName}>{community.name}</div>
                                                    <div className={headerStyles.resultSub}>{community.is_joined ? '✓ Joined' : community.is_private ? '🔒 Private' : 'Not joined'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {searchResults.pages?.length > 0 && (
                                    <div>
                                        <div className={headerStyles.sectionLabel}>Pages</div>
                                        {searchResults.pages.slice(0, 3).map(page => (
                                            <div key={page.id} className={headerStyles.resultRow}
                                                onMouseDown={() => handleResultClick('page', page)}>
                                                {page.profile_image
                                                    ? <img src={page.profile_image.startsWith('http') ? page.profile_image : `${API}${page.profile_image}`} alt="" className={headerStyles.resultAvatarSquare} />
                                                    : <div className={headerStyles.resultAvatarPlaceholderGray}><BookOpen size={16} color="rgba(255,255,255,0.5)" /></div>
                                                }
                                                <div className={headerStyles.resultInfo}>
                                                    <div className={headerStyles.resultName}>{page.page_full_name || page.page_name || page.name}</div>
                                                    <div className={headerStyles.resultSub}>{page.page_type || 'Page'}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {!searchResults.people?.length && !searchResults.communities?.length && !searchResults.pages?.length && (
                                    <div className={headerStyles.searchStatus}>No results found</div>
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
                    onChatClick={(id) => setDrawerChats(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))}
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