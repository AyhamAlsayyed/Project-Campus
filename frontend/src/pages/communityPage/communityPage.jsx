import styles from './communityPage.module.css'
import Header from '../../components/pagelayout/header/header'
import WeeklyNews from '../../components/rightPanel/weeklynews/weeklynews';
import DesktopCreatePost from '../../components/createPost/DesktopCreatePost/desktopCreatePost'
import MobileCreatePost from '../../components/createPost/MobileCreatePost/mobileCreatePost'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import CreatePostModal from '../../components/createPost/CreatePostModal/CreatePostModal';
import { Navigate } from 'react-router-dom';
import CommentModal from '../../components/comments/commentsModal';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import PostCard from '../../components/posts/postCard'
import NotificationInactive from '../../Assets/icons/mute.png'
import NotificationActive from '../../Assets/icons/notifications-active.png'
import Leave from '../../Assets/icons/leave.png'
import Setting from '../../Assets/icons/setting.png'
import { useUser } from '../../context/UserContext';
import useTheme from '../../hooks/useTheme';
import CommunitySettingsNav from '../../components/communitySettings/CommunitySettingsNav';
import CommunityInfoPanel from '../../components/communitySettings/CommunityInfoPanel';
import MembersTab from '../../components/communitySettings/membersTab';
import RequestsTab from '../../components/communitySettings/requestsTab';
import CommunityPosts from '../../components/communitySettings/CommunityPosts';
import DeleteCommunityModal from '../../components/communitySettings/deleteCommunityModal';
import API from '../../config';

export default function CommunityPage() {
    const { user, avatarSrc } = useUser();
    const { theme, toggleTheme } = useTheme();
    const [posts, setPosts] = useState([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const [filter, _setFilter] = useState(searchParams.get('filter') || "recent");
    const setFilter = useCallback((f) => {
        _setFilter(f);
        setSearchParams(f !== 'recent' ? { filter: f } : {}, { replace: true });
    }, [setSearchParams]);
    const [community, setCommunity] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState("");
    const [images, setImages] = useState([]);
    const [files, setFiles] = useState([]);
    const token = localStorage.getItem("access");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPost, setSelectedPostId] = useState(null);
    const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
    const [weather, setWeather] = useState(null);
    const [isPollOpen, setIsPollOpen] = useState(false);
    const [pollOptions, setPollOptions] = useState(["", ""]);
    const [isAcademic, setIsAcademic] = useState(false);
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState('Settings');
    const [prevSettingsTab, setPrevSettingsTab] = useState('Settings');

    useEffect(() => {
        if (activeSettingsTab !== 'Delete') {
            setPrevSettingsTab(activeSettingsTab);
        }
    }, [activeSettingsTab]);
    const displayedTab = activeSettingsTab === 'Delete' ? prevSettingsTab : activeSettingsTab;
    
    const handleToggleNotification = async () => {
        const prev = isNotified;
        setIsNotified(!prev);
        try {
            const res = await fetch(`${API}/api/communities/${id}/notify/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) setIsNotified(prev);
        } catch { setIsNotified(prev); }
    };

    const handleLeave = async () => {
        try {
            const res = await fetch(`${API}/api/communities/${id}/leave/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) navigate('/communities');
        } catch (err) { console.error("Leave failed", err); }
        setShowLeaveConfirm(false);
    };

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        if (community) setSelectedCommunity(community);
    }, [community]);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const openComments = (postId) => { setSelectedPostId(postId); setIsCommentModalOpen(true); };

    const resetPostState = () => {
        setContent(""); setImages([]); setFiles([]); setPollOptions(["", ""]); setIsPollOpen(false);
        setIsAcademic(false);
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

    const fetchCommunity = async () => {
        const res = await fetch(`${API}/api/communities/${id}/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setCommunity(data);
    };
    
    
    useEffect(() => {
        const fetchJoinedCommunities = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API}/api/communities/?filter=joined`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setJoinedCommunities(data);
                }
            } catch (err) { console.error("Failed to fetch joined communities:", err); }
        };
        fetchJoinedCommunities();
    }, [token]);

    const handleCreatePost = async () => {
        if (!content.trim() && !images.length && !files.length && !isPollOpen) return;

        const communityId = selectedCommunity?.id || id;
        const formData = new FormData();
        formData.append("content", content);
        formData.append("community", communityId);
        if (isAcademic && user?.role === "instructor") {
            formData.append("is_academic", "true");
            formData.append("post_type", "academy");
        }
        images.forEach(img => formData.append("images", img));
        files.forEach(file => formData.append("files", file));
        if (isPollOpen) {
            pollOptions.filter(opt => opt.trim()).forEach((opt, index) => {
                formData.append(`poll_options[${index}]`, opt);
            });
        }
        try {
            const res = await fetch(`${API}/api/posts/create/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (!res.ok) { console.error("Failed to create post"); return; }
            resetPostState();
            setIsModalOpen(false);
            fetchPosts();
        } catch (err) { console.error("Error:", err); }
    };

    const fetchPosts = async () => {
        const res = await fetch(`${API}/api/communities/${id}/posts/?filter=${filter}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPosts(data);
    };

    useEffect(() => {
        fetchPosts(); fetchCommunity(); fetchWeather();
    }, [id, filter]);

    const handleMediaUpload = (e) => { setImages(prev => [...prev, ...Array.from(e.target.files)]); };
    const handleFileUpload = (e) => { setFiles(prev => [...prev, ...Array.from(e.target.files)]); };
    
    const handleDeleteCommunity = async () => {
        try {
            const res = await fetch(`${API}/api/communities/${id}/`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                navigate('/communities');
            } else {
                console.error("Failed to delete community");
            }
        } catch (err) {
            console.error("Error deleting community:", err);
        }
    };

    const canManage = community?.user_role === 'owner' || community?.user_role === 'admin';

    const mobileFilters = [
        { key: "recommended", label: "Recommended" },
        { key: "recent", label: "Most Recent" },
        { key: "popular", label: "Popular" },
        { key: "trending", label: "Trending" },
        ...(!canManage ? [{ key: "my_pending", label: "My Pending" }] : []),
        { key: "my_approved", label: "By You" },
    ];
    
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    return (
        <div className={styles.darkContainer}>

            {/* ── MOBILE HEADER ── */}
            {isMobile && (
                <MobileHeader avatarSrc={avatarSrc} user={user} setMobileMenuOpen={setMobileMenuOpen} token={token} API={API} />
            )}

            {/* ── MOBILE DRAWER ── */}
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} />

            {/* ── DESKTOP HEADER ── */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            {/* ── MOBILE BODY ── */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
                    {isSettingsOpen ? (
                        <CommunitySettingsNav
                            activeTab={activeSettingsTab}
                            setActiveTab={setActiveSettingsTab}
                        />
                    ) : (
                        <>
                            <div style={{ padding: "12px 14px 0", minWidth: 200, margin: "0 auto 0 auto" }}>
                                <WeeklyNews communityId={id} isMobile={isMobile} />
                            </div>

                            <div style={{ padding: "10px 14px 0" }}>
                                <MobileCreatePost
                                    avatarSrc={avatarSrc}
                                    setIsModalOpen={setIsModalOpen}
                                    handleMediaUpload={handleMediaUpload}
                                    handleFileUpload={handleFileUpload}
                                    setIsPollOpen={setIsPollOpen}
                                    isPollOpen={isPollOpen}
                                />
                            </div>
                        </>
                    )}

                    {/* Hides Title row and Filters panel if Settings are open */}
                    {!isSettingsOpen && (
                        <>
                            <div
                                style={{
                                    padding: "14px 14px 0",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    gap: 12
                                }}
                            >
                                <h1
                                    style={{
                                        margin: 0,
                                        lineHeight: 1.2,
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 8,
                                        flexWrap: "wrap"
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: "2rem",
                                            fontWeight: 800,
                                            background: "linear-gradient(30deg, #c72cff, #8b2dff)",
                                            WebkitBackgroundClip: "text",
                                            WebkitTextFillColor: "transparent"
                                        }}
                                    >
                                        {community?.name}
                                    </span>

                                    <span
                                        style={{
                                            fontSize: "1.1rem",
                                            fontWeight: 500,
                                            color: "var(--text-muted)"
                                        }}
                                    >
                                        community
                                    </span>
                                </h1>

                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: 20
                                    }}
                                >
                                    <button
                                        onClick={handleToggleNotification}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            cursor: "pointer",
                                            padding: 0
                                        }}
                                    >
                                        <img
                                            src={isNotified ? NotificationActive : NotificationInactive}
                                            alt="notifications"
                                            className={styles.headerIcon}
                                            style={{
                                                height: isNotified ? "30px" : "25px"
                                            }}
                                        />
                                    </button>

                                    {canManage ? (
                                        <button
                                            onClick={() => {
                                                setIsSettingsOpen(true);
                                                setActiveSettingsTab('Community info');
                                            }}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 0
                                            }}
                                        >
                                            <img
                                                src={Setting}
                                                alt="settings"
                                                className={styles.headerIcon}
                                            />
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setShowLeaveConfirm(true)}
                                            style={{
                                                background: "none",
                                                border: "none",
                                                cursor: "pointer",
                                                padding: 0
                                            }}
                                        >
                                            <img
                                                src={Leave}
                                                alt="leave"
                                                className={styles.headerIcon}
                                            />
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <div style={{ padding: "10px 14px 0" }}>
                                <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
                                    {mobileFilters.map(f => (
                                        <button
                                            key={f.key}
                                            onClick={() => setFilter(f.key)}
                                            className={`${styles.filterBtn} ${filter === f.key ? styles.active : ''}`}
                                            style={{ flexShrink: 0, fontSize: "0.82rem" }}
                                        >
                                            {f.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ width: "100%", boxSizing: "border-box", margin: "12px 0 0 0", borderRadius: "20px 20px 0 0", background: "linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))", paddingTop: 6 }}>
                        <div style={{ background: "var(--bg-card)", borderRadius: "20px 20px 0 0", padding: "20px 10px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {isSettingsOpen ? (
                                <>
                                    {(displayedTab === 'Settings' || displayedTab === 'Community info') && (
                                        <CommunityInfoPanel
                                            community={community}
                                            onBack={() => setIsSettingsOpen(false)}
                                        />
                                    )}

                                    {displayedTab === 'Members' && (
                                        <MembersTab
                                            communityId={id}
                                            onBack={() => setActiveSettingsTab('Community info')}
                                        />
                                    )}

                                    {displayedTab === 'Requests' && (
                                        <RequestsTab
                                            communityId={id}
                                            token={token}
                                            onBack={() => setActiveSettingsTab('Community info')}
                                            isPublic={community?.is_public}
                                        />
                                    )}

                                    {displayedTab === 'Posts' && (
                                        <CommunityPosts
                                            communityId={id}
                                            token={token}
                                            onBack={() => setActiveSettingsTab('Community info')}
                                        />
                                    )}
                                </>
                            ) : (
                                <>
                                    {posts.length === 0 ? (
                                        <p style={{ color: "var(--text-muted)", padding: "0 10px" }}>
                                            No posts yet.
                                        </p>
                                    ) : (
                                        posts.map(post => (
                                            <PostCard
                                                key={post.id}
                                                post={post}
                                                openComments={openComments}
                                                isAdmin={canManage}
                                                communityContext={true}
                                                communityId={id}
                                            />
                                        ))
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP BODY ── */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SideBarNav theme={theme} toggleTheme={toggleTheme} user={user} />

                    {isSettingsOpen ? (
                        <>
                            <div className={`${styles.communityPostsContainer} ${styles.settingsWrapper}`}>
                                <div className={`${styles.mainContent} ${styles.settingsMiddleContainer}`}>
                                    {(displayedTab === 'Settings' || displayedTab === 'Community info') && (
                                        <CommunityInfoPanel community={community} onBack={() => setIsSettingsOpen(false)} />
                                    )}
                                    {displayedTab === 'Members' && (
                                        <MembersTab
                                            communityId={id}
                                            onBack={() => setActiveSettingsTab('Community info')}
                                        />
                                    )}
                                    {displayedTab === 'Requests' && (
                                        <RequestsTab
                                            communityId={id}
                                            token={token}
                                            onBack={() => setActiveSettingsTab('Community info')}
                                            isPublic={community?.is_public}
                                        />
                                    )}
                                    {displayedTab === 'Posts' && (
                                        <CommunityPosts
                                            onBack={() => setActiveSettingsTab('Community info')}
                                            communityId={id}
                                            token={token}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className={`${styles.rightSection} ${styles.settingsSidebarWrapper}`}>
                                <CommunitySettingsNav activeTab={activeSettingsTab} setActiveTab={setActiveSettingsTab} />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className={styles.mainContent}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <h1 className={styles.title}>
                                        <span className={styles.highlight}>{community?.name}</span> community
                                    </h1>
                                </div>
                                <div className={styles.settingsContainer} style={{ display: "flex", justifyContent: "space-between" }}>
                                    <div className={styles.filters}>
                                        {mobileFilters.map(f => (
                                            <button key={f.key} className={`${styles.filterBtn} ${filter === f.key ? styles.active : ""}`} onClick={() => setFilter(f.key)}>
                                                {f.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: 50 }}>
                                        <button onClick={handleToggleNotification} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                            <img src={isNotified ? NotificationActive : NotificationInactive} alt="notifications" className={styles.headerIcon} style={{ height: NotificationActive ? "30px" : "25px" }} />
                                        </button>
                                        {canManage ? (
                                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                <img src={Setting} alt="settings" className={styles.headerIcon} />
                                            </button>
                                        ) : (
                                            <button onClick={() => setShowLeaveConfirm(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                <img src={Leave} alt="leave" className={styles.headerIcon} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {posts.length > 0 ? (
                                    <div className={styles.communityPostsContainer} style={{ flex: 1, width: "100%" }}>
                                        <div className={styles.innerContainer} style={{ width: "100%" }}>
                                            {posts.map(post => (
                                                <PostCard
                                                    key={post.id}
                                                    post={post}
                                                    openComments={openComments}
                                                    isAdmin={canManage}
                                                    communityContext={true}
                                                    communityId={id}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className={styles.emptyState}>
                                        <div className={styles.emptyIconWrapper}><span className={styles.emptyIcon}>📭</span></div>
                                        <h2 className={styles.emptyTitle}>No posts yet</h2>
                                        <p className={styles.emptySubtitle}>This community hasn't posted anything yet. Be the first!</p>
                                    </div>
                                )}
                            </div>

                            <div className={styles.rightSection}>
                                <DesktopCreatePost user={user} avatarSrc={avatarSrc} weather={weather} setIsModalOpen={setIsModalOpen} handleMediaUpload={handleMediaUpload} handleFileUpload={handleFileUpload} setIsPollOpen={setIsPollOpen} selectedCommunity={selectedCommunity} setSelectedCommunity={setSelectedCommunity} communityDropdownOpen={communityDropdownOpen} setCommunityDropdownOpen={setCommunityDropdownOpen} joinedCommunities={joinedCommunities} API={API} defaultCommunity={community} />
                                <WeeklyNews communityId={id} useHighlights />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── MODALS ── */}
            <CreatePostModal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetPostState(); }}
                user={user}
                avatarSrc={avatarSrc}
                isMobile={isMobile}
                content={content}
                setContent={setContent}
                placeholder={`What's on your mind, ${user?.username || "User"}?`}
                images={images}
                setImages={setImages}
                files={files}
                setFiles={setFiles}
                isPollOpen={isPollOpen}
                setIsPollOpen={setIsPollOpen}
                pollOptions={pollOptions}
                setPollOptions={setPollOptions}
                onSubmit={handleCreatePost}
                submitDisabled={!content && !images.length && !files.length && !isPollOpen}
                toggles={user?.role === "instructor" ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                        <span style={{ color: '#ADADAD', fontSize: '0.85rem' }}>Academic?</span>
                        <label className={styles.switch}>
                            <input type="checkbox" checked={isAcademic} onChange={() => setIsAcademic(prev => !prev)} />
                            <span className={styles.switchSlider}></span>
                        </label>
                    </div>
                ) : null}
            />

            {isCommentModalOpen && <CommentModal post={selectedPost} onClose={() => setIsCommentModalOpen(false)} currentUser={user} />}

            {showLeaveConfirm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowLeaveConfirm(false)}>
                    <div style={{ background: "#1c1c1e", width: 290, borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "24px 20px 20px", textAlign: "center" }}>
                            <h3 style={{ color: "#ffffff", fontSize: "1.05rem", fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Leave this community?</h3>
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", lineHeight: 1.4, margin: 0 }}>You'll need to rejoin to see <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{community?.name}</strong>'s content again.</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            <button onClick={() => setShowLeaveConfirm(false)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: 16, fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 400 }}>Cancel</button>
                            <button onClick={handleLeave} style={{ background: "transparent", border: "none", padding: 16, fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", color: "#ff453a", fontWeight: 600 }}>Leave</button>
                        </div>
                    </div>
                </div>
            )}
            
            {activeSettingsTab === 'Delete' && (
                <DeleteCommunityModal
                    isOpen={true}
                    onClose={() => setActiveSettingsTab(prevSettingsTab)}
                    onDelete={handleDeleteCommunity}
                />
            )}
        </div>
    );
}