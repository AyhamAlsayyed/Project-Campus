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
import ArrowRight from '../../Assets/icons/arrow-right.png'
import ArrowLeft from '../../Assets/icons/arrow-left.png'
import Info from '../../Assets/icons/info.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png'
import BellOn from '../../Assets/icons/notifications.png'
import BellOff from '../../Assets/icons/mute.png'
import Edit from '../../Assets/icons/edit.png';
import { useCreateEvent } from '../../components/createEvent/useCreateEvent';



import CreateEventForm from '../../components/createEvent/CreateEventForm';
import CreateEventRightSidebar from '../../components/createEvent/CreateEventRightSidebar';

import AdIcon from '../../Assets/icons/ad.png';
import { AlertCircle } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
    User, UserPlus, Bell, Users, Settings,
    Languages, Home, HelpCircle, MessageSquare,
    Menu, X, Search, Check, MoreHorizontal,
    Volume2, Calendar, Heart, ChevronLeft,
    Upload, Trash2, Mail, Phone, Ban, Edit2, Camera
} from "lucide-react";

export default function ProfilePage({ type }) {
    const [theme, setTheme] = useState("dark");
    const [user, setUser] = useState(null);
    const [friendStatus, setFriendStatus] = useState("none");
    const [currentUser, setCurrentUser] = useState(null);
    const token = localStorage.getItem("access");
    const userType = localStorage.getItem("user_type");

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
    const [menuOpen, setMenuOpen] = useState(false);
    const [unfriendPopup, setUnfriendPopup] = useState(false);
    const menuRef = useRef(null);
    const [showPicksModal, setShowPicksModal] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [picksLoading, setPicksLoading] = useState(false);
    const [modalPicks, setModalPicks] = useState([]);
    const [pageFollowStatus, setPageFollowStatus] = useState({});
    const [pageNotifyStatus, setPageNotifyStatus] = useState({});
    const [showManageEvents, setShowManageEvents] = useState(false);
    const [activeEventTab, setActiveEventTab] = useState('upcoming');
    const [manageEventsDate, setManageEventsDate] = useState(new Date());
    const [showManageMonthPicker, setShowManageMonthPicker] = useState(false);
    const [showCreateEvent, setShowCreateEvent] = useState(false);
    const [ownPageEvents, setOwnPageEvents] = useState([]);
    const [editingEventId, setEditingEventId] = useState(null);
    const [editEventData, setEditEventData] = useState({
        title: '', description: '',
        startDay: '', startMonth: '', startYear: '',
        startHour: '', startMinute: '', startPeriod: 'AM',
        endDay: '', endMonth: '', endYear: '',
        endHour: '', endMinute: '', endPeriod: 'AM',
    });
    const [deleteEventPopup, setDeleteEventPopup] = useState(null);
    const createEvent = useCreateEvent({
        onSuccess: (eventId) => {
            setShowCreateEvent(false);
            navigate('/events', { state: { highlightId: eventId } });
        }
    });

    useEffect(() => {
        const close = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target))
                setMenuOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, []);

    useEffect(() => {
        if (!user) return;

        const blockedStatuses = ["blocked", "blocked_by_user"];

        setIsBlocked(
            user?.is_blocked ||
            blockedStatuses.includes(friendStatus)
        );
    }, [user, friendStatus]);


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
                const events = Array.isArray(data) ? data : [];
                setReminders(events);

                const followInit = {};
                const notifyInit = {};
                events.forEach(e => {
                    const pageId = e.page?.page_id ?? e.page?.id;
                    if (pageId) {
                        followInit[pageId] = e.page.is_followed ?? true;
                        notifyInit[pageId] = e.page.is_notified ?? false; // ← fixed
                    }
                });
                setPageFollowStatus(followInit);
                setPageNotifyStatus(notifyInit);
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
    const handleUnfriend = async () => {
        const res = await fetch(`${API}/api/friends/unfriend/`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ user_id: userId }),
        });
        if (res.ok) setFriendStatus("none");
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
    const { userId, id } = useParams();
    const profileId = userId || id;
    const navigate = useNavigate();

    useEffect(() => { if (user) edit.syncFromUser(user); }, [user]);

    const handlePinChange = (pinnedPostId) => {
        setPosts(prev => prev.map(p => ({
            ...p,
            is_pinned: (p.id || p.post_id) === pinnedPostId
        })));
    };

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    const filteredActivityPosts = activityPosts.filter(post => {
        if (activitiesFilter === 'saves') return post.is_saved;
        if (activitiesFilter === 'likes') return post.is_liked;
        if (activitiesFilter === 'comments') return post.is_commented;
        return true;
    });

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const loadOwnPageEvents = async () => {
        if (!user?.id) return;
        console.log('fetching page events for id:', user.id, 'user type:', user.type, 'role:', user.role);
        try {
            const res = await fetch(`${API}/api/pages/${user.id}/events/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            console.log('page events:', res.status, data);
            if (res.ok) setOwnPageEvents(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
    };

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
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.role === 'university' || localStorage.getItem('user_type') === 'university') {
                const pageRes = await fetch(`${API}/api/pages/${data.id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (pageRes.ok) {
                    const pageData = await pageRes.json();
                    data.avatar = pageData.profile_image; // 👈 inject avatar
                }
            }

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
            let res, raw, isPageType;

            if (type === 'page') {
                res = await fetch(`${API}/api/pages/${profileId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                isPageType = true;
            } else if (type === 'user') {
                res = await fetch(`${API}/api/users/${profileId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                isPageType = false;
            } else {
                res = await fetch(`${API}/api/users/${profileId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                isPageType = false;
                if (!res.ok) {
                    res = await fetch(`${API}/api/pages/${profileId}/`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    isPageType = true;
                }
            }

            if (!res.ok) { setUserError("Failed"); setUser(null); return; }
            raw = await res.json();

            let data;
            if (isPageType) {
                data = {
                    ...raw,
                    id: raw.page_id,
                    type: 'page',
                    username: raw.page_full_name || raw.page_name,
                    avatar_url: raw.profile_image?.startsWith("http") ? raw.profile_image : `${API}${raw.profile_image}`,
                    cover_url: raw.banner_image?.startsWith("http") ? raw.banner_image : `${API}${raw.banner_image}`,
                    bio: raw.description || "",
                    is_verified: raw.verified,
                    is_following: raw.is_followed,
                    followers_count: raw.followers_count || 0,
                    category: raw.page_type,
                };
            } else {
                data = {
                    ...raw,
                    avatar_url: raw.profile?.avatar?.startsWith("http") ? raw.profile.avatar : `${API}${raw.profile?.avatar}`,
                    cover_url: raw.profile?.cover?.startsWith("http") ? raw.profile.cover : `${API}${raw.profile?.cover}`,
                    full_name: raw.profile?.full_name || raw.full_name || "",
                    bio: raw.profile?.bio || raw.bio || "",
                };
            }

            setUser(data);

            if (!isPageType) {
                const fs = raw.friendship_status;
                const rawStatus = typeof fs === 'object' ? fs?.status : fs;
                const sentByMe = typeof fs === 'object' ? fs?.sent_by_me : null;

                const statusMap = {
                    accepted: "friends",
                    pending: sentByMe ? "sent" : "received",
                    pending_sent: "sent",
                    pending_received: "received",
                    rejected: "none"
                };

                setFriendStatus(statusMap[rawStatus] || rawStatus || "none");
            }

            if (data?.id) loadPosts(data.id, data.type);

        } catch (e) {
            console.error(e);
            setUserError(e?.message || "Something went wrong");
        } finally {
            setUserLoading(false);
        }
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

            const token = localStorage.getItem('access');

            const response = await fetch(`${API}/api/pages/${user.id}/follow/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
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
    const handleReminderPageFollow = async (pageId) => {
        const prev = pageFollowStatus[pageId];
        setPageFollowStatus(s => ({ ...s, [pageId]: !prev }));
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/follow/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPageFollowStatus(s => ({ ...s, [pageId]: data.is_followed }));
            } else {
                setPageFollowStatus(s => ({ ...s, [pageId]: prev })); // rollback
            }
        } catch {
            setPageFollowStatus(s => ({ ...s, [pageId]: prev }));
        }
    };

    const handleReminderPageNotify = async (pageId) => {
        const prev = pageNotifyStatus[pageId];
        setPageNotifyStatus(s => ({ ...s, [pageId]: !prev })); // optimistic toggle
        try {
            const res = await fetch(`${API}/api/pages/${pageId}/notify/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPageNotifyStatus(s => ({ ...s, [pageId]: data.is_notified })); // ← fixed
            } else {
                setPageNotifyStatus(s => ({ ...s, [pageId]: prev })); // rollback
            }
        } catch {
            setPageNotifyStatus(s => ({ ...s, [pageId]: prev }));
        }
    };

    const handleReview = async (rating) => {
        setReviewRating(rating);
        try {
            const res = await fetch(`${API}/api/pages/${userId}/review/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ score: rating })
            });
        } catch (e) { console.error(e); }
    };

    const loadPageEvents = async () => {
        try {
            const res = await fetch(`${API}/api/events/?page=${userId}`, {
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
                    id: post.post_id || post.id,
                    content: post.content_text || post.content,
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
            const res = await fetch(`${API}/api/users/${userId}/friends/`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("access")}` }
            });
            if (!res.ok) { setFriends([]); return; }
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

    const loadPosts = async (id, type) => {
        try {
            const param = type === 'page' ? 'page' : 'user';
            const res = await fetch(`${API}/api/posts?${param}=${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            let data;
            try { data = await res.json(); } catch (err) {
                setPostsError("Invalid server response.");
                setPosts([]);
                setPostsLoading(false);
                return;
            }
            if (!res.ok) { setPostsError(data?.message || "Failed to load posts"); setPosts([]); return; }

            const normalized = (Array.isArray(data) ? data : []).map(p => ({
                ...p,
                id: p.id || p.post_id,
            }));
            setPosts(normalized);
        } catch (e) { setPostsError(e?.message || "Something went wrong"); setPosts([]); }
        finally { setPostsLoading(false); }
    };

    const isOwnProfile = currentUser?.id === Number(userId) ||
        currentUser?.page_id === Number(userId);
    const isPageUser = isOwnProfile && (
        userType === 'page' ||
        userType === 'university' ||
        user?.type === 'page' ||
        user?.role === 'university'
    );
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
        if (isOwn && user?.type === 'page') {
            loadOwnPageEvents();
        }
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
            const chatsRes = await fetch(`${API}/api/chats/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const chats = await chatsRes.json();

            const existing = chats.find(c =>
                !c.is_group && c.name === username
            );

            if (existing) {
                console.log("existing chat found:", existing?.id, existing?.name);
                navigate(`/chats/${existing.id}`);
                return;
            }

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
        : ProfilePicture;

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
                <div className={styles.mobileDrawerOverlay}>
                    <div className={styles.mobileDrawerBackdrop} onClick={() => setMobileMenuOpen(false)} />
                    <div
                        ref={mobileMenuRef}
                        className={styles.mobileDrawer}
                        onClick={e => e.stopPropagation()}
                    >
                        <button className={styles.mobileDrawerCloseBtn} onClick={() => setMobileMenuOpen(false)}>
                            <X size={16} color="white" />
                        </button>

                        <div className={styles.mobileDrawerHeader}>
                            <span className={styles.mobileDrawerTitle}>CAMPUS</span>
                        </div>

                        <div className={styles.mobileDrawerNav}>
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
                        {showCreateEvent ? (
                            <CreateEventForm
                                {...createEvent.formProps}
                                onBack={() => setShowCreateEvent(false)}
                            />
                        ) : isEditing ? (
                            <ProfileEditCard styles={styles} edit={edit} setIsEditing={setIsEditing} user={user} API={API} token={token} />
                        ) : isBlocked ? (
                            <div className={styles.profileCard}>
                                <div className={styles.coverWrap}>
                                    <div className={`${styles.coverPlaceholder} ${styles.blockedCoverPlaceholder}`} />
                                </div>
                                <div className={styles.profileHeaderRow}>
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatarCircle}>
                                            <img
                                                className={styles.avatarImage}
                                                src={avatarUrl || ProfilePicture}
                                                alt="avatar"
                                                onError={e => { e.currentTarget.src = ProfilePicture; }}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.profileMeta}>
                                        <div className={styles.nameRow}>
                                            <h2 className={styles.username} style={{ opacity: 0.5 }}>{username}</h2>
                                        </div>
                                        <div className={styles.blockedSubtitle} style={{ marginTop: 8, textAlign: "left" }}>
                                            You've blocked this user. Their content is hidden.
                                        </div>
                                    </div>
                                    <div className={styles.profileActions}>
                                        <button onClick={handleBlock} className={styles.unblockBtn}>
                                            Unblock
                                        </button>
                                    </div>
                                </div>
                                <div className={styles.hr} />
                                <div className={styles.blockedBody}>
                                    <Ban size={48} className={styles.blockedIcon} />
                                    <p className={styles.blockedTitle}>
                                        This profile is blocked
                                    </p>
                                    <p className={styles.blockedSubtitle}>
                                        Unblock to see their posts, photos, and other content.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.profileCard}>
                                <div className={styles.coverWrap}>
                                    {coverUrl ? <img className={styles.coverImage} src={coverUrl} alt="cover" /> : <div className={styles.coverPlaceholder} />}
                                    {!isOwnProfile && (
                                        <div ref={menuRef} className={styles.coverMenuWrap}>
                                            <button
                                                onClick={() => setMenuOpen(prev => !prev)}
                                                className={`${styles.messageBtn} ${styles.coverMenuBtn}`}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                            {menuOpen && (
                                                <div className={styles.coverDropdown}>
                                                    <button
                                                        onClick={() => { handleBlock(); setMenuOpen(false); }}
                                                        className={`${styles.coverDropdownItem} ${isBlocked ? styles.coverDropdownItemDanger : styles.coverDropdownItemNormal}`}
                                                    >
                                                        <Ban size={15} />
                                                        {isBlocked ? "Unblock user" : "Block user"}
                                                    </button>
                                                    <button
                                                        onClick={() => { setMenuOpen(false); /* handleReport() */ }}
                                                        className={`${styles.coverDropdownItem} ${styles.coverDropdownItemDanger}`}
                                                    >
                                                        <AlertCircle size={15} />
                                                        Report user
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                </div>

                                <div className={styles.profileHeaderRow}>
                                    <div className={styles.avatarWrap}>
                                        <div className={styles.avatarCircle}>
                                            <img
                                                className={styles.avatarImage}
                                                src={avatarUrl || ProfilePicture}
                                                alt="avatar"
                                                onError={e => { e.currentTarget.src = ProfilePicture; }}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.profileMeta}>
                                        {user?.type === 'page' ? (
                                            <>
                                                <div className={`${styles.nameRow} ${styles.pageNameRow}`}>
                                                    <h2 className={styles.username}>{username}</h2>
                                                    {user?.is_verified && (
                                                        <img
                                                            src={VerifiedBadge}
                                                            alt="verified"
                                                            className={styles.pageVerifiedBadge}
                                                        />
                                                    )}
                                                </div>
                                                <div className={`${styles.subRow} ${styles.pageFollowersMeta}`}>
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
                                                        <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                                                            <span className={styles.editText}>Edit</span>

                                                            <div
                                                                style={{
                                                                    width: '20px',
                                                                    height: '20px',
                                                                    backgroundColor: '#999999',
                                                                    maskImage: `url(${Edit})`,
                                                                    WebkitMaskImage: `url(${Edit})`,
                                                                    maskSize: 'contain',
                                                                    WebkitMaskSize: 'contain',
                                                                    maskRepeat: 'no-repeat',
                                                                    WebkitMaskRepeat: 'no-repeat',
                                                                    maskPosition: 'center',
                                                                    WebkitMaskPosition: 'center',
                                                                }}
                                                            />
                                                        </button>
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
                                                    {friendStatus === "received" && (
                                                        <div className={styles.friendRequestBtns}>
                                                            <button onClick={handleAccept} className={styles.acceptRequestBtn}>
                                                                <Check size={15} />
                                                                Accept
                                                            </button>
                                                            <button onClick={handleDecline} className={styles.declineRequestBtn}>
                                                                <X size={15} />
                                                                Reject
                                                            </button>
                                                        </div>
                                                    )}
                                                    {friendStatus === "friends" && <button className={styles.friendsBtn} onClick={() => setUnfriendPopup(true)}>Friends</button>}
                                                </>
                                            )}
                                        </div>
                                    )}
                                    {isOwnProfile && user?.type === 'page' && (
                                        <div className={styles.profileActions}>
                                            <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>
                                                <span className={styles.editText}>Edit</span>
                                                <div style={{
                                                    width: '20px', height: '20px',
                                                    backgroundColor: '#999999',
                                                    maskImage: `url(${Edit})`,
                                                    WebkitMaskImage: `url(${Edit})`,
                                                    maskSize: 'contain', WebkitMaskSize: 'contain',
                                                    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                    maskPosition: 'center', WebkitMaskPosition: 'center',
                                                }} />
                                            </button>
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
                                            <div key="Activities" ref={activitiesDropdownRef} className={styles.activitiesDropdownWrap}>
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
                                                    <div className={styles.activitiesDropdown}>
                                                        {[
                                                            { key: 'saves', icon: Save, label: 'Saves' },
                                                            { key: 'comments', icon: Comment, label: 'Comments' },
                                                            { key: 'likes', icon: Like, label: 'Likes' },
                                                        ].map(({ key, icon, label }) => (
                                                            <button
                                                                key={key}
                                                                onClick={() => { setActivitiesFilter(key); setActivitiesDropdownOpen(false); }}
                                                                className={styles.activitiesDropdownItem}
                                                                style={{
                                                                    background: activitiesFilter === key ? 'rgba(221, 219, 224, 0.11)' : 'transparent',
                                                                    color: activitiesFilter === key ? '#f0e7f8' : 'rgba(255,255,255,0.8)',
                                                                    fontWeight: activitiesFilter === key ? 600 : 400,
                                                                }}
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
                                        {postsLoading ? <div className={styles.notice}>Loading...</div> : posts.map(post => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                openComments={openComments}
                                                isOwnProfile={isOwnProfile}
                                                hasPinnedPost={posts.some(p => p.is_pinned)}
                                                onPinChange={handlePinChange}
                                            />
                                        ))}
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
                                                        <PostCard
                                                            key={post.id}
                                                            post={post}
                                                            openComments={openComments}
                                                            isOwnProfile={
                                                                currentUser?.id === (post.author?.id || post.author_id)
                                                            }
                                                        />
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
                                        <UserDetails user={user} hidePill darker />
                                    </div>
                                )}
                                {activeTab === 'Events' && (
                                    <div className={styles.postsSection}>
                                        {pageEvents.length > 0 ? pageEvents.map(event => (
                                            <div key={event.id} className={styles.eventCard}>
                                                {event.banner && (
                                                    <img src={event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`}
                                                        alt="" className={styles.eventCardBanner} />
                                                )}
                                                <div className={styles.eventCardBody}>
                                                    <div className={styles.eventCardTitle}>{event.title}</div>
                                                    {event.start_date && (
                                                        <div className={styles.eventCardDate}>
                                                            {event.start_date} {event.end_date ? `→ ${event.end_date}` : ""}
                                                        </div>
                                                    )}
                                                    {event.description && (
                                                        <p className={styles.eventCardDesc}>
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

                        {showCreateEvent ?
                            <CreateEventRightSidebar {...createEvent.sidebarProps} />
                            : isOwnProfile && isPageUser ? (
                                <>
                                    <div className={styles.yourEventsWidgetWrap}>
                                        <div className={styles.yourEventsPill}>
                                            <p>YOUR EVENTS</p>
                                        </div>

                                        <div className={styles.yourEventsWrapper}>
                                            <div className={styles.yourEventsHeader}>
                                                <div className={styles.eventsIconColored} />
                                                <span className={styles.yourEventsTitle}>
                                                    Upcoming Events of <span className={styles.uppercaseText}>YOURS</span>
                                                </span>
                                            </div>

                                            <div className={styles.eventsDivider} />

                                            <div className={styles.eventCardContainer}>
                                                {ownPageEvents.length > 0 ? (() => {
                                                    const next = ownPageEvents[0];
                                                    const bannerUrl = next.image?.startsWith('http') ? next.image : `${API}${next.image}`;
                                                    const formatDate = (d) => {
                                                        if (!d) return '';
                                                        const dt = new Date(d);
                                                        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
                                                    };
                                                    const formatTime = (d) => {
                                                        if (!d) return '';
                                                        const dt = new Date(d);
                                                        let h = dt.getHours(), m = dt.getMinutes();
                                                        const period = h >= 12 ? 'PM' : 'AM';
                                                        h = h % 12 || 12;
                                                        return `${h}:${String(m).padStart(2, '0')} ${period}`;
                                                    };
                                                    return (
                                                        <div
                                                            className={styles.eventCardBg}
                                                            style={{ backgroundImage: `url(${bannerUrl})` }}
                                                        >
                                                            <div className={styles.eventTimeBox}>
                                                                Starts {formatDate(next.start_date)} - {formatTime(next.start_date)}<br />
                                                                Ends - {formatDate(next.end_date)} - {formatTime(next.end_date)}
                                                            </div>
                                                            <div className={styles.eventDetailsBottom}>
                                                                <div className={styles.eventTextContent}>
                                                                    <div className={styles.eventTitle}>{next.title}</div>
                                                                    <div className={styles.eventDescWrapper}>
                                                                        <span className={styles.eventDesc}>{next.description}</span>
                                                                        {next.description?.length > 80 && (
                                                                            <span className={styles.readMoreText}>read more</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })() : (
                                                    <div style={{ color: 'rgba(255,255,255,0.4)', padding: '20px', textAlign: 'center', fontSize: '0.85rem' }}>
                                                        No upcoming events yet.
                                                    </div>
                                                )}
                                            </div>

                                            <div className={styles.eventsDivider} />

                                            <div className={styles.eventsActionRow}>
                                                <button className={styles.manageEventsBtn} onClick={() => setShowManageEvents(true)} >Manage Events</button>
                                                <button className={styles.createEventBtn} onClick={() => setShowCreateEvent(true)} >Create</button>
                                            </div>
                                        </div>
                                    </div>


                                    <div className={styles.promotionsContainer}>
                                        <div className={styles.promoHeaderRow}>
                                            <div className={styles.promoIconColored} />
                                            <span className={styles.promoTitle}>Promotions</span>
                                        </div>

                                        <div className={styles.promoContentRow}>
                                            <p className={styles.promoDesc}>
                                                Track, manage, and review your active promotions and history.
                                            </p>
                                            <button className={styles.promoManageBtn}>Manage</button>
                                        </div>
                                    </div>
                                </>
                            ) : isOwnProfile && user?.role === 'instructor' ? (
                                <>
                                    <FriendsSuggestion />
                                    <div className={styles.remindersWidgetInstructor}>
                                        <div className={styles.remindersWidgetHeader}>
                                            <img src={Events} alt="events" className={styles.remindersWidgetIcon} />
                                            <span className={styles.remindersWidgetTitle}>
                                                Reminders set
                                            </span>
                                            <span
                                                onClick={() => setShowRemindersMonthPicker(p => !p)}
                                                className={styles.remindersMonthToggle}
                                            >
                                                {remindersMonth.toLocaleString('default', { month: 'long' })} {remindersMonth.getFullYear()}
                                            </span>
                                        </div>

                                        <div className={styles.remindersDivider} />

                                        {(() => {
                                            const upcoming = reminders
                                                .map(e => ({ ...e, _d: new Date(e.start_date || e.date || e.event_date) }))
                                                .filter(e => e._d >= new Date())
                                                .sort((a, b) => a._d - b._d);
                                            const next = upcoming[0];
                                            const daysLeft = next ? Math.ceil((next._d - new Date()) / 86400000) : null;
                                            return (
                                                <div className={styles.remindersNextRow}>
                                                    <div className={styles.remindersNextLeft}>
                                                        <span className={styles.remindersNextLabel}>
                                                            {daysLeft !== null ? `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : 'No upcoming events'}
                                                        </span>
                                                        {next && (
                                                            <span className={styles.remindersNextTitle}>
                                                                Upcoming event on {next._d.getDate()}{['st', 'nd', 'rd'][((next._d.getDate() + 90) % 100 - 10) % 10 - 1] || 'th'}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {next && (
                                                        <div className={styles.remindersNextRight}>
                                                            <div className={styles.remindersAvatarStack}>
                                                                {upcoming.slice(0, 3).map((event, i) => {
                                                                    const avatar = event.page?.avatar || event.host?.avatar;
                                                                    return avatar ? (
                                                                        <img
                                                                            key={event.id}
                                                                            src={resolveUrl(avatar)}
                                                                            alt=""
                                                                            className={`${styles.remindersStackAvatar} ${styles[`avatarStackIndex${i}`]}`}
                                                                        />
                                                                    ) : (
                                                                        <div
                                                                            key={event.id || i}
                                                                            className={`${styles.remindersStackPlaceholder} ${styles[`avatarStackIndex${i}`]}`}
                                                                        >
                                                                            <User size={18} className={styles.placeholderUserIcon} />
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                            <img
                                                                src={ArrowRight}
                                                                alt=""
                                                                onClick={() => navigate('/events', { state: { highlightId: next.id } })}
                                                                className={styles.remindersArrow}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })()}
                                    </div>

                                    <div className={styles.picksWidgetWrap}>
                                        <div className={styles.picksWidgetHeader}>
                                            <img src={Community} alt="" className={styles.picksWidgetIcon} />
                                            <span className={styles.picksWidgetTitle}>
                                                Your Picks
                                            </span>
                                            <div className={styles.picksWidgetMeta}>
                                                <span className={styles.picksWidgetCount}>
                                                    {(user?.community_picks || []).length}/3
                                                </span>
                                                <button
                                                    onClick={async () => {
                                                        setModalPicks(user?.community_picks || []);
                                                        setShowPicksModal(true);
                                                        setPicksLoading(true);
                                                        try {
                                                            const res = await fetch(`${API}/api/communities/?filter=joined`, {
                                                                headers: { Authorization: `Bearer ${token}` }
                                                            });
                                                            if (res.ok) {
                                                                const data = await res.json();
                                                                setJoinedCommunities(data.map(c => ({ ...c, bgImage: c.image })));
                                                            }
                                                        } catch (e) { console.error(e); }
                                                        finally { setPicksLoading(false); }
                                                    }}
                                                    className={styles.picksManageBtn}
                                                >
                                                    Manage
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : isOwnProfile ? (
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
                                            <div className={styles.calendarWidget}>
                                                <div className={styles.calendarWidgetHeader}>
                                                    <img src={Events} alt="events" className={styles.calendarWidgetIcon} />
                                                    <span className={styles.calendarWidgetTitle}>
                                                        Reminders set
                                                    </span>
                                                    <span
                                                        onClick={() => setShowRemindersMonthPicker(p => !p)}
                                                        className={styles.remindersMonthToggle}
                                                    >
                                                        {monthName} {year}
                                                    </span>
                                                </div>
                                                {showRemindersMonthPicker && (
                                                    <div className={styles.monthPickerDropdown}>
                                                        <div className={styles.monthPickerNav}>
                                                            <button
                                                                onClick={() => setRemindersMonth(new Date(year - 1, month, 1))}
                                                                disabled={year <= 2026}
                                                                className={styles.monthPickerNavBtn}
                                                            >‹</button>
                                                            <span className={styles.monthPickerYear}>{year}</span>
                                                            <button
                                                                onClick={() => setRemindersMonth(new Date(year + 1, month, 1))}
                                                                disabled={year >= new Date().getFullYear() + 2}
                                                                className={styles.monthPickerNavBtn}
                                                            >›</button>
                                                        </div>
                                                        <div className={styles.monthGrid}>
                                                            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                                                                const isSelected = i === month;
                                                                return (
                                                                    <button
                                                                        key={m}
                                                                        onClick={() => { setRemindersMonth(new Date(year, i, 1)); setShowRemindersMonthPicker(false); }}
                                                                        className={`${styles.monthBtn} ${isSelected ? styles.monthBtnActive : styles.monthBtnInactive}`}
                                                                    >{m}</button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className={styles.calendarGrid}>
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
                                                                className={`${styles.calendarDay} ${!day ? styles.calendarDayEmpty : (hasEvent ? styles.calendarDayEvent : styles.calendarDayNormal)}`}
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
                                        <div className={styles.reviewWidget}>
                                            <div className={styles.reviewWidgetHeader}>
                                                <div style={{
                                                    width: '35px', height: '35px',
                                                    backgroundColor: '#A6279C',
                                                    maskImage: `url(${Star})`,
                                                    WebkitMaskImage: `url(${Star})`,
                                                    maskSize: 'contain', WebkitMaskSize: 'contain',
                                                    maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                    maskPosition: 'center', WebkitMaskPosition: 'center',
                                                    flexShrink: 0,
                                                }} />
                                                <span className={styles.reviewWidgetTitle}>Add a Review</span>
                                            </div>

                                            <div className={styles.reviewStarsRow}>
                                                {[1, 2, 3, 4, 5].map(star => {
                                                    const isActive = star <= (hoverRating || reviewRating);
                                                    return (
                                                        <button
                                                            key={star}
                                                            onMouseEnter={() => setHoverRating(star)}
                                                            onMouseLeave={() => setHoverRating(0)}
                                                            onClick={() => handleReview(star)}
                                                            className={styles.reviewStarBtn}
                                                        >
                                                            <div style={{
                                                                width: '2.3rem', height: '2.3rem',
                                                                backgroundColor: isActive ? '#B8B8B8' : '#575757',
                                                                maskImage: `url(${Star})`,
                                                                WebkitMaskImage: `url(${Star})`,
                                                                maskSize: 'contain', WebkitMaskSize: 'contain',
                                                                maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat',
                                                                maskPosition: 'center', WebkitMaskPosition: 'center',
                                                                transition: 'background-color 0.15s',
                                                            }} />
                                                        </button>
                                                    );
                                                })}
                                            </div>


                                        </div>
                                    )}
                                    {communityPicks.length > 0 && (
                                        <>
                                            <div className={styles.picksCard}>
                                                <div className={styles.picksHeader}>
                                                    <div style={{
                                                        width: '40px',
                                                        height: '40px',
                                                        backgroundColor: '#A6279C',
                                                        maskImage: `url(${Community})`,
                                                        WebkitMaskImage: `url(${Community})`,
                                                        maskSize: 'contain',
                                                        WebkitMaskSize: 'contain',
                                                        maskRepeat: 'no-repeat',
                                                        WebkitMaskRepeat: 'no-repeat',
                                                        maskPosition: 'center',
                                                        WebkitMaskPosition: 'center',
                                                        flexShrink: 0,
                                                    }} />
                                                    <span className={styles.picksTitle}>{user?.username?.split(' ')[0]}'s Picks</span>
                                                </div>
                                                <div className={styles.picksSlideWrapper}>
                                                    {communityPicks[picksSlide] && (() => {
                                                        const pick = communityPicks[picksSlide];
                                                        return (
                                                            <div className={styles.pickItemCard}>
                                                                <img src={pick.image} alt={pick.name} className={styles.pickItemImageBg} />
                                                                <div className={styles.pickOverlay}>
                                                                    <div className={styles.pickContentTop}>
                                                                        <div className={styles.pickTitleGroup}>
                                                                            <h2 className={styles.pickName}>{pick.name}</h2>
                                                                            {pick.is_verified && <img src={VerifiedBadge} alt="Verified" width={18} height={18} className={styles.verifiedBadgeIcon} />}
                                                                        </div>
                                                                        <button className={styles.pickViewBtn} onClick={() => navigate(`/communities/${pick.id}`)}>view</button>
                                                                    </div>
                                                                    <div className={styles.pickContentBottom}>
                                                                        <p className={styles.pickDescription}>{pick.description}</p>
                                                                        {pick.description?.length > 80 && (
                                                                            <button className={styles.readMore} onClick={() => setPicksPopup(pick)}>read more</button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>



                                            </div>
                                            <div className={styles.paginationRow}>
                                                <button
                                                    className={styles.navArrow}
                                                    onClick={() => setPicksSlide(prev => Math.max(0, prev - 1))}
                                                    disabled={picksSlide === 0}
                                                >
                                                    <img
                                                        src={ArrowLeft}
                                                        alt="prev"
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            opacity: picksSlide === 0 ? 0.3 : 1,
                                                            filter: 'invert(1)',
                                                        }}
                                                    />
                                                </button>
                                                <div className={styles.picksDots}>
                                                    {communityPicks.map((_, i) => (
                                                        <button
                                                            key={i}
                                                            className={`${styles.picksDot} ${i === picksSlide ? styles.picksDotActive : ''}`}
                                                            onClick={() => setPicksSlide(i)}
                                                        />
                                                    ))}
                                                </div>
                                                <button
                                                    className={styles.navArrow}
                                                    onClick={() => setPicksSlide(prev => Math.min(communityPicks.length - 1, prev + 1))}
                                                    disabled={picksSlide === communityPicks.length - 1}
                                                >
                                                    <img
                                                        src={ArrowRight}
                                                        alt="next"
                                                        style={{
                                                            width: '18px',
                                                            height: '18px',
                                                            opacity: picksSlide === communityPicks.length - 1 ? 0.3 : 1,
                                                            filter: 'invert(1)',
                                                        }}
                                                    />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                    {picksPopup && createPortal(
                                        <div className={styles.picksPopupOverlay} onClick={() => setPicksPopup(null)}>
                                            <div className={styles.picksPopupBox} onClick={e => e.stopPropagation()}>
                                                <button onClick={() => setPicksPopup(null)} className={styles.picksPopupCloseBtn}>✕</button>
                                                <h3 className={styles.picksPopupTitle}>{picksPopup.name}</h3>
                                                <p className={styles.picksPopupDesc}>{picksPopup.description}</p>
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
                <div className={styles.mobileWrapper}>
                    <div className={styles.mobileGradientWrap}>
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
                    className={styles.remindersPopupOverlay}
                    onClick={() => { setRemindersPopup(null); setEventMenuOpen(null); }}
                >
                    <div
                        className={`${styles.popupScrollContainer} ${styles.remindersPopupBox}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.remindersPopupHeader}>
                            <img src={Events} alt="events" className={styles.remindersPopupHeaderIcon} />
                            <h3 className={styles.remindersPopupTitle}>
                                Events on {remindersPopup.monthName} {remindersPopup.day}{[1, 21, 31].includes(remindersPopup.day) ? 'st' : [2, 22].includes(remindersPopup.day) ? 'nd' : [3, 23].includes(remindersPopup.day) ? 'rd' : 'th'}
                            </h3>
                            <button
                                onClick={() => setRemindersPopup(null)}
                                className={styles.remindersPopupCancelBtn}
                            >
                                Cancel
                            </button>
                        </div>
                        <div className={styles.remindersPopupDivider} />


                        <div className={styles.remindersEventList}>
                            {remindersPopup.events.map((event, index) => (
                                <div key={event.id}>

                                    {index > 0 && (
                                        <div className={styles.remindersEventSeparator} />
                                    )}

                                    {/* Host row */}
                                    <div className={styles.remindersHostRow}>
                                        {event.page?.avatar || event.host?.avatar
                                            ? <img src={(event.page?.avatar || event.host?.avatar).startsWith("http") ? (event.page?.avatar || event.host?.avatar) : `${API}${event.page?.avatar || event.host?.avatar}`}
                                                alt="" className={styles.remindersHostAvatar} />
                                            : <div className={styles.remindersHostAvatarPlaceholder}><User size={20} color="rgba(255,255,255,0.4)" /></div>
                                        }
                                        <div className={styles.remindersHostMeta}>
                                            <div className={styles.remindersHostNameRow}>
                                                <span className={styles.remindersHostName}>
                                                    {event.page?.name || event.host?.name || event.host?.username || "Unknown Host"}
                                                </span>
                                                {(event.page?.is_verified || event.host?.is_verified) && (
                                                    <img src={VerifiedBadge} alt="verified" className={styles.remindersHostVerified} />
                                                )}
                                            </div>
                                            {(event.page?.description || event.host?.bio) && (
                                                <span className={styles.remindersHostBio}>
                                                    {event.page?.description || event.host?.bio}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => {
                                                const pid = event.page?.page_id ?? event.page?.id;
                                                pid && handleReminderPageNotify(pid);
                                            }}
                                            className={styles.remindersBellWrap}
                                            title={pageNotifyStatus[event.page?.page_id ?? event.page?.id] ? 'Mute notifications' : 'Enable notifications'}
                                        >
                                            <img
                                                src={pageNotifyStatus[event.page?.page_id ?? event.page?.id] ? BellOn : BellOff}
                                                alt="notifications"
                                                width={pageNotifyStatus[event.page?.page_id ?? event.page?.id] ? 17 : 20}
                                                height={pageNotifyStatus[event.page?.page_id ?? event.page?.id] ? 20 : 20}
                                                style={{ filter: 'brightness(0) saturate(100%) invert(85%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)' }}
                                            />
                                        </button>
                                        <button
                                            onClick={() => {
                                                const pid = event.page?.page_id ?? event.page?.id;
                                                pid && handleReminderPageFollow(pid);
                                            }}
                                            className={pageFollowStatus[event.page?.page_id ?? event.page?.id] ? styles.remindersFollowedBtn : styles.remindersFollowBtn}
                                        >
                                            {pageFollowStatus[event.page?.page_id ?? event.page?.id] ? 'Followed' : 'Follow'}
                                        </button>
                                    </div>


                                    <div className={styles.remindersEventCard}>

                                        {event.banner
                                            ? <img src={event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`} alt="" className={styles.remindersEventBanner} />
                                            : <div className={styles.remindersEventBannerPlaceholder} />
                                        }

                                        {/* Dark gradient overlay covering the card to ensure text is visible */}
                                        <div className={styles.remindersEventGradient} />

                                        {/* 3-dot menu floating at top right */}
                                        <div className={styles.eventCardMenuWrap}>
                                            <button
                                                onClick={e => { e.stopPropagation(); setEventMenuOpen(eventMenuOpen === event.id ? null : event.id); }}
                                                className={styles.eventCardMenuBtn}
                                            >
                                                <MoreHorizontal size={30} strokeWidth={3} />
                                            </button>
                                            {eventMenuOpen === event.id && (
                                                <div
                                                    className={styles.eventCardDropdown}
                                                    onClick={e => e.stopPropagation()}
                                                >
                                                    {/* Share event */}
                                                    <button className={styles.eventCardDropdownItem}>
                                                        <img src={Share} alt="share" width={14} height={14} className={`${styles.eventCardDropdownIcon} ${styles.eventCardDropdownIconNormal}`} />
                                                        <span style={{ color: "#CCCCCC" }}>Share event</span>
                                                    </button>

                                                    {/* Divider */}
                                                    <div className={styles.eventCardDropdownDivider}>
                                                        <div className={styles.eventCardDropdownDividerLine} />
                                                    </div>

                                                    {/* Delete event */}
                                                    <button className={styles.eventCardDropdownItem}>
                                                        <img src={Bin} alt="delete" width={14} height={14} className={`${styles.eventCardDropdownIcon} ${styles.eventCardDropdownIconDanger}`} />
                                                        <span style={{ color: "#e84d70" }}>Delete event</span>
                                                    </button>

                                                    {/* Divider */}
                                                    <div className={styles.eventCardDropdownDivider}>
                                                        <div className={styles.eventCardDropdownDividerLine} />
                                                    </div>

                                                    {/* Report event */}
                                                    <button className={styles.eventCardDropdownItem}>
                                                        <img src={Info} alt="report" width={14} height={14} className={`${styles.eventCardDropdownIcon} ${styles.eventCardDropdownIconDanger}`} />
                                                        <span style={{ color: "#e84d70" }}>Report event</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Content at the bottom */}
                                        <div className={styles.remindersEventContent}>
                                            {/* Left: title + desc + read more */}
                                            <div className={styles.remindersEventLeft}>

                                                {/* New Marquee Logic for Title */}
                                                {event.title?.length > 20 ? (
                                                    <div className={styles.titleMarqueeWrapper}>
                                                        {/* Overriding the 2.2rem from your CSS to fit this card's 1.05rem scale */}
                                                        <span className={styles.titleMarquee} style={{ fontSize: "1.05rem" }}>
                                                            {event.title}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className={styles.remindersEventTitle}>
                                                        {event.title}
                                                    </span>
                                                )}

                                                {event.description && (
                                                    <p className={styles.remindersEventDesc}>
                                                        {event.description}
                                                    </p>
                                                )}
                                                {event.description?.length > 80 && (
                                                    <button className={styles.remindersEventReadMore}>
                                                        read more
                                                    </button>
                                                )}
                                            </div>

                                            {(event.start_date || event.location) && (
                                                <div className={styles.remindersInfoBox}>
                                                    <span className={styles.remindersInfoLabel}>Information</span>
                                                    {event.start_date && (
                                                        <div className={styles.remindersInfoRow}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6823A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                                                            <span className={styles.remindersInfoText}>
                                                                {new Date(event.start_date) <= new Date()
                                                                    ? "Happening Now!"
                                                                    : `The event starts in ${Math.ceil((new Date(event.start_date) - new Date()) / 3600000)} hours`}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {event.location && (
                                                        <div className={styles.remindersInfoRow}>
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6823A3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                                                            <span className={styles.remindersInfoText}>{event.location}</span>
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
            {unfriendPopup && createPortal(
                <div
                    className={styles.unfriendOverlay}
                    onClick={() => setUnfriendPopup(false)}
                >
                    <div
                        className={styles.unfriendModal}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setUnfriendPopup(false)} className={styles.unfriendCloseBtn}>
                            <X size={15} />
                        </button>

                        <div className={styles.unfriendUserRow}>
                            <img
                                src={avatarUrl || ProfilePicture}
                                alt=""
                                className={styles.unfriendAvatar}
                            />
                            <div>
                                <div className={styles.unfriendUsername}>{username}</div>
                                <div className={styles.unfriendFriendsCount}>
                                    {user?.friends_count || 0} friends
                                </div>
                            </div>
                        </div>

                        <div className={styles.unfriendWarning}>
                            <p className={styles.unfriendWarningText}>
                                Are you sure you want to unfriend <strong className={styles.unfriendWarningName}>{username}</strong>? You'll have to send a new friend request if you change your mind.
                            </p>
                        </div>

                        <div className={styles.unfriendActions}>
                            <button
                                onClick={() => setUnfriendPopup(false)}
                                className={styles.unfriendCancelBtn}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    await handleUnfriend();
                                    setUnfriendPopup(false);
                                }}
                                className={styles.unfriendConfirmBtn}
                            >
                                Yes, Unfriend
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {showPicksModal && createPortal(
                <div
                    className={styles.picksModalOverlay}
                    onClick={() => setShowPicksModal(false)}
                >
                    <div
                        className={styles.picksModalBox}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={styles.picksModalHeader}>
                            <div>
                                <h2 className={styles.picksModalHeading}>
                                    Community Picks
                                </h2>
                                <p className={styles.picksModalSubtext}>
                                    Select up to 3 communities to feature on your profile
                                </p>
                            </div>
                            <div className={styles.picksModalHeaderRight}>
                                <span className={styles.picksModalCount}>
                                    {(modalPicks).length}/3
                                </span>
                                <button
                                    onClick={() => setShowPicksModal(false)}
                                    className={styles.picksModalCloseBtn}
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* List */}
                        <div className={styles.picksModalList}>
                            {picksLoading ? (
                                <p className={styles.picksModalEmptyText}>Loading...</p>
                            ) : joinedCommunities.length === 0 ? (
                                <p className={styles.picksModalEmptyText}>
                                    You haven't joined any communities yet.
                                </p>
                            ) : joinedCommunities.map(community => {
                                const isPicked = modalPicks.some(p => p.id === community.id);
                                const atLimit = modalPicks.length >= 3;

                                return (
                                    <div key={community.id} style={{ position: 'relative' }}>
                                        {/* CommunityCard with Pick button overlay */}
                                        <div
                                            className={`${styles.picksModalCommunityCard} ${isPicked ? styles.picksModalCommunityCardPicked : styles.picksModalCommunityCardUnpicked}`}
                                            style={{ backgroundImage: `linear-gradient(to right, rgba(25,25,25,0.95) 10%, rgba(25,25,25,0.7) 40%, rgba(25,25,25,0.2) 100%), url(${community.image})` }}
                                        >
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <h3 className={styles.picksModalCommunityName}>
                                                    {community.name}
                                                </h3>
                                                <p className={styles.picksModalCommunityDesc}>
                                                    {community.description || 'No description available.'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (isPicked) {
                                                        setModalPicks(prev => prev.filter(c => c.id !== community.id));
                                                    } else {
                                                        if (modalPicks.length >= 3) return;
                                                        setModalPicks(prev => [...prev, community]);
                                                    }
                                                }}
                                                disabled={!isPicked && atLimit}
                                                className={`${styles.picksModalPickBtn} ${isPicked ? styles.picksModalPickBtnPicked : (!isPicked && atLimit ? styles.picksModalPickBtnDisabled : styles.picksModalPickBtnNormal)}`}
                                            >
                                                {isPicked ? 'Unpick' : 'Pick'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                , document.body)}

            {showManageEvents && createPortal(
                <div className={styles.manageModalOverlay} onClick={() => setShowManageEvents(false)}>
                    <div className={styles.manageModalBox} onClick={e => e.stopPropagation()}>

                        <div className={styles.manageModalHeader}>
                            <button className={styles.manageModalBackBtn} onClick={() => setShowManageEvents(false)}>
                                <img src={ArrowLeft} alt="back" className={styles.iconSmallBack} />
                            </button>
                            <div className={styles.manageHeaderTitleGroup}>
                                <img src={Events} alt="events" className={styles.iconBigEvents} />
                                <h2 className={styles.manageModalTitle}>Event Management</h2>
                            </div>
                        </div>

                        <div className={styles.manageModalDivider} />

                        <div className={styles.manageTabsContainer}>
                            <button
                                className={`${styles.manageTabBtn} ${activeEventTab === 'upcoming' ? styles.manageTabActive : ''}`}
                                onClick={() => setActiveEventTab('upcoming')}
                            >
                                Upcoming
                            </button>
                            <div className={styles.manageVerticalLine} />
                            <button
                                className={`${styles.manageTabBtn} ${activeEventTab === 'history' ? styles.manageTabActive : ''}`}
                                onClick={() => setActiveEventTab('history')}
                            >
                                History
                            </button>
                        </div>

                        <div className={styles.manageContentBody}>
                            <div className={styles.manageEventsHeaderRow}>
                                <h3 className={styles.manageEventsMonth}>
                                    Events of <strong>{manageEventsDate.toLocaleString('default', { month: 'long' }).toUpperCase()}</strong>
                                </h3>
                                <div className={styles.manageMonthPickerWrapper}>
                                    <button
                                        onClick={() => setShowManageMonthPicker(p => !p)}
                                        className={styles.manageMonthToggle}
                                    >
                                        {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()} ▾
                                    </button>
                                    {showManageMonthPicker && (
                                        <div className={styles.manageMonthDropdown}>
                                            <div className={styles.manageMonthNav}>
                                                <button
                                                    onClick={() => setManageEventsDate(new Date(manageEventsDate.getFullYear() - 1, manageEventsDate.getMonth(), 1))}
                                                    className={styles.manageMonthNavBtn}
                                                    disabled={manageEventsDate.getFullYear() <= new Date().getFullYear()}
                                                >‹</button>
                                                <span className={styles.manageMonthYear}>{manageEventsDate.getFullYear()}</span>
                                                <button
                                                    onClick={() => setManageEventsDate(new Date(manageEventsDate.getFullYear() + 1, manageEventsDate.getMonth(), 1))}
                                                    className={styles.manageMonthNavBtn}
                                                    disabled={manageEventsDate.getFullYear() >= new Date().getFullYear() + 2}
                                                >›</button>
                                            </div>
                                            <div className={styles.manageMonthGrid}>
                                                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => {
                                                    const isSelected = i === manageEventsDate.getMonth();
                                                    return (
                                                        <button
                                                            key={m}
                                                            onClick={() => { setManageEventsDate(new Date(manageEventsDate.getFullYear(), i, 1)); setShowManageMonthPicker(false); }}
                                                            className={`${styles.manageMonthBtn} ${isSelected ? styles.manageMonthBtnActive : styles.manageMonthBtnInactive}`}
                                                        >{m}</button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className={styles.manageScrollArea}>
                                {(() => {
                                    const now = new Date();
                                    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                                    const allFiltered = ownPageEvents.filter(e => {
                                        const d = new Date(e.start_date);
                                        return d.getFullYear() === manageEventsDate.getFullYear() &&
                                            d.getMonth() === manageEventsDate.getMonth();
                                    });

                                    const filteredEvents = allFiltered.filter(e => {
                                        const eventDay = new Date(new Date(e.start_date).getFullYear(), new Date(e.start_date).getMonth(), new Date(e.start_date).getDate());
                                        return activeEventTab === 'upcoming'
                                            ? eventDay >= today
                                            : eventDay < today;
                                    });

                                    if (filteredEvents.length === 0) {
                                        return <p className={styles.noEventsText}>
                                            No {activeEventTab} events for {manageEventsDate.toLocaleString('default', { month: 'long' })} {manageEventsDate.getFullYear()}.
                                        </p>;
                                    }

                                    const formatDate = (d) => {
                                        if (!d) return '';
                                        const dt = new Date(d);
                                        return `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;
                                    };
                                    const formatTime = (d) => {
                                        if (!d) return '';
                                        const dt = new Date(d);
                                        let h = dt.getHours(), m = dt.getMinutes();
                                        const period = h >= 12 ? 'PM' : 'AM';
                                        h = h % 12 || 12;
                                        return `${h}:${String(m).padStart(2, '0')} ${period}`;
                                    };
                                    // Convert datetime-local input value to ISO
                                    const toInputVal = (iso) => {
                                        if (!iso) return '';
                                        const d = new Date(iso);
                                        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                                    };

                                    return filteredEvents.map((event, index) => {
                                        const eventDay = new Date(new Date(event.start_date).getFullYear(), new Date(event.start_date).getMonth(), new Date(event.start_date).getDate());
                                        const isToday = eventDay.getTime() === today.getTime();
                                        const isEditing = editingEventId === event.id;

                                        return (
                                            <div key={event.id || index} className={styles.manageEventItemBlock}>
                                                <div className={styles.manageEventItem}>
                                                    <div className={styles.eventCardContainer}>
                                                        <div
                                                            className={styles.eventCardBg}
                                                            style={{ backgroundImage: `url(${event.image?.startsWith('http') ? event.image : `${API}${event.image}`})` }}
                                                        >
                                                            <div className={styles.eventTimeBox}>
                                                                Starts {formatDate(event.start_date)} - {formatTime(event.start_date)}<br />
                                                                Ends - {formatDate(event.end_date)} - {formatTime(event.end_date)}
                                                            </div>
                                                            <div className={styles.eventDetailsBottom}>
                                                                <div className={styles.eventTextContent}>
                                                                    <div className={styles.eventTitle}>{event.title}</div>
                                                                    <div className={styles.eventDescWrapper}>
                                                                        <span className={styles.eventDesc}>{event.description}</span>
                                                                        {event.description?.length > 80 && (
                                                                            <span className={styles.readMoreText}>read more</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* ── Inline Edit Form ── */}
                                                    {isEditing && (
                                                        <div className={styles.manageEditForm}>
                                                            {/* Title */}
                                                            <input
                                                                className={styles.manageEditInput}
                                                                placeholder="Event title"
                                                                value={editEventData.title}
                                                                onChange={e => setEditEventData(p => ({ ...p, title: e.target.value }))}
                                                            />
                                                            {/* Description */}
                                                            <textarea
                                                                className={styles.manageEditTextarea}
                                                                placeholder="Description"
                                                                value={editEventData.description}
                                                                onChange={e => setEditEventData(p => ({ ...p, description: e.target.value }))}
                                                            />

                                                            {/* Start */}
                                                            <span className={styles.manageEditSectionLabel}>Start time</span>
                                                            <div className={styles.manageEditSegmentRow}>
                                                                <input type="text" inputMode="numeric" placeholder="DD" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.startDay}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 31) setEditEventData(p => ({ ...p, startDay: v })); }}
                                                                />
                                                                <span className={styles.manageEditSep}>/</span>
                                                                <input type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.startMonth}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 12) setEditEventData(p => ({ ...p, startMonth: v })); }}
                                                                />
                                                                <span className={styles.manageEditSep}>/</span>
                                                                <input type="text" inputMode="numeric" placeholder="YYYY" maxLength="4"
                                                                    className={styles.manageEditSegmentYear}
                                                                    value={editEventData.startYear}
                                                                    onChange={e => setEditEventData(p => ({ ...p, startYear: e.target.value.replace(/\D/g, '') }))}
                                                                />
                                                                <span className={styles.manageEditSep}>at</span>
                                                                <input type="text" inputMode="numeric" placeholder="HH" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.startHour}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 12) setEditEventData(p => ({ ...p, startHour: v })); }}
                                                                />
                                                                <span className={styles.manageEditSep}>:</span>
                                                                <input type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.startMinute}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 59) setEditEventData(p => ({ ...p, startMinute: v })); }}
                                                                />
                                                                <div className={styles.manageEditAmPm}>
                                                                    {['AM', 'PM'].map(p => (
                                                                        <button key={p}
                                                                            className={`${styles.manageEditAmPmBtn} ${editEventData.startPeriod === p ? styles.manageEditAmPmActive : ''}`}
                                                                            onClick={() => setEditEventData(prev => ({ ...prev, startPeriod: p }))}
                                                                        >{p}</button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* End */}
                                                            <span className={styles.manageEditSectionLabel}>End time</span>
                                                            <div className={styles.manageEditSegmentRow}>
                                                                <input type="text" inputMode="numeric" placeholder="DD" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.endDay}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 31) setEditEventData(p => ({ ...p, endDay: v })); }}
                                                                />
                                                                <span className={styles.manageEditSep}>/</span>
                                                                <input type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.endMonth}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 12) setEditEventData(p => ({ ...p, endMonth: v })); }}
                                                                />
                                                                <span className={styles.manageEditSep}>/</span>
                                                                <input type="text" inputMode="numeric" placeholder="YYYY" maxLength="4"
                                                                    className={styles.manageEditSegmentYear}
                                                                    value={editEventData.endYear}
                                                                    onChange={e => setEditEventData(p => ({ ...p, endYear: e.target.value.replace(/\D/g, '') }))}
                                                                />
                                                                <span className={styles.manageEditSep}>at</span>
                                                                <input type="text" inputMode="numeric" placeholder="HH" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.endHour}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 12) setEditEventData(p => ({ ...p, endHour: v })); }}
                                                                />
                                                                <span className={styles.manageEditSep}>:</span>
                                                                <input type="text" inputMode="numeric" placeholder="MM" maxLength="2"
                                                                    className={styles.manageEditSegment}
                                                                    value={editEventData.endMinute}
                                                                    onChange={e => { const v = e.target.value.replace(/\D/g, ''); if (v === '' || +v <= 59) setEditEventData(p => ({ ...p, endMinute: v })); }}
                                                                />
                                                                <div className={styles.manageEditAmPm}>
                                                                    {['AM', 'PM'].map(p => (
                                                                        <button key={p}
                                                                            className={`${styles.manageEditAmPmBtn} ${editEventData.endPeriod === p ? styles.manageEditAmPmActive : ''}`}
                                                                            onClick={() => setEditEventData(prev => ({ ...prev, endPeriod: p }))}
                                                                        >{p}</button>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            <div className={styles.manageEditActions}>
                                                                <button className={styles.manageEditCancelBtn} onClick={() => setEditingEventId(null)}>Cancel</button>
                                                                <button
                                                                    className={styles.manageEditSaveBtn}
                                                                    onClick={async () => {
                                                                        const toISO = (day, month, year, hour, minute, period) => {
                                                                            let h = parseInt(hour);
                                                                            if (period === 'PM' && h !== 12) h += 12;
                                                                            if (period === 'AM' && h === 12) h = 0;
                                                                            return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
                                                                        };
                                                                        try {
                                                                            const res = await fetch(`${API}/api/events/${event.id}/update/`, {
                                                                                method: 'PATCH',
                                                                                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                                                                                body: JSON.stringify({
                                                                                    title: editEventData.title,
                                                                                    description: editEventData.description,
                                                                                    start_date: toISO(editEventData.startDay, editEventData.startMonth, editEventData.startYear, editEventData.startHour, editEventData.startMinute, editEventData.startPeriod),
                                                                                    end_date: toISO(editEventData.endDay, editEventData.endMonth, editEventData.endYear, editEventData.endHour, editEventData.endMinute, editEventData.endPeriod),
                                                                                })
                                                                            });
                                                                            if (res.ok) {
                                                                                const updated = await res.json();
                                                                                setOwnPageEvents(prev => prev.map(e => e.id === event.id ? { ...e, ...updated } : e));
                                                                                setEditingEventId(null);
                                                                            } else {
                                                                                const err = await res.json();
                                                                                console.error('Update failed:', err);
                                                                            }
                                                                        } catch (e) { console.error(e); }
                                                                    }}
                                                                >Save</button>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* ── Action Buttons ── */}
                                                    <div className={styles.manageActionsRow} style={activeEventTab === 'history' ? { justifyContent: 'center' } : {}}>
                                                        <button
                                                            className={styles.manageActionBtnDelete}
                                                            onClick={() => setDeleteEventPopup(event)}
                                                        >
                                                            <img src={Bin} alt="delete" className={`${styles.manageActionIcon} ${styles.iconRed}`} />
                                                            Delete
                                                        </button>
                                                        {activeEventTab === 'upcoming' && (
                                                            <>
                                                                <div className={styles.manageVerticalLine} />
                                                                <button
                                                                    className={styles.manageActionBtnUpdate}
                                                                    disabled={isToday}
                                                                    title={isToday ? "Can't update an event happening today" : "Update event"}
                                                                    style={isToday ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                                                    onClick={() => {
                                                                        if (isToday) return;
                                                                        const toSegments = (iso) => {
                                                                            if (!iso) return { d: '', mo: '', y: '', h: '', mi: '', p: 'AM' };
                                                                            const dt = new Date(iso);
                                                                            let h = dt.getHours();
                                                                            const p = h >= 12 ? 'PM' : 'AM';
                                                                            h = h % 12 || 12;
                                                                            return {
                                                                                d: String(dt.getDate()).padStart(2, '0'),
                                                                                mo: String(dt.getMonth() + 1).padStart(2, '0'),
                                                                                y: String(dt.getFullYear()),
                                                                                h: String(h).padStart(2, '0'),
                                                                                mi: String(dt.getMinutes()).padStart(2, '0'),
                                                                                p,
                                                                            };
                                                                        };
                                                                        const s = toSegments(event.start_date);
                                                                        const e = toSegments(event.end_date);
                                                                        setEditingEventId(event.id);
                                                                        setEditEventData({
                                                                            title: event.title || '',
                                                                            description: event.description || '',
                                                                            startDay: s.d, startMonth: s.mo, startYear: s.y,
                                                                            startHour: s.h, startMinute: s.mi, startPeriod: s.p,
                                                                            endDay: e.d, endMonth: e.mo, endYear: e.y,
                                                                            endHour: e.h, endMinute: e.mi, endPeriod: e.p,
                                                                        });
                                                                    }}
                                                                >
                                                                    <img src={Edit} alt="update" className={`${styles.manageActionIcon} ${styles.iconWhite}`} />
                                                                    {isToday ? "Today's event" : "Update"}
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {index !== filteredEvents.length - 1 && (
                                                    <div className={styles.eventItemDivider} />
                                                )}
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {deleteEventPopup && (
                <div className={styles.deleteEventOverlay} onClick={() => setDeleteEventPopup(null)}>
                    <div className={styles.deleteEventModal} onClick={e => e.stopPropagation()}>
                        <h3 className={styles.deleteEventTitle}>Delete Event</h3>
                        <p className={styles.deleteEventDesc}>
                            Are you sure you want to delete <strong>"{deleteEventPopup.title}"</strong>? This can't be undone.
                        </p>
                        <div className={styles.deleteEventActions}>
                            <button className={styles.deleteEventCancelBtn} onClick={() => setDeleteEventPopup(null)}>
                                Cancel
                            </button>
                            <button
                                className={styles.deleteEventConfirmBtn}
                                onClick={async () => {
                                    try {
                                        const res = await fetch(`${API}/api/events/${deleteEventPopup.id}/delete/`, {
                                            method: 'DELETE',
                                            headers: { Authorization: `Bearer ${token}` }
                                        });
                                        if (res.ok) {
                                            setOwnPageEvents(prev => prev.filter(e => e.id !== deleteEventPopup.id));
                                            setDeleteEventPopup(null);
                                        } else {
                                            const err = await res.json();
                                            console.error('Delete failed:', err);
                                        }
                                    } catch (e) { console.error(e); }
                                }}
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}