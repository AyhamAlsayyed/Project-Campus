import styles from './notificationsPage.module.css';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { MoreHorizontal, Volume2, Calendar, UserPlus, Heart, Users, Trash2 } from 'lucide-react';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import Read from '../../Assets/icons/read.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import useTheme from '../../hooks/useTheme';
import API from '../../config';
import { useNotificationContext } from '../../context/NotificationContext';
import { useUser } from '../../context/UserContext';

// ── Helpers ──────────────────────────────────────────────────────────────────
function resolveAvatar(url, fallback = ProfilePicture) {
    if (!url) return fallback;
    return url.startsWith('http') ? url : `${API}${url}`;
}

function timeAgo(dateString) {
    if (!dateString) return '';
    const normalized =
        typeof dateString === 'string' &&
        !dateString.includes('Z') &&
        !dateString.includes('+') &&
        !dateString.match(/[+-]\d{2}:\d{2}$/)
            ? dateString + 'Z'
            : dateString;
    const date = new Date(normalized);
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
    const normalized =
        typeof dateString === 'string' &&
        !dateString.includes('Z') &&
        !dateString.includes('+')
            ? dateString + 'Z'
            : dateString;
    const date = new Date(normalized);
    if (isNaN(date.getTime())) return 'earlier';
    const days = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
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
    const isLinkNum = typeof item.link === 'number';
    const notifLink = !isLinkNum && item.link ? item.link : {};
    const linkPost = notifLink.post || null;
    const resolvedPostId = isLinkNum
        ? item.link
        : (linkPost?.post_id || notifLink.post_id || item.post_id || null);

    return {
        id: item.notification_id || item.id,
        is_read: item.is_read,
        avatar: resolveAvatar(item.actor_avatar || item.avatar),
        type: item.type || item.iconType || 'Notification',
        text: item.message || item.content,
        link: notifLink,
        post_id: resolvedPostId,
        post: linkPost,
        comment_id: notifLink.comment_id || item.comment_id || null,
        actor_id: isLinkNum ? item.link : (item.actor_id || null),
        event_id: notifLink.event_id || item.event_id || null,
        community_id: notifLink.community_id || null,
        time: item.time || item.created_at || null,
        timeLabel: timeAgo(item.time || item.created_at),
        bucket: getBucket(item.time || item.created_at),
    };
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function NotificationsPage() {
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { liveNotifications, liveNotifCount, clearLiveNotifCount } = useNotificationContext();

    const { user: currentUser, avatarSrc } = useUser();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, _setActiveFilter] = useState(searchParams.get('filter') || 'All');
    const setActiveFilter = useCallback((f) => {
        _setActiveFilter(f);
        setSearchParams(f !== 'All' ? { filter: f } : {}, { replace: true });
    }, [setSearchParams]);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuRect, setMenuRect] = useState(null);
    const menuBtnRef = useRef(null);

    const filters = ['All', 'Comments', 'Follows', 'Mentions'];

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    // ── Fetch notifications ──
    const fetchNotifications = useCallback(async (showLoader = false) => {
        const token = localStorage.getItem('access');
        if (!token) return;
        if (showLoader) setLoading(true);
        try {
            const res = await fetch(`${API}/api/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setNotifications(data.map(formatNotif));
            }
        } catch (e) { console.error(e); }
        finally { if (showLoader) setLoading(false); }
    }, []);

    useEffect(() => { fetchNotifications(true); }, [fetchNotifications]);


 


    // ── Sync WebSocket live notifications (mirrors header logic) ──
    useEffect(() => {
        if (!liveNotifications || liveNotifications.length === 0) return;

        setNotifications(prev => {
            const newNotifs = liveNotifications.map(formatNotif);
            const existingIds = new Set(prev.map(n => n.id));
            const uniqueNew = newNotifs.filter(n => !existingIds.has(n.id));
            if (uniqueNew.length === 0) return prev;
            return [...uniqueNew, ...prev];
        });
    }, [liveNotifications]);

    // ── Clear live notif count when on this page ──
    useEffect(() => {
        if (liveNotifCount > 0) {
            clearLiveNotifCount();
        }
    }, [liveNotifCount, clearLiveNotifCount]);

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
            fetchNotifications(false);
        }
    }, [notifications, fetchNotifications]);

    // ── Delete all ──
    const handleDeleteAll = useCallback(async () => {
        const token = localStorage.getItem('access');
        const allIds = notifications.map(n => n.id);
        if (!allIds.length) return;

        // Optimistic update
        const snapshot = notifications;
        setNotifications([]);
        setIsDeletingAll(true);

        try {
            await Promise.all(
                allIds.map(id =>
                    fetch(`${API}/api/notifications/${id}/`, {
                        method: 'DELETE',
                        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    })
                )
            );
        } catch (e) {
            console.error(e);
            // Rollback on failure
            setNotifications(snapshot);
        } finally {
            setIsDeletingAll(false);
        }
    }, [notifications]);

    const handleNotifClick = useCallback((n) => {
        setOpenMenuId(null);
        const type = (n.type || '').toLowerCase();

        // Community notifications
        if (n.community_id) { navigate(`/communities/${n.community_id}`); return; }

        // Friend request / accepted → their profile
        if (type.includes('friend')) {
            if (n.actor_id) navigate(`/profile/${n.actor_id}`);
            return;
        }

        // DM request → go to chats
        if (type.includes('dm')) { navigate('/chats'); return; }

        // Post reaction / comment → open the post
        if (n.post_id) {
            navigate('/home', { state: { openPost: { post: n.post, postId: n.post_id, commentId: n.comment_id } } });
            return;
        }

        // Event notification
        if (n.event_id) { navigate(`/events/${n.event_id}`); return; }

        // Fallback → actor profile
        if (n.actor_id) navigate(`/profile/${n.actor_id}`);
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
            <div className={styles.menuWrapper} onMouseDown={e => e.stopPropagation()}>
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
                        style={{
                            position: 'fixed',
                            ...(menuRect.bottom + 150 > window.innerHeight
                                ? { top: 'auto', bottom: window.innerHeight - menuRect.top + 6 }
                                : { top: menuRect.bottom + 6 }),
                            left: menuRect.left + menuRect.width / 2,
                            transform: 'translateX(-50%)',
                            zIndex: 999999
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <button onClick={e => { e.stopPropagation(); handleMarkAsRead(n.id, n.is_read); }}>
                            <img src={Read} alt="" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} />
                            {n.is_read ? 'Mark as unread' : 'Mark as read'}
                        </button>
                        <button onClick={e => { e.stopPropagation(); navigate('/settings'); setOpenMenuId(null); }}>
                            Manage
                        </button>
                        <button className={styles.deleteAction} onClick={e => { e.stopPropagation(); handleDelete(n.id); }}>
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

    const mainContent = (
        <div className={styles.mainColumn}>
            <div className={styles.titleRow}>
                <h1 className={styles.pageTitle}>
                    <span className={styles.highlight}>Notifications</span>
                </h1>
                <div className={styles.titleActions}>
                    {unreadCount > 0 && (
                        <button className={styles.markAllBtn} onClick={handleMarkAllAsRead}>
                            <img src={Read} alt="" style={{ width: 15, height: 15, filter: 'brightness(0) invert(1)' }} />
                            Mark all as read
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            className={styles.deleteAllBtn}
                            onClick={() => setShowDeleteAllConfirm(true)}
                            disabled={isDeletingAll}
                        >
                            <Trash2 size={15} />
                            {isDeletingAll ? 'Deleting…' : 'Delete all'}
                        </button>
                    )}
                </div>
            </div>

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
    );

    // ── MOBILE ──
    if (isMobile) {
        return (
            <div className={styles.darkContainer} data-theme={theme}>
                {showDeleteAllConfirm && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px', width: 300, textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                            <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0 0 8px' }}>Delete all notifications?</p>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 24px' }}>This action cannot be undone.</p>
                            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                                <button onClick={() => setShowDeleteAllConfirm(false)} style={{ padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                                <button onClick={() => { setShowDeleteAllConfirm(false); handleDeleteAll(); }} style={{ padding: '10px 20px', borderRadius: 12, border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>Delete all</button>
                            </div>
                        </div>
                    </div>
                )}
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={currentUser}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={localStorage.getItem('access')}
                    API={API}
                />

                <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} />

                <div className={styles.mobileBody}>
                    {mainContent}
                </div>
            </div>
        );
    }

    // ── DESKTOP ──
    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {showDeleteAllConfirm && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#1e1e1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: '32px', width: 340, textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
                        <p style={{ color: '#fff', fontSize: '1rem', fontWeight: 600, margin: '0 0 8px' }}>Delete all notifications?</p>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: '0 0 24px' }}>This action cannot be undone.</p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                            <button onClick={() => setShowDeleteAllConfirm(false)} style={{ padding: '10px 24px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.07)', color: '#fff', cursor: 'pointer', fontSize: '0.9rem' }}>Cancel</button>
                            <button onClick={() => { setShowDeleteAllConfirm(false); handleDeleteAll(); }} style={{ padding: '10px 24px', borderRadius: 12, border: 'none', background: '#c0392b', color: '#fff', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>Delete all</button>
                        </div>
                    </div>
                </div>
            )}
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>

            <div className={`${styles.page} ${styles.content}`}>
                <SideBarNav variant="default" currentUser={currentUser} />

                {mainContent}

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