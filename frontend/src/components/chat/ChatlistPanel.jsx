import React, { useDeferredValue, useMemo, useTransition, useCallback } from 'react';
import { Search } from 'lucide-react';
import styles from '../../pages/chatsPage/chatspage.module.css';
import CreateGroupIcon from '../../Assets/icons/create-group.png';
import MessagesIcon from '../../Assets/icons/messages.png';
import ReadIcon from '../../Assets/icons/read.png';
import PinIcon from '../../Assets/icons/pin.png';
import SearchIcon from '../../Assets/icons/search.png';
import ChatRow from './ChatRow';

const FILTERS = ['all', 'unread', 'pinned', 'groups'];

const EMPTY_CONFIG = {
    all:    { icon: MessagesIcon,   title: 'No chats yet',    sub: 'Start a conversation or join a group.' },
    unread: { icon: ReadIcon,       title: 'All caught up!',  sub: 'You have no unread messages.' },
    pinned: { icon: PinIcon,        title: 'No pinned chats', sub: 'Pin a chat to find it quickly later.' },
    groups: { icon: CreateGroupIcon, title: 'No group chats', sub: 'Create a group to chat with multiple people.' },
};

const EmptyChatsState = React.memo(({ filter, searchQuery }) => {
    if (searchQuery.trim()) {
        return (
            <div className={styles.emptyState}>
                <img src={SearchIcon} alt="" className={styles.emptyStateIcon} />
                <div style={{ fontWeight: 600, marginBottom: 4 }}>No results found</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>
                    No chats matching &ldquo;{searchQuery.trim()}&rdquo;
                </div>
            </div>
        );
    }
    const { icon, title, sub } = EMPTY_CONFIG[filter] || EMPTY_CONFIG.all;
    return (
        <div className={styles.emptyState}>
            <img src={icon} alt="" className={styles.emptyStateIcon} />
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.6 }}>{sub}</div>
        </div>
    );
});

const ChatListPanel = React.memo(({
    sortedChats,
    filter, setFilter,
    searchQuery, setSearchQuery,
    requestsCount,
    setShowRequests,
    setShowCreateGroup,
    // row actions
    selectChat,
    togglePin, toggleMute, markUnread,
    clearChat, deleteChat,
    blockUser, reportUser,
}) => {
    const [isPending, startTransition] = useTransition();

    // Defer the query used for filtering — typing stays instant
    const deferredQuery = useDeferredValue(searchQuery);
    const isStale = deferredQuery !== searchQuery;

    // This memo only re-runs when deferredQuery or filter changes,
    // never on every keystroke
    const visibleChats = useMemo(() => {
        const q = deferredQuery.trim().toLowerCase();
        return sortedChats.filter(chat => {
            if (q && !chat.name?.toLowerCase().includes(q)) return false;
            if (filter === 'unread') return chat.unread_count > 0;
            if (filter === 'pinned') return chat.is_pinned;
            if (filter === 'groups') return chat.is_group;
            return true;
        });
    }, [sortedChats, deferredQuery, filter]);

    const handleSearch = useCallback((e) => setSearchQuery(e.target.value), [setSearchQuery]);

    const handleFilterChange = useCallback((f) => {
        startTransition(() => setFilter(f));
    }, [setFilter]);

    return (
        <>
            <h1 className={styles.title}>
                <span className={styles.highlight}>Chats</span> section
            </h1>

            <div className={styles.filterContainer}>
                <div className={styles.filters}>
                    {FILTERS.map(f => (
                        <button
                            key={f}
                            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
                            onClick={() => handleFilterChange(f)}
                        >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div
                        className={styles.createGroup}
                        onClick={() => setShowCreateGroup(true)}
                        style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            padding: 8, cursor: 'pointer',
                        }}
                    >
                        <img src={CreateGroupIcon} alt="" className={styles.createGroupIcon} />
                    </div>
                    <div
                        className={styles.requestsLink}
                        onClick={() => setShowRequests(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <span style={{ borderBottom: '1.5px solid #F2F2F2' }}>Requests</span>{' '}
                        ({requestsCount > 1 ? `+${requestsCount}` : requestsCount})
                    </div>
                </div>
            </div>

            <div className={styles.chatList}>
                <div className={styles.innerContainer}>
                    <div className={styles.searchContainer}>
                        <Search size={18} className={styles.searchIcon} />
                        <input
                            type="text"
                            className={styles.searchInput}
                            placeholder="Searching for someone?"
                            value={searchQuery}
                            onChange={handleSearch}
                        />
                    </div>

                    <div
                        className={styles.chatItemsContainer}
                        style={{
                            opacity: isStale || isPending ? 0.55 : 1,
                            transition: 'opacity 0.1s',
                        }}
                    >
                        {visibleChats.length === 0 ? (
                            <EmptyChatsState filter={filter} searchQuery={searchQuery} />
                        ) : visibleChats.map((chat, index) => (
                            <ChatRow
                                key={chat.id}
                                chat={chat}
                                isLast={index === visibleChats.length - 1}
                                onSelect={selectChat}
                                onTogglePin={togglePin}
                                onToggleMute={toggleMute}
                                onMarkUnread={markUnread}
                                onClearChat={clearChat}
                                onDeleteChat={deleteChat}
                                onBlockUser={blockUser}
                                onReportUser={reportUser}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
});

ChatListPanel.displayName = 'ChatListPanel';
export default ChatListPanel;