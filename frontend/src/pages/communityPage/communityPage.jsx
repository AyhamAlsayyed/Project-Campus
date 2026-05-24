import styles from './communityPage.module.css'
import Header from '../../components/pagelayout/header/header'
import WeeklyNews from '../../components/weeklynews/weeklynews';
import DesktopCreatePost from '../../components/DesktopCreatePost/desktopCreatePost'
import MobileCreatePost from '../../components/MobileCreatePost/mobileCreatePost'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from "react-router-dom";
import { X, Menu } from "lucide-react";
import { Navigate } from 'react-router-dom';
import CommentModal from '../../components/comments/commentsModal';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import PostCard from '../../components/posts/postCard'
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import NotificationInactive from '../../Assets/icons/notifications.png'
import NotificationActive from '../../Assets/icons/notifications-active.png'
import Leave from '../../Assets/icons/leave.png'
import Setting from '../../Assets/icons/setting.png'

// New imports for the Settings Feature
import CommunitySettingsNav from '../../components/communitySettings/CommunitySettingsNav';
import CommunityInfoPanel from '../../components/communitySettings/CommunityInfoPanel';
import MembersTab from '../../components/communitySettings/membersTab';
import RequestsTab from '../../components/communitySettings/requestsTab';
import CommunityPosts from '../../components/communitySettings/CommunityPosts';
import DeleteCommunityModal from '../../components/communitySettings/deleteCommunityModal';

export default function CommunityPage() {
    const [user, setUser] = useState(null)
    const [theme, setTheme] = useState('dark');
    const [posts, setPosts] = useState([]);
    const [filter, setFilter] = useState("recent");
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
    const [selectedCommunity, setSelectedCommunity] = useState(null);
    const [communityDropdownOpen, setCommunityDropdownOpen] = useState(false);
    const [joinedCommunities, setJoinedCommunities] = useState([]);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isNotified, setIsNotified] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const mobileMenuRef = useRef(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState('Settings');
    const [prevSettingsTab, setPrevSettingsTab] = useState('Settings');

    useEffect(() => {
        if (activeSettingsTab !== 'Delete') {
            setPrevSettingsTab(activeSettingsTab);
        }
    }, [activeSettingsTab]);
    const displayedTab = activeSettingsTab === 'Delete' ? prevSettingsTab : activeSettingsTab;

    const API = "http://localhost:8000"

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
    const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

    const resetPostState = () => {
        setContent(""); setImages([]); setFiles([]); setPollOptions(["", ""]); setIsPollOpen(false);
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

    const loadUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setUser(data);
        } catch (err) { console.error("Failed to load user"); }
    };

    useEffect(() => {
        const fetchJoinedCommunities = async () => {
            if (!token) return;
            try {
                const res = await fetch(`${API}/api/communities/joined/`, {
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
        loadUser(); fetchPosts(); fetchCommunity(); fetchWeather();
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
                navigate('/communities'); // Redirect to directory after deletion
            } else {
                console.error("Failed to delete community");
            }
        } catch (err) {
            console.error("Error deleting community:", err);
        }
    };

    const rawAvatar = user?.profile?.avatar || user?.avatar;
    const avatarSrc = rawAvatar ? (rawAvatar.startsWith("http") ? rawAvatar : `${API}${rawAvatar}`) : "/default-avatar.png";

    // Determine if the user is the community admin
    const isAdmin = user?.id === community?.admin;

    const mobileFilters = [
        { key: "recommended", label: "Recommended" },
        { key: "recent", label: "Most Recent" },
        { key: "popular", label: "Popular" },
        { key: "trending", label: "Trending" },
    ];

    return (
        <div className={styles.darkContainer}>

            {/* ── MOBILE HEADER ── */}
            {isMobile && (
                <MobileHeader avatarSrc={avatarSrc} user={user} setMobileMenuOpen={setMobileMenuOpen} token={token} API={API} />
            )}

            {/* ── MOBILE DRAWER ── */}
            {isMobile && mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
                    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }} onClick={() => setMobileMenuOpen(false)} />
                    <div ref={mobileMenuRef} style={{ position: "absolute", left: 0, top: 0, height: "100%", width: "75vw", maxWidth: 350, background: "linear-gradient(135deg, var(--bg-main), var(--bg-secondary))", borderRight: "1px solid rgba(255,255,255,0.1)", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "4px 0 30px rgba(0,0,0,0.6)" }} onClick={e => e.stopPropagation()}>
                        <button style={{ position: "absolute", top: 14, right: 14, zIndex: 10, width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.1)", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={() => setMobileMenuOpen(false)}>
                            <X size={16} color="white" />
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: 1 }}>CAMPUS</span>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            <SideBarNav onClose={() => setMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP HEADER ── */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            {/* ── MOBILE BODY ── */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box" }}>
                    <div style={{ padding: "12px 14px 0" }}><WeeklyNews communityId={id} /></div>
                    <div style={{ padding: "10px 14px 0" }}>
                        <MobileCreatePost avatarSrc={avatarSrc} setIsModalOpen={setIsModalOpen} handleMediaUpload={handleMediaUpload} handleFileUpload={handleFileUpload} setIsPollOpen={setIsPollOpen} isPollOpen={isPollOpen} />
                    </div>
                    <div style={{ padding: "14px 14px 0" }}>
                        <h1 style={{ margin: 0, lineHeight: 1.2, display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "2rem", fontWeight: 800, background: "linear-gradient(30deg, #c72cff, #8b2dff)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{community?.name}</span>
                            <span style={{ fontSize: "1.1rem", fontWeight: 500, color: "rgba(255,255,255,0.5)" }}>community</span>
                        </h1>
                    </div>
                    <div style={{ padding: "10px 14px 0" }}>
                        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8, scrollbarWidth: "none", msOverflowStyle: "none" }}>
                            {mobileFilters.map(f => (
                                <button key={f.key} onClick={() => setFilter(f.key)} style={{ flexShrink: 0, padding: "8px 16px", borderRadius: 999, border: "none", fontSize: "0.82rem", cursor: "pointer", fontWeight: filter === f.key ? 600 : 400, background: filter === f.key ? "#4a4a4a" : "#2a2a2a", color: filter === f.key ? "#fff" : "#aaa", boxShadow: filter === f.key ? "0 0 0 1px rgba(255,255,255,0.1)" : "none", transition: "all 0.2s ease" }}>
                                    {f.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div style={{ width: "100%", boxSizing: "border-box", margin: "12px 0 0 0", borderRadius: "20px 20px 0 0", background: "linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))", paddingTop: 6 }}>
                        <div style={{ background: "#333333", borderRadius: "20px 20px 0 0", padding: "20px 10px 40px", display: "flex", flexDirection: "column", gap: 16 }}>
                            {posts.length === 0 ? <p style={{ color: "rgba(255,255,255,0.4)", padding: "0 10px" }}>No posts yet.</p> : posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)}
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP BODY ── */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>

                    {/* Always keep the universal left navigation */}
                    <SideBarNav theme={theme} toggleTheme={toggleTheme} user={user} />

                    {isSettingsOpen ? (
                        <>
                            <div className={styles.communityPostsContainer}>
                                <div className={`${styles.mainContent} ${styles.settingsMiddleContainer}`}>
                                    {/* 2. CHANGE activeSettingsTab TO displayedTab HERE */}
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
                                            groupId={id}
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

                                    {/* REMOVE THE DELETE MODAL FROM HERE */}
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
                                            <img src={isNotified ? NotificationActive : NotificationInactive} alt="notifications" style={{ width: 28, height: 28, filter: "brightness(0) invert(1)" }} />
                                        </button>
                                        
                                        {isAdmin ? (
                                            <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                <img src={Setting} alt="settings" style={{ width: 28, height: 28, filter: "brightness(0) invert(1)" }} />
                                            </button>
                                        ) : (
                                            <button onClick={() => setShowLeaveConfirm(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                                                <img src={Leave} alt="leave" style={{ width: 28, height: 28, filter: "brightness(0) invert(1)" }} />
                                            </button>
                                        )}
                                        
                                    </div>
                                </div>
                                {posts.length > 0 ? (
                                    <div className={styles.communityPostsContainer} style={{ flex: 1, width: "100%" }}>
                                        <div className={styles.innerContainer} style={{ width: "100%" }}>
                                            {posts.map(post => <PostCard key={post.id} post={post} openComments={openComments} />)}
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
                                <WeeklyNews communityId={id} />
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── MODALS ── */}
            {isModalOpen && (
                <div className={styles.modalOverlay} onClick={() => { setIsModalOpen(false); resetPostState(); }}>
                    <div className={styles.modal} onClick={e => e.stopPropagation()} style={isMobile ? { width: "calc(100vw - 24px)", maxWidth: 500, boxSizing: "border-box", padding: 16 } : {}}>
                        <div className={styles.modalHeader}>
                            <h3>Create post</h3>
                            <button className={styles.closeButton} onClick={() => { setIsModalOpen(false); resetPostState(); }}>✕</button>
                        </div>
                        <div className={styles.leftSide}>
                            <img src={avatarSrc} alt="" className={styles.userProfilePicture} />
                            <strong>{user?.full_name || user?.username}</strong>
                        </div>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder={`What's on your mind, ${user?.username || "User"}?`} className={styles.modalInput} />
                        {images.length > 0 && (
                            <div className={styles.previewContainer}>
                                {images.map((img, i) => (
                                    <div key={i} className={styles.previewWrapper}>
                                        <img src={URL.createObjectURL(img)} alt="" className={styles.previewImage} />
                                        <button className={styles.removeImage} onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {files.length > 0 && (
                            <div className={styles.filePreviewContainer}>
                                {files.map((f, i) => (
                                    <div key={i} className={styles.fileItem}>
                                        📁 {f.name}
                                        <button className={styles.removeFile} onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}><X size={14} /></button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className={styles.actionsRow}>
                            <label className={styles.actionButton}>📷 Media<input hidden type="file" onChange={handleMediaUpload} /></label>
                            <label className={styles.actionButton}>📁 File<input hidden type="file" multiple onChange={handleFileUpload} /></label>
                            <button type="button" className={styles.actionButton} onClick={() => { if (isPollOpen) { setIsPollOpen(false); setPollOptions(["", ""]); } else setIsPollOpen(true); }}>📊 Poll</button>
                        </div>
                        {isPollOpen && (
                            <div className={styles.pollContainer}>
                                {pollOptions.map((option, i) => (
                                    <div key={i} className={styles.pollOptionRow}>
                                        <input value={option} onChange={e => { const u = [...pollOptions]; u[i] = e.target.value; setPollOptions(u); }} placeholder={`Option ${i + 1}`} className={styles.pollInput} style={{ width: "100%", boxSizing: "border-box" }} />
                                        {pollOptions.length > 2 && <button className={styles.removeOption} onClick={() => setPollOptions(pollOptions.filter((_, idx) => idx !== i))}>✕</button>}
                                    </div>
                                ))}
                                <button type="button" onClick={() => setPollOptions([...pollOptions, ""])} className={styles.addOption}>+ Add Option</button>
                            </div>
                        )}
                        <button className={styles.postButton} onClick={handleCreatePost} disabled={!content && !images.length && !files.length && !isPollOpen}>Post</button>
                    </div>
                </div>
            )}

            {isCommentModalOpen && <CommentModal post={selectedPost} onClose={() => setIsCommentModalOpen(false)} currentUser={user} />}

            {showLeaveConfirm && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(5px)", WebkitBackdropFilter: "blur(5px)", display: "flex", alignItems: "center", justifyContent: "center", animation: "fadeIn 0.2s ease-out" }} onClick={() => setShowLeaveConfirm(false)}>
                    <div style={{ background: "#1c1c1e", width: 290, borderRadius: 18, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 24px 48px rgba(0,0,0,0.6)", display: "flex", flexDirection: "column", overflow: "hidden", animation: "popIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)" }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: "24px 20px 20px", textAlign: "center" }}>
                            <h3 style={{ color: "#ffffff", fontSize: "1.05rem", fontWeight: 600, margin: "0 0 6px", letterSpacing: "-0.01em" }}>Leave this community?</h3>
                            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", lineHeight: 1.4, margin: 0 }}>You'll need to rejoin to see <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{community?.name}</strong>'s content again.</p>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
                            <button onClick={() => setShowLeaveConfirm(false)} style={{ background: "transparent", border: "none", borderBottom: "1px solid rgba(255,255,255,0.08)", padding: 16, fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", color: "#ffffff", fontWeight: 400, transition: "background 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Cancel</button>
                            <button onClick={handleLeave} style={{ background: "transparent", border: "none", padding: 16, fontSize: "1rem", cursor: "pointer", fontFamily: "inherit", color: "#ff453a", fontWeight: 600, transition: "background 0.15s ease" }} onMouseEnter={e => e.currentTarget.style.background = "rgba(255,69,58,0.1)"} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>Leave</button>
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