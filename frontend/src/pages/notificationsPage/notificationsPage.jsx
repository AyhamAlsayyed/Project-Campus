import styles from './notificationsPage.module.css';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Volume2, Calendar, UserPlus, Heart, Users } from 'lucide-react';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import Read from '../../Assets/icons/read.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import useTheme from '../../hooks/useTheme';
import API from '../../config';

// ── Helpers ──────────────────────────────────────────────────────────────────
function resolveAvatar(url, fallback = ProfilePicture) {
    if (!url) return fallback;
    return url.startsWith('http') ? url : `${API}${url}`;
}

function timeAgo(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const diffInSeconds = Math.floor((Date.now() - date) / 1000);
    if (diffInSeconds < 60) return 'Just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min. ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr. ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getBucket(dateString) {
    if (!dateString) return 'earlier';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'earlier';
    const now = Date.now();
    const diff = now - date.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days <= 7) return 'week';
    if (days <= 30) return 'month';
    return 'earlier';
}

function getNotificationIcon(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('announcement')) return <Volume2 size={12} color="currentColor" />;
    if (t.includes('event')) return <Calendar size={12} color="currentColor" />;
    if (t.includes('friend') || t.includes('request') || t.includes('follow')) return <UserPlus size={12} color="currentColor" />;
    if (t.includes('react') || t.includes('post') || t.includes('like')) return <Heart size={12} color="currentColor" />;
    if (t.includes('community') || t.includes('group')) return <Users size={12} color="currentColor" />;
    return <Volume2 size={12} color="currentColor" />;
}

function formatNotif(item) {
    const notifLink = item.link || {};
    const linkPost = notifLink.post || null;
    const resolvedPostId =
        typeof item.link === 'number'
            ? item.link
            : linkPost?.post_id || notifLink.post_id || item.post_id || null;

    return {
        id: item.notification_id || item.id,
        is_read: item.is_read,
        avatar: resolveAvatar(item.actor_avatar || item.avatar),
        type: item.type || item.iconType || 'Notification',
        text: item.message || item.content,
        link: notifLink,
        post_id: resolvedPostId,
        post: linkPost,
        comment_id: typeof item.link === 'object' ? notifLink.comment_id || item.comment_id || null : null,
        actor_id: item.actor_id || null,
        event_id: item.event_id || null,
        time: item.time || item.created_at || null,
        timeLabel: timeAgo(item.time || item.created_at),
        bucket: getBucket(item.time || item.created_at),
    };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [currentUser, setCurrentUser] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuRect, setMenuRect] = useState(null);
    const menuBtnRef = useRef(null);

    const filters = ['All', 'People you follow', 'Comments', 'Follows', 'Mentions'];

    // ── Fetch user ──
    useEffect(() => {
        const fetchUser = async () => {
            const token = localStorage.getItem('access');
            if (!token) return;
            try {
                const res = await fetch(`${API}/api/auth/me/`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) setCurrentUser(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchUser();
    }, []);

    // ── Fetch notifications ──
    const fetchNotifications = useCallback(async () => {
        const token = localStorage.getItem('access');
        if (!token) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.map(formatNotif));
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

    // ── Menu rect tracking on scroll ──
    useEffect(() => {
        if (!openMenuId) return;
        const update = () => {
            if (menuBtnRef.current) setMenuRect(menuBtnRef.current.getBoundingClientRect());
        };
        window.addEventListener('scroll', update, true);
        window.addEventListener('resize', update);
        return () => {
            window.removeEventListener('scroll', update, true);
            window.removeEventListener('resize', update);
        };
    }, [openMenuId]);

    // ── Close menu on outside click ──
    useEffect(() => {
        const handler = (e) => {
            if (menuBtnRef.current && !menuBtnRef.current.contains(e.target)) {
                setOpenMenuId(null);
                setMenuRect(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // ── Actions ──
    const handleMarkAsRead = useCallback(async (id, currentlyRead) => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`${API}/api/notifications/${id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: !currentlyRead }),
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: !currentlyRead } : n));
                setOpenMenuId(null);
                setMenuRect(null);
            }
        } catch (e) { console.error(e); }
    }, []);

    const handleDelete = useCallback(async (id) => {
        const token = localStorage.getItem('access');
        try {
            const res = await fetch(`${API}/api/notifications/${id}/`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            });
            if (res.ok) {
                setNotifications(prev => prev.filter(n => n.id !== id));
                setOpenMenuId(null);
                setMenuRect(null);
            }
        } catch (e) { console.error(e); }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        const token = localStorage.getItem('access');
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (!unreadIds.length) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await Promise.all(
                unreadIds.map(id =>
                    fetch(`${API}/api/notifications/${id}/`, {
                        method: 'PATCH',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_read: true }),
                    })
                )
            );
        } catch {
            fetchNotifications();
        }
    }, [notifications, fetchNotifications]);

    const handleNotifClick = useCallback((n) => {
        setOpenMenuId(null);
        const type = (n.type || '').toLowerCase();

        if (type.includes('friend') || type.includes('request')) {
            const profileId = typeof n.link === 'number' ? n.link : n.link?.id || n.actor_id;
            if (profileId) navigate(`/profile/${profileId}`);
            return;
        }

        const post_id = n.post_id || (typeof n.link === 'number' ? n.link : n.link?.post_id);
        const comment_id = n.comment_id || null;
        const post = n.post || n.link?.post || null;

        if (post_id) {
            navigate('/home', { state: { openPost: { post, postId: post_id, commentId: comment_id } } });
            return;
        }

        if (n.event_id) { navigate(`/events/${n.event_id}`); return; }

        if (n.link?.id) navigate(`/profile/${n.link.id}`);
        else if (n.actor_id) navigate(`/profile/${n.actor_id}`);
    }, [navigate]);

    // ── Buckets ──
    const filtered = useMemo(() => {
        if (activeFilter === 'All') return notifications;
        const f = activeFilter.toLowerCase();
        return notifications.filter(n => (n.type || '').toLowerCase().includes(f));
    }, [notifications, activeFilter]);

    const thisWeek = useMemo(() => filtered.filter(n => n.bucket === 'week'), [filtered]);
    const thisMonth = useMemo(() => filtered.filter(n => n.bucket === 'month'), [filtered]);
    const earlier = useMemo(() => filtered.filter(n => n.bucket === 'earlier'), [filtered]);
    const unreadCount = useMemo(() => notifications.filter(n => !n.is_read).length, [notifications]);

    // ── Render a single notification ──
    const renderNotif = (n) => (
        <div
            key={n.id}
            className={`${styles.notifItem} ${!n.is_read ? styles.unread : ''}`}
            onClick={() => handleNotifClick(n)}
        >
            {!n.is_read && <span className={styles.unreadDot} />}

            <div className={styles.notifAvatarWrap}>
                <img
                    src={n.avatar}
                    alt=""
                    className={styles.notifAvatar}
                    onError={e => { e.currentTarget.src = ProfilePicture; }}
                />
                <div className={styles.notifIconBadge}>
                    {getNotificationIcon(n.type)}
                </div>
            </div>

            <div className={styles.notifBody}>
                <div className={styles.notifTopRow}>
                    <span className={styles.notifType}>{n.type}</span>
                    <span className={styles.notifTime}>{n.timeLabel}</span>
                </div>
                <p className={styles.notifText}>{n.text}</p>
            </div>

            <div
                className={styles.menuWrapper}
                onMouseDown={e => e.stopPropagation()}
            >
                <button
                    className={styles.menuBtn}
                    onClick={e => {
                        e.stopPropagation();
                        if (openMenuId === n.id) { setOpenMenuId(null); setMenuRect(null); menuBtnRef.current = null; }
                        else { menuBtnRef.current = e.currentTarget; setOpenMenuId(n.id); setMenuRect(e.currentTarget.getBoundingClientRect()); }
                    }}
                >
                    <MoreHorizontal size={20} />
                </button>

                {openMenuId === n.id && menuRect && createPortal(
                    <div
                        className={styles.actionMenu}
                        style={{ position: 'fixed', top: menuRect.bottom + 6, left: menuRect.left + menuRect.width / 2, transform: 'translateX(-50%)', zIndex: 999999 }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <button onClick={e => { e.stopPropagation(); handleMarkAsRead(n.id, n.is_read); }}>
                            <img src={Read} alt="" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} />
                            {n.is_read ? 'Mark as unread' : 'Mark as read'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); navigate('/settings'); setOpenMenuId(null); }}>
                            Manage
                        </button>
                        <button
                            className={styles.deleteAction}
                            onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                        >
                            Delete
                        </button>
                    </div>,
                    document.body
                )}
            </div>
        </div>
    );

    const renderSection = (label, items) => {
        if (!items.length) return null;
        return (
            <div className={styles.bucketSection}>
                <h3 className={styles.bucketLabel}>{label}</h3>
                {items.map(renderNotif)}
            </div>
        );
    };

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>

            <div className={`${styles.page} ${styles.content}`}>
                <SideBarNav variant="default" currentUser={currentUser} />

                <div className={styles.mainColumn}>
                    {/* Title */}
                    <div className={styles.titleRow}>
                        <h1 className={styles.pageTitle}>
                            <span className={styles.highlight}>Notifications</span>
                        </h1>
                        {unreadCount > 0 && (
                            <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                                <img src={Read} alt="" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} />
                                Mark all as read
                            </button>
                        )}
                    </div>

                    {/* Filter chips */}


                    {/* Outer card */}
                    <div className={styles.postContainer}>
                        <div className={styles.innerContainer}>
                            {loading ? (
                                <div className={styles.emptyState}>
                                    <p className={styles.emptyText}>Loading notifications…</p>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className={styles.emptyState}>
                                    <span className={styles.emptyIcon}>🔔</span>
                                    <h2 className={styles.emptyTitle}>No notifications</h2>
                                    <p className={styles.emptySubtitle}>You're all caught up!</p>
                                </div>
                            ) : (
                                <>
                                    {renderSection('This week', thisWeek)}
                                    {renderSection('This month', thisMonth)}
                                    {renderSection('Earlier', earlier)}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right section */}
                <div className={styles.rightSection}>
                    <div className={styles.rightCard}>
                        <h3 className={styles.rightCardTitle}>Summary</h3>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Total</span>
                            <span className={styles.summaryValue}>{notifications.length}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>Unread</span>
                            <span className={`${styles.summaryValue} ${styles.summaryUnread}`}>{unreadCount}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>This week</span>
                            <span className={styles.summaryValue}>{thisWeek.length}</span>
                        </div>
                        <div className={styles.summaryRow}>
                            <span className={styles.summaryLabel}>This month</span>
                            <span className={styles.summaryValue}>{thisMonth.length}</span>
                        </div>

                        <div className={styles.rightDivider} />

                        <button className={styles.manageBtn} onClick={() => navigate('/settings')}>
                            Manage Preferences
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}