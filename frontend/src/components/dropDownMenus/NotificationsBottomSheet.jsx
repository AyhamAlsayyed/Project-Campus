import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MoreHorizontal, Volume2, Calendar, UserPlus, Heart, Users, Check } from "lucide-react";
import styles from './DrawerStyles.module.css';
import API from '../../config';
import { useNotificationContext } from '../../context/NotificationContext';

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
    return `${diffInDays}d ago`;
}

function resolveAvatar(url) {
    if (!url) return '/default-avatar.png';
    return url.startsWith('http') ? url : `${API}${url}`;
}

function formatNotif(item) {
    return {
        id: item.notification_id || item.id,
        is_read: item.is_read,
        avatar: resolveAvatar(item.actor_avatar || item.avatar),
        type: item.type || item.iconType || 'Notification',
        text: item.message || item.content,
        link: item.link || {},
        post_id: item.post_id || null,
        actor_id: item.actor_id || null,
        event_id: item.event_id || null,
        time: timeAgo(item.time || item.created_at),
    };
}

function getNotificationIcon(type) {
    const t = (type || '').toLowerCase();
    if (t.includes('announcement')) return <Volume2 size={12} color="currentColor" />;
    if (t.includes('event')) return <Calendar size={12} color="currentColor" />;
    if (t.includes('friend') || t.includes('request')) return <UserPlus size={12} color="currentColor" />;
    if (t.includes('react') || t.includes('post') || t.includes('like')) return <Heart size={12} color="currentColor" />;
    if (t.includes('community') || t.includes('group')) return <Users size={12} color="currentColor" />;
    return <Volume2 size={12} color="currentColor" />;
}

export default function NotifsBottomSheet({
    setShowDrawerNotifs,
    dropdownPosition,
    navigate,
}) {
    const dropdownRef = useRef(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const { liveNotifCount, clearLiveNotifCount } = useNotificationContext();

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

    useEffect(() => {
        fetchNotifications(true);
        clearLiveNotifCount();
    }, []);

    // ── Poll every 5 seconds ──
    useEffect(() => {
        const interval = setInterval(() => fetchNotifications(false), 5000);
        return () => clearInterval(interval);
    }, [fetchNotifications]);

    // ── Refetch when live notification arrives ──
    useEffect(() => {
        if (liveNotifCount > 0) {
            fetchNotifications(false);
            clearLiveNotifCount();
        }
    }, [liveNotifCount]);

    // ── Click outside ──
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDrawerNotifs(false);
                setOpenMenuId(null);
            }
        }
        const timer = setTimeout(() => {
            document.addEventListener('mousedown', handleClickOutside);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [setShowDrawerNotifs]);

    // ── Actions ──
    const handleNotifClick = useCallback((n) => {
        setShowDrawerNotifs(false);
        const type = (n.type || '').toLowerCase();
        if (type.includes('friend') || type.includes('request')) {
            const profileId = typeof n.link === 'number' ? n.link : n.link?.id || n.actor_id;
            if (profileId) navigate(`/profile/${profileId}`);
            return;
        }
        const post_id = n.post_id || (typeof n.link === 'number' ? n.link : n.link?.post_id);
        if (post_id) {
            navigate('/home', { state: { openPost: { postId: post_id } } });
            return;
        }
        if (n.event_id) { navigate(`/events/${n.event_id}`); return; }
        if (n.actor_id) navigate(`/profile/${n.actor_id}`);
    }, [navigate, setShowDrawerNotifs]);

    const handleMarkAsRead = useCallback(async (id) => {
        const token = localStorage.getItem('access');
        const notif = notifications.find(n => n.id === id);
        if (!notif) return;
        try {
            const res = await fetch(`${API}/api/notifications/${id}/`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ is_read: !notif.is_read }),
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
                setOpenMenuId(null);
            }
        } catch (e) { console.error(e); }
    }, [notifications]);

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
            }
        } catch (e) { console.error(e); }
    }, []);

    const handleMarkAllAsRead = useCallback(async () => {
        const token = localStorage.getItem('access');
        const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
        if (!unreadIds.length) return;
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        try {
            await Promise.all(unreadIds.map(id =>
                fetch(`${API}/api/notifications/${id}/`, {
                    method: 'PATCH',
                    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_read: true }),
                })
            ));
        } catch { fetchNotifications(false); }
    }, [notifications, fetchNotifications]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div
            ref={dropdownRef}
            className={styles.dropdown}
            style={{
                top: dropdownPosition.top,
                right: window.innerWidth < 480 ? '0vw' : dropdownPosition.right,
            }}
        >
            <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Notifications</h3>
                <div className={styles.notifHeaderActions}>
                    {unreadCount > 0 && (
                        <Check
                            size={18}
                            style={{ cursor: 'pointer' }}
                            onClick={handleMarkAllAsRead}
                            title="Mark all as read"
                        />
                    )}
                    <span
                        className={styles.viewAll}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/notifications');
                            setShowDrawerNotifs(false);
                        }}
                    >
                        view all
                    </span>
                </div>
            </div>

            <div className={styles.notifList}>
                {loading ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>Loading...</div>
                ) : notifications.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>No notifications</div>
                ) : notifications.map(n => (
                    <div
                        key={n.id}
                        onClick={() => handleNotifClick(n)}
                        className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ''}`}
                    >
                        {!n.is_read && <span className={styles.unreadDot} />}
                        <div className={styles.notifAvatarWrap}>
                            <img
                                src={n.avatar}
                                alt=""
                                className={styles.notifAvatar}
                                onError={e => { e.currentTarget.src = '/default-avatar.png'; }}
                            />
                            <div className={styles.notifIconBadge}>{getNotificationIcon(n.type)}</div>
                        </div>
                        <div className={styles.notifContent}>
                            <div className={styles.notifTopRow}>
                                <span className={styles.notifType}>{n.type}</span>
                                <span className={styles.notifTime}>{n.time}</span>
                            </div>
                            <p className={styles.notifText}>{n.text}</p>
                        </div>
                        <div
                            className={styles.notifMenuWrapper}
                            onMouseDown={e => e.stopPropagation()}
                        >
                            <button
                                className={styles.notifMenuBtn}
                                onClick={e => {
                                    e.stopPropagation();
                                    setOpenMenuId(openMenuId === n.id ? null : n.id);
                                }}
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {openMenuId === n.id && (
                                <div
                                    className={styles.actionMenu}
                                    onClick={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    <button onClick={e => { e.stopPropagation(); handleMarkAsRead(n.id); }}>
                                        <Check size={14} />
                                        {n.is_read ? 'Mark as unread' : 'Mark as read'}
                                    </button>
                                    <button onClick={e => {
                                        e.stopPropagation();
                                        navigate('/settings/notifications');
                                        setShowDrawerNotifs(false);
                                    }}>
                                        Manage
                                    </button>
                                    <button
                                        className={styles.deleteAction}
                                        onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}