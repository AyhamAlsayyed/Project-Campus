import styles from './Homepage.module.css'
import communityStyles from '../communityPage/communityPage.module.css'
import headerStyles from '../../components/pagelayout/header/header.module.css'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import DesktopCreatePost from '../../components/createPost/DesktopCreatePost/desktopCreatePost';
import CommentModal from '../../components/comments/commentsModal';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import { useState, useEffect, useRef } from 'react';
import {
    X, Cloud, Menu, Search,
    Check, MoreHorizontal, Volume2, Calendar, UserPlus, Heart,
    User, MessageSquare as MessageSquareIcon2, Bell as BellIcon2, ChevronDown
} from "lucide-react";
import PostCard from '../../components/posts/postCard'
import WeeklyNews from '../../components/rightPanel/weeklynews/weeklynews';
import ThemeToggler from '../../components/pagelayout/themeToggle';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import { useNavigate, useLocation } from 'react-router-dom';
import MobileCreatePost from '../../components/createPost/MobileCreatePost/mobileCreatePost';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import Calender from '../../Assets/icons/calender.png'
import API from '../../config';
import useTheme from '../../hooks/useTheme';

export default function Homepage() {
    const navigate = useNavigate();
    const location = useLocation();
    const [pendingOpen, setPendingOpen] = useState(null);
    const pendingStateRef = useRef(null);
    const [modalCommunityDropdownOpen, setModalCommunityDropdownOpen] = useState(false);

    const { theme, toggleTheme } = useTheme();
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [user, setUser] = useState(null)
    const [content, setContent] = useState("")
    const [images, setImages] = useState([]);
    const [files, setFiles] = useState([])
    const [selectedPost, setSelectedPost] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [userError, setUserError] = useState("")
    const [userLoading, setUserLoading] = useState(true)
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [weather, setWeather] = useState(null);
    const [isPollOpen, setIsPollOpen] = useState(false)
    const [pollOptions, setPollOptions] = useState(["", ""])
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const mobileMenuRef = useRef(null)
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)

    // Announcement States
    const [isAnnouncement, setIsAnnouncement] = useState(false);
    const [announcementTitle, setAnnouncementTitle] = useState('');
    const [announcementDesc, setAnnouncementDesc] = useState('');
    const [announcementDuration, setAnnouncementDuration] = useState(0);
    const [annImageError, setAnnImageError] = useState(false);

    // Promote States
    const [isPromote, setIsPromote] = useState(false);
    const [promoteTitle, setPromoteTitle] = useState('');
    const [promoteContent, setPromoteContent] = useState('');
    const [promoteDesc, setPromoteDesc] = useState('');
    const [promoteDuration, setPromoteDuration] = useState(0);

    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const sentinelRef = useRef(null);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024)
        window.addEventListener("resize", check)
        return () => window.removeEventListener("resize", check)
    }, [])

    const resetPostState = () => {
        setContent(""); setImages([]); setFiles([]); setPollOptions(["", ""]); setIsPollOpen(false);
        setIsAnnouncement(false); setAnnouncementTitle(''); setAnnouncementDesc(''); setAnnouncementDuration(0);
        setIsPromote(false); setPromoteTitle(''); setPromoteContent(''); setPromoteDesc(''); setPromoteDuration(0);
        setAnnImageError(false);
    };

    const handleAnnouncementToggle = () => {
        setIsAnnouncement(prev => {
            if (!prev) setIsPromote(false);
            return !prev;
        });
    };

    const handlePromoteToggle = () => {
        setIsPromote(prev => {
            if (!prev) setIsAnnouncement(false);
            return !prev;
        });
    };

    const token = localStorage.getItem("access")

    const loadUser = async () => {
        if (!token) { setUserLoading(false); setUserError("No token found"); return }
        try {
            const res = await fetch(`${API}/api/auth/me/`, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json().catch(() => ({}))

            if (!res.ok) { setUserError("Failed to load user"); setUser(null); return }
            if (data.role === 'uni' || localStorage.getItem('user_type') === 'university') {
                const pageRes = await fetch(`${API}/api/pages/${data.id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (pageRes.ok) {
                    const pageData = await pageRes.json();
                    data.avatar = pageData.profile_image;
                }
                data.username = data.page_full_name || data.page_name;
            }

            setUser(data)
        } catch (e) { setUserError("Something went wrong") }
        finally { setUserLoading(false) }
    }

    const openComments = (post) => { setSelectedPost(post); };
    const closeComments = () => { setSelectedPost(null); };

    useEffect(() => {
        if (!location.state?.openPost) return;

        const openPost = location.state.openPost;
        navigate('/home', { replace: true, state: {} });

        const handleOpenPost = (data) => {
            const { post, postId, commentId } = data;
            if (post) {
                setSelectedPost({
                    ...post,
                    id: post.post_id || post.id || postId,
                    highlightCommentId: commentId ? Number(commentId) : null,
                    author: {
                        ...post.author,
                        avatar: post.author?.avatar?.startsWith("http")
                            ? post.author.avatar
                            : `${API}${post.author?.avatar}`
                    }
                });
            } else {
                setPendingOpen({
                    postId: Number(postId),
                    commentId: commentId ? Number(commentId) : null
                });
            }
        };

        if (user) {
            handleOpenPost(openPost);
        } else {
            pendingStateRef.current = openPost;
        }
    }, [location.state, user]);

    useEffect(() => {
        if (!user || !pendingStateRef.current) return;
        const data = pendingStateRef.current;
        pendingStateRef.current = null;

        const { post, postId, commentId } = data;
        if (post) {
            setSelectedPost({
                ...post,
                id: post.post_id || post.id || postId,
                highlightCommentId: commentId ? Number(commentId) : null,
                author: {
                    ...post.author,
                    avatar: post.author?.avatar?.startsWith("http")
                        ? post.author.avatar
                        : `${API}${post.author?.avatar}`
                }
            });
        } else {
            setPendingOpen({
                postId: Number(postId),
                commentId: commentId ? Number(commentId) : null
            });
        }
    }, [user]);

    const loadPosts = async (currentOffset = 0) => {
        if (!token) { setLoading(false); setError("No token found"); return; }
        currentOffset === 0 ? setLoading(true) : setLoadingMore(true);
        try {
            const res = await fetch(
                `${API}/api/posts/feed/?limit=20&offset=${currentOffset}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json().catch(() => []);
            if (!res.ok) { setError(data?.message || "Failed to load posts"); return; }
            const incoming = Array.isArray(data) ? data : (data.results || []);
            setPosts(prev => currentOffset === 0 ? incoming : [...prev, ...incoming]);
            setHasMore(incoming.length === 20);
            setOffset(currentOffset + incoming.length);
        } catch { setError("Something went wrong"); }
        finally { setLoading(false); setLoadingMore(false); }
    };

    useEffect(() => {
        if (!sentinelRef.current) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
                    loadPosts(offset);
                }
            },
            { threshold: 0.1 }
        );
        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, loading, offset]);

    const fetchJoined = async () => {
        const res = await fetch(`${API}/api/communities/?filter=joined`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) { const data = await res.json(); setJoinedCommunities(data); }
    };

    const fetchWeather = async () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            try {
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
                const data = await res.json();
                setWeather({ temp: Math.round(data.current_weather.temperature) });
            } catch (err) { console.error("Weather fetch failed:", err); }
        }, (error) => { console.error("Location permission denied", error); });
    };

    const handleMediaUpload = (e) => { setImages(prev => [...prev, ...Array.from(e.target.files)]); setIsModalOpen(true); };
    const handleFileUpload = (e) => { setFiles(prev => [...prev, ...Array.from(e.target.files)]); setIsModalOpen(true); };

    const handleCreatePost = async () => {
        if (isAnnouncement && localStorage.getItem("user_type") === "university") {
            if (!announcementTitle.trim() || !announcementDesc.trim() || images.length === 0) return;
        } else if (isPromote && (localStorage.getItem("user_type") === "university" || localStorage.getItem("user_type") === "page")) {
            if (!promoteTitle.trim() || !promoteContent.trim() || !promoteDesc.trim() || images.length === 0) return;
        } else {
            if (!content.trim() && !images.length && !files.length && !isPollOpen) return;
        }

        const postContent = isPromote ? promoteContent : (isAnnouncement ? announcementDesc : content);

        const optimisticPost = {
            id: `temp-${Date.now()}`,
            content_text: postContent,
            created_at: new Date().toISOString(),
            is_announcement: isAnnouncement && localStorage.getItem("user_type") === "university",
            is_promote: isPromote && (localStorage.getItem("user_type") === "university" || localStorage.getItem("user_type") === "page"),
            is_academic: isAnnouncement && user?.role === "instructor",
            author: {
                id: user?.id,
                username: user?.username,
                avatar: avatarSrc,
            },
            likes_count: 0,
            comments_count: 0,
            is_liked: false,
            is_saved: false,
            media: images.map(img => ({
                url: URL.createObjectURL(img),
                type: img.type.startsWith("video/") ? "video" : "image"
            })),
        };

        setPosts(prev => [optimisticPost, ...prev]);
        setIsModalOpen(false);
        setModalCommunityDropdownOpen(false);
        resetPostState();

        try {
            const formData = new FormData();
            formData.append("content", postContent);

            if (isAnnouncement) {
                formData.append("title", announcementTitle);
                formData.append("post_type", "announcement");
                formData.append("duration", ["1 week", "1 month", "3 months", "6 months", "1 year"][announcementDuration]);
            } else if (isPromote) {
                formData.append("title", promoteTitle);
                formData.append("description", promoteDesc);
                formData.append("post_type", "advertisement"); 
                formData.append("duration", ["1 week", "1 month", "3 months", "6 months", "1 year"][promoteDuration]);
            }

            if (isAnnouncement && user?.role === "instructor") {
                formData.append("is_academic", "true");
            }

            images.forEach(img => formData.append("images", img));
            files.forEach(file => formData.append("files", file));
            if (isPollOpen) {
                pollOptions.filter(opt => opt.trim()).forEach((opt, i) => formData.append(`poll_options[${i}]`, opt));
            }
            if (selectedCommunity) formData.append("community", selectedCommunity.id);

            const res = await fetch(`${API}/api/posts/create/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });

            if (!res.ok) {
                setPosts(prev => prev.filter(p => p.id !== optimisticPost.id));
                return;
            }

            const savedPost = await res.json();
            setPosts(prev => prev.map(p =>
                p.id === optimisticPost.id ? savedPost : p
            ));

        } catch (err) {
            setPosts(prev => prev.filter(p => p.id !== optimisticPost.id));
            console.error("Error:", err);
        }
    };

    useEffect(() => {
        const close = () => setCommunityDropdownOpen(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const openPostId = params.get('openPost');
        const highlightCommentId = params.get('highlightComment');
        if (!openPostId) return;

        setPendingOpen({ postId: Number(openPostId), commentId: highlightCommentId ? Number(highlightCommentId) : null });
        navigate('/home', { replace: true });
    }, [location.search]);

    useEffect(() => {
        if (!pendingOpen || !user) return;

        const fetchPostContent = async () => {
            try {
                const res = await fetch(`${API}/api/posts/${pendingOpen.postId}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    const posts = Array.isArray(data) ? data : (data.results || []);
                    const matchedPost = posts.find(
                        p => (p.id || p.post_id) === pendingOpen.postId
                    );

                    setSelectedPost({
                        ...(matchedPost || {}),
                        id: pendingOpen.postId,
                        highlightCommentId: pendingOpen.commentId,
                        author: matchedPost?.author || {
                            id: matchedPost?.author_user,
                            username: matchedPost?.author_username || "",
                            avatar: matchedPost?.author_avatar
                                ? (matchedPost.author_avatar.startsWith('http')
                                    ? matchedPost.author_avatar
                                    : `${API}${matchedPost.author_avatar}`)
                                : "/default-avatar.png"
                        },
                        created_at: matchedPost?.created_at || null,
                    });
                }
            } catch (err) {
                console.error(err);
                setSelectedPost({ id: pendingOpen.postId, highlightCommentId: pendingOpen.commentId });
            }
            setPendingOpen(null);
        };

        fetchPostContent();
    }, [pendingOpen, user]);

    useEffect(() => {
        loadPosts();
        loadUser();
        fetchJoined()
        fetchWeather();
    }, [])

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const rawAvatar = user?.profile?.avatar || user?.avatar || user?.profile_image;
    const avatarSrc = rawAvatar
        ? (rawAvatar.startsWith("http") ? rawAvatar : `${API}${rawAvatar}`)
        : ProfilePicture;

    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {/* ══════════════════════════════════════
                    MOBILE HEADER BAR
                ══════════════════════════════════════ */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={user}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                />
            )}

            {/* ══════════════════════════════════════
                    MOBILE DRAWER (SideBarNav only)
                ══════════════════════════════════════ */}
            {isMobile && mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
                    <div
                        style={{
                            position: "absolute", inset: 0,
                            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)"
                        }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div
                        ref={mobileMenuRef}
                        style={{
                            position: "absolute", left: 0, top: 0,
                            height: "100%", width: "75vw", maxWidth: 350,
                            background: " linear-gradient(135deg, var(--bg-main), var(--bg-secondary))",
                            borderRight: "1px solid rgba(255,255,255,0.1)",
                            display: "flex", flexDirection: "column", overflow: "hidden",
                            boxShadow: "4px 0 30px rgba(0,0,0,0.6)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            style={{
                                position: "absolute", top: 14, right: 14, zIndex: 10,
                                width: 32, height: 32, borderRadius: "50%",
                                background: "rgba(255,255,255,0.1)", border: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer"
                            }}
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <X size={16} color="white" />
                        </button>

                        <div style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)"
                        }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: 1 }}>
                                CAMPUS
                            </span>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            <SideBarNav onClose={() => setMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP HEADER
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header
                        theme={theme}
                        toggleTheme={toggleTheme}
                        user={user}
                        onOpenPost={(postId, commentId, post) => {
                            if (location.pathname !== '/home') {
                                navigate('/home', {
                                    state: { openPost: { post, postId, commentId } }
                                });
                            } else {
                                if (post) {
                                    setSelectedPost({
                                        ...post,
                                        id: post.post_id || post.id || postId,
                                        highlightCommentId: commentId ? Number(commentId) : null,
                                        author: {
                                            ...post.author,
                                            avatar: post.author?.avatar?.startsWith("http")
                                                ? post.author.avatar
                                                : `${API}${post.author?.avatar}`
                                        }
                                    });
                                } else {
                                    setPendingOpen({ postId: Number(postId), commentId: commentId ? Number(commentId) : null });
                                }
                            }
                        }}
                    />
                </div>
            )}

            {/* ══════════════════════════════════════
                    MOBILE BODY
                ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
                    <div style={{ padding: "12px 10px 0 10px", width: "100%", boxSizing: "border-box" }}>
                        <WeeklyNews isMobile={true} />
                    </div>
                    <div style={{ padding: "12px 10px 0 10px" }}>
                        <MobileCreatePost
                            avatarSrc={avatarSrc}
                            setIsModalOpen={setIsModalOpen}
                            handleMediaUpload={handleMediaUpload}
                            handleFileUpload={handleFileUpload}
                            setIsPollOpen={setIsPollOpen}
                        />
                    </div>
                    <div
                        className={styles.postContainer}
                        style={{
                            width: "100%", maxWidth: "100%", minWidth: 0,
                            boxSizing: "border-box", margin: "12px 0 0 0",
                            borderRadius: "20px 20px 0 0"
                        }}
                    >
                        <div className={styles.innerContainer} style={{ borderRadius: "20px 20px 0 0", width: "100%", boxSizing: "border-box" }}>
                            {error ? (
                                <div className={styles.errorBox}><p>{error}</p></div>
                            ) : loading ? (
                                <p style={{ padding: 20, color: "rgba(255,255,255,0.5)" }}>Loading...</p>
                            ) : posts.length === 0 ? (
                                <div className={styles.emptyState}><div>📰</div><h2>No posts yet</h2></div>
                            ) : (
                                <div className={styles.feed}>
                                    {posts.map(post => (
                                        <PostCard key={post.id} post={post} openComments={openComments} />
                                    ))}
                                    <div ref={sentinelRef} style={{ height: 1 }} />
                                    {loadingMore && (
                                        <p style={{ textAlign: "center", padding: "16px 0", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
                                            Loading more posts...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP BODY
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SideBarNav />

                    <div className={styles.postContainer}>
                        <div className={styles.innerContainer}>
                            {error ? (
                                <div className={styles.errorBox}><p>{error}</p></div>
                            ) : loading ? (
                                <p>Loading...</p>
                            ) : posts.length === 0 ? (
                                <div className={styles.emptyState}><div>📰</div><h2>No posts yet</h2></div>
                            ) : (
                                <div className={styles.feed}>
                                    {posts.map(post => (
                                        <PostCard key={post.id} post={post} openComments={openComments} />
                                    ))}
                                    <div ref={sentinelRef} style={{ height: 1 }} />
                                    {loadingMore && (
                                        <p style={{ textAlign: "center", padding: "16px 0", color: "rgba(255,255,255,0.4)", fontSize: "0.875rem" }}>
                                            Loading more posts...
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.rightSection}>
                        <DesktopCreatePost
                            user={user}
                            avatarSrc={avatarSrc}
                            weather={weather}
                            setIsModalOpen={setIsModalOpen}
                            handleMediaUpload={handleMediaUpload}
                            handleFileUpload={handleFileUpload}
                            setIsPollOpen={setIsPollOpen}
                            selectedCommunity={selectedCommunity}
                            setSelectedCommunity={setSelectedCommunity}
                            communityDropdownOpen={communityDropdownOpen}
                            setCommunityDropdownOpen={setCommunityDropdownOpen}
                            joinedCommunities={joinedCommunities}
                            API={API}
                        />
                        <WeeklyNews />
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                    CREATE POST MODAL (shared)
                ══════════════════════════════════════ */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => { setIsModalOpen(false); resetPostState(); setModalCommunityDropdownOpen(false); }}>
                    <div
                        className={styles.modal}
                        onClick={e => e.stopPropagation()}
                        style={isMobile ? { width: "calc(100vw - 24px)", maxWidth: 500, boxSizing: "border-box", padding: 16 } : {}}
                    >
                        <div className={styles.modalHeader}>
                            <h3>Create post</h3>
                            <button className={styles.closeButton} onClick={() => { setIsModalOpen(false); resetPostState(); setModalCommunityDropdownOpen(false); }}>✕</button>
                        </div>

                        {/* Name row + toggles on the right */}
                        <div className={styles.leftSide}>
                            <img
                                src={avatarSrc}
                                alt=""
                                className={styles.userProfilePicture}
                                onError={e => { e.currentTarget.src = ProfilePicture; }}
                            />
                            <strong>{user?.full_name || user?.page_full_name || user?.username}</strong>

                            {(localStorage.getItem("user_type") === "university" ||
                                localStorage.getItem("user_type") === "page" ||
                                user?.role === "instructor") && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: 'auto' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                            <span style={{ color: '#ADADAD', fontSize: '0.85rem' }}>
                                                {user?.role === "instructor" ? "Academic?" : "Announcement?"}
                                            </span>
                                            <label className={styles.switch}>
                                                <input
                                                    type="checkbox"
                                                    checked={isAnnouncement}
                                                    onChange={handleAnnouncementToggle}
                                                />
                                                <span className={styles.switchSlider}></span>
                                            </label>
                                        </div>
                                        {(localStorage.getItem("user_type") === "university" || localStorage.getItem("user_type") === "page") && (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                                                <span style={{ color: '#ADADAD', fontSize: '0.85rem' }}>
                                                    Promote?
                                                </span>
                                                <label className={styles.switch}>
                                                    <input
                                                        type="checkbox"
                                                        checked={isPromote}
                                                        onChange={handlePromoteToggle}
                                                    />
                                                    <span className={styles.switchSlider}></span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                )}
                        </div>

                        {/* ANNOUNCEMENT FIELDS */}
                        {isAnnouncement && localStorage.getItem("user_type") === "university" ? (
                            <div className={styles.announcementFields}>
                                <input
                                    type="text"
                                    placeholder="Announcement title..."
                                    value={announcementTitle}
                                    onChange={e => setAnnouncementTitle(e.target.value)}
                                    className={styles.announcementTitleInput}
                                />
                                <textarea
                                    placeholder="Announcement description..."
                                    value={announcementDesc}
                                    onChange={e => setAnnouncementDesc(e.target.value)}
                                    className={styles.announcementDescInput}
                                />
                                <div className={styles.announcementFieldDivider} />
                                <div className={styles.annDurationRow}>
                                    <span className={styles.annDurationLabel}>
                                        <img src={Calender} alt="" style={{ width: 16, height: 16, filter: 'brightness(0) saturate(100%) invert(31%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)', flexShrink: 0 }} />
                                        Duration
                                    </span>
                                    <div className={styles.annSliderWrapper}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="4"
                                            value={announcementDuration}
                                            onChange={e => setAnnouncementDuration(Number(e.target.value))}
                                            className={styles.annRangeInput}
                                        />
                                        <div className={styles.annTrackBase} />
                                        <div className={styles.annTrackFill} style={{ width: `${(announcementDuration / 4) * 100}%` }} />
                                        <div className={styles.annNodesRow}>
                                            {["1 week", "1 month", "3 months", "6 months", "1 year"].map((label, i) => (
                                                <div key={i} className={styles.annNode} onClick={() => setAnnouncementDuration(i)}>
                                                    <div className={`${styles.annNodeDot} ${i === announcementDuration ? styles.annNodeDotActive : i < announcementDuration ? styles.annNodeDotPassed : ''}`} />
                                                    <span className={`${styles.annNodeLabel} ${i === announcementDuration ? styles.annNodeLabelActive : ''}`}>{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : isPromote && (localStorage.getItem("user_type") === "university" || localStorage.getItem("user_type") === "page") ? (
                            /* PROMOTE FIELDS */
                            <div className={styles.announcementFields}>
                                <input
                                    type="text"
                                    placeholder="Promote title..."
                                    value={promoteTitle}
                                    onChange={e => setPromoteTitle(e.target.value)}
                                    className={styles.announcementTitleInput}
                                />
                                <textarea
                                    placeholder="Promote content..."
                                    value={promoteContent}
                                    onChange={e => setPromoteContent(e.target.value)}
                                    className={styles.announcementDescInput}
                                    style={{ minHeight: '60px' }}
                                />
                                <textarea
                                    placeholder="Promote description..."
                                    value={promoteDesc}
                                    onChange={e => setPromoteDesc(e.target.value)}
                                    className={styles.announcementDescInput}
                                    style={{ minHeight: '60px' }}
                                />
                                <div className={styles.announcementFieldDivider} />
                                <div className={styles.annDurationRow}>
                                    <span className={styles.annDurationLabel}>
                                        <img src={Calender} alt="" style={{ width: 16, height: 16, filter: 'brightness(0) saturate(100%) invert(31%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(85%)', flexShrink: 0 }} />
                                        Duration
                                    </span>
                                    <div className={styles.annSliderWrapper}>
                                        <input
                                            type="range"
                                            min="0"
                                            max="4"
                                            value={promoteDuration}
                                            onChange={e => setPromoteDuration(Number(e.target.value))}
                                            className={styles.annRangeInput}
                                        />
                                        <div className={styles.annTrackBase} />
                                        <div className={styles.annTrackFill} style={{ width: `${(promoteDuration / 4) * 100}%` }} />
                                        <div className={styles.annNodesRow}>
                                            {["1 week", "1 month", "3 months", "6 months", "1 year"].map((label, i) => (
                                                <div key={i} className={styles.annNode} onClick={() => setPromoteDuration(i)}>
                                                    <div className={`${styles.annNodeDot} ${i === promoteDuration ? styles.annNodeDotActive : i < promoteDuration ? styles.annNodeDotPassed : ''}`} />
                                                    <span className={`${styles.annNodeLabel} ${i === promoteDuration ? styles.annNodeLabelActive : ''}`}>{label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* STANDARD FIELDS */
                            <textarea
                                value={content}
                                onChange={e => setContent(e.target.value)}
                                placeholder={`What's on your mind, ${user?.page_full_name || user?.username || "User"}?`}
                                className={styles.modalInput}
                            />
                        )}

                        {images.length > 0 && (
                            <div className={styles.previewContainer}>
                                {images.map((file, i) => {
                                    const url = URL.createObjectURL(file);
                                    if (file.type.startsWith("video/")) return (
                                        <div key={i} className={styles.previewWrapper}>
                                            <video src={url} className={styles.previewImage} controls />
                                            <button className={styles.removeImage}
                                                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                    return (
                                        <div key={i} className={styles.previewWrapper}>
                                            <img src={url} alt="" className={styles.previewImage} />
                                            <button className={styles.removeImage}
                                                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {files.length > 0 && (
                            <div className={styles.filePreviewContainer}>
                                {files.map((f, i) => (
                                    <div key={i} className={styles.fileItem}>
                                        📁 {f.name}
                                        <button className={styles.removeFile}
                                            onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={styles.actionsRow}>
                            <label className={styles.actionButton}>📷 Media<input hidden type="file" onChange={handleMediaUpload} /></label>
                            <label className={styles.actionButton}>📁 File<input hidden type="file" multiple onChange={handleFileUpload} /></label>
                            <button type="button" className={styles.actionButton}
                                onClick={() => { if (isPollOpen) { setIsPollOpen(false); setPollOptions(["", ""]); } else setIsPollOpen(true); }}>
                                📊 Poll
                            </button>
                            <div style={{ position: "relative", display: "flex", justifyContent: "flex-end" }} onClick={e => e.stopPropagation()}>
                                <button
                                    style={{ display: "flex", alignItems: "center", background: "transparent", border: "none", padding: "2px 8px", cursor: "pointer" }}
                                    onClick={e => { e.stopPropagation(); setModalCommunityDropdownOpen(prev => !prev); }}
                                >
                                    <span style={{
                                        position: "relative", zIndex: 0, marginRight: "-15px",
                                        background: theme === "light" ? "#E8E8E8" : "#262626",
                                        borderRadius: 20, padding: "1px 30px 1px 15px",
                                        color: theme === "light" ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.45)",
                                        fontSize: 12, whiteSpace: "nowrap"
                                    }}>
                                        {selectedCommunity ? selectedCommunity.name : "Community"}
                                    </span>
                                    <span style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: 25, height: 25, background: "linear-gradient(-90deg, rgba(166,39,156,0.9), rgba(49,32,169,0.9))", borderRadius: "50%", fontSize: 20, color: "white", flexShrink: 0 }}>▾</span>
                                </button>
                                {modalCommunityDropdownOpen && (
                                    <div style={{
                                        position: "absolute", top: "calc(100% + 6px)", right: 0,
                                        minWidth: 200,
                                        background: theme === "light" ? "#ffffff" : "#2a2a2a",
                                        border: theme === "light" ? "1px solid rgba(0,0,0,0.1)" : "1px solid rgba(255,255,255,0.1)",
                                        borderRadius: 14, padding: 6, zIndex: 100,
                                        display: "flex", flexDirection: "column", gap: 2,
                                        boxShadow: "0 10px 30px rgba(0,0,0,0.2)"
                                    }}
                                        onClick={e => e.stopPropagation()}>
                                        <div
                                            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, fontSize: 13, color: theme === "light" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.75)", cursor: "pointer" }}
                                            onClick={() => { setSelectedCommunity(null); setModalCommunityDropdownOpen(false); }}
                                            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
                                            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                                        >
                                            None
                                        </div>
                                        {joinedCommunities.map(c => (
                                            <div
                                                key={c.id}
                                                style={{
                                                    display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, fontSize: 13,
                                                    color: selectedCommunity?.id === c.id ? "#c084fc" : theme === "light" ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.75)",
                                                    background: selectedCommunity?.id === c.id ? "rgba(168,85,247,0.15)" : "transparent", cursor: "pointer"
                                                }}
                                                onClick={() => { setSelectedCommunity(c); setModalCommunityDropdownOpen(false); }}
                                                onMouseEnter={e => e.currentTarget.style.background = theme === "light" ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.07)"}
                                                onMouseLeave={e => e.currentTarget.style.background = selectedCommunity?.id === c.id ? "rgba(168,85,247,0.15)" : "transparent"}
                                            >
                                                {c.avatar && <img src={c.avatar.startsWith("http") ? c.avatar : `${API}${c.avatar}`} alt="" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
                                                {c.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {isPollOpen && (
                            <div className={styles.pollContainer}>
                                {pollOptions.map((option, i) => (
                                    <div key={i} className={styles.pollOptionRow}>
                                        <input
                                            value={option}
                                            onChange={e => { const u = [...pollOptions]; u[i] = e.target.value; setPollOptions(u); }}
                                            placeholder={`Option ${i + 1}`}
                                            className={styles.pollInput}
                                            style={{ width: "100%", boxSizing: "border-box" }}
                                        />
                                        {pollOptions.length > 2 && (
                                            <button className={styles.removeOption}
                                                onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>✕</button>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className={styles.addOption}>+ Add Option</button>
                            </div>
                        )}

                        {annImageError && (
                            <div className={styles.annImageWarning}>
                                <span className={styles.annImageWarningIcon}>📸</span>
                                <div>
                                    <p className={styles.annImageWarningTitle}>Image required</p>
                                    <p className={styles.annImageWarningDesc}>
                                        {isPromote ? "Promotions need a cover image to stand out in the feed." : "Announcements need a cover image to stand out in the feed."}
                                    </p>
                                </div>
                                <button className={styles.annImageWarningClose} onClick={() => setAnnImageError(false)}>✕</button>
                            </div>
                        )}

                        <button
                            className={styles.postButton}
                            onClick={() => {
                                if (isAnnouncement && localStorage.getItem("user_type") === "university") {
                                    if (images.length === 0) { setAnnImageError(true); return; }
                                    if (!announcementTitle.trim() || !announcementDesc.trim()) return;
                                }
                                if (isPromote && (localStorage.getItem("user_type") === "university" || localStorage.getItem("user_type") === "page")) {
                                    if (images.length === 0) { setAnnImageError(true); return; }
                                    if (!promoteTitle.trim() || !promoteContent.trim() || !promoteDesc.trim()) return;
                                }
                                handleCreatePost();
                            }}
                            disabled={
                                isAnnouncement
                                    ? (!announcementTitle.trim() || !announcementDesc.trim())
                                    : isPromote
                                        ? (!promoteTitle.trim() || !promoteContent.trim() || !promoteDesc.trim())
                                        : (!content.trim() && !images.length && !files.length && !isPollOpen)
                            }
                        >
                            Post
                        </button>
                    </div>
                </div>
            )}

            {selectedPost && (
                <CommentModal post={selectedPost} onClose={closeComments} currentUser={user} />
            )}
        </div>
    )
}