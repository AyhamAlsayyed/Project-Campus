import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal, CheckSquare } from 'lucide-react';
import styles from '../../pages/chatsPage/chatspage.module.css';
import MaskIcon from './MaskIcon';
import BinIcon from '../../Assets/icons/bin.png';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import Block  from '../../Assets/icons/block.png';
import { API } from '../../pages/chatsPage/chatUtils';

const Divider = () => (
    <div className={styles.chatDividerInline} />
);

const ChatRequestRow = React.memo(({
    req,
    onOpen,
    onAccept,
    onBlock,
    onDelete,
    isLast,
}) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
    const menuWrapRef = useRef(null);

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
        const dropdownH = 120;
        const spaceBelow = window.innerHeight - rect.bottom;
        setMenuPos({
            top: (spaceBelow < dropdownH ? rect.top - dropdownH + 35 : rect.bottom + 8) / z,
            left: rect.right / z,
        });
        setMenuOpen(v => !v);
    }, []);

    const close = useCallback(() => setMenuOpen(false), []);

    const reqAvatar = req.sender_avatar || req.avatar;
    const avatarSrc = reqAvatar
        ? (reqAvatar.startsWith('http') ? reqAvatar : `${API}${reqAvatar}`)
        : null;

    return (
        <div className={styles.chatRow}>
            <div
                className={styles.chatItem}
                style={{ cursor: 'pointer' }}
                onClick={() => onOpen(req)}
            >
                <div className={styles.chatItemLeft}>
                    <div className={styles.avatarWrapper}>
                        <img
                            src={avatarSrc || DefaultPfp}
                            alt={req.sender_username}
                            className={`${styles.chatAvatar} ${!avatarSrc ? styles.defaultAvatar : ''} ${!avatarSrc ? 'defaultPfp' : ''}`}
                            onError={e => { e.currentTarget.src = DefaultPfp; e.currentTarget.classList.add(styles.defaultAvatar); e.currentTarget.classList.add('defaultPfp'); }}
                        />
                        <span className={`${styles.statusDot} ${styles.offline}`} />
                    </div>
                    <div className={styles.chatIdentity}>
                        <span className={styles.chatStatusText}>Message request</span>
                        <div className={styles.chatNameWrapper}>
                            <span className={styles.chatName}>{req.sender_username}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.chatItemRight}>
                    <div className={styles.chatDetails}>
                        <div className={styles.chatDetailsTop}>
                            <span className={styles.chatPreview}>{req.preview}</span>
                            <span className={styles.chatTime}>{req.time}</span>
                        </div>
                    </div>
                    <div className={styles.chatActions}>
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
                                    <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onAccept(req.conversation_id); close(); }}>
                                        <CheckSquare size={14} /> Accept request
                                    </button>
                                    <Divider />
                                    <button className={styles.menuItem} onClick={(e) => { e.stopPropagation(); onDelete(req.conversation_id); close(); }}>
                                        <MaskIcon src={BinIcon} />
                                        Delete chat
                                    </button>
                                    <Divider />
                                    <button className={`${styles.menuItem} ${styles.destructive}`} onClick={(e) => { e.stopPropagation(); onBlock(req.conversation_id); close(); }}>
                                        <MaskIcon src={Block} color="#D4145A" />
                                        Block sender
                                    </button>
                                </div>,
                                document.body
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {!isLast && <div className={styles.chatDivider} />}
        </div>
    );
});

ChatRequestRow.displayName = 'ChatRequestRow';
export default ChatRequestRow;