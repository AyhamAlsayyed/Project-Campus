import { useState, lazy, Suspense, useEffect, useRef } from 'react';
import styles from './chatspage.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import GroupCreationFlow from '../../components/chat/GroupCreationFlow';
import { useChats } from '../../components/chat/Usechats';
import ChatListPanel from '../../components/chat/ChatlistPanel';
import ChatRequestsPanel from '../../components/chat/Chatrequestspanel';
import AcademicGroupsPanel from '../../components/chat/Academicgroupspanel';
import useTheme from '../../hooks/useTheme';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import API from '../../config';
import { X } from 'lucide-react';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';

const ActiveChat = lazy(() => import('./ActiveChats'));

export default function ChatsPage() {
    const { theme, toggleTheme } = useTheme();
    const ctx = useChats();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileTab, setMobileTab] = useState('chats');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    document.documentElement.setAttribute('data-theme', theme);

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

    const showActiveChat = !ctx.showCreateGroup && !!ctx.selectedChat;

    const rawAvatar = ctx.user?.profile?.avatar || ctx.user?.avatar || ctx.user?.profile_image;
    const avatarSrc = rawAvatar
        ? (rawAvatar.startsWith('http') ? rawAvatar : `${API}${rawAvatar}`)
        : ProfilePicture;

    // ── MOBILE LAYOUT ──────────────────────────────────────────────────────
    if (isMobile) {
        return (
            <div className={styles.darkContainer} data-theme={theme}>

                {/* Mobile top header — hidden when in active chat */}
                {!showActiveChat && !ctx.showCreateGroup && (
                    <MobileHeader
                        avatarSrc={avatarSrc}
                        user={ctx.user}
                        setMobileMenuOpen={setMobileMenuOpen}
                        token={ctx.token}
                        API={API}
                    />
                )}

                {/* Mobile drawer */}
                {mobileMenuOpen && (
                    <div style={{ position: 'fixed', inset: 0, zIndex: 9998 }}>
                        <div
                            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
                            onClick={() => setMobileMenuOpen(false)}
                        />
                        <div
                            ref={mobileMenuRef}
                            style={{
                                position: 'absolute', left: 0, top: 0,
                                height: '100%', width: '75vw', maxWidth: 350,
                                background: 'linear-gradient(135deg, var(--bg-main), var(--bg-secondary))',
                                borderRight: '1px solid rgba(255,255,255,0.1)',
                                display: 'flex', flexDirection: 'column', overflow: 'hidden',
                                boxShadow: '4px 0 30px rgba(0,0,0,0.6)'
                            }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button
                                style={{
                                    position: 'absolute', top: 14, right: 14, zIndex: 10,
                                    width: 32, height: 32, borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.1)', border: 'none',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer'
                                }}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <X size={16} color="white" />
                            </button>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 10,
                                padding: '20px 16px 16px',
                                borderBottom: '1px solid rgba(255,255,255,0.08)'
                            }}>
                                <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                                <span style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', letterSpacing: 1 }}>CAMPUS</span>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto' }}>
                                <SideBarNav onClose={() => setMobileMenuOpen(false)} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Mobile main content */}
                <div className={styles.mobileContent}>
                    {ctx.showCreateGroup ? (
                        <GroupCreationFlow
                            closeFlow={() => ctx.setShowCreateGroup(false)}
                            currentUser={ctx.user}
                        />

                    ) : showActiveChat ? (
                        <Suspense fallback={<div style={{ color: '#888', padding: 40 }}>Loading chat…</div>}>
                            <ActiveChat
                                selectedChat={ctx.selectedChat}
                                user={ctx.user}
                                token={ctx.token}
                                onBack={() => { ctx.setSelectedChat(null); ctx.navigate('/chats'); }}
                                onClearChat={ctx.clearChat}
                                onDeleteChat={ctx.deleteChat}
                                onMarkRead={ctx.markRead}
                            />
                        </Suspense>

                    ) : ctx.showRequests ? (
                        <ChatRequestsPanel
                            chatRequests={ctx.chatRequests}
                            selectedRequest={ctx.selectedRequest}
                            setSelectedRequest={ctx.setSelectedRequest}
                            requestMessages={ctx.requestMessages}
                            setShowRequests={ctx.setShowRequests}
                            user={ctx.user}
                            openRequest={ctx.openRequest}
                            acceptRequest={ctx.acceptRequest}
                            blockRequest={ctx.blockRequest}
                            deleteRequest={ctx.deleteRequest}
                        />

                    ) : (
                        <>
                            {/* Tab bar */}
                            <div className={styles.mobileTabs}>
                                <button
                                    className={`${styles.mobileTab} ${mobileTab === 'chats' ? styles.mobileTabActive : ''}`}
                                    onClick={() => setMobileTab('chats')}
                                >
                                    Chats
                                </button>
                                <button
                                    className={`${styles.mobileTab} ${mobileTab === 'academic' ? styles.mobileTabActive : ''}`}
                                    onClick={() => setMobileTab('academic')}
                                >
                                    Academic
                                </button>
                            </div>

                            {mobileTab === 'chats' ? (
                                <div className={styles.mobileChatListWrapper}>
                                    <ChatListPanel
                                        sortedChats={ctx.sortedChats}
                                        filter={ctx.filter}
                                        setFilter={ctx.setFilter}
                                        searchQuery={ctx.searchQuery}
                                        setSearchQuery={ctx.setSearchQuery}
                                        requestsCount={ctx.requestsCount}
                                        setShowRequests={ctx.setShowRequests}
                                        setShowCreateGroup={ctx.setShowCreateGroup}
                                        selectChat={ctx.selectChat}
                                        togglePin={ctx.togglePin}
                                        toggleMute={ctx.toggleMute}
                                        markUnread={ctx.markUnread}
                                        clearChat={ctx.clearChat}
                                        deleteChat={ctx.deleteChat}
                                        blockUser={ctx.blockUser}
                                        reportUser={ctx.reportUser}
                                    />
                                </div>
                            ) : (
                                <div className={styles.mobileAcademicWrapper}>
                                    <AcademicGroupsPanel
                                        academicGroups={ctx.academicGroups}
                                        user={ctx.user}
                                        onSelect={ctx.selectChat}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        );
    }

    // ── DESKTOP LAYOUT (unchanged) ─────────────────────────────────────────
    return (
        <div className={styles.darkContainer} data-theme={theme}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={ctx.user} />
            </div>

            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav />

                <div className={styles.mainContent}>
                    {ctx.showCreateGroup ? (
                        <GroupCreationFlow
                            closeFlow={() => ctx.setShowCreateGroup(false)}
                            currentUser={ctx.user}
                        />

                    ) : showActiveChat ? (
                        <Suspense fallback={<div style={{ color: '#888', padding: 40 }}>Loading chat…</div>}>
                            <ActiveChat
                                selectedChat={ctx.selectedChat}
                                user={ctx.user}
                                token={ctx.token}
                                onBack={() => { ctx.setSelectedChat(null); ctx.navigate('/chats'); }}
                                onClearChat={ctx.clearChat}
                                onDeleteChat={ctx.deleteChat}
                                onMarkRead={ctx.markRead}
                            />
                        </Suspense>

                    ) : ctx.showRequests ? (
                        <ChatRequestsPanel
                            chatRequests={ctx.chatRequests}
                            selectedRequest={ctx.selectedRequest}
                            setSelectedRequest={ctx.setSelectedRequest}
                            requestMessages={ctx.requestMessages}
                            setShowRequests={ctx.setShowRequests}
                            user={ctx.user}
                            openRequest={ctx.openRequest}
                            acceptRequest={ctx.acceptRequest}
                            blockRequest={ctx.blockRequest}
                            deleteRequest={ctx.deleteRequest}
                        />

                    ) : (
                        <ChatListPanel
                            sortedChats={ctx.sortedChats}
                            filter={ctx.filter}
                            setFilter={ctx.setFilter}
                            searchQuery={ctx.searchQuery}
                            setSearchQuery={ctx.setSearchQuery}
                            requestsCount={ctx.requestsCount}
                            setShowRequests={ctx.setShowRequests}
                            setShowCreateGroup={ctx.setShowCreateGroup}
                            selectChat={ctx.selectChat}
                            togglePin={ctx.togglePin}
                            toggleMute={ctx.toggleMute}
                            markUnread={ctx.markUnread}
                            clearChat={ctx.clearChat}
                            deleteChat={ctx.deleteChat}
                            blockUser={ctx.blockUser}
                            reportUser={ctx.reportUser}
                        />
                    )}
                </div>

                <AcademicGroupsPanel
                    academicGroups={ctx.academicGroups}
                    user={ctx.user}
                    onSelect={ctx.selectChat}
                />
            </div>
        </div>
    );
}