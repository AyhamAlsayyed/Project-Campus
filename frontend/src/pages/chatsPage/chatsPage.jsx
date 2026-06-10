import { useState, lazy, Suspense } from 'react';
import styles from './chatspage.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import GroupCreationFlow from '../../components/chatPageComponents/GroupCreationFlow';
import { useChats } from '../../components/chatPageComponents/Usechats';
import ChatListPanel from '../../components/chatPageComponents/ChatlistPanel';
import ChatRequestsPanel from '../../components/chatPageComponents/Chatrequestspanel';
import AcademicGroupsPanel from '../../components/chatPageComponents/Academicgroupspanel';

// Downloaded only when the user first opens a chat
const ActiveChat = lazy(() => import('./ActiveChats'));
 
export default function ChatsPage() {
    const [theme, setTheme] = useState('dark');
    const ctx = useChats();
 
    const showActiveChat = !ctx.showCreateGroup && !!ctx.selectedChat;
 
    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} setTheme={setTheme} user={ctx.user} />
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