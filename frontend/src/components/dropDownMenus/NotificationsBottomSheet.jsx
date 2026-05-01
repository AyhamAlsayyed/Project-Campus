import React, { useEffect, useRef } from 'react';
import { Check, MoreHorizontal } from "lucide-react";
import styles from './DrawerStyles.module.css';

export default function NotifsBottomSheet({
    setShowDrawerNotifs,
    dropdownPosition,
    drawerNotifsLoading,
    drawerNotifications,
    handleDrawerNotificationClick,
    drawerOpenMenuId,
    setDrawerOpenMenuId,
    handleDrawerMarkAsRead,
    handleDrawerDelete,
    getNotificationIcon,
    navigate
}) {
    const dropdownRef = useRef(null);

    // Click outside listener
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDrawerNotifs(false);
                setDrawerOpenMenuId(null);
            }
        }
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setShowDrawerNotifs]);

    return (
        <div
            ref={dropdownRef}
            className={`${styles.dropdown} max-w-[92vw] sm:max-w-[420px] overflow-hidden`}
            style={{
                top: dropdownPosition.top,
                right: window.innerWidth < 480 ? '0vw' : dropdownPosition.right,
            }}
        >
            <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Notifications</h3>
                <div className={styles.notifHeaderActions}>
                    <Check size={18} />
                    <span
                        className={styles.viewAll}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate("/notifications"); // Adjust route if needed
                            setShowDrawerNotifs(false);
                        }}
                    >
                        view all
                    </span>
                </div>
            </div>

            <div className={styles.notifList}>
                {drawerNotifsLoading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</div>
                ) : drawerNotifications.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No notifications</div>
                ) : drawerNotifications.map(n => (
                    <div
                        key={n.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDrawerNotificationClick(n);
                        }}
                        className={`${styles.notificationItem} ${!n.is_read ? styles.unread : ""}`}
                    >
                        {!n.is_read && <span className={styles.unreadDot} />}
                        <div className={styles.notifAvatarWrap}>
                            <img src={n.avatar || "/default-avatar.png"} alt="" className={styles.notifAvatar} />
                            <div className={styles.notifIconBadge}>{getNotificationIcon(n.type)}</div>
                        </div>
                        <div className={styles.notifContent}>
                            <div className={styles.notifTopRow}>
                                <span className={styles.notifType}>{n.type}</span>
                                <span className={styles.notifTime}>{n.time}</span>
                            </div>
                            <p className={styles.notifText}>{n.text}</p>
                        </div>
                        <div className={styles.notifMenuWrapper}>
                            <button
                                className={styles.notifMenuBtn}
                                onClick={e => { e.stopPropagation(); setDrawerOpenMenuId(drawerOpenMenuId === n.id ? null : n.id); }}
                            >
                                <MoreHorizontal size={18} />
                            </button>
                            {drawerOpenMenuId === n.id && (
                                <div
                                    className={styles.actionMenu}
                                    onClick={e => e.stopPropagation()}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    <button onClick={e => { e.stopPropagation(); handleDrawerMarkAsRead(n.id); }}>
                                        <Check size={14} /> Read
                                    </button>
                                    <button onClick={e => { e.stopPropagation(); navigate("/settings/notifications"); setShowDrawerNotifs(false); }}>
                                        Manage
                                    </button>
                                    <button
                                        className={styles.deleteAction}
                                        onClick={e => { e.stopPropagation(); handleDrawerDelete(n.id); }}
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