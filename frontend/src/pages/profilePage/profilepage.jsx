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
import MobileEditView from '../../components/profile/mobileEditView';
import MobileProfileView from '../../components/profile/mobileProfileView';
import { useProfileEdit } from '../../components/profile/useEditProfile';
import ProfileEditCard from '../../components/profile/profileEditCard';
import Like from '../../Assets/icons/like.png';
import Comment from '../../Assets/icons/comment.png';
import Save from '../../Assets/icons/save-icon.png';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import {
    User, UserPlus, Bell, Users, Settings,
    Languages, Home, HelpCircle, MessageSquare,
    Menu, X, Search, Check, MoreHorizontal,
    Volume2, Calendar, Heart, ChevronLeft,
    Upload, Trash2, Mail, Phone, Edit2, Camera
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
    const [activitiesFilter, setActivitiesFilter] = useState('likes');
    const [activitiesDropdownOpen, setActivitiesDropdownOpen] = useState(false);
    const activitiesDropdownRef = useRef(null);
    const [savedLoading, setSavedLoading] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(0);
    const [reviewRating, setReviewRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [pagePosts, setPagePosts] = useState([]);
    const [pageEvents, setPageEvents] = useState([]);

    const resolveUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API}${url}`;
    };

    const API = "http://localhost:8000";
    const edit = useProfileEdit({ user, token, API, onSaved: () => onSavedRef.current?.() });
    const { isEditing, setIsEditing } = edit;
    const onSavedRef = useRef(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const avatarDropdownRef = useRef(null);
    const { pathname } = useLocation();
    const { userId } = useParams();
    const navigate = useNavigate();
    useEffect(() => { if (user) edit.syncFromUser(user); }, [user]);



    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);
    const filteredActivityPosts = activityPosts.filter(post => {
        if (activitiesFilter === 'saves') return post.is_saved;
        if (activitiesFilter === 'likes') return post.is_liked;
        if (activitiesFilter === 'comments') return true; // backend already filters by commented posts
        return true;
    });

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const close = (e) => {
            if (activitiesDropdownRef.current && !activitiesDropdownRef.current.contains(e.target))
                setActivitiesDropdownOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);


    const loadCurrentUser = async () => {
        try {
            const res = await fetch(`${API}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` } });
            const data = await res.json();
            setCurrentUser(data);
        } catch (e) { console.error(e); }
    };

    const loadCommunityPicks = async () => {
        try {
            // try pages endpoint first, fall back to users
            let res = await fetch(`${API}/api/pages/${userId}/community-picks/`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) res = await fetch(`${API}/api/users/${userId}/community-picks/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { const data = await res.json(); setCommunityPicks(Array.isArray(data) ? data : []); }
        } catch (e) { console.error(e); }
    };

    const loadProfileUser = async () => {
        try {
            let data;
            let res = await fetch(`${API}/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("users/ status:", res.status); // what do you get here?

            if (res.status === 404) {
                res = await fetch(`${API}/api/pages/${userId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                console.log("pages/ status:", res.status); // and here?
                data = await res.json();
                console.log("page raw data:", data); // does this print?
                data = {
                    ...data,
                    type: 'page',
                    username: data.name,
                    avatar_url: data.avatar,
                    cover_url: data.banner,
                    bio: data.description,
                    is_verified: data.verified,
                };
            } else {
                data = await res.json();
            }

            console.log("final user data:", data); // is user being set?
            if (!res.ok) { setUserError(data?.message || "Failed"); setUser(null); return; }
            setUser(data);
            setFriendStatus(data.friend_status);
            if (data?.id) loadPosts(data.id, data.type);;
        } catch (e) {
            console.error("loadProfileUser error:", e); // any crash?
            setUser(null);
            setUserError(e?.message || "Something went wrong");
        }
        finally { setUserLoading(false); }
    };
    onSavedRef.current = loadProfileUser;

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
    useEffect(() => {
        if (user?.type === 'page') {
            setIsFollowing(user?.is_following || false);
            setFollowersCount(user?.followers_count || 0);
        }
    }, [user]);
    const handleFollow = async () => {
        const wasFollowing = isFollowing;
        setIsFollowing(!wasFollowing);
        setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
        try {
            const res = await fetch(`${API}/api/users/${userId}/follow/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                setIsFollowing(wasFollowing);
                setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
            }
        } catch {
            setIsFollowing(wasFollowing);
        }
    };
    const handleReview = async (rating) => {
        setReviewRating(rating);
        try {
            await fetch(`${API}/api/users/${userId}/review/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ rating })
            });
        } catch (e) { console.error(e); }
    };

    const loadPageEvents = async () => {
        try {
            const res = await fetch(`${API}/api/users/${userId}/events/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) { const data = await res.json(); setPageEvents(Array.isArray(data) ? data : []); }
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
            if (!res.ok) { setFriends([]); return; } // add this
            const data = await res.json();
            setFriends(Array.isArray(data) ? data : []);
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

    const loadPosts = async (id, type) => {  // ← add type here
        try {
            const param = type === 'page' ? 'page' : 'user';  // ← use param, not user?.type
            console.log("fetching posts:", `?${param}=${id}`); // confirm in console
            const res = await fetch(`${API}/api/posts?${param}=${id}`, { headers: { Authorization: `Bearer ${token}` } });
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
                        {isEditing ? (
                            <ProfileEditCard styles={styles} edit={edit} setIsEditing={setIsEditing} user={user} />

                        ) : (
                            <div className={styles.profileCard}>
                                <div className={styles.coverWrap}>
                                    {coverUrl ? <img className={styles.coverImage} src={coverUrl} alt="cover" /> : <div className={styles.coverPlaceholder} />}

                                </div>

                                <div className={styles.profileHeaderRow}>
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatarCircle}>
                                            {avatarUrl ? <img className={styles.avatarImage} src={avatarUrl} alt="avatar" /> : <User size={52} />}
                                        </div>
                                    </div>
                                    <div className={styles.profileMeta}>
                                        {user?.type === 'page' ? (
                                            <>
                                                <div className={styles.nameRow} style={{ justifyContent: "normal" }}>
                                                    <h2 className={styles.username}>{username}</h2>
                                                    {user?.is_verified && (
                                                        <img
                                                            src={VerifiedBadge}
                                                            alt="verified"
                                                            style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', marginLeft: 3 }}
                                                        />
                                                    )}
                                                </div>
                                                <div className={styles.subRow} style={{ gap: "10px" }}>
                                                    {user?.category && <span className={styles.department}>{user.category}</span>}
                                                    {user?.category && <span className={styles.dot} />}
                                                    <span className={styles.friendsCount}>{followersCount.toLocaleString()} followers</span>
                                                </div>
                                                {bio && <p className={styles.bio}>{bio}</p>}
                                            </>

                                        ) : user?.type === 'instructor' ? (
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
                                        ) : isOwnProfile ? (
                                            // OWN student profile
                                            <>
                                                <div className={styles.info}>
                                                    <div className={styles.nameRow}>
                                                        <div className={styles.userInfo}>
                                                            <h2 className={styles.username}>{username}</h2>
                                                            <span className={styles.role}>/{role}</span>
                                                        </div>
                                                        <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>Edit ✎</button>
                                                    </div>
                                                    <div className={styles.subRow}>
                                                        <span className={styles.fullName}>{fullName}</span>
                                                        <div className={styles.uniInfo}>
                                                            <span className={styles.uni}>{university} - {major}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                {user?.bio && <p className={styles.bio}>{user.bio}</p>}
                                            </>
                                        ) : (
                                            // OTHER student profile
                                            <>
                                                <div className={styles.info}>
                                                    <div className={styles.nameRow}>
                                                        <div className={styles.userInfo}>
                                                            <h2 className={styles.username}>{username}</h2>
                                                            <span className={styles.role}>/{role}</span>
                                                        </div>
                                                    </div>
                                                    <div className={styles.subRow} style={{ gap: '8px' }}>
                                                        <span className={styles.fullName}>{fullName}</span>
                                                        <span className={styles.dot} />
                                                        <span className={styles.friendsCount}>{user?.friends_count || 0} friends</span>
                                                    </div>
                                                    <div className={styles.uniRow}>
                                                        <span className={styles.uni}>{university} - {major}</span>
                                                    </div>
                                                </div>
                                                {user?.bio && <p className={styles.bio}>{user.bio}</p>}
                                            </>
                                        )}
                                    </div>
                                    {!isOwnProfile && (
                                        <div className={styles.profileActions}>
                                            {user?.type === 'page' ? (
                                                <>
                                                    <button className={styles.messageBtn} onClick={handleMessage}>
                                                        <MessageSquare size={18} />
                                                    </button>
                                                    <button className={styles.messageBtn}>
                                                        <Bell size={18} />
                                                    </button>
                                                    <button
                                                        className={isFollowing ? styles.friendsBtn : styles.addFriendBtn}
                                                        onClick={handleFollow}
                                                    >
                                                        {isFollowing ? 'Followed' : 'Follow'}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button className={styles.messageBtn} onClick={handleMessage}><MessageSquare size={18} /></button>
                                                    {friendStatus === "none" && (
                                                        <button className={styles.addFriendBtn} onClick={handleAddFriend}>
                                                            <UserPlus size={18} /><span>Add<span className="hidden sm:inline"> friend</span></span>
                                                        </button>
                                                    )}
                                                    {friendStatus === "sent" && <button className={styles.pendingBtn}>⏳ Request Sent</button>}
                                                    {friendStatus === "received" && (<><button className={styles.acceptBtn} onClick={handleAccept}>✅ Accept</button><button className={styles.declineBtn} onClick={handleDecline}>❌ Decline</button></>)}
                                                    {friendStatus === "friends" && <button className={styles.friendsBtn}>Friends</button>}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.hr} />

                                <div className={styles.tabs}>
                                    {(user?.type === 'page'
                                        ? ['Posts', 'Photos', 'Events']
                                        : isOwnProfile
                                            ? ['Posts', 'Activities', 'About']
                                            : ['Posts', 'Photos', 'Friends']
                                    ).map(tab => (
                                        tab === 'Activities' && isOwnProfile ? (
                                            <div key="Activities" ref={activitiesDropdownRef} style={{ position: 'relative' }}>
                                                <button
                                                    className={`${styles.tabBtn} ${activeTab === 'Activities' ? styles.tabActive : ''}`}
                                                    onClick={() => {
                                                        setActiveTab('Activities');
                                                        loadActivities();
                                                        setActivitiesDropdownOpen(prev => !prev);
                                                    }}
                                                >
                                                    Activities
                                                </button>
                                                {activitiesDropdownOpen && activeTab === 'Activities' && (
                                                    <div style={{
                                                        position: 'absolute', top: '110%', left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        background: 'var(--bg-secondary, #1e1e2e)',
                                                        border: '1px solid rgba(255,255,255,0.1)',
                                                        borderRadius: 12, padding: '6px 0',
                                                        minWidth: 150, zIndex: 100,
                                                        boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                                                    }}>
                                                        {[
                                                            { key: 'saves', icon: Save, label: 'Saves' },
                                                            { key: 'comments', icon: Comment, label: 'Comments' },
                                                            { key: 'likes', icon: Like, label: 'Likes' },
                                                        ].map(({ key, icon, label }) => (
                                                            <button
                                                                key={key}
                                                                onClick={() => { setActivitiesFilter(key); setActivitiesDropdownOpen(false); }}
                                                                style={{
                                                                    display: 'flex', alignItems: 'center', gap: 10,
                                                                    width: '100%', padding: '10px 18px',
                                                                    background: activitiesFilter === key ? 'rgba(221, 219, 224, 0.11)' : 'transparent',
                                                                    border: 'none', cursor: 'pointer',
                                                                    color: activitiesFilter === key ? '#f0e7f8' : 'rgba(255,255,255,0.8)',
                                                                    fontSize: '0.9rem', fontWeight: activitiesFilter === key ? 600 : 400,
                                                                    transition: 'background 0.15s',
                                                                    borderRadius: 6,
                                                                }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = activitiesFilter === key ? 'rgba(139,45,255,0.15)' : 'transparent'}
                                                            >
                                                                <img
                                                                    src={icon}
                                                                    alt={label}
                                                                    style={{
                                                                        width: 18, height: 18,
                                                                        filter: activitiesFilter === key
                                                                            ? 'invert(100%) sepia(100%) grayscale(200%) brightness(150%)'
                                                                            : 'invert(100%) sepia(100%) grayscale(200%) brightness(80%)'

                                                                    }}
                                                                />
                                                                {label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <button
                                                key={tab}
                                                className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                                                onClick={() => {
                                                    setActiveTab(tab);
                                                    if (tab === 'Events') loadPageEvents();
                                                    if (tab === 'Activities') loadActivities();
                                                }}
                                            >
                                                {tab}
                                            </button>
                                        )
                                    ))}
                                </div>

                                {activeTab === 'Posts' && (
                                    <div className={styles.postsSection}>
                                        {postsLoading ? <div className={styles.notice}>Loading...</div> : posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} isOwnProfile={isOwnProfile} />)}
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
                                        {activitiesLoading
                                            ? <div className={styles.notice}>Loading activities...</div>
                                            : (() => {
                                                // use savedPosts directly for saves filter
                                                const postsToShow = activitiesFilter === 'saves'
                                                    ? savedPosts
                                                    : filteredActivityPosts;

                                                return postsToShow.length > 0
                                                    ? postsToShow.map(post => (
                                                        <PostCard key={post.id} post={post} openComments={openComments} isOwnProfile={isOwnProfile} />
                                                    ))
                                                    : <div className={styles.notice}>``
                                                        No {activitiesFilter === 'saves' ? 'saved posts' : activitiesFilter === 'likes' ? 'liked posts' : 'commented posts'} yet.
                                                    </div>
                                            })()
                                        }
                                    </div>
                                )}

                                {activeTab === 'About' && (
                                    <div className={styles.postsSection}>
                                        <UserDetails user={user} hidePill />
                                    </div>
                                )}
                                {activeTab === 'Events' && (
                                    <div className={styles.postsSection}>
                                        {pageEvents.length > 0 ? pageEvents.map(event => (
                                            <div key={event.id} style={{
                                                background: "rgba(255,255,255,0.04)", borderRadius: 16,
                                                overflow: "hidden", border: "1px solid rgba(255,255,255,0.06)"
                                            }}>
                                                {event.banner && (
                                                    <img src={event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`}
                                                        alt="" style={{ width: "100%", height: 180, objectFit: "cover", display: "block" }} />
                                                )}
                                                <div style={{ padding: "14px 16px" }}>
                                                    <div style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>{event.title}</div>
                                                    {event.start_date && (
                                                        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginTop: 4 }}>
                                                            {event.start_date} {event.end_date ? `→ ${event.end_date}` : ""}
                                                        </div>
                                                    )}
                                                    {event.description && (
                                                        <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.85rem", marginTop: 8, lineHeight: 1.5 }}>
                                                            {event.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )) : <div className={styles.notice}>No events yet.</div>}
                                    </div>
                                )}

                            </div>

                        )}
                        {userLoading && <div className={styles.notice}>Loading profile...</div>}

                    </div>
                    <div className={styles.rightSection}>
                        {isOwnProfile ? <FriendsSuggestion /> : (
                            <>
                                <UserDetails user={user} />
                                {user?.type === 'page' && !isOwnProfile && (
                                    <div style={{
                                        background: "rgba(61,60,60,0.45)", borderRadius: 20,
                                        padding: "20px 24px", border: "1px solid rgba(255,255,255,0.08)",
                                        backdropFilter: "blur(10px)", marginTop: 16
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                                            <span style={{ fontSize: "1.4rem" }}>⭐</span>
                                            <span style={{ color: "white", fontWeight: 700, fontSize: "1rem" }}>Add a Review</span>
                                        </div>
                                        <div style={{ display: "flex", gap: 8 }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => handleReview(star)}
                                                    style={{
                                                        background: "none", border: "none", cursor: "pointer",
                                                        fontSize: "1.8rem", padding: 0,
                                                        filter: star <= (hoverRating || reviewRating)
                                                            ? "none"
                                                            : "grayscale(100%) brightness(0.5)",
                                                        transition: "filter 0.15s, transform 0.15s",
                                                        transform: star <= (hoverRating || reviewRating) ? "scale(1.15)" : "scale(1)"
                                                    }}
                                                >
                                                    ⭐
                                                </button>
                                            ))}
                                        </div>
                                        {reviewRating > 0 && (
                                            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.8rem", marginTop: 10 }}>
                                                You rated this {reviewRating}/5
                                            </p>
                                        )}
                                    </div>
                                )}
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
                        {isEditing ? (
                            <MobileEditView styles={styles} edit={edit} setIsEditing={setIsEditing} />

                        ) : (
                            <MobileProfileView
                                styles={styles}
                                user={user}
                                currentUser={currentUser}
                                isOwnProfile={isOwnProfile}
                                friendStatus={friendStatus}
                                posts={posts}
                                photoPosts={photoPosts}
                                friends={friends}
                                activityPosts={activityPosts}
                                savedPosts={savedPosts}
                                communityPicks={communityPicks}
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                                picksSlide={picksSlide}
                                setPicksSlide={setPicksSlide}
                                postsLoading={postsLoading}
                                activitiesLoading={activitiesLoading}
                                savedLoading={savedLoading}
                                openComments={openComments}
                                handleMessage={handleMessage}
                                handleAddFriend={handleAddFriend}
                                handleAccept={handleAccept}
                                handleDecline={handleDecline}
                                onEditClick={() => edit.setIsEditing(true)}
                                edit={edit}
                            />)}

                    </div>
                </div>
            )}

            {selectedPost && (
                <CommentModal post={selectedPost} onClose={closeComments} currentUser={currentUser} />
            )}
        </div>
    );
}