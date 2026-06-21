import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import styles from '../../pages/chatsPage/chatspage.module.css';
import MaskIcon from './MaskIcon';
import Pin from '../../Assets/icons/pin.png';
import Mute from '../../Assets/icons/mute.png';
import Unread from '../../Assets/icons/unread-message.png';
import Clear from '../../Assets/icons/clear.png';
import BinIcon from '../../Assets/icons/bin.png';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import Block from '../../Assets/icons/block.png';
import Report from '../../Assets/icons/info.png';
import { API } from '../../pages/chatsPage/chatUtils';
import ReportModal from '../posts/ReportModal';
import StatusDot from '../presence/StatusDot';
import { usePresence } from '../../context/presenceContext';

function ChatStatusLabel({ userId, isGroup, isBlocked, isPage }) {
    const { onlineUsers } = usePresence();
    if (isBlocked) return <span className={styles.chatStatusText}>Blocked</span>;
    if (isGroup) return <span className={styles.chatStatusText}>Group Chat</span>;
    if (isPage) return null;
    const status = onlineUsers[String(userId)] ?? 'offline';

    return (
        <span className={styles.chatStatusText}>
            {status === 'online' ? 'Online' : status === 'away' ? 'Away' : status === 'dnd' ? 'Do Not Disturb' : 'Offline'}
        </span>
    );
}
const Divider = () => (
    <div style={{ width: '65%', height: 1, background: '#4D4D4D', margin: '0 auto' }} />
);


function chatRowPropsAreEqual(prev, next) {
    const pc = prev.chat;
    const nc = next.chat;
    return (
        pc.id === nc.id &&
        pc.name === nc.name &&
        pc.avatar === nc.avatar &&
        pc.preview === nc.preview &&
        pc.time === nc.time &&
        pc.unread_count === nc.unread_count &&
        pc.is_pinned === nc.is_pinned &&
        pc.is_muted === nc.is_muted &&
        pc.is_blocked === nc.is_blocked &&
        pc.last_message_type === nc.last_message_type &&
        pc.has_attachment === nc.has_attachment &&
        prev.isLast === next.isLast
    );
}

const ChatRow = React.memo(({
    chat,
    onSelect,
    onTogglePin,
    onToggleMute,
    onMarkUnread,
    onClearChat,
    onDeleteChat,
    onBlockUser,
    onReportUser,
    isLast,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuWrapRef = useRef(null);
    const [reportTargetId, setReportTargetId] = useState(null);
    const maskColor = document.documentElement.getAttribute('data-theme') === 'light' ? '#662D91' : '#CCCCCC';


    // Close on outside click
    useEffect(() => {
        if (!menuOpen) return;
        const handle = (e) => {
            if (menuWrapRef.current && !menuWrapRef.current.contains(e.target))
                setMenuOpen(false);
        };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
    }, [menuOpen]);

    const openMenu = useCallback((e) => {
        e.stopPropagation();
        const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
        const rect = e.currentTarget.getBoundingClientRect();
        const dropdownH = 290;
        const spaceBelow = window.innerHeight - rect.bottom;
        setMenuPos({
            top: (spaceBelow < dropdownH ? rect.top - dropdownH + 35 : rect.bottom + 8) / z,
            left: rect.right / z,
        });
        setMenuOpen(v => !v);
    }, []);

    const close = useCallback(() => setMenuOpen(false), []);

    const avatarSrc = chat.avatar
        ? (chat.avatar.startsWith('http') ? chat.avatar : `${API}${chat.avatar}`)
        : DefaultPfp;



    const statusClass =
        chat.is_group ? styles.groupDot :
            chat.is_blocked ? styles.blockedDot :
                chat.status === 'online' ? styles.online :
                    chat.status === 'dnd' ? styles.dnd :
                        styles.offline;

    const statusLabel =
        chat.is_blocked ? 'Blocked' :
            chat.is_group ? 'Group Chat' :
                chat.status === 'online' ? 'Online' :
                    chat.status === 'dnd' ? 'Do Not Disturb' :
                        'Offline';

    const previewText =
        chat.last_message_type === 'media' || chat.has_attachment
            ? '📎 sent an attachment'
            : chat.preview;


    return (
        <div className={styles.chatRow}>
            <div
                className={styles.chatItem}
                style={{ cursor: 'pointer' }}
                onClick={() => onSelect(chat)}
            >
                {/* ── Left ── */}
                <div className={styles.chatItemLeft}>
                    <div className={styles.avatarWrapper}>
                        <img src={avatarSrc} alt={chat.name} className={`${styles.chatAvatar}${!chat.avatar ? ' defaultPfp' : ''}`} loading="lazy" onError={e => { e.currentTarget.src = DefaultPfp; e.currentTarget.classList.add('defaultPfp'); }} />
                        {!chat.is_group && !chat.is_page && (
                            <span style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '50%' }}>
                                <StatusDot userId={chat.userId} size="sm" />
                            </span>
                        )}
                    </div>
                    <div className={styles.chatIdentity}>
                        <ChatStatusLabel userId={chat.userId} isGroup={chat.is_group} isBlocked={chat.is_blocked} isPage={chat.is_page} />
                        <div className={styles.chatNameWrapper}>
                            <span className={styles.chatName}>{chat.name}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right ── */}
                <div className={styles.chatItemRight}>
                    <div className={styles.chatIndicators}>
                        {chat.is_pinned && <MaskIcon src={Pin} size={25} color={maskColor} />}
                        {chat.is_muted && <MaskIcon src={Mute} size={25} color={maskColor} />}
                    </div>
                    <div className={styles.chatDetails}>
                        <span className={styles.chatPreview}>{previewText}</span>
                        <div className={styles.chatDetailsTop}>
                            <span className={styles.chatTime}>{chat.time}</span>
                        </div>
                    </div>
                    <div className={styles.chatActions}>
                        {chat.unread_count > 0 && (
                            <span className={styles.unreadBadge}>{chat.unread_count}</span>
                        )}
                        <div className={styles.menuWrapper} ref={menuWrapRef}>
                            <button className={styles.moreButton} onClick={openMenu}>
                                <MoreHorizontal size={16} />
                            </button>

                            {menuOpen && createPortal(
                                <div
                                    className={styles.dropdownMenu}
                                    style={{
                                        position: 'fixed',
                                        top: menuPos.top,
                                        left: menuPos.left,
                                        transform: 'translateX(-100%)',
                                        zIndex: 999999,
                                    }}
                                    onMouseDown={e => e.stopPropagation()}
                                >
                                    <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onTogglePin(chat.id); close(); }}>
                                        <MaskIcon src={Pin} />
                                        {chat.is_pinned ? 'Unpin chat' : 'Pin chat'}
                                    </button>
                                    <Divider />
                                    <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onToggleMute(chat.id); close(); }}>
                                        <MaskIcon src={Mute} />
                                        Mute notifications
                                    </button>
                                    {chat.preview && (
                                        <>
                                            <Divider />
                                            <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onMarkUnread(chat); close(); }}>
                                                <MaskIcon src={Unread} />
                                                {chat.unread_count > 0 ? 'Mark as read' : 'Mark as unread'}
                                            </button>
                                        </>
                                    )}
                                    <Divider />
                                    <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onClearChat(chat.id); close(); }}>
                                        <MaskIcon src={Clear} />
                                        Clear chat
                                    </button>
                                    <Divider />
                                    <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onDeleteChat(chat.id); close(); }}>
                                        <MaskIcon src={BinIcon} />
                                        Delete chat
                                    </button>
                                    {!chat.is_group && (
                                        <>
                                            <Divider />
                                            <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => { e.stopPropagation(); onBlockUser(chat.id); close(); }}>
                                                <MaskIcon src={Block} color="#D4145A" />
                                                {chat.is_blocked ? 'Unblock user' : 'Block user'}
                                            </button>
                                        </>
                                    )}
                                    <Divider />
                                    <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => {
                                        e.stopPropagation();
                                        setReportTargetId(chat.id);
                                        close();
                                    }}>
                                        <MaskIcon src={Report} color="#D4145A" />
                                        {chat.is_group ? 'Report group chat' : 'Report user'}
                                    </button>
                                </div>,
                                document.body
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {!isLast && <div className={styles.chatDivider} />}
            {reportTargetId && (
                <ReportModal
                    contentId={reportTargetId}
                    contentType={chat.is_group ? "conversation" : "user"}
                    onClose={() => setReportTargetId(null)}
                />
            )}
        </div>
    );
}, chatRowPropsAreEqual);

ChatRow.displayName = 'ChatRow';
export default ChatRow;