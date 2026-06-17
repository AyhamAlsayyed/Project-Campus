import React from 'react';
import styles from '../../pages/chatsPage/chatspage.module.css';
import BackButton from '../../Assets/icons/arrow-left.png';
import ChatRequestRow from './ChatrequestRow';
import { getSenderName } from '../../pages/chatsPage/chatUtils';

/**
 * ChatRequestsPanel
 *
 * Two views:
 *  1. List of pending requests
 *  2. The expanded view of a selected request with Accept / Block actions
 */
const ChatRequestsPanel = React.memo(({
    chatRequests,
    selectedRequest, setSelectedRequest,
    requestMessages,
    setShowRequests,
    user,
    openRequest,
    acceptRequest,
    blockRequest,
    deleteRequest,
}) => (
    <>
        <h1 className={styles.title}>
            <span className={styles.highlight}>Chat</span> Requests
        </h1>

        <button
            onClick={() => { setShowRequests(false); setSelectedRequest(null); }}
            className={styles.iconBtn}
            style={{ marginBottom: 12 }}
        >
            <img
                src={BackButton}
                alt=""
                style={{ width: 22, height: 22, filter: 'brightness(0) invert(1) opacity(0.9)' }}
            />
        </button>

        {selectedRequest ? (
            <SelectedRequestView
                req={selectedRequest}
                messages={requestMessages}
                user={user}
                onBack={() => setSelectedRequest(null)}
                onAccept={acceptRequest}
                onBlock={blockRequest}
            />
        ) : (
            <div className={styles.chatList}>
                <div className={styles.innerContainer}>
                    <div className={styles.chatItemsContainer}>
                        {chatRequests.length === 0 ? (
                            <div style={{
                                padding: '40px 20px', textAlign: 'center',
                                color: 'rgba(255,255,255,0.35)', fontSize: '0.9rem',
                            }}>
                                No message requests
                            </div>
                        ) : chatRequests.map((req, index) => (
                            <ChatRequestRow
                                key={req.conversation_id}
                                req={req}
                                isLast={index === chatRequests.length - 1}
                                onOpen={openRequest}
                                onAccept={acceptRequest}
                                onBlock={blockRequest}
                                onDelete={deleteRequest}
                            />
                        ))}
                    </div>
                </div>
            </div>
        )}
    </>
));

// ── Selected request expanded view ────────────────────────────────────────────

const SelectedRequestView = React.memo(({
    req, messages, user, onBack, onAccept, onBlock,
}) => (
    <div className={`${styles.chatList} ${styles.activeChatOuter}`}>
        <div className={styles.innerChatContainer}>
            <div className={styles.activeChatHeader}>
                <div className={styles.headerLeftWrapper}>
                    <button className={styles.iconBtn} onClick={onBack}>
                        <img
                            src={BackButton}
                            alt=""
                            style={{ width: 22, height: 22, filter: 'brightness(0) invert(1) opacity(0.9)' }}
                        />
                    </button>
                    <div className={styles.headerTitleInfo}>
                        <h2 className={styles.groupName}>{req.sender_username}</h2>
                        <p className={styles.memberSubtitle}>Wants to send you a message</p>
                    </div>
                </div>
            </div>

            <div className={styles.activeChatInnerContainer}>
                <div className={styles.chatArea}>
                    <div className={styles.messagesScrollArea}>
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`
                                    ${styles.messageWrapper}
                                    ${msg.senderId === user?.id
                                        ? styles.messageMineWrapper
                                        : styles.messageOtherWrapper}
                                `}
                            >
                                <div className={styles.messageContentBlock}>
                                    <div className={`
                                        ${styles.messageMeta}
                                        ${msg.senderId === user?.id ? styles.metaRight : styles.metaLeft}
                                    `}>
                                        <span className={styles.msgSenderName}>
                                            {msg.senderId === user?.id ? 'You' : getSenderName(msg.sender)}
                                        </span>
                                        <span className={styles.msgTime}>{msg.time}</span>
                                    </div>
                                    <div className={styles.messageRow}>
                                        <div className={`
                                            ${styles.messageBubble}
                                            ${msg.senderId === user?.id ? styles.bubbleMine : styles.bubbleOther}
                                        `}>
                                            <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        display: 'flex', gap: 12, padding: '16px 20px',
                        borderTop: '1px solid rgba(0,0,0,0.08)',
                        background: 'transparent',
                    }}>
                        <p style={{
                            flex: 1, margin: 0,
                            color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', alignSelf: 'center',
                        }}>
                            Do you want to accept this message request?
                        </p>
                        <button
                            onClick={() => onAccept(req.conversation_id)}
                            style={{
                                padding: '10px 22px', borderRadius: 22, border: 'none',
                                background: 'linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))',
                                color: '#fff', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                            }}
                        >
                            Accept
                        </button>
                        <button
                            onClick={() => onBlock(req.conversation_id)}
                            style={{
                                padding: '10px 22px', borderRadius: 22,
                                border: '1px solid rgba(248,113,113,0.3)',
                                background: 'rgba(248,113,113,0.08)',
                                color: '#f87171', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer',
                            }}
                        >
                            Block
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
));

ChatRequestsPanel.displayName = 'ChatRequestsPanel';
SelectedRequestView.displayName = 'SelectedRequestView';
export default ChatRequestsPanel;