import styles from './joinedCommunties.module.css'
import { useEffect, useState, useRef } from 'react'
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav'
import { useNavigate } from "react-router-dom";
import CommunityCard from '../../components/communityCard/communityCard'
import API from '../../config';
import useTheme from '../../hooks/useTheme'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import MobileDrawer from '../../components/mobileDrawer/MobileDrawer';
import { useUser } from '../../context/UserContext';
export default function FollowedCommunities() {
    const { theme, toggleTheme } = useTheme();
    const { user: currentUser, avatarSrc } = useUser();
    const [searchTerm, setSearchTerm] = useState('');
    const [pageLoading, setPageLoading] = useState(true);
    const [communities, setCommunities] = useState([]);
    const [recommended, setRecommended] = useState([]);
    const [expandedIds, setExpandedIds] = useState({});
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const token = localStorage.getItem("access");

    const toggleExpand = (id) => {
        setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
    };
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            setPageLoading(true);
            try {
                const token = localStorage.getItem("access");
                if (!token) return;

                const headers = { Authorization: `Bearer ${token}` };

                const [joinedRes, recommendedRes] = await Promise.all([
                    fetch(`${API}/api/communities/?filter=joined`, { headers }),
                    fetch(`${API}/api/communities/?filter=recommended`, { headers })
                ]);

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
                setPageLoading(false);
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
            <MobileDrawer isOpen={isMobile && mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} theme={theme} toggleTheme={toggleTheme} variant='profile' currentUser={currentUser} />

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