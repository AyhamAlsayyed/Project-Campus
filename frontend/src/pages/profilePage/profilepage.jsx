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
import Community from '../../Assets/icons/community.png';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';
import Star from '../../Assets/icons/star.png';
import Events from '../../Assets/icons/event.png';
import Share from '../../Assets/icons/share.png';
import Bin from '../../Assets/icons/bin.png';
import Info from '../../Assets/icons/info.png';
import { createPortal } from 'react-dom';
import {
    User, UserPlus, Bell, Users, Settings,
    Languages, Home, HelpCircle, MessageSquare,
    Menu, X, Search, Check, MoreHorizontal,
    Volume2, Calendar, Heart, ChevronLeft,
    Upload, Trash2, Mail, Phone, Ban,Edit2, Camera
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
    const [picksPopup, setPicksPopup] = useState(null);
    const [reminders, setReminders] = useState([]);
    const [remindersMonth, setRemindersMonth] = useState(new Date());
    const [remindersPopup, setRemindersPopup] = useState(null);
    const [eventMenuOpen, setEventMenuOpen] = useState(null);
    const [showRemindersMonthPicker, setShowRemindersMonthPicker] = useState(false);
    const [isBlocked, setIsBlocked] = useState(false);
    useEffect(() => {
        if (user) setIsBlocked(user?.is_blocked || false);
    }, [user]);


    const resolveUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API}${url}`;
    };
    const loadReminders = async () => {
        try {
            const res = await fetch(`${API}/api/events/reminders/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setReminders(Array.isArray(data) ? data : []);
            }
        } catch (e) { console.error(e); }
    };
    const handleBlock = async () => {
        const wasBlocked = isBlocked;
        setIsBlocked(!wasBlocked);
        try {
            const res = await fetch(`${API}/api/users/${userId}/block/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) setIsBlocked(wasBlocked);
        } catch { setIsBlocked(wasBlocked); }
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
            let res = await fetch(`${API}/api/pages/${userId}/community-picks/`, { headers: { Authorization: `Bearer ${token}` } });
            if (!res.ok) res = await fetch(`${API}/api/users/${userId}/community-picks/`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setCommunityPicks(Array.isArray(data) ? data : []);
            }
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
        try {

            const path = user?.type === 'page'
                ? `pages/${user.id}/follow/`
                : `friends/request/`;

            const token = localStorage.getItem('access'); // Make sure the key matches exactly what you used during login

            const response = await fetch(`${API}/api/pages/${user.id}/follow/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Ensure space between Bearer and token
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                setIsFollowing(!isFollowing);
            } else {
                const errorData = await response.json();
                console.error("Server Error:", errorData);
            }
        } catch (error) {
            console.error("Network Error:", error);
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
                const formatted = (Array.isArray(data) ? data : []).map(post => ({
                    ...post,
                    id: post.post_id || post.id,          // ← normalize post_id → id
                    content: post.content_text || post.content,  // ← normalize content_text → content
                    author: post.author || {
                        id: post.author_user || post.author_page,
                        username: post.author_username || "Unknown",
                        avatar: post.author_avatar || null,
                    }
                }));
                setActivityPosts(formatted);
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
    }, [userId]);


    useEffect(() => {
        if (!currentUser) return;
        const isOwn = currentUser.id === Number(userId);
        if (!isOwn) return;

        loadActivities();
        loadSavedPosts();
        loadReminders();
    }, [currentUser, userId]);

    useEffect(() => {
        if (!user || !currentUser) return;
        const isOwn = currentUser.id === Number(userId);
        if (isOwn) return;
        if (user.role === 'instructor') {
            loadCommunityPicks();
        }
        if (user.type !== 'page') {
            loadFriends(userId);
        }
    }, [user, currentUser, userId]);

    const handleMessage = async () => {
        try {
            const res = await fetch(`${API}/api/conversations/get-or-create/${userId}/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            console.log("conversation response:", data);
            if (data.conversation_id) navigate(`/chats/${data.conversation_id}`);
        } catch (e) {
            console.error("Error opening chat:", e);
        }
    };
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
                        ) : isBlocked ? (
                            <div className={styles.profileCard}>
                                <div className={styles.coverWrap}>
                                    <div className={styles.coverPlaceholder} style={{ filter: "grayscale(1)", opacity: 0.3 }} />
                                </div>
                                <div className={styles.profileHeaderRow}>
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatarCircle} style={{ filter: "grayscale(1)", opacity: 0.4 }}>
                                            <User size={52} />
                                        </div>
                                    </div>
                                    <div className={styles.profileMeta}>
                                        <div className={styles.nameRow}>
                                            <h2 className={styles.username} style={{ opacity: 0.5 }}>{username}</h2>
                                        </div>
                                        <div style={{ marginTop: 8, color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
                                            You've blocked this user. Their content is hidden.
                                        </div>
                                    </div>
                                    <div className={styles.profileActions}>
                                        <button
                                            onClick={handleBlock}
                                            style={{
                                                background: "rgba(255,255,255,0.08)",
                                                border: "1px solid rgba(255,255,255,0.15)",
                                                borderRadius: 20, padding: "8px 20px",
                                                color: "rgba(255,255,255,0.7)", fontWeight: 600,
                                                fontSize: "0.9rem", cursor: "pointer"
                                            }}
                                        >
                                            Unblock
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.hr} />
                                <div style={{
                                    display: "flex", flexDirection: "column", alignItems: "center",
                                    justifyContent: "center", padding: "60px 20px", gap: 16
                                }}>
                                    <Ban size={48} color="rgba(255,255,255,0.2)" />
                                    <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "1rem", margin: 0 }}>
                                        This profile is blocked
                                    </p>
                                    <p style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.85rem", margin: 0, textAlign: "center" }}>
                                        Unblock to see their posts, photos, and other content.
                                    </p>
                                </div>
                            </div>
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
                                                    <button
                                                        onClick={handleBlock}
                                                        style={{
                                                            background: isBlocked ? "rgba(255,100,100,0.15)" : "rgba(255,255,255,0.07)",
                                                            border: `1px solid ${isBlocked ? "rgba(255,100,100,0.3)" : "rgba(255,255,255,0.1)"}`,
                                                            borderRadius: 20, padding: "8px 14px",
                                                            color: isBlocked ? "#ff6464" : "rgba(255,255,255,0.5)",
                                                            fontWeight: 600, fontSize: "0.85rem", cursor: "pointer"
                                                        }}
                                                    >
                                                        {isBlocked ? "Unblock" : "Block"}
                                                    </button>
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
                                                const postsToShow = activitiesFilter === 'saves'
                                                    ? savedPosts
                                                    : filteredActivityPosts;
                                                return postsToShow.length > 0
                                                    ? postsToShow.map(post => (
                                                        <PostCard key={post.id} post={post} openComments={openComments} isOwnProfile={isOwnProfile} />
                                                    ))
                                                    : <div className={styles.notice}>
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
                        {isOwnProfile ? (
                            <>
                                <FriendsSuggestion />
                                {(() => {
                                    const year = remindersMonth.getFullYear();
                                    const month = remindersMonth.getMonth();
                                    const monthName = remindersMonth.toLocaleString('default', { month: 'long' });
                                    const firstDay = new Date(year, month, 1).getDay();
                                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                                    const eventDays = new Set(
                                        reminders.map(e => {
                                            const d = new Date(e.start_date || e.date || e.event_date);
                                            return (d.getFullYear() === year && d.getMonth() === month) ? d.getDate() : null;
                                        }).filter(Boolean)
                                    );
                                    const cells = [];
                                    for (let i = 0; i < firstDay; i++) cells.push(null);
                                    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

                                    return (
                                        <div style={{
                                            background: "rgba(61,60,60,0.45)", borderRadius: 20,
                                            padding: "20px 20px 16px", border: "1px solid rgba(255,255,255,0.08)",
                                            backdropFilter: "blur(10px)", marginTop: 16, position: "relative"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", marginBottom: 16 }}>
                                                <img src={Events} alt="events" style={{ width: 20, height: 20, flexShrink: 0, filter: "brightness(0) saturate(100%) invert(22%) sepia(80%) saturate(1300%) hue-rotate(280deg) brightness(90%)" }} />
                                                <span style={{ color: "white", fontWeight: 700, fontSize: "1.1rem", marginLeft: 8 }}>
                                                    Reminders set
                                                </span>
                                                <span
                                                    onClick={() => setShowRemindersMonthPicker(p => !p)}
                                                    style={{
                                                        color: "rgba(255,255,255,0.45)", fontSize: "0.85rem", marginLeft: "auto",
                                                        borderBottom: "1.5px solid #A6279C", cursor: "pointer",
                                                        userSelect: "none", transition: "color 0.15s"
                                                    }}
                                                    onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
                                                    onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.45)"}
                                                >
                                                    {monthName} {year}
                                                </span>
                                            </div>
                                            {showRemindersMonthPicker && (
                                                <div style={{
                                                    position: "absolute",        // ← float over content
                                                    top: 56,                     // ← sits just below the header row
                                                    left: 0,
                                                    right: 0,
                                                    zIndex: 50,                  // ← above the calendar grid
                                                    background: "#252525",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: 16, padding: 14,
                                                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)",
                                                    margin: "0 0 0 0"           // ← remove the old marginBottom
                                                }}>
                                                    {/* Year navigation */}
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                                                        <button
                                                            onClick={() => setRemindersMonth(new Date(year - 1, month, 1))}
                                                            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                        >‹</button>
                                                        <span style={{ color: "#fff", fontWeight: 700, fontSize: "0.95rem" }}>{year}</span>
                                                        <button
                                                            onClick={() => setRemindersMonth(new Date(year + 1, month, 1))}
                                                            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}
                                                        >›</button>
                                                    </div>

                                                    {/* Month grid */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                                                            const isSelected = i === month;
                                                            return (
                                                                <button
                                                                    key={m}
                                                                    onClick={() => {
                                                                        setRemindersMonth(new Date(year, i, 1));
                                                                        setShowRemindersMonthPicker(false);
                                                                    }}
                                                                    style={{
                                                                        background: isSelected
                                                                            ? "linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))"
                                                                            : "transparent",
                                                                        border: "none", borderRadius: 10,
                                                                        color: isSelected ? "#fff" : "rgba(255,255,255,0.7)",
                                                                        padding: "8px 4px", fontSize: "0.8rem",
                                                                        fontWeight: isSelected ? 700 : 400,
                                                                        cursor: "pointer", transition: "background 0.15s"
                                                                    }}
                                                                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                                                                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                                                                >
                                                                    {m}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                                                {cells.map((day, i) => {
                                                    const hasEvent = day && eventDays.has(day);
                                                    return (
                                                        <div
                                                            key={i}
                                                            onClick={() => {
                                                                if (!hasEvent) return;
                                                                const eventsOnDay = reminders.filter(e => {
                                                                    const d = new Date(e.start_date || e.date || e.event_date);
                                                                    return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
                                                                });
                                                                setRemindersPopup({ day, monthName, events: eventsOnDay });
                                                            }}
                                                            style={{
                                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                                width: 30, height: 30, margin: "2px auto",
                                                                borderRadius: "50%",
                                                                background: hasEvent ? "#A4279C" : "transparent",
                                                                color: day ? (hasEvent ? "white" : "rgba(255,255,255,0.7)") : "transparent",
                                                                fontSize: "0.78rem", fontWeight: hasEvent ? 700 : 400,
                                                                cursor: hasEvent ? "pointer" : "default",
                                                                transition: "background 0.15s, transform 0.15s",
                                                            }}
                                                            onMouseEnter={e => { if (hasEvent) e.currentTarget.style.transform = "scale(1.1)"; }}
                                                            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                                                        >
                                                            {day || ""}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <>
                                <UserDetails user={user} />
                                {user?.type === 'page' && !isOwnProfile && (
                                    <div style={{
                                        background: "rgba(61,60,60,0.45)", borderRadius: 20,
                                        padding: "20px 24px", border: "1px solid rgba(255,255,255,0.08)",
                                        backdropFilter: "blur(10px)", marginTop: 16
                                    }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 30, marginLeft: 20 }}>
                                            <img src={Star} alt="star" style={{ width: "2rem", height: "2rem", filter: "brightness(0) saturate(100%) invert(23%) sepia(76%) saturate(1200%) hue-rotate(280deg) brightness(95%)" }} />
                                            <span style={{ color: "white", fontWeight: 700, fontSize: "1.15rem" }}>Add a Review</span>
                                        </div>
                                        <div style={{ display: "flex", justifyContent: "space-around" }}>
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                    onMouseLeave={() => setHoverRating(0)}
                                                    onClick={() => handleReview(star)}
                                                    style={{
                                                        background: "none", border: "none", cursor: "pointer",
                                                        padding: 0,
                                                        transition: "filter 0.15s, transform 0.15s",
                                                        transform: star <= (hoverRating || reviewRating) ? "scale(1.1)" : "scale(1)"
                                                    }}
                                                >
                                                    <img
                                                        src={Star}
                                                        alt="star"
                                                        style={{
                                                            width: "1.9rem", height: "1.9rem", display: "block",
                                                            filter: star <= (hoverRating || reviewRating)
                                                                ? "brightness(0) invert(1) opacity(0.72)"        // #B8B8B8
                                                                : "brightness(0) invert(1) opacity(0.28)"        // dark unselected
                                                        }}
                                                    />
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
                                            <img
                                                src={Community}
                                                alt="icon"
                                                className={styles.picksIconPng}
                                                style={{ filter: 'brightness(0) saturate(100%) invert(23%) sepia(85%) saturate(1200%) hue-rotate(280deg) brightness(90%)' }}
                                            />
                                            <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                                        </div>

                                        <div className={styles.picksSlideWrapper}>
                                            {communityPicks[picksSlide] && (() => {
                                                const pick = communityPicks[picksSlide];
                                                return (
                                                    <div
                                                        className={styles.pickItemCard}
                                                        style={{ backgroundImage: `url(${pick.image})` }}
                                                    >
                                                        <div className={styles.pickOverlay}>
                                                            <div className={styles.pickContentTop}>
                                                                <div className={styles.pickTitleGroup}>
                                                                    <h2 className={styles.pickName}>{pick.name}</h2>
                                                                    {pick.is_verified && (
                                                                        <img src={VerifiedBadge} alt="Verified" width={18} height={18} style={{ filter: "brightness(0) invert(1)" }} />
                                                                    )}
                                                                </div>
                                                                <button
                                                                    className={styles.pickViewBtn}
                                                                    onClick={() => navigate(`/communities/${pick.id}`)}
                                                                >
                                                                    view
                                                                </button>
                                                            </div>

                                                            <div className={styles.pickContentBottom}>
                                                                <p className={styles.pickDescription}>{pick.description}</p>
                                                                {pick.description?.length > 80 && (
                                                                    <button
                                                                        className={styles.readMore}
                                                                        onClick={() => setPicksPopup(pick)}
                                                                    >
                                                                        read more
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        <div className={styles.paginationRow}>
                                            <button className={styles.navArrow} onClick={() => setPicksSlide(prev => Math.max(0, prev - 1))} disabled={picksSlide === 0}>
                                                <div className={styles.arrowLeft} />
                                            </button>
                                            <div className={styles.picksDots}>
                                                {communityPicks.map((_, i) => (
                                                    <button key={i} className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`} onClick={() => setPicksSlide(i)} />
                                                ))}
                                            </div>
                                            <button className={styles.navArrow} onClick={() => setPicksSlide(prev => Math.min(communityPicks.length - 1, prev + 1))} disabled={picksSlide === communityPicks.length - 1}>
                                                <div className={styles.arrowRight} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Picks popup — outside the picks card */}
                                {picksPopup && createPortal(
                                    <div style={{
                                        position: "fixed", inset: 0, zIndex: 9999,
                                        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)",
                                        display: "flex", alignItems: "center", justifyContent: "center"
                                    }} onClick={() => setPicksPopup(null)}>
                                        <div style={{
                                            background: "#1e1e1e", border: "1px solid rgba(255,255,255,0.1)",
                                            borderRadius: 20, padding: 32, width: "90%", maxWidth: 500,
                                            position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.5)"
                                        }} onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setPicksPopup(null)} style={{
                                                position: "absolute", top: 16, right: 16,
                                                background: "none", border: "none",
                                                color: "rgba(255,255,255,0.5)", fontSize: 20, cursor: "pointer"
                                            }}>✕</button>
                                            <h3 style={{ color: "#fff", fontSize: 24, fontWeight: 800, margin: "0 0 16px" }}>
                                                {picksPopup.name}
                                            </h3>
                                            <p style={{
                                                color: "rgba(255,255,255,0.85)", fontSize: 15,
                                                lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word"
                                            }}>
                                                {picksPopup.description}
                                            </p>
                                        </div>
                                    </div>,
                                    document.body
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
                                handleAddFriend={handleAddFriend} handleAccept={handleAccept} handleDecline={handleDecline} onEditClick={() => edit.setIsEditing(true)} edit={edit}
                            />)}

                    </div>
                </div>
            )}

            {selectedPost && (
                <CommentModal post={selectedPost} onClose={closeComments} currentUser={currentUser} />
            )}
            {remindersPopup && createPortal(
                <div
                    style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center" }}
                    onClick={() => { setRemindersPopup(null); setEventMenuOpen(null); }}
                >
                    <div
                        style={{ background: "#383838", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 24, padding: "24px 20px", width: "92%", maxWidth: 480, maxHeight: "85vh", overflowY: "auto", position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,0.7)" }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                            <img src={Events} alt="events" style={{ width: 22, height: 22, filter: "brightness(0) invert(1)" }} />
                            <h3 style={{ color: "white", fontSize: "1.15rem", fontWeight: 700, margin: 0 }}>
                                Events on {remindersPopup.monthName} {remindersPopup.day}{[1, 21, 31].includes(remindersPopup.day) ? 'st' : [2, 22].includes(remindersPopup.day) ? 'nd' : [3, 23].includes(remindersPopup.day) ? 'rd' : 'th'}
                            </h3>
                            <button
                                onClick={() => setRemindersPopup(null)}
                                style={{ marginLeft: "auto", background: "none", border: "none", color: "#e84d70", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer", padding: 0 }}
                            >
                                Cancel
                            </button>
                        </div>

                        {/* Events list */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                            {remindersPopup.events.map((event, index) => (
                                <div key={event.id}>
                                    {/* Separator between events */}
                                    {index > 0 && (
                                        <div style={{ width: "40%", height: 1, background: "rgba(255,255,255,0.1)", margin: "0 auto 20px auto" }} />
                                    )}

                                    {/* Host row */}
                                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                                        {event.page?.avatar || event.host?.avatar
                                            ? <img src={(event.page?.avatar || event.host?.avatar).startsWith("http") ? (event.page?.avatar || event.host?.avatar) : `${API}${event.page?.avatar || event.host?.avatar}`}
                                                alt="" style={{ width: 42, height: 42, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.1)" }} />
                                            : <div style={{ width: 42, height: 42, borderRadius: "50%", background: "rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><User size={20} color="rgba(255,255,255,0.4)" /></div>
                                        }
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                                <span style={{ color: "white", fontWeight: 700, fontSize: "0.85rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {event.page?.name || event.host?.name || event.host?.username || "Unknown Host"}
                                                </span>
                                                {(event.page?.is_verified || event.host?.is_verified) && (
                                                    <img src={VerifiedBadge} alt="verified" style={{ width: 14, height: 14, filter: "brightness(0) invert(1)", flexShrink: 0 }} />
                                                )}
                                            </div>
                                            {(event.page?.description || event.host?.bio) && (
                                                <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                                    {event.page?.description || event.host?.bio}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginRight: 6 }}>
                                            <Bell size={14} color="rgba(255,255,255,0.8)" />
                                        </div>
                                        <button style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: 20, color: "white", fontSize: "0.75rem", fontWeight: 600, padding: "6px 16px", cursor: "pointer", flexShrink: 0 }}>
                                            Followed
                                        </button>
                                    </div>

                                    {/* Event card */}
                                    <div style={{ borderRadius: 24, overflow: "hidden", position: "relative", minHeight: 160 }}>
                                        {/* Banner background */}
                                        {event.banner
                                            ? <img src={event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`} alt=""
                                                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                                            : <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.05)" }} />
                                        }

                                        {/* Dark gradient overlay covering the card to ensure text is visible */}
                                        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.85) 100%)" }} />

                                        {/* 3-dot menu floating at top right */}
                                        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 10 }}>
                                            <button
                                                onClick={e => { e.stopPropagation(); setEventMenuOpen(eventMenuOpen === event.id ? null : event.id); }}
                                                style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)", border: "none", borderRadius: "50%", cursor: "pointer", color: "white", padding: 6, display: "flex", alignItems: "center", justifyContent: "center" }}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                            {eventMenuOpen === event.id && (
                                                <div
                                                    style={{ position: "absolute", right: 0, top: "115%", zIndex: 200, background: "#222224", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "8px 0", minWidth: 160, boxShadow: "0 8px 24px rgba(0,0,0,0.8)" }}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {[
                                                        { icon: <Upload size={14} />, label: "Share event", color: "white" },
                                                        { icon: <Trash2 size={14} />, label: "Delete event", color: "#e84d70" },
                                                        { icon: <HelpCircle size={14} />, label: "Report event", color: "#e84d70" },
                                                    ].map(({ icon, label, color }) => (
                                                        <button
                                                            key={label}
                                                            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 16px", background: "transparent", border: "none", cursor: "pointer", color: color, fontSize: "0.85rem", fontWeight: 500, transition: "background 0.15s" }}
                                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
                                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                                        >
                                                            {icon}{label}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content at the bottom */}
                                        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "flex-end", gap: 16, padding: "20px 16px 16px 16px", minHeight: 160 }}>
                                            {/* Left: title + desc + read more */}
                                            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                                                <span style={{ color: "white", fontWeight: 800, fontSize: "1.05rem" }}>{event.title}</span>
                                                {event.description && (
                                                    <p style={{ color: "rgba(255,255,255,0.75)", fontSize: "0.8rem", margin: 0, lineHeight: 1.4, fontStyle: "italic", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                                        {event.description}
                                                    </p>
                                                )}
                                                {event.description?.length > 80 && (
                                                    <button style={{ background: "none", border: "none", color: "white", textDecoration: "underline", fontSize: "0.75rem", cursor: "pointer", padding: 0, fontWeight: 500, textAlign: "left", marginTop: 2 }}>
                                                        read more
                                                    </button>
                                                )}
                                            </div>

                                            {/* Right: Information panel */}
                                            {(event.start_date || event.location) && (
                                                <div style={{ width: 140, flexShrink: 0, padding: "12px", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)", borderRadius: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                                                    <span style={{ color: "white", fontSize: "0.6rem", fontWeight: 600 }}>Information</span>
                                                    {event.start_date && (
                                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e84d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                            <span style={{ color: "white", fontSize: "0.65rem", lineHeight: 1.3 }}>
                                                                {new Date(event.start_date) <= new Date()
                                                                    ? "Happening Now!"
                                                                    : `The event starts in ${Math.ceil((new Date(event.start_date) - new Date()) / 3600000)} hours`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {event.location && (
                                                        <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#e84d70" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                            <span style={{ color: "white", fontSize: "0.65rem", lineHeight: 1.3 }}>{event.location}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}