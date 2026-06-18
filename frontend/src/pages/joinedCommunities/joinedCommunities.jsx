import styles from './joinedCommunties.module.css'
import { useEffect, useState, useRef } from 'react'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useNavigate } from "react-router-dom";
import CommunityCard from '../../components/communityCard/communityCard'
import API from '../../config';
import useTheme from '../../hooks/useTheme'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import { X } from 'lucide-react';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
export default function FollowedCommunities() {
    const { theme, toggleTheme } = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [userLoading, setUserLoading] = useState(true);
    const [userError, setUserError] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [communities, setCommunities] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [expandedIds, setExpandedIds] = useState({});
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);
    const token = localStorage.getItem("access");

    const toggleExpand = (id) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setUserLoading(true);
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const headers = { Authorization: `Bearer ${token}` };

                const [userRes, joinedRes, recommendedRes] = await Promise.all([
                    fetch(`${API}/api/auth/me/`, { headers }),
                    fetch(`${API}/api/communities/?filter=joined`, { headers }),
                    fetch(`${API}/api/communities/?filter=recommended`, { headers })
                ]);

                if (userRes.ok) setCurrentUser(await userRes.json());

                if (joinedRes.ok) {
                    const joinedData = await joinedRes.json();
                    setCommunities(joinedData.map(c => ({ ...c, bgImage: c.image })));
                }

                if (recommendedRes.ok) {
                    const recData = await recommendedRes.json();

                    /* Optional: Filter out communities the user is already in 
                       from the recommended list so they don't see duplicates.
                    */
                    const filteredRecs = recData
                        .filter(c => !c.is_joined)
                        .map(c => ({ ...c, bgImage: c.image }));

                    setRecommended(filteredRecs);
                }

            } catch (err) {
                console.error("Fetch Error:", err);
            } finally {
                setUserLoading(false);
            }
        };

        fetchData();
    }, []);


    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);

    useEffect(() => {
        document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [mobileMenuOpen]);

    const rawAvatar = currentUser?.profile?.avatar || currentUser?.avatar || currentUser?.profile_image;
    const avatarSrc = rawAvatar
        ? (rawAvatar.startsWith("http") ? rawAvatar : `${API}${rawAvatar}`)
        : ProfilePicture;

    const communitiesList = (
        <>
            <h1 className={styles.title}>
                <span className={styles.highlight}>Communities</span> You Joined
            </h1>
            {communities.length > 0 ? (
                <div className={styles.postContainer} style={isMobile ? { minWidth: 0 } : {}}>
                    <div className={styles.innerContainer}>
                        {communities.map((community, index) => (
                            <div key={community.id} className={styles.itemWrapper}>
                                <CommunityCard community={community} variant="large" setCommunities={setCommunities} />
                                {index !== communities.length - 1 && <div className={styles.dividerOne} />}
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>🏘️</span>
                    <h2 className={styles.emptyTitle}>No communities yet</h2>
                    <p className={styles.emptySubtitle}>You haven't joined any communities yet.</p>
                </div>
            )}
        </>
    );

    return (
        <div className={styles.darkContainer} data-theme={theme}>
            {/* ══════════════════════════════════════
                    MOBILE HEADER BAR
                ══════════════════════════════════════ */}
            {isMobile && (
                <MobileHeader
                    avatarSrc={avatarSrc}
                    user={currentUser}
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
                            <X size={16} color="white" />
                        </button>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "20px 16px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                            <img src={darkModeIcon} alt="Logo" style={{ height: 40 }} />
                            <span style={{ color: "#fff", fontWeight: 800, fontSize: "1.3rem", letterSpacing: 1, cursor: 'pointer' }} onClick={() => navigate('/home')}>CAMPUS</span>
                        </div>
                        <div style={{ flex: 1, overflowY: "auto" }}>
                            <SideBarNav variant="profile" currentUser={currentUser} onClose={() => setMobileMenuOpen(false)} />
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
                    MOBILE BODY — no recommended panel
                ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box", padding: "12px 10px 0 10px" }}>
                    <div className={styles.followedCommunitiesPosts}>
                        {communitiesList}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP BODY
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SideBarNav variant="profile" currentUser={currentUser} />
                    <div className={styles.followedCommunitiesPosts}>
                        {communitiesList}
                    </div>
                    <div className={styles.rightSection}>
                        <div className={styles.rightSectionWrapper}>
                            <div className={styles.pill}>RECOMMENDED COMMUNITIES</div>
                            <div className={styles.rightCard}>
                                <div className={styles.rightList}>
                                    {recommended
                                        .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map((community, index, arr) => (
                                            <div key={community.id} className={styles.communityWrapper}>
                                                <CommunityCard community={community} variant="small" setCommunities={setCommunities} />
                                                {index !== arr.length - 1 && <div className={styles.dividerTwo} />}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}