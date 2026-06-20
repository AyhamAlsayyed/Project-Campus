import React, { useCallback } from 'react';
import styles from '../../pages/chatsPage/chatspage.module.css';
import { getSenderName, timeAgo, API } from '../../pages/chatsPage/chatUtils';
import DefaultPfp from '../../Assets/icons/default-pfp.png';
import EducationIcon from '../../Assets/icons/education.png';

// ── MarqueeText ───────────────────────────────────────────────────────────────
// Simple overflow-ellipsis span; memoised to avoid re-renders from parent.
const MarqueeText = React.memo(({ text, className }) => (
    <span
        className={className}
        style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
    >
        {text}
    </span>
));
MarqueeText.displayName = 'MarqueeText';

// ── Single academic group row ─────────────────────────────────────────────────
const AcademicGroupItem = React.memo(({ chat, user, onSelect, isLast }) => {
    const isMineSender =
        chat.last_sender_id === 'me' ||
        chat.last_sender_id === user?.id ||
        chat.last_message_mine === true ||
        chat.preview_sender === user?.username ||
        chat.preview_sender === 'me';

    const isAttachment = chat.preview == null;
    const lastSender = getSenderName(
        chat.last_sender || chat.last_message_sender || chat.sender || ''
    );
    const senderLabel = isMineSender ? 'You' : lastSender;

    const previewText = isAttachment
        ? `${senderLabel}: sent an attachment`
        : isMineSender
            ? `You: ${chat.preview || ''}`
            : `${lastSender ? lastSender + ': ' : ''}${chat.preview || ''}`;

    const avatarSrc = chat.avatar
        ? (chat.avatar.startsWith('http') ? chat.avatar : `${API}${chat.avatar}`)
        : DefaultPfp;

    return (
        <>
            <div
                className={styles.academicChatItem}
                onClick={() => onSelect(chat)}
            >
                <div className={styles.academicAvatarWrapper}>
                    <img src={avatarSrc} className={`${styles.academicAvatar}${!chat.avatar ? ' defaultPfp' : ''}`} alt="" onError={e => { e.currentTarget.src = DefaultPfp; e.currentTarget.classList.add('defaultPfp'); }} />
                </div>
                <div className={styles.academicChatInfo}>
                    <div className={styles.academicTopRow}>
                        <span className={styles.academicTeacherName}>{chat.conversations_owner}</span>
                        <MarqueeText
                            text={previewText}
                            className={styles.academicMessagePreview}
                        />
                    </div>
                    <div className={styles.academicBottomRow}>
                        <MarqueeText text={chat.name} className={styles.academicGroupName} />
                        <span className={styles.academicTimestamp}>{timeAgo(chat.last_message_time)}</span>
                    </div>
                </div>
            </div>
            {!isLast && <div className={styles.academicDivider} />}
        </>
    );
});
AcademicGroupItem.displayName = 'AcademicGroupItem';

// ── Panel ─────────────────────────────────────────────────────────────────────
const AcademicGroupsPanel = React.memo(({ academicGroups, user, onSelect }) => (
    <div className={styles.rightSection}>
        <div className={styles.pill}>ACADEMIC GROUP CHATS</div>
        <div className={styles.rightCard}>
            <div className={styles.rightList}>
                {academicGroups.length === 0 ? (
                    <div className={styles.emptyState}>
                        <img src={EducationIcon} alt="" className={styles.emptyStateIcon} />
                        <div style={{ fontWeight: 600, marginBottom: 4 }}>No academic groups</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>You haven&apos;t been added to any academic group chats yet.</div>
                    </div>
                ) : academicGroups.map((chat, index) => (
                    <AcademicGroupItem
                        key={chat.id}
                        chat={chat}
                        user={user}
                        onSelect={onSelect}
                        isLast={index === academicGroups.length - 1}
                    />
                ))}
            </div>
        </div>
    </div>
));

AcademicGroupsPanel.displayName = 'AcademicGroupsPanel';
export default AcademicGroupsPanel;