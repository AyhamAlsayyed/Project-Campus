import { useState, lazy, Suspense, useEffect, useRef, useCallback } from 'react';
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
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import { useNavigate, useSearchParams } from 'react-router-dom';

const ActiveChat = lazy(() => import('./ActiveChats'));

export default function ChatsPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { theme, toggleTheme } = useTheme();
    const ctx = useChats();
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileTab, _setMobileTab] = useState(searchParams.get('tab') || 'chats');
    const setMobileTab = useCallback((tab) => {
        _setMobileTab(tab);
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            if (tab === 'chats') next.delete('tab'); else next.set('tab', tab);
            return next;
        }, { replace: true });
    }, [setSearchParams]);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
                <MobileDrawer isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} />

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