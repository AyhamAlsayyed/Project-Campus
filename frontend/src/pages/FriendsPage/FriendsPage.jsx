import styles from './FriendsPage.module.css'
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Messages from '../../Assets/icons/messages.png'
import Posts from '../../components/posts/postCard';
import { Search, MessageSquare } from "lucide-react"
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import CommentsModal from '../../components/comments/commentsModal'
import DefaultProfileIcon from '../../Assets/icons/default-pfp.png'
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import ReportModal from '../../components/posts/ReportModal';
import RemoveFriendIcon from '../../Assets/icons/remove-person.png'
import Block from '../../Assets/icons/block.png'
import InfoIcon from '../../Assets/icons/info.png'
import API from '../../config';
import NeutralReview from '../../Assets/icons/neutral-review.png';
import useTheme from '../../hooks/useTheme'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import StatusDot from '../../components/presence/StatusDot';
import { useUser } from '../../context/UserContext';

export default function FriendsPage() {
    const { theme, toggleTheme } = useTheme()
    const { user: currentUser, avatarSrc, loading: userLoading } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [friends, setFriends] = useState([]);
    const [posts, setPosts] = useState([]);
    const [showAllPopup, setShowAllPopup] = useState(false);
    const [popupSearchTerm, setPopupSearchTerm] = useState("");
    const [activeMenuId, setActiveMenuId] = useState(null);
    const [isCommentsOpen, setIsCommentsOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [activeMenu, setActiveMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const token = localStorage.getItem("access");
    const navigate = useNavigate();
    const [reportTargetId, setReportTargetId] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const handleOpenComments = (postObject) => {
        setSelectedPost(postObject);
        setIsCommentsOpen(true);
    };

    const handleFriendClick = (friendId) => {
        navigate(`/profile/${friendId}`);
    };
    const { userId } = useParams();
    const isOwnProfile = currentUser?.id === Number(userId);

  
    const filteredFriends = friends.filter(friend =>
        friend.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (friend.major && friend.major.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const handleUnfriend = async (friendId) => {
        try {
            const res = await fetch(`${API}/api/friends/unfriend/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: friendId }),
            });
            if (res.ok) {
                setFriends(prev => prev.filter(f => f.id !== friendId));
            }
        } catch (e) { console.error("Unfriend failed:", e); }
    };

    const handleBlock = async (friendId) => {
        try {
            const res = await fetch(`${API}/api/users/${friendId}/block/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                setFriends(prev => prev.filter(f => f.id !== friendId));
            }
        } catch (e) { console.error("Block failed:", e); }
    };
    useEffect(() => {
        if (!currentUser?.id) return;
        const fetchPageData = async () => {
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const [friendsRes, postsRes] = await Promise.all([
                    fetch(`${API}/api/users/${currentUser.id}/friends/`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    fetch(`${API}/api/posts/feed/?filter=friends`, {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                ]);
                if (friendsRes.ok && postsRes.ok) {
                    if (friendsRes.ok && postsRes.ok) {
                        const friendsData = await friendsRes.json();
                        const postsData = await postsRes.json();

                      
                        const formattedFriends = (friendsData.all || []).map(f => {
                            return {
                                id: f.id,
                                username: f.username,
                                // Your API uses 'avatar_url', not 'avatar'
                                avatar: f.avatar_url
                                    ? (f.avatar_url.startsWith("http")
                                        ? f.avatar_url
                                        : `${API}${f.avatar_url}`)
                                    : DefaultProfileIcon,
                                major: f.major || "No Major Set",
                                is_online: f.is_online || false
                            };
                        });

                        // 3. Handle posts (in case your backend wraps them in 'results' or 'posts')
                        const actualPosts = Array.isArray(postsData)
                            ? postsData
                            : (postsData.results || postsData.posts || []);
                        const normalizedPosts = actualPosts.map(p => ({
                            ...p,
                            user: p.author,
                            body: p.content,
                        }));


                        setFriends(formattedFriends);
                        setPosts(normalizedPosts);
                    }
                }

            } catch (error) {
                console.error("FriendsPage Error:", error);
            }
        };

        fetchPageData();
    }, [currentUser?.id]);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const handleGlobalClick = () => {
            setActiveMenuId(null);
        };

        window.addEventListener('click', handleGlobalClick);
        return () => {
            window.removeEventListener('click', handleGlobalClick);
        };
    }, []);

    const handleMessage = async (userId, username) => {
        try {
            // First check if a conversation already exists
            const chatsRes = await fetch(`${API}/api/chats/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const chats = await chatsRes.json();

            // Find existing conversation with this user
            const existing = chats.find(c =>
                !c.is_group && c.name === username
            );

            if (existing) {
                console.log("existing chat found:", existing?.id, existing?.name);
                navigate(`/chats/${existing.id}`);
                return;
            }

            // No existing conversation, create one
            const res = await fetch(`${API}/api/conversations/create/${userId}/`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target_user: userId, type: 'user' })
            });
            const data = await res.json();
            if (data.convention_id) navigate(`/chats/${data.convention_id}`);

        } catch (e) {
            console.error("Error opening chat:", e);
        }
    };

    const friendsMiddle = (extraStyle = {}) => (
        <div className={styles.friendsPostsSection}>
            <h1 className={styles.title}>
                <span className={styles.highlight}>Friends</span> posts
            </h1>
            {userLoading ? (
                <div className={styles.emptyState}>
                    <p className={styles.emptySubtitle}>Loading posts...</p>
                </div>
            ) : posts.length > 0 ? (
                <div className={styles.postContainer} style={extraStyle}>
                    <div className={styles.innerContainer}>
                        {posts.map(post => (
                            <Posts key={post.id} post={post} openComments={() => handleOpenComments(post)} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <div className={styles.emptyIconWrapper}>
                        <img src={NeutralReview} alt="" className={styles.emptyIcon} />
                    </div>
                    <h2 className={styles.emptyTitle}>No posts yet</h2>
                    <p className={styles.emptySubtitle}>Your friends haven't posted anything yet.</p>
                </div>
            )}
        </div>
    );

    const friendsRightPanel = (showPill) => (
        <>
            {showPill && <div className={styles.pill}>FRIENDS LIST</div>}
            <div className={styles.rightCard}>
                <div className={styles.friendsListHeader}>
                    <div className={styles.searchContactWrap}>
                        <Search size={16} color="#888" className={styles.searchIcon} />
                        <input
                            type="text"
                            placeholder="Search friends..."
                            className={styles.searchInput}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className={styles.viewAllBtn} onClick={() => setShowAllPopup(true)}>
                        View All
                    </button>
                </div>
                <div className={styles.rightList}>
                    {filteredFriends.length > 0 ? (
                        filteredFriends.map((friend, index) => (
                            <div key={friend.id} className={styles.friendWrapper}>
                                <div className={styles.friendItemRow}>
                                    <div className={styles.friendItemLeft} onClick={() => handleFriendClick(friend.id)}>
                                        <div className={styles.friendAvatarWrapper}>
                                            <img
                                                src={friend.avatar || DefaultProfileIcon}
                                                alt={friend.username}
                                                className={`${styles.friendAvatar}${!friend.avatar ? ' defaultPfp' : ''}`}
                                                onError={e => { e.currentTarget.src = DefaultProfileIcon; e.currentTarget.classList.add('defaultPfp'); }}
                                            />
                                            <span style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '50%' }}>
                                                <StatusDot userId={friend.id} size="sm" />
                                            </span>
                                        </div>
                                        <div className={styles.friendInfo}>
                                            <div className={styles.friendName}>{friend.username}</div>
                                            <div className={styles.friendMajor}>{friend.major || "No Major Set"}</div>
                                        </div>
                                    </div>
                                    <div className={styles.friendActions}>
                                        <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleMessage(friend.id, friend.username); }}>
                                            <img src={Messages} alt="Messages" className={styles.messageIcon} />
                                        </button>
                                        <div className={styles.dropdownContainer}>
                                            <button className={styles.actionBtn} onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeMenuId === friend.id) { setActiveMenuId(null); }
                                                else {
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1; setMenuPosition({ top: rect.bottom / z + 6, left: rect.right / z });
                                                    setActiveMenuId(friend.id);
                                                }
                                            }}>•••</button>
                                        </div>
                                    </div>
                                </div>
                                {index !== filteredFriends.length - 1 && <div className={styles.divider}></div>}
                            </div>
                        ))
                    ) : (
                        <p className={styles.noDataText}>{searchTerm ? "No friends match your search." : "No friends yet."}</p>
                    )}
                </div>
            </div>

        </>
    );

    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {/* ══════════════════════════════════════
                    MOBILE HEADER BAR
                ══════════════════════════════════════ */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={currentUser}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                />
            )}

            {/* ══════════════════════════════════════
                    MOBILE DRAWER
                ══════════════════════════════════════ */}
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} variant='profile' theme={theme} toggleTheme={toggleTheme} />

            {/* ══════════════════════════════════════
                    DESKTOP HEADER
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
                </div>
            )}

            {/* ══════════════════════════════════════
                    MOBILE BODY
                ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box", padding: "12px 10px 0 10px" }}>
                    {friendsRightPanel(false)}
                    {friendsMiddle({ minWidth: 0 })}
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP BODY
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.page} ${styles.content}`}>
                    <SideBarNav variant="profile" currentUser={currentUser} />
                    {friendsMiddle({})}
                    <div className={styles.rightSection}>
                        {friendsRightPanel(true)}
                    </div>
                </div>
            )}
            {activeMenuId && createPortal(
                <div
                    className={styles.portalMenu}
                    style={{ position: 'fixed', top: menuPosition.top, left: menuPosition.left, transform: 'translateX(-100%)' }}
                    onClick={e => e.stopPropagation()}
                >
                    <button className={styles.portalMenuItem} onClick={() => {
                        const id = Number(String(activeMenuId).replace('popup-', ''));
                        handleUnfriend(id);
                        setActiveMenuId(null);
                    }}>
                        <img src={RemoveFriendIcon} alt="" className={styles.portalMenuIcon} />
                        Unfriend
                    </button>
                    <div className={styles.portalMenuDivider}>
                        <div className={styles.portalMenuDividerLine} />
                    </div>
                    <button className={styles.portalMenuItemDanger} onClick={() => {
                        const id = Number(String(activeMenuId).replace('popup-', ''));
                        setReportTargetId(id);
                        setActiveMenuId(null);
                    }}>
                        <img src={InfoIcon} alt="" className={styles.portalMenuIconDanger} />
                        Report User
                    </button>
                    <div className={styles.portalMenuDivider}>
                        <div className={styles.portalMenuDividerLine} />
                    </div>
                    <button className={styles.portalMenuItemDanger} onClick={() => {
                        const id = Number(String(activeMenuId).replace('popup-', ''));
                        handleBlock(id);
                        setActiveMenuId(null);
                    }}>
                        <img src={Block} alt="" className={styles.portalMenuIconDanger} />
                        Block
                    </button>
                </div>,
                document.body
            )}
            {isCommentsOpen && selectedPost && (
                <CommentsModal
                    post={selectedPost}
                    currentUser={currentUser}
                    onClose={() => {
                        setIsCommentsOpen(false);
                        setSelectedPost(null);
                    }}
                />
            )}
            {reportTargetId && (
                <ReportModal
                    contentId={reportTargetId}
                    contentType="user"
                    onClose={() => setReportTargetId(null)}
                />
            )}

            {showAllPopup && createPortal(
                <div className={styles.popupOverlay} onClick={() => { setShowAllPopup(false); setPopupSearchTerm(''); }}>
                    <div className={styles.popupContent} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.popupHeader}>
                            <h3>All Friends</h3>
                            <button className={styles.closePopupBtn} onClick={() => { setShowAllPopup(false); setPopupSearchTerm(''); }}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className={styles.searchContactWrap}>
                            <Search size={16} color="#888" className={styles.searchIcon} />
                            <input
                                type="text"
                                placeholder="Searching for someone?"
                                className={styles.searchInput}
                                value={popupSearchTerm}
                                onChange={(e) => setPopupSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <div className={styles.popupList}>
                            {friends
                                .filter(f => f.username.toLowerCase().includes(popupSearchTerm.toLowerCase()))
                                .map((friend, index, arr) => (
                                    <div key={`popup-${friend.id}`} className={styles.friendWrapper}>
                                        <div className={styles.friendItemRow}>
                                            <div className={styles.friendItemLeft} onClick={() => { handleFriendClick(friend.id); setShowAllPopup(false); setPopupSearchTerm(''); }}>
                                                <div className={styles.friendAvatarWrapper}>
                                                    <img
                                                src={friend.avatar || DefaultProfileIcon}
                                                alt={friend.username}
                                                className={`${styles.friendAvatar}${!friend.avatar ? ' defaultPfp' : ''}`}
                                                onError={e => { e.currentTarget.src = DefaultProfileIcon; e.currentTarget.classList.add('defaultPfp'); }}
                                            />
                                                    <span style={{ position: 'absolute', bottom: 0, right: 0, borderRadius: '50%' }}>
                                                        <StatusDot userId={friend.id} size="sm" />
                                                    </span>
                                                </div>
                                                <div className={styles.friendInfo}>
                                                    <div className={styles.friendName}>{friend.username}</div>
                                                    <div className={styles.friendMajor}>{friend.major || "No Major Set"}</div>
                                                </div>
                                            </div>
                                            <div className={styles.friendActions}>
                                                <button className={styles.actionBtn} onClick={(e) => { e.stopPropagation(); handleMessage(friend.id, friend.username); }}>
                                                    <img src={Messages} alt="Messages" className={styles.messageIcon} />
                                                </button>
                                                <div className={styles.dropdownContainer}>
                                                    <button className={styles.actionBtn} onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (activeMenuId === `popup-${friend.id}`) { setActiveMenuId(null); }
                                                        else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const z = parseFloat(getComputedStyle(document.documentElement).zoom) || 1;
                                                            setMenuPosition({ top: rect.bottom / z + 6, left: rect.right / z });
                                                            setActiveMenuId(`popup-${friend.id}`);
                                                        }
                                                    }}>•••</button>
                                                </div>
                                            </div>
                                        </div>
                                        {index !== arr.length - 1 && <div className={styles.divider} />}
                                    </div>
                                ))}
                            {friends.filter(f => f.username.toLowerCase().includes(popupSearchTerm.toLowerCase())).length === 0 && (
                                <p className={styles.noDataText}>{popupSearchTerm ? "No friends match your search." : "No friends yet."}</p>
                            )}
                        </div>
                    </div>
                </div>,
                document.body
            )}

        </div>
    )
}