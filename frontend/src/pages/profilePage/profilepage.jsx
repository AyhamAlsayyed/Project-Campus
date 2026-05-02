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
    const [savedLoading, setSavedLoading] = useState(false);

    const resolveUrl = (url) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        return `${API}${url}`;
    };
    const parseBirthday = (str) => {
        if (!str) return { day: '', month: '', year: '' };
        const [year, month, day] = str.split('-');
        return { year: year || '', month: month || '', day: day || '' };
    };

    const [usernameError, setUsernameError] = useState('');
    const [usernameChecking, setUsernameChecking] = useState(false);
    const [editView, setEditView] = useState('main');
    const [verifyTarget, setVerifyTarget] = useState('');
    const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
    const [otpError, setOtpError] = useState('');
    const [otpLoading, setOtpLoading] = useState(false);
    const [showCoverDropdown, setShowCoverDropdown] = useState(false);
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(() => resolveUrl(user?.avatar_url || user?.avatar));
    const [coverFile, setCoverFile] = useState(null);
    const [coverPreview, setCoverPreview] = useState(() => resolveUrl(user?.cover_url || user?.cover));
    const [editSaving, setEditSaving] = useState(false);
    const [showCalendar, setShowCalendar] = useState(false);
    const [calViewDate, setCalViewDate] = useState(new Date());
    const avatarInputRef = useRef();
    const coverInputRef = useRef();
    const otpRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];


    const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
    const [isEditing, setIsEditing] = useState(false);

    const [formData, setFormData] = useState({
        username: user?.username || '',
        fullName: user?.full_name || '',
        university: user?.university || '',
        major: user?.major || '',
        bio: user?.bio || '',
        primaryEmail: user?.academic_email || user?.email || '',
        secondaryEmail: user?.personal_email || '',
        primaryPhone: user?.primary_phone || '',
        secondaryPhone: user?.secondary_phone || '',
        birthday: parseBirthday(user?.birthday),
    });


    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);


    const mobileMenuRef = useRef(null);
    const avatarDropdownRef = useRef(null);

    const { pathname } = useLocation();
    const { userId } = useParams();
    const navigate = useNavigate();
    useEffect(() => {
        if (!user) return;
        setAvatarPreview(resolveUrl(user.avatar_url || user.avatar));
        setCoverPreview(resolveUrl(user.cover_url || user.cover));
        setFormData({
            username: user.username || '',
            fullName: user.full_name || '',
            university: user.university || '',
            major: user.major || '',
            bio: user.bio || '',
            primaryEmail: user.academic_email || user.email || '',
            secondaryEmail: user.personal_email || '',
            primaryPhone: user.primary_phone || '',
            secondaryPhone: user.secondary_phone || '',
            birthday: parseBirthday(user.birthday),
        });
    }, [user]);

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
    const handleEditChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCodeChange = (index, value) => {
        const newCode = [...verificationCode];
        newCode[index] = value.slice(-1); // Only keep last character
        setVerificationCode(newCode);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`code-input-${index + 1}`)?.focus();
        }
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

    const usernameTimer = useRef(null);
    const handleUsernameChange = (val) => {
        setFormData(p => ({ ...p, username: val }));
        setUsernameError('');
        clearTimeout(usernameTimer.current);
        if (!val.trim()) { setUsernameError('Username is required.'); return; }
        if (/[^a-zA-Z0-9_]/.test(val)) { setUsernameError('No spaces or special characters allowed.'); return; }
        if (val.length > 50) { setUsernameError('Maximum 50 characters.'); return; }
        usernameTimer.current = setTimeout(async () => {
            if (val === user?.username) return; // unchanged — always valid
            setUsernameChecking(true);
            try {
                const res = await fetch(`${API}/api/auth/check-username/?username=${encodeURIComponent(val)}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (!data.available) setUsernameError('This username is unavailable. Please enter a unique username with no spaces, no special characters, and a maximum of 50 characters.');
            } catch (e) { /* ignore network errors */ }
            finally { setUsernameChecking(false); }
        }, 600);
    };

    const handleAvatarChange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f));
    };
    const handleCoverChange = (e) => {
        const f = e.target.files[0]; if (!f) return;
        setCoverFile(f); setCoverPreview(URL.createObjectURL(f));
        setShowCoverDropdown(false);
    };

    const handleSendOtp = async (phone) => {
        setVerifyTarget(phone);
        try {
            await fetch(`${API}/api/auth/send-otp/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone }),
            });
        } catch (e) { console.error(e); }
        setOtpDigits(['', '', '', '', '', '']);
        setOtpError('');
        setEditView('verify');
        setTimeout(() => otpRefs[0].current?.focus(), 100);
    };

    const handleOtpChange = (i, v) => {
        if (!/^\d?$/.test(v)) return;
        const next = [...otpDigits]; next[i] = v; setOtpDigits(next);
        if (v && i < 5) otpRefs[i + 1].current?.focus();
    };
    const handleOtpKeyDown = (i, e) => {
        if (e.key === 'Backspace' && !otpDigits[i] && i > 0) otpRefs[i - 1].current?.focus();
    };

    const handleCheckOtp = async () => {
        const code = otpDigits.join('');
        if (code.length < 6) { setOtpError('Enter all 6 digits.'); return; }
        setOtpLoading(true);
        try {
            const res = await fetch(`${API}/api/auth/verify-otp/`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: verifyTarget, code }),
            });
            if (res.ok) {
                setFormData(p => ({ ...p, secondaryPhone: verifyTarget }));
                setEditView('phone');
            } else { setOtpError('Invalid code. Try again.'); }
        } catch (e) { setOtpError('Something went wrong.'); }
        finally { setOtpLoading(false); }
    };

    const handleEditSave = async () => {
        if (usernameError) return;
        setEditSaving(true);
        try {
            const fd = new FormData();
            fd.append('username', formData.username);
            fd.append('full_name', formData.fullName);
            fd.append('university', formData.university);
            fd.append('major', formData.major);
            fd.append('bio', formData.bio);
            fd.append('personal_email', formData.secondaryEmail);
            fd.append('primary_phone', formData.primaryPhone);
            fd.append('secondary_phone', formData.secondaryPhone);
            const { day, month, year } = formData.birthday;
            if (day && month && year) fd.append('birthday', `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
            if (avatarFile) fd.append('avatar', avatarFile);
            if (coverFile) fd.append('cover', coverFile);
            const res = await fetch(`${API}/api/auth/profile/update/`, {
                method: 'PATCH', headers: { Authorization: `Bearer ${token}` }, body: fd,
            });
            if (res.ok) { setIsEditing(false); loadProfileUser(); }
        } catch (e) { console.error(e); }
        finally { setEditSaving(false); }
    };

    // Calendar helpers
    const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const firstDay = (y, m) => new Date(y, m, 1).getDay();
    const handleEditCancel = () => {
        // Reset all form data back to current saved user values
        setFormData({
            username: user?.username || '',
            fullName: user?.full_name || user?.fullName || '',
            university: user?.university || '',
            major: user?.major || '',
            bio: user?.bio || '',
            primaryEmail: user?.email || '',
            secondaryEmail: user?.secondary_email || '',
            primaryPhone: user?.phone?.[0]?.phone || user?.phone?.[0] || '',
            secondaryPhone: user?.phone?.[1]?.phone || user?.phone?.[1] || '',
            birthday: {
                month: user?.birthday ? String(new Date(user.birthday).getMonth() + 1).padStart(2, '0') : '',
                day: user?.birthday ? String(new Date(user.birthday).getDate()).padStart(2, '0') : '',
                year: user?.birthday ? String(new Date(user.birthday).getFullYear()) : '',
            }
        });
        // Reset avatar/cover previews back to saved values
        setAvatarPreview(user?.avatar_url || user?.avatar || null);
        setAvatarFile(null);
        setCoverPreview(user?.cover_url || user?.cover || null);
        setCoverFile(null);
        setUsernameError('');
        setEditView('main');
        setShowCalendar(false);
        setIsEditing(false);
    };


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
                        {isEditing ? (
                            <div className={styles.editCard}>

                                {/* ── Header ── */}
                                <div className={styles.editHeader}>
                                    <div className={styles.flexAlign}>
                                        <button className={styles.backBtn} onClick={() => setIsEditing(false)}>
                                            <ChevronLeft size={24} />
                                        </button>
                                        <h1 className={styles.whiteHeaderText}>Edit Your Profile</h1>
                                    </div>
                                    <div className={styles.editActions}>
                                        <button className={styles.cancelLink} onClick={handleEditCancel}>
                                            Cancel
                                        </button>
                                        <button className={styles.savePill} onClick={handleEditSave} disabled={!!usernameError || editSaving}>
                                            {editSaving ? 'Saving…' : 'Save'}
                                        </button>
                                    </div>
                                </div>

                                {/* ── Media Area ── */}
                                <div style={{ display: "flex", gap: 20, alignItems: "stretch", padding: "0 24px", maxHeight: 210, marginBottom: 0 }}>

                                    {/* Avatar column */}
                                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, flexShrink: 0 }}>
                                        <div className={styles.avatarEditGroup} onClick={() => avatarInputRef.current?.click()}>
                                            <div className={styles.editAvatarCircle} style={{ width: 130, height: 130 }}>
                                                {avatarPreview
                                                    ? <img src={avatarPreview} alt="avatar" />
                                                    : <User size={70} color="#888" />
                                                }
                                            </div>
                                            <div style={{ display: "flex", gap: 16 }} onClick={e => e.stopPropagation()}>
                                                <button
                                                    className={`${styles.mediaTextBtn} ${styles.deleteText}`}
                                                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                                                >
                                                    <Trash2 size={14} /> Delete
                                                </button>
                                                <button className={styles.mediaTextBtn} onClick={() => avatarInputRef.current?.click()}>
                                                    <Upload size={14} /> Upload
                                                </button>
                                                <input hidden ref={avatarInputRef} type="file" accept="image/*" onChange={handleAvatarChange} />
                                            </div>
                                        </div>
                                    </div>

                                   
                                    <div style={{ flex: 1, position: "relative" }}>
                                        <div style={{
                                            width: "100%", minHeight: 180, height: "100%",
                                            background: "#2a2a2a", borderRadius: 16,
                                            overflow: "hidden", position: "relative"
                                        }}>
                                            {coverPreview && (
                                                <img src={coverPreview} alt="cover"
                                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                                            )}

                                            {/* Camera button — BOTTOM RIGHT of the cover */}
                                            <button
                                                className={styles.centeredCameraBtn}
                                                style={{ position: "absolute", bottom: 10, right: 10, top: "auto", left: "auto", transform: "none" }}
                                                onClick={() => setShowCoverDropdown(p => !p)}
                                            >
                                                <Camera size={16} />
                                            </button>

                                            {/* Dropdown — anchored bottom-right */}
                                            {showCoverDropdown && (
                                                <div className={styles.coverActionsDropdown}
                                                    style={{ position: "absolute", bottom: 50, right: 10, top: "auto", left: "auto", transform: "none" }}>
                                                    <button onClick={() => coverInputRef.current?.click()}>
                                                        <Upload size={14} /> Upload
                                                    </button>
                                                    <button className={styles.deleteText} onClick={() => {
                                                        setCoverFile(null); setCoverPreview(null); setShowCoverDropdown(false);
                                                    }}>
                                                        <Trash2 size={14} /> Delete
                                                    </button>
                                                </div>
                                            )}
                                            <input hidden ref={coverInputRef} type="file" accept="image/*" onChange={handleCoverChange} />
                                        </div>
                                    </div>
                                </div>

                                {/* ── Form ── */}
                                <div className={styles.editForm} style={{ padding: "20px 24px 24px" }}>

                                    {/* Input grid + Bio */}
                                    <div style={{ display: "flex", gap: 16, marginBottom: 4, alignItems: "stretch" }}>
                                        {/* Left: 2×2 inputs */}
                                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                                                    <input
                                                        className={`${styles.inputPairRow} ${usernameError ? styles.invalidInput : ''}`}
                                                        style={{
                                                            width: "100%", background: "#262626",
                                                            border: `1px solid ${usernameError ? '#ff4b4b' : '#444'}`,
                                                            borderRadius: 24, padding: "14px 16px",
                                                            color: "white", outline: "none", fontSize: 14, boxSizing: "border-box"
                                                        }}
                                                        type="text"
                                                        value={formData.username}
                                                        placeholder="Username"
                                                        onChange={e => handleUsernameChange(e.target.value)}
                                                    />
                                                </div>
                                                <input
                                                    style={{
                                                        flex: 1, background: "#262626", border: "1px solid #444",
                                                        borderRadius: 24, padding: "14px 16px", color: "white",
                                                        outline: "none", fontSize: 14, boxSizing: "border-box"
                                                    }}
                                                    type="text"
                                                    value={formData.fullName}
                                                    placeholder="Real Name"
                                                    onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
                                                />
                                            </div>
                                            <div style={{ display: "flex", gap: 12 }}>
                                                <input
                                                    readOnly
                                                    style={{
                                                        flex: 1, background: "#262626", border: "1px solid #444",
                                                        borderRadius: 24, padding: "14px 16px", color: "white",
                                                        outline: "none", fontSize: 14, boxSizing: "border-box", opacity: 0.4,
                                                        cursor: "not-allowed",
                                                    }}
                                                    type="text"
                                                    value={formData.university}
                                                    placeholder="University"
                                                    onChange={e => setFormData(p => ({ ...p, university: e.target.value }))}
                                                />
                                                <input
                                                    style={{
                                                        flex: 1, background: "#262626", border: "1px solid #444",
                                                        borderRadius: 24, padding: "14px 16px", color: "white",
                                                        outline: "none", fontSize: 14, boxSizing: "border-box"
                                                    }}
                                                    type="text"
                                                    value={formData.major}
                                                    placeholder="Major"
                                                    onChange={e => setFormData(p => ({ ...p, major: e.target.value }))}
                                                />
                                            </div>
                                        </div>

                                        {/* Right: Bio */}
                                        <div style={{
                                            flex: 1, background: "#262626", borderRadius: 16,
                                            border: "1px solid #2a2a2a", padding: 16, display: "flex"
                                        }}>
                                            <textarea
                                                value={formData.bio}
                                                placeholder="Bio..."
                                                onChange={e => setFormData(p => ({ ...p, bio: e.target.value }))}
                                                style={{
                                                    flex: 1, background: "transparent", border: "none",
                                                    color: "white", width: "100%", outline: "none",
                                                    resize: "none", fontSize: 14, lineHeight: 1.5, fontFamily: "inherit"
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Username error — only shows when there's actually an error */}
                                    {usernameError && (
                                        <p style={{ color: "#ff4b4b", fontSize: 11, margin: "4px 0 0 4px", lineHeight: 1.4 }}>
                                            {usernameError}
                                        </p>
                                    )}

                                    <div style={{ borderTop: "1px solid #2a2a2a", margin: "20px 0 24px" }} />

                                    {/* Details header */}
                                    <div style={{ display: "flex", alignItems: "flex-start", gap: 24, marginBottom: 24 }}>
                                        <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "white", width: 110, flexShrink: 0 }}>Details</h2>
                                        <p style={{ color: "#888", fontSize: 13, lineHeight: 1.5, flex: 1, margin: "4px 0 0" }}>
                                            Please provide accurate profile information, as errors may affect your account. You can adjust your privacy
                                            settings to control profile visibility.
                                        </p>
                                    </div>

                                    {/* Inset fields panel */}
                                    <div className={styles.insetFieldsPanel}>

                                        {/* Contact Info */}
                                        <div className={styles.sectionLabelDivider}>
                                            <span>Contact Info</span>
                                            <div className={styles.dividerLine} />
                                        </div>

                                        {/* Email row */}
                                        <div className={styles.detailFieldItem}>
                                            <span><Mail size={16} /> Email</span>
                                            <span className={styles.fieldValueText}>{formData.primaryEmail || 'username@gmail.com'}</span>
                                            <Edit2 size={16} className={styles.fieldEditIcon} onClick={() => setEditView("email")} />
                                        </div>

                                        {/* Phone row */}
                                        <div className={styles.detailFieldItem}>
                                            <span><Phone size={16} /> Phone</span>
                                            <span className={styles.fieldValueText}>{formData.primaryPhone || '—'}</span>
                                            <Edit2 size={16} className={styles.fieldEditIcon} onClick={() => setEditView("phone")} />
                                        </div>

                                        {/* Personal Details */}
                                        <div className={styles.sectionLabelDivider}>
                                            <span>Personal Details</span>
                                            <div className={styles.dividerLine} />
                                        </div>

                                        {/* Birthday row */}
                                        <div className={styles.detailFieldItem} style={{ position: "relative" }}>
                                            <span>🎂 Birthday</span>
                                            <div className={styles.birthdayInputsGroup}>
                                                <input
                                                    type="text" maxLength={2} placeholder="MM"
                                                    value={formData.birthday.month}
                                                    className={styles.bInput}
                                                    onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, month: e.target.value } }))}
                                                /> /
                                                <input
                                                    type="text" maxLength={2} placeholder="DD"
                                                    value={formData.birthday.day}
                                                    className={styles.bInput}
                                                    onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, day: e.target.value } }))}
                                                /> /
                                                <input
                                                    type="text" maxLength={4} placeholder="YYYY"
                                                    value={formData.birthday.year}
                                                    className={styles.bInput} style={{ width: 44 }}
                                                    onChange={e => setFormData(p => ({ ...p, birthday: { ...p.birthday, year: e.target.value } }))}
                                                />
                                            </div>
                                            {/* Calendar icon opens picker */}
                                            <Calendar
                                                size={18}
                                                className={styles.fieldEditIcon}
                                                onClick={() => setShowCalendar(p => !p)}
                                            />
                                            {/* Calendar dropdown */}
                                            {showCalendar && (
                                                <div style={{
                                                    position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                                                    width: 260, background: "#252525",
                                                    border: "1px solid rgba(255,255,255,0.1)",
                                                    borderRadius: 16, padding: 14, zIndex: 50,
                                                    boxShadow: "0 16px 40px rgba(0,0,0,0.6)"
                                                }}>
                                                    {/* Month nav */}
                                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                                                        <button onClick={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() - 1, 1))}
                                                            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
                                                        <span style={{ color: "#fff", fontWeight: 600, fontSize: "0.88rem" }}>
                                                            {MONTHS_LONG[calViewDate.getMonth()]} {calViewDate.getFullYear()}
                                                        </span>
                                                        <button onClick={() => setCalViewDate(new Date(calViewDate.getFullYear(), calViewDate.getMonth() + 1, 1))}
                                                            style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", fontSize: "1.2rem", cursor: "pointer", width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
                                                    </div>
                                                    {/* Day headers */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", marginBottom: 6 }}>
                                                        {DAYS_SHORT.map(d => (
                                                            <span key={d} style={{ textAlign: "center", fontSize: "0.7rem", fontWeight: 600, color: "rgba(255,255,255,0.35)", padding: "2px 0" }}>{d}</span>
                                                        ))}
                                                    </div>
                                                    {/* Day grid */}
                                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2 }}>
                                                        {Array.from({ length: firstDay(calViewDate.getFullYear(), calViewDate.getMonth()) }).map((_, i) => (
                                                            <span key={`e${i}`} />
                                                        ))}
                                                        {Array.from({ length: daysInMonth(calViewDate.getFullYear(), calViewDate.getMonth()) }).map((_, i) => {
                                                            const day = i + 1;
                                                            const isSelected =
                                                                Number(formData.birthday.year) === calViewDate.getFullYear() &&
                                                                Number(formData.birthday.month) === calViewDate.getMonth() + 1 &&
                                                                Number(formData.birthday.day) === day;
                                                            return (
                                                                <button
                                                                    key={day}
                                                                    onClick={() => {
                                                                        setFormData(p => ({
                                                                            ...p,
                                                                            birthday: {
                                                                                year: String(calViewDate.getFullYear()),
                                                                                month: String(calViewDate.getMonth() + 1).padStart(2, '0'),
                                                                                day: String(day).padStart(2, '0'),
                                                                            }
                                                                        }));
                                                                        setShowCalendar(false);
                                                                    }}
                                                                    style={{
                                                                        aspectRatio: "1", display: "flex", alignItems: "center",
                                                                        justifyContent: "center", background: isSelected
                                                                            ? "linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))"
                                                                            : "transparent",
                                                                        border: "none", borderRadius: "50%",
                                                                        color: isSelected ? "#fff" : "rgba(255,255,255,0.8)",
                                                                        fontSize: "0.8rem", cursor: "pointer",
                                                                        fontWeight: isSelected ? 700 : 400,
                                                                    }}
                                                                >
                                                                    {day}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* ══════════════════════════════════════
        PHONE EDIT POPUP
    ══════════════════════════════════════ */}
                                {editView === "phone" && (
                                    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setEditView("main")} />
                                        <div style={{
                                            position: "relative", background: "#1e1e1e", borderRadius: 20,
                                            padding: 28, width: 380, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}>
                                            {/* Header */}
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <Phone size={20} color="white" />
                                                    <h3 style={{ margin: 0, color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Phone</h3>
                                                </div>
                                                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                                    <button onClick={() => setEditView("main")} style={{ background: "none", border: "none", color: "#e91e63", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Discard</button>
                                                    <button onClick={() => setEditView("main")} style={{ background: "none", border: "1px solid #444", color: "white", borderRadius: 20, padding: "6px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Save</button>
                                                </div>
                                            </div>
                                            <div style={{ height: 1, background: "#2a2a2a", marginBottom: 20 }} />

                                            {/* Primary phone */}
                                            <div style={{ marginBottom: 16 }}>
                                                <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Primary</label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        value={formData.primaryPhone}
                                                        placeholder="Primary phone number"
                                                        onChange={e => setFormData(p => ({ ...p, primaryPhone: e.target.value }))}
                                                        style={{ flex: 1, background: "#252525", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                                    />
                                                    <button
                                                        onClick={() => handleSendOtp(formData.primaryPhone)}
                                                        style={{ background: "rgba(139,45,255,0.15)", border: "1px solid rgba(139,45,255,0.4)", color: "#c084fc", borderRadius: 10, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                                                    >
                                                        Update
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Secondary phone */}
                                            <div>
                                                <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Secondary</label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <input
                                                        type="text"
                                                        value={formData.secondaryPhone}
                                                        placeholder="Add secondary number"
                                                        onChange={e => setFormData(p => ({ ...p, secondaryPhone: e.target.value }))}
                                                        style={{ flex: 1, background: "#252525", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                                    />
                                                    <button
                                                        onClick={() => handleSendOtp(formData.secondaryPhone)}
                                                        style={{ background: "rgba(139,45,255,0.15)", border: "1px solid rgba(139,45,255,0.4)", color: "#c084fc", borderRadius: 10, padding: "10px 16px", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                                                    >
                                                        Verify
                                                    </button>
                                                    {formData.secondaryPhone && (
                                                        <button
                                                            onClick={() => setFormData(p => ({ ...p, secondaryPhone: '' }))}
                                                            style={{ background: "transparent", border: "none", color: "#e91e63", cursor: "pointer", padding: 4 }}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ══════════════════════════════════════
        EMAIL EDIT POPUP
    ══════════════════════════════════════ */}
                                {editView === "email" && (
                                    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setEditView("main")} />
                                        <div style={{
                                            position: "relative", background: "#1e1e1e", borderRadius: 20,
                                            padding: 28, width: 400, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}>
                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    <Mail size={20} color="white" />
                                                    <h3 style={{ margin: 0, color: "white", fontWeight: 700, fontSize: "1.1rem" }}>Email</h3>
                                                </div>
                                                <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                                                    <button onClick={() => setEditView("main")} style={{ background: "none", border: "none", color: "#e91e63", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Discard</button>
                                                    <button onClick={() => setEditView("main")} style={{ background: "none", border: "1px solid #444", color: "white", borderRadius: 20, padding: "6px 20px", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>Save</button>
                                                </div>
                                            </div>
                                            <div style={{ height: 1, background: "#2a2a2a", marginBottom: 20 }} />

                                            {/* Academic email — read-only, clearly labelled */}
                                            <div style={{ marginBottom: 16 }}>
                                                <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>
                                                    Primary <span style={{ color: "rgba(139,45,255,0.85)", fontSize: "0.72rem", background: "rgba(139,45,255,0.12)", border: "1px solid rgba(139,45,255,0.3)", borderRadius: 6, padding: "1px 6px", marginLeft: 6 }}>Academic · Read-only</span>
                                                </label>
                                                <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "11px 14px", color: "rgba(255,255,255,0.45)", fontSize: "0.9rem" }}>
                                                    {formData.primaryEmail || 'username@university.edu'}
                                                </div>
                                            </div>

                                            {/* Personal email — editable */}
                                            <div>
                                                <label style={{ color: "#888", fontSize: "0.85rem", display: "block", marginBottom: 8 }}>Personal (optional)</label>
                                                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                                    <input
                                                        type="email"
                                                        value={formData.secondaryEmail}
                                                        placeholder="Add personal email"
                                                        onChange={e => setFormData(p => ({ ...p, secondaryEmail: e.target.value }))}
                                                        style={{ flex: 1, background: "#252525", border: "1px solid #333", borderRadius: 12, padding: "11px 14px", color: "white", outline: "none", fontSize: "0.9rem" }}
                                                    />
                                                    {formData.secondaryEmail && (
                                                        <button
                                                            onClick={() => setFormData(p => ({ ...p, secondaryEmail: '' }))}
                                                            style={{ background: "transparent", border: "none", color: "#e91e63", cursor: "pointer", padding: 4 }}
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ══════════════════════════════════════
        OTP VERIFICATION POPUP
    ══════════════════════════════════════ */}
                                {editView === "verify" && (
                                    <div style={{ position: "fixed", inset: 0, zIndex: 1001, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setEditView("phone")} />
                                        <div style={{
                                            position: "relative", background: "#1e1e1e", borderRadius: 20,
                                            padding: 32, width: 420, boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                                            border: "1px solid rgba(255,255,255,0.08)"
                                        }}>
                                            <h3 style={{ margin: "0 0 8px", color: "white", fontWeight: 700, fontSize: "1.05rem" }}>
                                                Verifying number{" "}
                                                <span style={{ color: "#c084fc" }}>
                                                    {verifyTarget.replace(/^(\d{3})(\d+)(\d{2})$/, '$1***$3')}
                                                </span>
                                            </h3>
                                            <p style={{ margin: "0 0 24px", color: "#777", fontSize: "0.85rem", lineHeight: 1.5 }}>
                                                A verification code was sent via SMS, check your messages. Do not share that code with anyone!
                                            </p>

                                            {/* 6 OTP boxes */}
                                            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 16 }}>
                                                {otpDigits.map((d, i) => (
                                                    <input
                                                        key={i}
                                                        ref={otpRefs[i]}
                                                        type="text"
                                                        maxLength={1}
                                                        inputMode="numeric"
                                                        value={d}
                                                        onChange={e => handleOtpChange(i, e.target.value)}
                                                        onKeyDown={e => handleOtpKeyDown(i, e)}
                                                        style={{
                                                            width: 52, height: 56, background: d ? "rgba(139,45,255,0.12)" : "transparent",
                                                            border: `2px solid ${d ? "rgba(139,45,255,0.7)" : "rgba(139,45,255,0.45)"}`,
                                                            borderRadius: 12, color: "white", fontSize: "1.3rem",
                                                            fontWeight: 700, textAlign: "center", outline: "none",
                                                            transition: "border-color 0.15s, background 0.15s"
                                                        }}
                                                    />
                                                ))}
                                            </div>

                                            {otpError && <p style={{ color: "#ff4b4b", fontSize: "0.8rem", textAlign: "center", margin: "0 0 12px" }}>{otpError}</p>}

                                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                                                <button
                                                    onClick={() => handleSendOtp(verifyTarget)}
                                                    style={{ background: "none", border: "none", color: "#888", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}
                                                >
                                                    Resend
                                                </button>
                                                <button
                                                    onClick={handleCheckOtp}
                                                    disabled={otpLoading}
                                                    style={{
                                                        background: "linear-gradient(30deg, #5E23A4, #9C269D)",
                                                        border: "none", color: "white", borderRadius: 20,
                                                        padding: "10px 36px", fontWeight: 600,
                                                        cursor: otpLoading ? "not-allowed" : "pointer",
                                                        fontSize: "0.9rem", opacity: otpLoading ? 0.6 : 1
                                                    }}
                                                >
                                                    {otpLoading ? '…' : 'Check'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
                                                    <div className={styles.userInfo}>
                                                        <h2 className={styles.username}>{username}</h2>
                                                        <span className={styles.role}>/{role}</span>
                                                    </div>

                                                    {isOwnProfile && <button className={styles.editProfileBtn} onClick={() => setIsEditing(true)}>Edit ✎</button>}
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
                                            {friendStatus === "none" && (
                                                <button className={styles.addFriendBtn} onClick={handleAddFriend}>
                                                    <UserPlus size={18} />
                                                    <span>
                                                        Add<span className="hidden sm:inline"> friend</span>
                                                    </span>
                                                </button>
                                            )}
                                            {friendStatus === "sent" && <button className={styles.pendingBtn}>⏳ Request Sent</button>}
                                            {friendStatus === "received" && (<><button className={styles.acceptBtn} onClick={handleAccept}>✅ Accept</button><button className={styles.declineBtn} onClick={handleDecline}>❌ Decline</button></>)}
                                            {friendStatus === "friends" && <button className={styles.friendsBtn}>👥 Friends</button>}
                                        </div>
                                    )}
                                </div>

                                <div className={styles.hr} />

                                <div className={styles.tabs}>
                                    {(isOwnProfile
                                        ? ['Posts', 'Activities', 'Saved']
                                        : ['Posts', 'Photos', 'Friends']
                                    ).map(tab => (
                                        <button
                                            key={tab}
                                            className={`${styles.tabBtn} ${activeTab === tab ? styles.tabActive : ''}`}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab}
                                        </button>
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

                        )}
                        {userLoading && <div className={styles.notice}>Loading profile...</div>}

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
                        <div style={{ background: "#333333", minHeight: "100vh" }}>

                            {/* Cover */}
                            <div style={{
                                width: "100%", height: "clamp(160px, 22vw, 300px)", position: "relative",
                                background: "rgba(255,255,255,0.04)", overflow: "hidden"
                            }}>
                                {coverUrl ? <img src={coverUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                                {isOwnProfile && (
                                    <button style={{
                                        position: "absolute", right: 12, bottom: 10,
                                        background: "rgba(0,0,0,0.35)", border: "none", borderRadius: 10,
                                        color: "rgba(255,255,255,0.9)", padding: "7px 12px", cursor: "pointer", fontWeight: 600
                                    }}>Edit ✎</button>
                                )}
                            </div>

                            {/* Avatar + name */}
                            <div style={{ padding: "0 16px 16px", marginTop: "clamp(-36px, -5vw, -60px)", position: "relative", zIndex: 2 }}>
                                <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 10 }}>
                                    <div style={{
                                        width: "clamp(72px, 9vw, 96px)", height: "clamp(72px, 9vw, 96px)",
                                        borderRadius: "50%", border: "4px solid #333333",
                                        overflow: "hidden", background: "rgba(0,0,0,0.25)",
                                        flexShrink: 0, position: "relative", zIndex: 3
                                    }}>
                                        {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <User size={36} color="white" />}
                                    </div>

                                    {!isOwnProfile && (
                                        <div style={{ display: "flex", gap: 8, marginLeft: "auto", paddingBottom: 4 }}>
                                            <button className={styles.messageBtn} onClick={handleMessage} style={{ width: 36, height: 36 }}>
                                                <MessageSquare size={16} />
                                            </button>
                                            {friendStatus === "none" && <button className={styles.addFriendBtn} onClick={handleAddFriend} style={{ padding: "6px 12px", fontSize: "0.8rem" }}><UserPlus size={14} />Add</button>}
                                            {friendStatus === "sent" && <button className={styles.pendingBtn} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>⏳ Sent</button>}
                                            {friendStatus === "received" && (<><button className={styles.acceptBtn} onClick={handleAccept} style={{ padding: "6px 10px", fontSize: "0.8rem" }}>✅</button><button className={styles.declineBtn} onClick={handleDecline} style={{ padding: "6px 10px", fontSize: "0.8rem" }}>❌</button></>)}
                                            {friendStatus === "friends" && <button className={styles.friendsBtn} style={{ padding: "6px 12px", fontSize: "0.8rem" }}>👥 Friends</button>}
                                        </div>
                                    )}
                                </div>

                                {user?.role === 'instructor' ? (
                                    <>
                                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#fff" }}>{username}</h2>
                                            {user?.is_verified && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8b2dff" strokeWidth="2.5"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
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

                            {/* ── Tabs — space-between ── */}
                            <div style={{
                                display: "flex",
                                justifyContent: "space-between",
                                borderTop: "1px solid rgba(255,255,255,0.08)",
                                borderBottom: "1px solid rgba(255,255,255,0.06)",
                                padding: "0 12px",
                                overflowX: "auto",
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                WebkitOverflowScrolling: "touch"
                            }}>
                                {(isOwnProfile
                                    ? ['Posts', 'Activities', 'Saved']
                                    : ['Posts', 'Photos', 'Friends', 'Details']
                                ).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        style={{
                                            flex: 1,
                                            background: "transparent",
                                            border: "none",
                                            color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.5)",
                                            fontWeight: activeTab === tab ? 700 : 500,
                                            fontSize: "0.85rem",
                                            padding: "12px 4px",
                                            cursor: "pointer",
                                            borderBottom: activeTab === tab ? "2px solid #8b2dff" : "2px solid transparent",
                                            marginBottom: -1,
                                            whiteSpace: "nowrap",
                                            textAlign: "center"
                                        }}
                                    >{tab}</button>
                                ))}
                            </div>

                            {/* Tab content */}
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
                                        )) : <div className={styles.notice} style={{ gridColumn: "span 3" }}>No photos found.</div>}
                                    </div>
                                )}

                                {activeTab === 'Friends' && (
                                    <div className={styles.friendsTabContent}>
                                        <FriendsTab friends={friends} />
                                    </div>
                                )}

                                {activeTab === 'Details' && (
                                    <div style={{ width: "100%", boxSizing: "border-box" }}>
                                        <UserDetails user={user} hidePill />
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

                                {!isOwnProfile && activeTab !== 'Details' && communityPicks.length > 0 && (
                                    <div className={styles.picksCard} style={{ marginTop: 8 }}>
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