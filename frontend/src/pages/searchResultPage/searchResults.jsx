import Header from "../../components/pagelayout/header/header"
import SidebarNav from "../../components/pagelayout/sidebarnav/sideBarNav"
import { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import PostCard from '../../components/posts/postCard'
import styles from './searchResults.module.css'
import CommunityCard from '../../components/communityCard/communityCard'
import { X as XIcon } from 'lucide-react';
import API from '../../config';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import useTheme from '../../hooks/useTheme';

export default function SearchResults() {
    const { theme, toggleTheme } = useTheme();
    const [user, setUser] = useState(null);
    const [filter, setFilter] = useState("All");
    const [results, setResults] = useState({ people: [], communities: [], posts: [], pages: [] });
    const [loading, setLoading] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    const [searchParams] = useSearchParams();
    const query = searchParams.get("q") || "";
    const navigate = useNavigate();
    const token = localStorage.getItem("access");

    const filters = [
        { key: "All", label: "All" },
        { key: "Posts", label: "Posts" },
        { key: "Communities", label: "Communities" },
        { key: "Pages", label: "Pages" },
        { key: "People", label: "People" },
    ];

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    // Fetch current user
    useEffect(() => {
        if (!token) return;
        const fetchUser = async () => {
            try {
                const res = await fetch(`${API}/api/auth/me/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) setUser(await res.json());
            } catch (e) { console.error(e); }
        };
        fetchUser();
    }, []);

    const rawAvatar = user?.profile?.avatar || user?.avatar || user?.profile_image;
    const avatarSrc = rawAvatar
        ? (rawAvatar.startsWith("http") ? rawAvatar : `${API}${rawAvatar}`)
        : ProfilePicture;

    // Fetch search results whenever query changes
    useEffect(() => {
        if (!query.trim()) return;
        const fetchResults = async () => {
            setLoading(true);
            try {
                const res = await fetch(
                    `${API}/api/search/?q=${encodeURIComponent(query)}&dropdown=false`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.ok) setResults(await res.json());
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetchResults();
    }, [query]);

    // What to show based on active filter
    const visiblePeople = (filter === "All" || filter === "People") ? (results.people || []) : [];
    const visibleCommunities = (filter === "All" || filter === "Communities") ? (results.communities || []) : [];
    const visiblePages = (filter === "All" || filter === "Pages") ? (results.pages || []) : [];
    const visiblePosts = (filter === "All" || filter === "Posts") ? (results.posts || []) : [];

    const totalCount = visiblePeople.length + visibleCommunities.length + visiblePages.length + visiblePosts.length;

    const avatarUrl = (url) => url
        ? url.startsWith("http") ? url : `${API}${url}`
        : "/default-avatar.png";

    const resultsContent = (
        <div className={styles.resultsContainer} style={isMobile ? { minWidth: 0, width: "100%" } : {}}>
            <h1 className={styles.title}>
                <span className={styles.highlight}>Search</span> Results for "{query}"
            </h1>

            <div className={styles.filters}>
                {filters.map(f => (
                    <button
                        key={f.key}
                        className={`${styles.filterBtn} ${filter === f.key ? styles.active : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                        {f.key !== "All" && (() => {
                            const count =
                                f.key === "People" ? results.people?.length :
                                    f.key === "Communities" ? results.communities?.length :
                                        f.key === "Pages" ? results.pages?.length :
                                            f.key === "Posts" ? results.posts?.length : 0;
                            return count > 0 ? <span className={styles.filterCount}>{count}</span> : null;
                        })()}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className={styles.notice}>Searching...</div>
            ) : !query.trim() ? (
                <div className={styles.notice}>Enter a search term to see results.</div>
            ) : totalCount === 0 ? (
                <div className={styles.notice}>No results found for "{query}"</div>
            ) : (
                <div className={styles.results}>
                    <div className={styles.innerContainer} style={isMobile ? { minWidth: 0 } : {}}>
                        {visiblePeople.length > 0 && (
                            <section className={styles.section}>
                                {filter === "All" && <h2 className={styles.sectionTitle}>People</h2>}
                                <div className={styles.cardGrid}>
                                    {visiblePeople.map(person => (
                                        <div key={person.id} className={styles.personCard} onClick={() => navigate(`/profile/${person.id}`)}>
                                            <img src={(() => {
                                                const av = person.profile?.avatar || person.profile?.profile_image || person.avatar_url || person.avatar;
                                                if (!av) return "/default-avatar.png";
                                                return av.startsWith("http") ? av : `${API}${av}`;
                                            })()} alt="" className={styles.personAvatar} />
                                            <div className={styles.personName}>{person.full_name || person.username}</div>
                                            <div className={styles.personSub}>@{person.username}</div>
                                            {person.university && <div className={styles.personSub}>{person.university}</div>}
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {visibleCommunities.length > 0 && (
                            <section className={styles.section}>
                                {filter === "All" && <h2 className={styles.sectionTitle}>Communities</h2>}
                                <div className={styles.communityStack}>
                                    {visibleCommunities.map(c => (
                                        <CommunityCard
                                            key={c.id}
                                            community={c}
                                            variant="large"
                                            setCommunities={(updater) => {
                                                setResults(prev => ({
                                                    ...prev,
                                                    communities: typeof updater === 'function' ? updater(prev.communities) : updater
                                                }));
                                            }}
                                        />
                                    ))}
                                </div>
                            </section>
                        )}

                        {visiblePages.length > 0 && (
                            <section className={styles.section}>
                                {filter === "All" && <h2 className={styles.sectionTitle}>Pages</h2>}
                                <div className={styles.listStack}>
                                    {visiblePages.map(p => (
                                        <div key={p.id} className={styles.listItem} onClick={() => navigate(`/profile/${p.id}`)}>
                                            {p.profile_image ? (
                                                <img src={p.profile_image} alt={p.page_full_name} className={styles.listAvatar} style={{ borderRadius: 10, objectFit: 'cover' }} />
                                            ) : (
                                                <div className={styles.listAvatarPlaceholder}>📄</div>
                                            )}
                                            <div className={styles.listInfo}>
                                                <div className={styles.listName}>{p.page_full_name}</div>
                                                <div className={styles.listSub}>Page{p.page_type ? ` · ${p.page_type}` : ""}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {visiblePosts.length > 0 && (
                            <section className={styles.section}>
                                {filter === "All" && <h2 className={styles.sectionTitle}>Posts</h2>}
                                <div className={styles.postsStack}>
                                    {visiblePosts.map(post => (
                                        <PostCard key={post.id} post={post} openComments={setSelectedPost} isOwnProfile={false} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

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
                    MOBILE DRAWER
                ══════════════════════════════════════ */}
            {isMobile && mobileMenuOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 9998 }}>
                    <div
                        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
                        onClick={() => setMobileMenuOpen(false)}
                    />
                    <div
                        ref={mobileMenuRef}
                        style={{
                            position: "absolute", left: 0, top: 0,
                            height: "100%", width: "75vw", maxWidth: 350,
                            background: "linear-gradient(135deg, var(--bg-main), var(--bg-secondary))",
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
                            <XIcon size={16} color="white" />
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: 1, cursor: 'pointer' }} onClick={() => navigate('/home')}>CAMPUS</span>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            <SidebarNav onClose={() => setMobileMenuOpen(false)} />
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP HEADER
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.header} ${styles.page}`}>
                    <Header theme={theme} toggleTheme={toggleTheme} user={user} />
                </div>
            )}

            {/* ══════════════════════════════════════
                    MOBILE BODY
                ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box", padding: "12px 10px 0 10px" }}>
                    {resultsContent}
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP BODY
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SidebarNav />
                    {resultsContent}
                </div>
            )}
        </div>
    );
}