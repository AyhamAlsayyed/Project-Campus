import React, { useEffect, useRef } from 'react';
import { Search, Check } from "lucide-react";
import styles from './DrawerStyles.module.css';
import StatusDot from '../presence/StatusDot';
export default function ChatsBottomSheet({
    setShowDrawerChats,
    dropdownPosition,
    drawerSearchQuery,
    setDrawerSearchQuery,
    drawerChatsLoading,
    filteredDrawerChats,
    navigate
}) {
    const dropdownRef = useRef(null);


    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDrawerChats(false);
            }
        }
        const timer = setTimeout(() => {
            document.addEventListener("mousedown", handleClickOutside);
        }, 50);
        return () => {
            clearTimeout(timer);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setShowDrawerChats]);

    return (
        <div
            ref={dropdownRef}
            className={`${styles.dropdown} max-w-[92vw] sm:max-w-[420px] overflow-hidden`}
            style={{
                top: dropdownPosition.top,
                right: window.innerWidth < 480 ? '0vw' : dropdownPosition.right,
            }}
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
        >
            <div className={styles.notifHeader}>
                <h3 className={styles.notifTitle}>Chats</h3>
                <div className={styles.notifHeaderActions}>
                    <Check size={18} />
                    <span
                        className={styles.viewAll}
                        onClick={(e) => {
                            e.stopPropagation(); // Stops click from bubbling up
                            navigate("/chats");
                            setShowDrawerChats(false);
                        }}
                    >
                        view all
                    </span>
                </div>
            </div>

            <div className={styles.chatSearchContainer}>
                <Search size={18} className={`${styles.chatSearchIcon} text-white mr-3`} />
                <input
                    className={styles.chatSearchInput}
                    placeholder="Searching for someone?"
                    value={drawerSearchQuery}
                    onChange={e => setDrawerSearchQuery(e.target.value)}
                />
            </div>

            <div className={styles.chatListWrapper}>
                {drawerChatsLoading ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>Loading...</div>
                ) : filteredDrawerChats.length === 0 ? (
                    <div style={{ padding: "20px", textAlign: "center", color: "rgba(255,255,255,0.4)" }}>No chats found</div>
                ) : filteredDrawerChats.map(chat => (
                    <div
                        key={chat.id}
                        className={styles.chatItem}
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/chats/${chat.id}`);
                            setShowDrawerChats(false);
                        }}
                    >
                        <div className={styles.chatAvatarWrap}>
                            <img src={chat.avatar} alt="" className={styles.chatAvatar} />
                           {!chat.isGroup && <StatusDot userId={chat.userId} size="sm" />}

                        </div>
                        <div className={styles.chatGrid}>
                            {!chat.isGroup && <span className={styles.chatStatus}>{chat.status}</span>}
                            <span className={styles.chatPreview}>{chat.message}</span>
                            <span className={styles.chatName}>{chat.name}</span>
                            <div className={styles.chatTimeContainer}>
                                {chat.unread > 0 && <span className={styles.chatUnread}>{chat.unread}</span>}
                                <span className={styles.chatTime}>{chat.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}