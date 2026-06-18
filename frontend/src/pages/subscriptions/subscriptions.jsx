import styles from './subscriptions.module.css';
import Header from '../../components/pagelayout/header/header';
import SidebarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import Stars from '../../Assets/icons/stars.png';
import { useState, useEffect, useRef } from 'react';
import { X as XIcon } from 'lucide-react';
import API from '../../config';
import useTheme from '../../hooks/useTheme';
import MobileHeader from '../../components/mobileHeader/mobileHeader';
import darkModeIcon from '../../Assets/Pictures/LogoDarkMode.png';
import ProfilePicture from '../../Assets/icons/default-pfp.png';
import { useNavigate } from 'react-router-dom';
export default function Subscriptions() {
    const navigate = useNavigate();
   const { theme, toggleTheme } = useTheme();
    const [currentUser, setCurrentUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const token = localStorage.getItem("access");
    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const mobileMenuRef = useRef(null);

   

    const loadCurrentUser = async () => {
        if (!token) return;
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setCurrentUser(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadSubscription = async () => {
        if (!token) return;
        try {
            setLoading(true);
            const res = await fetch(`${API}/api/subscriptions/current/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setSubscription(data);
            } else {
                setSubscription(null);
            }
        } catch (e) {
            console.error(e);
            setSubscription(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCurrentUser();
        loadSubscription();
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

    const handleSubscribe = async (plan) => {
        
        if (subscription?.plan === plan) return;
        try {
            setSubscribing(true);
            const res = await fetch(`${API}/api/subscriptions/subscribe/`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ plan })
            });
            if (res.ok) await loadSubscription();
        } catch (e) { console.error(e); }
        finally { setSubscribing(false); }
    };

    const handleCancel = async () => {
        try {
            setCancelling(true);
            const res = await fetch(`${API}/api/subscriptions/cancel/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setSubscription(null);
                await loadSubscription();
            }
        } catch (e) { console.error(e); }
        finally { setCancelling(false); }
    };

    // Compute days left + progress
    const getDaysInfo = () => {
        if (!subscription?.end_date) return { daysLeft: 0, progress: 0, endLabel: '' };

        const end = new Date(subscription.end_date);
        const start = new Date(subscription.start_date || subscription.created_at);
        const now = new Date();

        const totalMs = end - start;
        const remainingMs = end - now;

        const daysLeft = Math.max(0, Math.ceil(remainingMs / 86400000));

        // Fill = how much time is LEFT (shrinks toward 0 as it expires)
        const progress = Math.min(100, Math.max(0, (1 - remainingMs / totalMs) * 100));
        const endLabel = end.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
        return { daysLeft, progress, endLabel };
    };

    const { daysLeft, progress, endLabel } = getDaysInfo();
    const activePlan = subscription?.plan; // 'basic' | 'premium' | null
    const isBasicActive = activePlan === 'basic';
    const isPremiumActive = activePlan === 'premium';

    const basicCard = (
        <div className={styles.subscriptionsContainer}>
            {activePlan && (
                <div className={styles.statusSection}>
                    <div className={styles.statusHeaderRow}>
                        <img src={Stars} alt="stars" className={styles.starsIcon} />
                        <span className={styles.premiumTitle}>{activePlan === 'premium' ? 'PREMIUM' : 'BASIC'}</span>
                        <span className={styles.subscriptionText}>Subscription</span>
                    </div>
                    <div className={styles.daysLeftRow}>
                        <span className={styles.daysLeftText}>{daysLeft} days left</span>
                        <span className={styles.endingDateText}>Ending on {endLabel}</span>
                    </div>
                    <div className={styles.progressBarBackground}>
                        <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
                    </div>
                </div>
            )}
            <div className={styles.basicCard}>
                {isBasicActive && <div className={styles.activeSubscriptionOverlay} />}
                <div className={styles.cardHeader}>
                    <span className={styles.basicTitle}>BASIC</span>
                    <span className={styles.subscriptionText}>Subscription</span>
                </div>
                <ul className={styles.featuresList}>
                    <li>Exist on the platform</li>
                    <li>Your own identity and content.</li>
                    <li>Join communities.</li>
                    <li>Create events.</li>
                    <li>Create posts and interact with others.</li>
                    <li>Create and run promotions.</li>
                </ul>
                <div className={styles.basicFooter}>
                    {isBasicActive && (
                        <button onClick={handleCancel} disabled={cancelling} className={styles.cancelBtn}>
                            {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                        </button>
                    )}
                    <div className={styles.priceContainerBasic}>
                        <button
                            onClick={() => handleSubscribe('basic')}
                            disabled={isBasicActive || subscribing}
                            className={`${styles.priceBtn} ${isBasicActive ? styles.priceBtnDisabled : ''}`}
                            title={isBasicActive ? "You're already on this plan" : "Subscribe to Basic"}
                        >
                            {isBasicActive ? 'Active' : '$14.99'}
                        </button>
                        <span className={styles.perMonthText}>/month</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const premiumCard = (
        <div className={styles.premiumCard}>
            <div className={styles.cardHeader}>
                <img src={Stars} alt="stars" className={styles.starsIconSmall} />
                <span className={styles.premiumTitleCard}>PREMIUM</span>
                <span className={styles.subscriptionText}>Subscription</span>
            </div>
            <ul className={styles.featuresList}>
                <li>Exist on the platform</li>
                <li>Your own identity and content.</li>
                <li>Join communities.</li>
                <li>Create events.</li>
                <li>Create posts and interact with others.</li>
                <li>Create and run promotions.</li>
            </ul>
            <div className={styles.divider} />
            <ul className={`${styles.featuresList} ${styles.pinkList}`}>
                <li>Verification badge.</li>
                <li>Instant community creation.</li>
                <li>Higher priority in feed.</li>
                <li>16% Subscription discount.</li>
            </ul>
            <div className={styles.premiumFooter}>
                {isPremiumActive && (
                    <button onClick={handleCancel} disabled={cancelling} className={styles.cancelBtn}>
                        {cancelling ? 'Cancelling...' : 'Cancel Subscription'}
                    </button>
                )}
                <div className={styles.premiumPriceBox}>
                    <div className={styles.priceColumn}>
                        <span className={styles.oldPrice}>$29.99</span>
                        <button
                            onClick={() => handleSubscribe('premium')}
                            disabled={isPremiumActive || subscribing}
                            className={`${styles.priceBtn} ${isPremiumActive ? styles.priceBtnDisabled : ''}`}
                            title={isPremiumActive ? "You're already on this plan" : "Subscribe to Premium"}
                        >
                            {'$24.99'}
                        </button>
                    </div>
                    <span className={styles.perMonthText}>/month</span>
                </div>
            </div>
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
                    <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
                </div>
            )}

            {/* ══════════════════════════════════════
                    MOBILE BODY
                ══════════════════════════════════════ */}
            {isMobile && (
                <div style={{ display: "flex", flexDirection: "column", width: "100%", boxSizing: "border-box", padding: "12px 10px 0 10px", gap: 16 }}>
                    {basicCard}
                    {premiumCard}
                </div>
            )}

            {/* ══════════════════════════════════════
                    DESKTOP BODY
                ══════════════════════════════════════ */}
            {!isMobile && (
                <div className={`${styles.content} ${styles.page}`}>
                    <SidebarNav currentUser={currentUser} />
                    {basicCard}
                    <div className={styles.rightSection}>
                        {premiumCard}
                    </div>
                </div>
            )}
        </div>
    );
}