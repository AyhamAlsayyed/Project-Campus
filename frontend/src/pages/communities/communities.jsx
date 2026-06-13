import styles from './communities.module.css';
import Header from '../../components/pagelayout/header/header'
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import CommunityCard from '../../components/communityCard/communityCard'
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import { useState, useEffect, useRef } from 'react';
import { X, Menu } from 'lucide-react';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import Palette from '../../Assets/icons/palette.png'
import Arrow from '../../Assets/icons/arrow-right.png'
import RequestModal from '../../components/CommunityRequest/RequestModal'
import CommunityInfoPanel from '../../components/communitySettings/CommunityInfoPanel';
import CommunitySettingsNav from '../../components/communitySettings/CommunitySettingsNav';
import MembersTab from '../../components/communitySettings/membersTab';
import RequestsTab from '../../components/communitySettings/requestsTab';
import CommunityPosts from '../../components/communitySettings/CommunityPosts';
import DefaultBanner from '../../Assets/Pictures/default-community-banner.png';
import DeleteCommunityModal from '../../components/communitySettings/deleteCommunityModal';
import { createPortal } from 'react-dom';
import AdIcon from '../../Assets/icons/ad.png';
import ArrowLeftIcon from '../../Assets/icons/arrow-left.png';
import CreateCommunityIcon from '../../Assets/icons/create-group.png';
import CreateCommunityForm from '../../components/createCommunity/CreateCommunity';
import CommunityPermissions from '../../components/createCommunity/CommunityPermissions';

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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [ownedCommunities, setOwnedCommunities] = useState([]);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [activeCommunity, setActiveCommunity] = useState(null);
    const [activeTab, setActiveTab] = useState('Community info');
    const isUserPage = ["page", "uni"].includes(localStorage.getItem("user_type"));
    const isUni = localStorage.getItem("user_type") === "uni";
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [promoDurationIdx, setPromoDurationIdx] = useState(2);
    const [showCreateCommunityModal, setShowCreateCommunityModal] = useState(false);
    const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
    const [postApproval, setPostApproval] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [promoCart, setPromoCart] = useState([]);
    const [selectedPromoCommunityId, setSelectedPromoCommunityId] = useState(null);
    const [isCommunityDropdownOpen, setIsCommunityDropdownOpen] = useState(false);

    const [whoCanPost, setWhoCanPost] = useState({
        'Everyone': true,
        'Members only': false,
        'Admins only': false,
    });
    const handleWhoCanPostChange = (opt) => {
        setWhoCanPost({ 'Everyone': false, 'Members only': false, 'Admins only': false, [opt]: true });
    };

    const [requestSent, setRequestSent] = useState(
        () => localStorage.getItem("community_request_sent") === "true"
    );
    const [prevTab, setPrevTab] = useState('Community info');
    const displayedTab = activeTab === 'Delete' ? prevTab : activeTab;
    const durationOptions = [
        { label: '1 week', cost: 4.99 },
        { label: '1 month', cost: 9.99 },
        { label: '3 months', cost: 14.99 },
        { label: '6 months', cost: 24.99 },
        { label: '1 year', cost: 49.99 }
    ];

    useEffect(() => {
        if (activeTab !== 'Delete') {
            setPrevTab(activeTab);
        }
    }, [activeTab]);

    const API = "http://localhost:8000";
    const token = localStorage.getItem("access");
    useEffect(() => {
        const fetchOwned = async () => {
            try {
                const res = await fetch(`${API}/api/communities/?filter=owned`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await res.json();
                setOwnedCommunities(data.map(c => ({
                    ...c,
                    isJoined: c.is_joined,
                    isVerified: c.is_verified,
                    isPrivate: c.is_private,
                    requestSent: c.request_sent
                })));
            } catch (err) {
                console.error("Error fetching owned communities:", err);
            }
        };
        fetchOwned();
    }, []);
    useEffect(() => {
        const fetchPromoCart = async () => {
            try {
                const res = await fetch(`${API}/api/communities/promotions/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setPromoCart(data.map(item => ({
                        id: item.id,
                        communityId: item.community_id,
                        community: ownedCommunities.find(c => c.id === item.community_id) || { name: item.community_name },
                        durationIdx: item.duration_idx,
                        label: item.duration,
                        cost: item.cost,
                    })));
                }
            } catch (err) { console.error("Failed to load promo cart:", err); }
        };
        if (token) fetchPromoCart();
    }, [ownedCommunities]);

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
    useEffect(() => {
        document.documentElement.setAttribute("data-theme", theme);
    }, [theme]);

    const loadUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (data.role === 'university' || localStorage.getItem('user_type') === 'uni') {
                const pageRes = await fetch(`${API}/api/pages/${data.id}/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (pageRes.ok) {
                    const pageData = await pageRes.json();
                    data.avatar = pageData.profile_image;
                }
            }

            setUser(data);
        } catch (err) { console.error("Failed to load user"); }
    };

    useEffect(() => {
        const checkRequestStatus = async () => {
            try {
                const res = await fetch(`${API}/api/communities/request/status/`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.has_requested) {
                        setRequestSent(true);
                        localStorage.setItem("community_request_sent", "true");
                    } else {
                        // ← clear stale localStorage value
                        setRequestSent(false);
                        localStorage.removeItem("community_request_sent");
                    }
                }
            } catch (e) { console.error(e); }
        };
        checkRequestStatus();
    }, []);

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

                    {/* --- MAIN MIDDLE CONTAINER --- */}
                    <div className={styles.mainContent}>
                        {settingsOpen ? (
                            <div className={styles.communitiesContainer} style={{ marginTop: "4%" }}>
                                <div key={displayedTab} style={{ animation: 'tabFadeIn 0.25s ease forwards' }}></div>
                                {(displayedTab === 'Settings' || displayedTab === 'Community info') && (
                                    <CommunityInfoPanel
                                        community={activeCommunity}
                                        onBack={() => setSettingsOpen(false)}
                                    />
                                )}
                                {displayedTab === 'Members' && (
                                    <MembersTab
                                        communityId={activeCommunity?.id}
                                        onBack={() => setActiveTab('Community info')}
                                    />
                                )}
                                {displayedTab === 'Requests' && (
                                    <RequestsTab
                                        communityId={activeCommunity?.id}
                                        token={token}
                                        onBack={() => setActiveTab('Community info')}
                                        isPublic={activeCommunity?.is_public}
                                    />
                                )}
                                {displayedTab === 'Posts' && (
                                    <CommunityPosts
                                        onBack={() => setActiveTab('Community info')}
                                        communityId={activeCommunity?.id}
                                        token={token}
                                    />
                                )}
                            </div>
                        ) : showCreateCommunityModal && isUserPage ? (
                            <>
                                <div className={styles.communitiesContainer}>
                                    <div style={{ animation: 'tabFadeIn 0.25s ease forwards' }}>
                                        <CreateCommunityForm
                                            onBack={() => setShowCreateCommunityModal(false)}
                                            onSuccess={(id, community) => {
                                                setOwnedCommunities(prev => [...prev, {
                                                    ...community,
                                                    isJoined: true,
                                                    isVerified: false,
                                                    isPrivate: community.is_private,
                                                    requestSent: false,
                                                }]);
                                                setShowCreateCommunityModal(false);
                                            }}
                                        />
                                    </div>
                                </div>


                            </>
                        ) : (

                            <>
                                {ownedCommunities.length > 0 && (
                                    <>
                                        <div className={styles.yourCommunitiesHeader}>
                                            <h1 className={styles.title}>
                                                Your <span className={styles.highlight}>COMMUNITIES</span>
                                            </h1>
                                            {isUserPage && (
                                                <div
                                                    className={styles.createCommunityBtn}
                                                    onClick={() => {
                                                        (user?.is_premium || isUni) ? setShowCreateCommunityModal(true) : setIsModalOpen(true);
                                                    }}
                                                    style={{
                                                        display: "flex", alignItems: "center", justifyContent: "center",
                                                        padding: "8px", cursor: "pointer", transition: "background 0.2s"
                                                    }}
                                                >
                                                   <img src={CreateCommunityIcon} alt="" className={styles.createCommunityIcon} />
                                                </div>
                                            )}
                                        </div>
                                        <div className={styles.ownedCommunitiesContainer} style={{ minHeight: "unset", padding: "30px 0" }}>
                                            {ownedCommunities.map((community, index) => (
                                                <div key={index} className={styles.itemWrapper}>
                                                    <div style={{ width: "100%", maxWidth: "100%" }}>
                                                        <CommunityCard
                                                            community={community}
                                                            setCommunities={setOwnedCommunities}
                                                            fullWidth
                                                            isOwned
                                                            onSettingsClick={(c) => { setActiveCommunity(c); setSettingsOpen(true); setActiveTab('Community info'); }}
                                                        />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={styles.divider} style={{ width: "50%", margin: "16px auto", backgroundColor: "#747475" }} />
                                    </>
                                )}

                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                    <h1 className={styles.title}>
                                        Looking for - <br /> <span className={styles.highlight}>COMMUNITIES</span> to be part of?
                                    </h1>
                                    {isUserPage && ownedCommunities.length === 0 && (
                                        <div className={styles.createCommunityBtn} onClick={() => {
                                            (user?.is_premium || isUni) ? setShowCreateCommunityModal(true) : setIsModalOpen(true);

                                        }} style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "8px", cursor: "pointer" }}>
                                            <img src={CreateCommunityIcon} alt="" className={styles.createCommunityIcon} />
                                        </div>
                                    )}
                                </div>
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
                            </>
                        )}
                    </div>


                    <div className={styles.rightSection} style={{ marginTop: settingsOpen ? "2%" : "4%", flex: isUserPage ? " 0 0 420px;" : "0 0 380px" }}>
                        {settingsOpen ? (
                            <CommunitySettingsNav
                                activeTab={activeTab}
                                setActiveTab={setActiveTab}
                            />
                        ) : showCreateCommunityModal && isUserPage ? (
                            <>

                                <div style={{ animation: 'tabFadeIn 0.25s ease forwards' }}>
                                    <CommunityPermissions
                                        postApproval={postApproval}
                                        onPostApprovalChange={setPostApproval}
                                        whoCanPost={whoCanPost}
                                        onWhoCanPostChange={handleWhoCanPostChange}
                                    />
                                </div>
                                <div className={styles.promoContainer}>
                                    <div className={styles.promoHeaderContainer}>
                                        <div className={styles.promoIconColored}></div>
                                        <h3 className={styles.promoTitle}>Community Promotion</h3>
                                    </div>
                                    <div className={styles.promoBodyContainer}>
                                        <p className={styles.promoText}>Manage your promotion plan and get more users to notice your community.</p>
                                        <button className={styles.promoManageBtn} onClick={() => setIsPromoModalOpen(true)}>Manage</button>
                                    </div>
                                </div>
                            </>
                        ) : isUserPage ? (

                            <>
                                <div className={styles.pillContainer}>
                                    <div className={styles.pill} style={{ width: "25%", left: "7%", top: "-40px" }}>
                                        ON-HOLD
                                    </div>
                                </div>

                                <div className={styles.onHoldContainer}>
                                    <div className={styles.pendingText}>
                                        {promoCart.length} Pending checkout
                                    </div>
                                    <div className={styles.onHoldDivider}></div>

                                    <div className={styles.checkoutList}>
                                        {promoCart.length === 0 ? (
                                            <p style={{
                                                color: 'rgba(255,255,255,0.35)', fontSize: '0.82rem',
                                                textAlign: 'center', padding: '16px 0'
                                            }}>
                                                No promotions queued. Use "Manage" below to add one.
                                            </p>
                                        ) : promoCart.map(item => {
                                            const imgSrc = item.community.banner || item.community.image
                                                ? ((item.community.banner || item.community.image)?.startsWith('http')
                                                    ? (item.community.banner || item.community.image)
                                                    : `${API}${item.community.banner || item.community.image}`)
                                                : '/default-banner.png';
                                            return (
                                                <div key={item.communityId} className={styles.checkoutItemWrap}>
                                                    <div className={styles.checkoutCard}>
                                                        <img
                                                            src={imgSrc}
                                                            alt={item.community.name}
                                                            className={styles.checkoutBannerImg}
                                                        />
                                                        <div className={styles.checkoutOverlay}>
                                                            <div className={styles.checkoutOverlayLeft}>
                                                                <h4 className={styles.checkoutTitle}>{item.community.name}</h4>
                                                                <p className={styles.checkoutDesc}>
                                                                    {item.community.description?.substring(0, 50)}
                                                                    {item.community.description?.length > 50 && '...'}
                                                                </p>
                                                            </div>
                                                            <button
                                                                className={styles.detailsBtn}
                                                                onClick={async () => {
                                                                    if (item.id) {
                                                                        await fetch(`${API}/api/communities/promotions/${item.id}/delete`, {
                                                                            method: "DELETE",
                                                                            headers: { Authorization: `Bearer ${token}` }
                                                                        });
                                                                    }
                                                                    setPromoCart(prev => prev.filter(c => c.communityId !== item.communityId));
                                                                }}
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className={styles.checkoutSubInfo}>
                                                        <span>Plan: {item.label} promotion</span>
                                                        <span>Price: ${item.cost.toFixed(2)}</span>
                                                    </div>
                                                    <div className={styles.onHoldDivider}></div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className={styles.checkoutBottom}>
                                        <span className={styles.totalText}>
                                            Total: ${promoCart.reduce((sum, item) => sum + item.cost, 0).toFixed(2)}
                                        </span>
                                        <button
                                            className={styles.proceedBtn}
                                            onClick={() => promoCart.length > 0 && setIsCheckoutModalOpen(true)}
                                            disabled={promoCart.length === 0}
                                            style={promoCart.length === 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                                        >
                                            Proceed to check-out
                                        </button>
                                    </div>
                                </div>

                                <div className={styles.promoContainer}>
                                    <div className={styles.promoHeaderContainer}>
                                        <div className={styles.promoIconColored}></div>
                                        <h3 className={styles.promoTitle}>Community Promotion</h3>
                                    </div>
                                    <div className={styles.promoBodyContainer}>
                                        <p className={styles.promoText}>
                                            Manage your promotion plan and get more users to notice your community.
                                        </p>
                                        <button className={styles.promoManageBtn} onClick={() => setIsPromoModalOpen(true)}>
                                            Manage
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (

                            <>
                                <div className={styles.pill} style={{ left: "20px" }}>FRIENDS RELATED</div>
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

                                <div className={styles.communityRequest} style={{ position: "relative", overflow: "hidden" }}>
                                    {requestSent && (
                                        <div style={{
                                            position: "absolute", inset: 0,
                                            background: "rgba(35, 35, 36, 0.4)",
                                            borderRadius: "inherit",
                                            display: "flex", flexDirection: "column",
                                            alignItems: "center", justifyContent: "center",
                                            gap: 8, zIndex: 10, backdropFilter: "blur(0.9px)",
                                        }} />
                                    )}
                                    <div className={styles.requestHeader}>
                                        <div className={styles.paletteIcon} style={{ maskImage: `url(${Palette})`, WebkitMaskImage: `url(${Palette})` }} />
                                        <h3 className={styles.requestTitle}>Request a community</h3>
                                    </div>
                                    <div className={styles.requestBody}>
                                        <p className={styles.requestText}>
                                            Can't find your community?<br />
                                            Request one and we'll review it.
                                        </p>
                                        {requestSent ? (
                                            <span style={{ color: "white", fontSize: "0.85rem", fontWeight: 500, letterSpacing: 1 }}>
                                                Waiting...
                                            </span>
                                        ) : (
                                            <button className={styles.applyButton} onClick={() => setIsModalOpen(true)}>
                                                Apply
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {activeTab === 'Delete' && (
                <DeleteCommunityModal
                    isOpen={true}
                    onClose={() => setActiveTab(prevTab)}
                    onDelete={() => {
                        setSettingsOpen(false);
                        setOwnedCommunities(prev => prev.filter(c => c.id !== activeCommunity.id));
                    }}
                />
            )}
            {isModalOpen && (
                <RequestModal
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setRequestSent(true);
                        localStorage.setItem("community_request_sent", "true");
                        setIsModalOpen(false);
                    }}
                    API={API}
                />
            )}
            {isPromoModalOpen && createPortal(
                <div className={styles.promoModalOverlay} onClick={() => setIsPromoModalOpen(false)}>
                    <div className={styles.promoModalContent} onClick={e => e.stopPropagation()}>
                        <div className={styles.pmHeader}>
                            <div className={styles.pmHeaderLeft}>
                                <img src={ArrowLeftIcon} alt="Back" className={styles.pmBackIcon} onClick={() => setIsPromoModalOpen(false)} />
                                <div className={styles.pmAdIconWrapper}>
                                    <img src={AdIcon} alt="Ad" className={styles.pmAdIcon} />
                                </div>
                                <h2 className={styles.pmTitle}>Community Promotion</h2>
                            </div>
                            <div className={styles.pmHeaderRight}>
                                <span className={styles.pmCancelBtn} onClick={() => setIsPromoModalOpen(false)}>Cancel</span>
                                <button
                                    className={styles.pmDoneBtn}
                                    onClick={async () => {
                                        if (!selectedPromoCommunityId) { setIsPromoModalOpen(false); return; }
                                        const communityObj = ownedCommunities.find(c => c.id === selectedPromoCommunityId);
                                        if (!communityObj) return;

                                        const cartItem = {
                                            communityId: selectedPromoCommunityId,
                                            community: communityObj,
                                            durationIdx: promoDurationIdx,
                                            label: durationOptions[promoDurationIdx].label,
                                            cost: durationOptions[promoDurationIdx].cost,
                                        };

                                        try {
                                            const existingItem = promoCart.find(item => item.communityId === selectedPromoCommunityId);
                                            if (existingItem) {
                                                await fetch(`${API}/api/communities/promotions/${existingItem.id}/delete/`, {
                                                    method: "DELETE",
                                                    headers: { Authorization: `Bearer ${token}` }
                                                });
                                            }

                                            const res = await fetch(`${API}/api/communities/promotions/`, {
                                                method: "POST",
                                                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                                                body: JSON.stringify({
                                                    community_id: selectedPromoCommunityId,
                                                    duration: durationOptions[promoDurationIdx].label,
                                                    duration_idx: promoDurationIdx,
                                                    cost: durationOptions[promoDurationIdx].cost,
                                                })
                                            });

                                            if (res.ok) {
                                                const saved = await res.json();
                                                const newItem = { ...cartItem, id: saved.id };
                                                setPromoCart(prev => {
                                                    const filtered = prev.filter(i => i.communityId !== selectedPromoCommunityId);
                                                    return [...filtered, newItem];
                                                });
                                            }
                                        } catch (err) { console.error("Failed to save promotion:", err); }

                                        setIsPromoModalOpen(false);
                                        setSelectedPromoCommunityId(null);
                                        setPromoDurationIdx(2);
                                    }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                        <div className={styles.pmBody}>
                            <div className={styles.pmDividerSection}>
                                <div className={styles.pmDivider}></div>
                                <p className={styles.pmSubText}>
                                    Choose a promotion for your community ad, your community will start to appear more for users!
                                </p>
                            </div>

                            <h3 className={styles.pmSectionTitle}>Select community</h3>
                            {ownedCommunities.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', margin: '0 0 18px' }}>
                                    No communities found. Create one first.
                                </p>
                            ) : (
                                <div style={{ position: 'relative', marginBottom: 22 }}>
                                    {/* Trigger row */}
                                    <div
                                        onClick={() => setIsCommunityDropdownOpen(p => !p)}
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            background: '#2a2a2a', borderRadius: 8, padding: '10px 12px',
                                            cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)',
                                        }}
                                    >
                                        <span style={{ color: selectedPromoCommunityId ? 'white' : 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>
                                            {selectedPromoCommunityId
                                                ? ownedCommunities.find(c => c.id === selectedPromoCommunityId)?.name
                                                : '— Choose a community —'}
                                        </span>
                                        <img
                                            src={ArrowLeftIcon}
                                            alt=""
                                            style={{
                                                width: 14, height: 14,
                                                filter: 'brightness(0) invert(1)',
                                                transform: isCommunityDropdownOpen ? 'rotate(90deg)' : 'rotate(270deg)',
                                                transition: 'transform 0.2s ease',
                                                flexShrink: 0,
                                            }}
                                        />
                                    </div>

                                    {/* Dropdown list */}
                                    {isCommunityDropdownOpen && (
                                        <div style={{
                                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                                            background: '#333333', borderRadius: 8,
                                            border: '1px solid rgba(255,255,255,0.08)',
                                            zIndex: 100, overflow: 'hidden',
                                        }}>
                                            <div style={{
                                                maxHeight: 132, overflowY: 'auto',
                                                scrollbarWidth: 'thin',
                                                scrollbarColor: 'rgba(255,255,255,0.15) transparent',
                                            }}>
                                                {ownedCommunities.map((c, i) => (
                                                    <div key={c.id}>
                                                        <div
                                                            onClick={() => {
                                                                setSelectedPromoCommunityId(c.id);
                                                                const existing = promoCart.find(item => item.communityId === c.id);
                                                                if (existing) setPromoDurationIdx(existing.durationIdx);
                                                                setIsCommunityDropdownOpen(false);
                                                            }}
                                                            style={{
                                                                padding: '10px 12px', cursor: 'pointer',
                                                                color: selectedPromoCommunityId === c.id ? 'white' : 'rgba(255,255,255,0.75)',
                                                                fontSize: '0.9rem',
                                                                background: selectedPromoCommunityId === c.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                                transition: 'background 0.15s',
                                                            }}
                                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                                                            onMouseLeave={e => e.currentTarget.style.background = selectedPromoCommunityId === c.id ? 'rgba(255,255,255,0.07)' : 'transparent'}
                                                        >
                                                            <span>{c.name}</span>
                                                            {promoCart.find(item => item.communityId === c.id) && (
                                                                <span style={{ fontSize: '0.75rem', color: '#a855f7' }}>✓ in cart</span>
                                                            )}
                                                        </div>
                                                        {i !== ownedCommunities.length - 1 && (
                                                            <div style={{ height: 1, background: '#4D4D4D', margin: '10px auto 10px auto', width: "50%" }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <h3 className={styles.pmSectionTitle}>Select duration</h3>
                            <div className={styles.pmSliderWrapper}>
                                <input
                                    type="range"
                                    min="0"
                                    max={durationOptions.length - 1}
                                    step="1"
                                    value={promoDurationIdx}
                                    onChange={(e) => setPromoDurationIdx(Number(e.target.value))}
                                    className={styles.pmInvisibleSlider}
                                />
                                <div className={styles.pmSliderTrack}>
                                    <div className={styles.pmSliderFill} style={{ width: `${(promoDurationIdx / (durationOptions.length - 1)) * 100}%` }}></div>
                                </div>
                                <div className={styles.pmSliderDotsContainer}>
                                    {durationOptions.map((opt, i) => {
                                        const isActive = i === promoDurationIdx;
                                        const isFilled = i <= promoDurationIdx;
                                        const leftPos = (i / (durationOptions.length - 1)) * 100;
                                        return (
                                            <div key={i} className={styles.pmDotWrapper} style={{ left: `${leftPos}%` }}>
                                                <div className={`${styles.pmDot} ${isActive ? styles.pmDotActive : isFilled ? styles.pmDotFilled : ''}`}></div>
                                                <span className={`${styles.pmDotLabel} ${isActive ? styles.pmLabelActive : ''}`}>{opt.label}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className={styles.pmTotalCost}>
                                Total cost: <span className={styles.pmCostValue}>${durationOptions[promoDurationIdx].cost.toFixed(2)}</span>
                                <p className={styles.pmNote}>
                                    Note: The promotion will get proceeded once making sure the community has been created successfully!
                                </p>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {isCheckoutModalOpen && createPortal(
                <div className={styles.checkoutModalOverlay} onClick={() => setIsCheckoutModalOpen(false)}>
                    <div className={styles.checkoutModalContent} onClick={e => e.stopPropagation()}>
                        <h2 style={{ color: 'white', marginTop: 0, marginBottom: '24px', fontSize: '1.5rem' }}>Checkout</h2>

                        <div className={styles.checkoutInputGroup}>
                            <label className={styles.checkoutLabel}>Name on Card</label>
                            <input type="text" className={styles.checkoutInput} placeholder="John Doe" />
                        </div>

                        <div className={styles.checkoutInputGroup}>
                            <label className={styles.checkoutLabel}>Card Number</label>
                            <input type="text" className={styles.checkoutInput} placeholder="0000 0000 0000 0000" />
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <div className={styles.checkoutInputGroup} style={{ flex: 1 }}>
                                <label className={styles.checkoutLabel}>Expiry Date</label>
                                <input type="text" className={styles.checkoutInput} placeholder="MM/YY" />
                            </div>
                            <div className={styles.checkoutInputGroup} style={{ flex: 1 }}>
                                <label className={styles.checkoutLabel}>CVC</label>
                                <input type="text" className={styles.checkoutInput} placeholder="123" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <button className={styles.checkoutCancelBtn} onClick={() => setIsCheckoutModalOpen(false)}>
                                Cancel
                            </button>
                            <button className={styles.checkoutSubmitBtn} onClick={async () => {
                                const token = localStorage.getItem("access");
                                try {
                                    const res = await fetch(`${API}/api/communities/promotions/checkout/`, {
                                        method: 'POST',
                                        headers: {
                                            Authorization: `Bearer ${token}`,
                                            'Content-Type': 'application/json'
                                        },
                                        body: JSON.stringify({
                                            items: promoCart.map(item => ({
                                                community_id: item.communityId,
                                                duration: item.label,
                                                cost: item.cost,
                                            }))
                                        })
                                    });
                                    if (res.ok) {
                                        setPromoCart([]);
                                        setIsCheckoutModalOpen(false);
                                    } else {
                                        console.error('Checkout failed:', res.status);
                                    }
                                } catch (err) {
                                    console.error('Checkout error:', err);
                                }
                            }}>Pay Now</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}