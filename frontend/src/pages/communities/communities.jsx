import styles from './communities.module.css';
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import CommunityCard from '../../components/communityCard/communityCard'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import { useState, useEffect, useRef } from 'react';
import { X, Menu } from 'lucide-react';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';

export default function Community() {
    const [theme, setTheme] = useState('dark');
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState(null)
    const [communities, setCommunities] = useState([]);
    const [filter, setFilter] = useState("recommended");
    const [friendsCommunities, setFriendsCommunities] = useState([]);
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

    const API = "http://localhost:8000";
    const token = localStorage.getItem("access");

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
        const fetchFriendsRelated = async () => {
            try {
                const res = await fetch(`${API}/api/communities/?filter=friends_related`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setFriendsCommunities(data.map(c => ({
                    ...c,
                    isJoined: c.is_joined,
                    isVerified: c.is_verified,
                    isPrivate: c.is_private,
                    requestSent: c.request_sent
                })));
            } catch (err) {
                console.error("Error fetching friends related communities:", err);
            }
        };
        fetchFriendsRelated();
    }, []);

    const loadUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setUser(data);
        } catch (err) {
            console.error("Failed to load user");
        }
    };

    useEffect(() => {
        const fetchCommunities = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API}/api/communities/?filter=${filter}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setCommunities(data.map(c => ({
                    ...c,
                    isJoined: c.is_joined,
                    isVerified: c.is_verified,
                    isPrivate: c.is_private,
                    requestSent: c.request_sent
                })));
            } catch (err) {
                console.error("Error fetching communities:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCommunities();
    }, [filter]);

    useEffect(() => { loadUser(); }, []);

    const toggleTheme = () => setTheme(p => p === 'light' ? 'dark' : 'light');

    const avatarSrc = user?.avatar
        ? user.avatar.startsWith("http") ? user.avatar : `${API}${user.avatar}`
        : "/default-avatar.png";

    // All filters including friends_related on mobile
    const mobileFilters = [
        { key: "recommended", label: "Recommended" },
        { key: "joined", label: "Joined" },
        { key: "popular", label: "Popular" },
        { key: "trending", label: "Trending" },
        { key: "friends_related", label: "Friends" },
    ];

    const desktopFilters = [
        { key: "recommended", label: "Recommended" },
        { key: "joined", label: "Joined" },
        { key: "popular", label: "Popular" },
        { key: "trending", label: "Trending" },
    ];

    // What to show in the main list on mobile — friends_related uses its own data
    const displayedCommunities = (isMobile && filter === "friends_related")
        ? friendsCommunities
        : communities;

    return (
        <div className={styles.darkContainer}>

            {/* ── MOBILE HEADER ── */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={user}
                    setMobileMenuOpen={setMobileMenuOpen}
                    token={token}
                    API={API}
                />
            )}

            {/* ── MOBILE DRAWER ── */}
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
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box", padding: "12px 10px 0" }}>
                    <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "rgba(255,255,255,0.85)", margin: "0 0 12px" }}>
                        Looking for <span style={{
                            background: "linear-gradient(30deg, #c72cff, #8b2dff)",
                            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                        }}>COMMUNITIES</span>?
                    </h1>

                    {/* Scrollable filter row — includes Friends */}
                    <div style={{
                        display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8,
                        scrollbarWidth: "none", msOverflowStyle: "none"
                    }}>
                        {mobileFilters.map(f => (
                            <button
                                key={f.key}
                                onClick={() => setFilter(f.key)}
                                style={{
                                    flexShrink: 0, padding: "8px 16px", borderRadius: 999,
                                    border: "none", fontSize: "0.82rem", cursor: "pointer",
                                    fontWeight: filter === f.key ? 600 : 400,
                                    background: filter === f.key ? "#4a4a4a" : "#2a2a2a",
                                    color: filter === f.key ? "#fff" : "#aaa",
                                    boxShadow: filter === f.key ? "0 0 0 1px rgba(255,255,255,0.1)" : "none",
                                    transition: "all 0.2s ease",
                                }}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Communities list */}
                    <div style={{
                        background: "linear-gradient(-90deg, rgba(166,39,156,0.95), rgba(49,32,169,0.95))",
                        paddingTop: 6, borderRadius: "20px 20px 0 0", marginTop: 12
                    }}>
                        <div style={{
                            background: "#333333", borderRadius: "20px 20px 0 0",
                            padding: "20px 10px 30px", display: "flex", flexDirection: "column", gap: 16
                        }}>
                            {loading ? (
                                <p style={{ color: "rgba(255,255,255,0.5)", padding: "0 10px" }}>Loading...</p>
                            ) : displayedCommunities.length === 0 ? (
                                <p style={{ color: "rgba(255,255,255,0.4)", padding: "0 10px" }}>No communities found.</p>
                            ) : displayedCommunities.map((community, index) => (
                                <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%" }}>
                                    <CommunityCard
                                        community={community}
                                        setCommunities={filter === "friends_related" ? setFriendsCommunities : setCommunities}
                                    />
                                    {index !== displayedCommunities.length - 1 && (
                                        <div style={{
                                            height: 1, width: "50%", margin: "16px auto 0",
                                            background: "linear-gradient(transparent, rgba(255,255,255,0.12), transparent)"
                                        }} />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── DESKTOP BODY ── */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SideBarNav theme={theme} toggleTheme={toggleTheme} user={user} />
                    <div className={styles.mainContent}>
                        <h1 className={styles.title}>
                            Looking for - <br /> <span className={styles.highlight}>COMMUNITIES</span> to be part of?
                        </h1>
                        <div className={styles.filters}>
                            {desktopFilters.map(f => (
                                <button
                                    key={f.key}
                                    className={`${styles.filterBtn} ${filter === f.key ? styles.active : ""}`}
                                    onClick={() => setFilter(f.key)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className={styles.communitiesContainer}>
                            <div className={styles.innerContainer}>
                                {communities.map((community, index) => (
                                    <div key={index} className={styles.itemWrapper}>
                                        <CommunityCard community={community} setCommunities={setCommunities} />
                                        {index !== communities.length - 1 && <div className={styles.divider} />}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className={styles.rightSection}>
                        <div className={styles.pill}>FRIENDS RELATED</div>
                        <div className={styles.rightCard}>
                            <div className={styles.rightList}>
                                {friendsCommunities.map((community, index) => (
                                    <CommunityCard
                                        key={index}
                                        community={community}
                                        setCommunities={setFriendsCommunities}
                                        variant="small"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}