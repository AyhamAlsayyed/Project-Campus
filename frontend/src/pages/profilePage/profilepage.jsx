import styles from './profilepage.module.css';
import headerStyles from '../../components/pagelayout/header/header.module.css';
import Header from '../../components/pagelayout/header/header';
import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import PostCard from '../../components/posts/postCard';
import UserDetails from '../../components/userDetails/userDetails';
import CommentModal from '../../components/comments/commentsModal';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import FriendsTab from '../../components/FriendsTab/FriendsTab';
import FriendsSuggestion from '../../components/recentlycontacted/recentlyContacted';
import ThemeToggler from '../../components/pagelayout/themeToggle';
import darkModeIcon from "../../Assets/icons/dark-mode.png"
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import {
    User, UserPlus, Bell, Users, Settings,
    Languages, Home, HelpCircle, MessageSquare,
    Menu, X, Search, Check, MoreHorizontal,
    Volume2, Calendar, Heart,
} from "lucide-react";

export default function ProfilePage() {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [friendStatus, setFriendStatus] = useState("none");
    const [currentUser, setCurrentUser] = useState(null);
    const token = localStorage.getItem("access");
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState("");
    const [selectedPost, setSelectedPost] = useState(null);
    const [posts, setPosts] = useState([]);
    const [friends, setFriends] = useState([]);
    const [friendsLoading, setFriendsLoading] = useState(false);
    const [postsLoading, setPostsLoading] = useState(true);
    const [postsError, setPostsError] = useState("");
    const [activeTab, setActiveTab] = useState("Posts");
    const [activityPosts, setActivityPosts] = useState([]);
    const [activitiesLoading, setActivitiesLoading] = useState(false);
    const [communityPicks, setCommunityPicks] = useState([]);
    const [picksSlide, setPicksSlide] = useState(0);
    const [savedPosts, setSavedPosts] = useState([]);
    const [savedLoading, setSavedLoading] = useState(false);

    // Mobile state
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    const mobileMenuRef = useRef(null);
    const avatarDropdownRef = useRef(null);

    const { pathname } = useLocation();
    const { userId } = useParams();
    const navigate = useNavigate();

    const API = "http://localhost:8000";

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);


    const loadCurrentUser = async () => {
        try {
            const res = await fetch(`${API}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setCurrentUser(data);
        } catch (e) { console.error(e); }
    };

    const loadCommunityPicks = async () => {
        try {
            const res = await fetch(`${API}/api/users/${userId}/community-picks/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setCommunityPicks(Array.isArray(data) ? data : []); }
        } catch (e) { console.error(e); }
    };

    const loadProfileUser = async () => {
        try {
            const res = await fetch(`${API}/api/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
            let data;
            try { data = await res.json(); } catch (err) { setUserError("API Error"); setUser(null); setUserLoading(false); return; }
            if (!res.ok) { setUserError(data?.message || "Failed to load user"); setUser(null); return; }
            setUser(data);
            setFriendStatus(data.friend_status);
            if (data?.id) loadPosts(data.id);
        } catch (e) { setUser(null); setUserError(e?.message || "Something went wrong"); }
        finally { setUserLoading(false); }
    };

    const handleAddFriend = async () => {
        try {
            const res = await fetch(`${API}/api/friends/request/`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ to_user: userId }),
            });
            if (res.ok) setFriendStatus("sent");
        } catch (e) { console.error(e); }
    };

    const loadActivities = async () => {
        try {
            setActivitiesLoading(true);
            const res = await fetch(`${API}/api/posts/activity/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                const formattedActivities = (Array.isArray(data) ? data : []).map(post => ({
                    ...post,
                    username: post.author?.username || currentUser?.username,
                    avatar: post.author?.avatar || currentUser?.avatar_url
                }));
                setActivityPosts(formattedActivities);
            }
        } catch (e) { console.error(e); }
        finally { setActivitiesLoading(false); }
    };

    const loadSavedPosts = async () => {
        try {
            setSavedLoading(true);
            const res = await fetch(`${API}/api/posts/saved/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setSavedPosts(Array.isArray(data) ? data : []); }
        } catch (e) { console.error(e); }
        finally { setSavedLoading(false); }
    };

    const loadFriends = async (userId) => {
        try {
            setFriendsLoading(true);
            const res = await fetch(`${API}/api/users/${userId}/friends/`, { headers: { Authorization: `Bearer ${localStorage.getItem("access")}` } });
            const data = await res.json();
            setFriends(data);
        } catch (err) { console.error(err); }
        finally { setFriendsLoading(false); }
    };

    const handleAccept = async () => {
        const res = await fetch(`${API}/api/friends/accept/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setFriendStatus("friends");
    };

    const handleDecline = async () => {
        const res = await fetch(`${API}/api/friends/decline/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setFriendStatus("none");
    };

    const loadPosts = async (id) => {
        try {
            const res = await fetch(`${API}/api/posts?user=${id}`, { headers: { Authorization: `Bearer ${token}` } });
            let data;
            try { data = await res.json(); } catch (err) { setPostsError("Invalid server response."); setPosts([]); setPostsLoading(false); return; }
            if (!res.ok) { setPostsError(data?.message || "Failed to load posts"); setPosts([]); return; }
            setPosts(Array.isArray(data) ? data : []);
        } catch (e) { setPostsError(e?.message || "Something went wrong"); setPosts([]); }
        finally { setPostsLoading(false); }
    };

    const isOwnProfile = currentUser?.id === Number(userId);

    useEffect(() => {
        loadCurrentUser();
        loadProfileUser();
        loadFriends(userId);
        if (!isOwnProfile) loadCommunityPicks();
    }, [userId]);

    useEffect(() => {
        const isOwn = currentUser?.id === Number(userId) || (!userId && currentUser);
        if (isOwn) { loadActivities(); loadSavedPosts(); }
    }, [currentUser, userId]);

    const handleMessage = () => { navigate(`/messages/${userId}`); };
    const toggleTheme = () => setTheme((p) => (p === "light" ? "dark" : "light"));
    const openComments = (post) => setSelectedPost(post);
    const closeComments = () => setSelectedPost(null);

    const photoPosts = posts.filter(post => {
        const fileUrl = post.image || post.image_url || (Array.isArray(post.media) && post.media[0]?.url);
        if (!fileUrl || typeof fileUrl !== 'string') return false;
        return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'].some(ext => fileUrl.toLowerCase().endsWith(ext));
    });

    const profileTabs = isOwnProfile ? ['Posts', 'Activities', 'Saved'] : ['Posts', 'Photos', 'Friends'];
    const username = user?.username || "Username";
    const role = user?.role || "Role";
    const fullName = user?.full_name || user?.fullName || "Full name";
    const university = user?.university || "University";
    const major = user?.major || "Major";
    const bio = user?.bio;
    const avatarUrl = user?.avatar_url || user?.avatar || "";
    const coverUrl = user?.cover_url || user?.cover || "";

    const currentAvatarSrc = currentUser?.avatar
        ? currentUser.avatar.startsWith("http") ? currentUser.avatar : `${API}${currentUser.avatar}`
        : "/default-avatar.png";


    return (
        <div className={styles.darkContainer}>

            {/* ══════════════════════════════════════
            MOBILE HEADER
        ══════════════════════════════════════ */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={currentAvatarSrc}
                    user={currentUser}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                    homeMode={true}
                />
            )}
            {/* ══════════════════════════════════════
            MOBILE DRAWER
        ══════════════════════════════════════ */}
            {isMobile && mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)"
                    }} onClick={() => setMobileMenuOpen(false)} />
                    <div
                        ref={mobileMenuRef}
                        style={{
                            position: "absolute", left: 0, top: 0,
                            height: "100%", width: "80vw", maxWidth: 435,
                            background: "linear-gradient(135deg, var(--bg-main), var(--bg-secondary))",
                            borderRight: "1px solid rgba(255,255,255,0.1)",
                            display: "flex", flexDirection: "column", overflow: "hidden",
                            boxShadow: "4px 0 30px rgba(0,0,0,0.6)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button style={{
                            position: "absolute", top: 14, right: 14, zIndex: 10,
                            width: 32, height: 32, borderRadius: "50%",
                            background: "rgba(255,255,255,0.1)", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                        }} onClick={() => setMobileMenuOpen(false)}>
                            <X size={16} color="white" />
                        </button>

                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)"
                        }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: 1 }}>CAMPUS</span>
                        </div>

                        <div style={{ flex: 1, overflowY: "auto" }}>
                            <SideBarNav
                                variant={isOwnProfile ? "profile" : "default"}
                                currentUser={currentUser}
                                onClose={() => setMobileMenuOpen(false)}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
            DESKTOP HEADER
        ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
                </div>
            )}

            {/* ══════════════════════════════════════
            DESKTOP LAYOUT
        ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.page} ${styles.content}`}>
                    <SideBarNav
                        variant={isOwnProfile ? "profile" : "default"}
                        currentUser={currentUser}
                    />

                    <div className={styles.profileContent}>
                        {userLoading && <div className={styles.notice}>Loading profile...</div>}
                        <div className={styles.profileCard}>
                            <div className={styles.coverWrap}>
                                {coverUrl ? <img className={styles.coverImage} src={coverUrl} alt="cover" /> : <div className={styles.coverPlaceholder} />}
                                {isOwnProfile && <button className={styles.editCoverBtn}>Edit ✎</button>}
                            </div>

                            <div className={styles.profileHeaderRow}>
                                <div className={styles.avatarWrap}>
                                    <div className={styles.avatarCircle}>
                                        {avatarUrl ? <img className={styles.avatarImage} src={avatarUrl} alt="avatar" /> : <User size={52} />}
                                    </div>
                                </div>
                                <div className={styles.profileMeta}>
                                    {user?.role === 'instructor' ? (
                                        <>
                                            <div className={styles.nameRow}>
                                                <h2 className={styles.username}>{username}</h2>
                                                {user?.is_verified && (
                                                    <span className={styles.verifiedBadge}>
                                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8b2dff" strokeWidth="2.5">
                                                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                            <div className={styles.subRow}>
                                                {user?.department && <span className={styles.department}>{user.department}</span>}
                                                {user?.department && user?.employment_type && <span className={styles.dot} />}
                                                {user?.employment_type && <span className={styles.employmentType}>{user.employment_type}</span>}
                                                {!isOwnProfile && <><span className={styles.dot} /><span className={styles.friendsCount}>{user?.friends_count || 0} friends</span></>}
                                            </div>
                                            {bio && <p className={styles.bio}>{bio}</p>}
                                        </>
                                    ) : (
                                        <>
                                            <div className={styles.nameRow}>
                                                <h2 className={styles.username}>{username}</h2>
                                                <span className={styles.role}>/{role}</span>
                                            </div>
                                            <div className={styles.subRow}>
                                                <span className={styles.fullName}>{fullName}</span>
                                                {!isOwnProfile && <><span className={styles.dot} /><span className={styles.friendsCount}>{user?.friends_count || 0} friends</span></>}
                                            </div>
                                            <div className={styles.uniRow}>
                                                <span className={styles.uni}>{university} - {major}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {!isOwnProfile && (
                                    <div className={styles.profileActions}>
                                        <button className={styles.messageBtn} onClick={handleMessage}><MessageSquare size={18} /></button>
                                        {friendStatus === "none" && <button className={styles.addFriendBtn} onClick={handleAddFriend}><UserPlus size={18} />Add friend</button>}
                                        {friendStatus === "sent" && <button className={styles.pendingBtn}>⏳ Request Sent</button>}
                                        {friendStatus === "received" && (<><button className={styles.acceptBtn} onClick={handleAccept}>✅ Accept</button><button className={styles.declineBtn} onClick={handleDecline}>❌ Decline</button></>)}
                                        {friendStatus === "friends" && <button className={styles.friendsBtn}>👥 Friends</button>}
                                    </div>
                                )}
                            </div>

                            <div className={styles.hr} />

                            <div className={styles.tabs}>
                                {profileTabs.map(tab => (
                                    <button key={tab} className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab)}>{tab}</button>
                                ))}
                            </div>

                            {activeTab === 'Posts' && (
                                <div className={styles.postsSection}>
                                    {postsLoading ? <div className={styles.notice}>Loading...</div> : posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)}
                                </div>
                            )}
                            {activeTab === 'Photos' && (
                                <div className={styles.photosGrid}>
                                    {photoPosts.length > 0 ? photoPosts.map((post, idx) => (
                                        <img key={post.id} className={`${styles.photoItem} ${idx === 0 ? styles.photoLarge : ''}`}
                                            src={post.image || post.image_url || post.media?.[0]?.url} alt="" onClick={() => openComments(post)} />
                                    )) : <div className={styles.notice}>No photos found.</div>}
                                </div>
                            )}
                            {activeTab === 'Friends' && <div className={styles.friendsTabContent}><FriendsTab friends={friends} /></div>}
                            {activeTab === 'Activities' && (
                                <div className={styles.postsSection}>
                                    {activitiesLoading ? <div className={styles.notice}>Loading activities...</div>
                                        : activityPosts.length > 0 ? activityPosts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                                            : <div className={styles.notice}>No recent activity to show.</div>}
                                </div>
                            )}
                            {activeTab === 'Saved' && (
                                <div className={styles.postsSection}>
                                    {savedLoading ? <div className={styles.notice}>Loading saved posts...</div>
                                        : savedPosts.length > 0 ? savedPosts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                                            : <div className={styles.notice}>You haven't saved any posts yet.</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.rightSection}>
                        {isOwnProfile ? <FriendsSuggestion /> : (
                            <>
                                <UserDetails user={user} />
                                {communityPicks.length > 0 && (
                                    <div className={styles.picksCard}>
                                        <div className={styles.picksHeader}>
                                            <Users size={18} className={styles.picksIcon} />
                                            <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                                        </div>
                                        <div className={styles.picksSliderWrapper}>
                                            <button className={styles.picksArrow} onClick={() => setPicksSlide(prev => Math.max(0, prev - 1))} disabled={picksSlide === 0}>‹</button>
                                            <div className={styles.picksSlide}>
                                                {communityPicks[picksSlide] && (() => {
                                                    const pick = communityPicks[picksSlide];
                                                    return (
                                                        <div className={styles.pickItem}>
                                                            {pick.cover_image && <img src={pick.cover_image} alt={pick.name} className={styles.pickCoverImage} />}
                                                            <div className={styles.pickInfo}>
                                                                <div className={styles.pickNameRow}>
                                                                    <span className={styles.pickName}>{pick.name}</span>
                                                                    {pick.is_verified && <svg width="14" height="14" viewBox="0 0 24 24" fill="#8b2dff"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                                                    <button className={styles.pickViewBtn}>View</button>
                                                                </div>
                                                                <p className={styles.pickDescription}>{pick.description}</p>
                                                                {pick.description?.length > 80 && <button className={styles.readMore}>read more</button>}
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <button className={styles.picksArrow} onClick={() => setPicksSlide(prev => Math.min(communityPicks.length - 1, prev + 1))} disabled={picksSlide === communityPicks.length - 1}>›</button>
                                        </div>
                                        {communityPicks.length > 1 && (
                                            <div className={styles.picksDots}>
                                                {communityPicks.map((_, i) => (
                                                    <button key={i} className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`} onClick={() => setPicksSlide(i)} />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
            MOBILE LAYOUT
        ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>


                    <div style={{
                        background: "linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))",
                        paddingTop: 6
                    }}>
                        {/* This #333333 div now covers the full page — no borderRadius cutoff */}
                        <div style={{ background: "#333333", minHeight: "100vh" }}>

                            {/* ── Cover image ── */}
                            <div style={{
                                width: "100%", height: "clamp(160px, 22vw, 300px)", position: "relative",
                                background: "rgba(255,255,255,0.04)", overflow: "hidden"
                            }}>
                                {coverUrl
                                    ? <img src={coverUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    : null
                                }
                                {isOwnProfile && (
                                    <button style={{
                                        position: "absolute", right: 12, bottom: 10,
                                        background: "rgba(0,0,0,0.35)", border: "none", borderRadius: 10,
                                        color: "rgba(255,255,255,0.9)", padding: "7px 12px", cursor: "pointer", fontWeight: 600
                                    }}>Edit ✎</button>
                                )}
                            </div>

                            {/* ── Avatar + name ── */}
                            <div style={{ padding: "0 16px 16px", marginTop: -36, position: "relative", zIndex: 2 }}>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 10 }}>
                                    {/* Avatar sits above the cover edge */}
                                    <div style={{
                                        width: 72, height: 72, borderRadius: "50%",
                                        border: "4px solid #333333",
                                        overflow: "hidden",
                                        background: "rgba(0,0,0,0.25)", flexShrink: 0,
                                        position: "relative", zIndex: 3
                                    }}>
                                        {avatarUrl
                                            ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                            : <User size={36} color="white" />
                                        }
                                    </div>

                                    {!isOwnProfile && (
                                        <div style={{ display: "flex", gap: 8, marginLeft: "auto", paddingBottom: 4 }}>
                                            <button className={styles.messageBtn} onClick={handleMessage} style={{ width: 36, height: 36 }}>
                                                <MessageSquare size={16} />
                                            </button>
                                            {friendStatus === "none" && (
                                                <button className={styles.addFriendBtn} onClick={handleAddFriend} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                                                    <UserPlus size={14} />Add
                                                </button>
                                            )}
                                            {friendStatus === "sent" && (
                                                <button className={styles.pendingBtn} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>⏳ Sent</button>
                                            )}
                                            {friendStatus === "received" && (
                                                <>
                                                    <button className={styles.acceptBtn} onClick={handleAccept} style={{ padding: "6px 10px", fontSize: "0.8rem" }}>✅</button>
                                                    <button className={styles.declineBtn} onClick={handleDecline} style={{ padding: "6px 10px", fontSize: "0.8rem" }}>❌</button>
                                                </>
                                            )}
                                            {friendStatus === "friends" && (
                                                <button className={styles.friendsBtn} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>👥 Friends</button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Name / role */}
                                {user?.role === 'instructor' ? (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{username}</h2>
                                            {user?.is_verified && (
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b2dff" strokeWidth="2.5">
                                                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: 8, marginTop: 4, color: "#aaa", fontSize: "0.82rem" }}>
                                            {user?.department && <span>{user.department}</span>}
                                            {user?.employment_type && <><span>·</span><span>{user.employment_type}</span></>}
                                        </div>
                                        {bio && <p style={{ margin: "6px 0 0", color: "rgba(255,255,255,0.6)", fontSize: "0.82rem", lineHeight: 1.4 }}>{bio}</p>}
                                    </>
                                ) : (
                                    <>
                                        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
                                            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{username}</h2>
                                            <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>/{role}</span>
                                        </div>
                                        <div style={{ color: "#ccc", fontSize: "0.85rem", marginTop: 2 }}>{fullName}</div>
                                        <div style={{ color: "#aaa", fontSize: "0.8rem", marginTop: 2 }}>{university} — {major}</div>
                                    </>
                                )}
                            </div>

                            {/* ── Tabs ── */}
                            <div style={{
                                display: "flex",
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                padding: "0 8px"
                            }}>
                                {profileTabs.map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            flex: 1, background: "transparent", border: "none",
                                            color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
                                            fontWeight: activeTab === tab ? 700 : 500,
                                            fontSize: "0.85rem", padding: "12px 4px", cursor: "pointer",
                                            borderBottom: activeTab === tab ? "2px solid #8b2dff" : "2px solid transparent",
                                            marginBottom: -1
                                        }}
                                    >{tab}</button>
                                ))}
                            </div>

                            {/* ── Tab content — stays inside #333333 ── */}
                            <div style={{ padding: "12px 10px 40px", display: "flex", flexDirection: "column", gap: 12 }}>

                                {activeTab === 'Posts' && (
                                    postsLoading
                                        ? <div className={styles.notice}>Loading...</div>
                                        : posts.length === 0
                                            ? <div className={styles.notice}>No posts yet.</div>
                                            : posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                                )}

                                {activeTab === 'Photos' && (
                                    <div style={{
                                        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
                                        gap: 8, background: "#2a2a2a", borderRadius: 20, padding: 12
                                    }}>
                                        {photoPosts.length > 0 ? photoPosts.map((post, idx) => (
                                            <img
                                                key={post.id}
                                                src={post.image || post.image_url || post.media?.[0]?.url} alt=""
                                                onClick={() => openComments(post)}
                                                style={{
                                                    width: "100%", aspectRatio: "1/1", objectFit: "cover",
                                                    borderRadius: 10, cursor: "pointer",
                                                    gridColumn: idx === 0 ? "span 2" : undefined,
                                                    gridRow: idx === 0 ? "span 2" : undefined
                                                }}
                                            />
                                        )) : (
                                            <div className={styles.notice} style={{ gridColumn: "span 3" }}>No photos found.</div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'Friends' && (
                                    <div className={styles.friendsTabContent}>
                                        <FriendsTab friends={friends} />
                                    </div>
                                )}

                                {activeTab === 'Activities' && (
                                    activitiesLoading
                                        ? <div className={styles.notice}>Loading activities...</div>
                                        : activityPosts.length > 0
                                            ? activityPosts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                                            : <div className={styles.notice}>No recent activity to show.</div>
                                )}

                                {activeTab === 'Saved' && (
                                    savedLoading
                                        ? <div className={styles.notice}>Loading saved posts...</div>
                                        : savedPosts.length > 0
                                            ? savedPosts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)
                                            : <div className={styles.notice}>You haven't saved any posts yet.</div>
                                )}

                                {/* UserDetails + Community Picks for other profiles */}
                                {!isOwnProfile && (
                                    <div style={{ marginTop: 8 }}>
                                        <UserDetails user={user} />
                                        {communityPicks.length > 0 && (
                                            <div className={styles.picksCard} style={{ marginTop: 16 }}>
                                                <div className={styles.picksHeader}>
                                                    <Users size={18} className={styles.picksIcon} />
                                                    <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                                                </div>
                                                <div className={styles.picksSliderWrapper}>
                                                    <button className={styles.picksArrow} onClick={() => setPicksSlide(p => Math.max(0, p - 1))} disabled={picksSlide === 0}>‹</button>
                                                    <div className={styles.picksSlide}>
                                                        {communityPicks[picksSlide] && (() => {
                                                            const pick = communityPicks[picksSlide];
                                                            return (
                                                                <div className={styles.pickItem}>
                                                                    {pick.cover_image && <img src={pick.cover_image} alt={pick.name} className={styles.pickCoverImage} />}
                                                                    <div className={styles.pickInfo}>
                                                                        <div className={styles.pickNameRow}>
                                                                            <span className={styles.pickName}>{pick.name}</span>
                                                                            <button className={styles.pickViewBtn}>View</button>
                                                                        </div>
                                                                        <p className={styles.pickDescription}>{pick.description}</p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                    <button className={styles.picksArrow} onClick={() => setPicksSlide(p => Math.min(communityPicks.length - 1, p + 1))} disabled={picksSlide === communityPicks.length - 1}>›</button>
                                                </div>
                                                {communityPicks.length > 1 && (
                                                    <div className={styles.picksDots}>
                                                        {communityPicks.map((_, i) => (
                                                            <button key={i} className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`} onClick={() => setPicksSlide(i)} />
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                {/* FriendsSuggestion intentionally hidden on mobile */}
                            </div>

                        </div>{/* end #333333 */}
                    </div>{/* end gradient */}
                </div>
            )}



            {selectedPost && (
                <CommentModal post={selectedPost} onClose={closeComments} currentUser={currentUser} />
            )}
        </div>
    );
}