import styles from './subscriptions.module.css';
import Header from '../../components/pagelayout/header/header';
import SidebarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import Stars from '../../Assets/icons/stars.png';
import { useState, useEffect } from 'react';

import API from '../../config';
import useTheme from '../../hooks/useTheme';
export default function Subscriptions() {
   const { theme, toggleTheme } = useTheme();
    const [currentUser, setCurrentUser] = useState(null);
    const [subscription, setSubscription] = useState(null);  // active subscription
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);
    const [subscribing, setSubscribing] = useState(false);
    const token = localStorage.getItem("access");

   

    const loadCurrentUser = async () => {
        try {
            const res = await fetch(`${API}/api/auth/me/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) setCurrentUser(await res.json());
        } catch (e) { console.error(e); }
    };

    const loadSubscription = async () => {
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

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={currentUser} />
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SidebarNav currentUser={currentUser} />

                {/* MIDDLE CONTAINER */}
                <div className={styles.subscriptionsContainer}>

                    {/* Active Subscription Status — only show if subscribed */}
                    {activePlan && (
                        <div className={styles.statusSection}>
                            <div className={styles.statusHeaderRow}>
                                <img src={Stars} alt="stars" className={styles.starsIcon} />
                                <span className={styles.premiumTitle}>
                                    {activePlan === 'premium' ? 'PREMIUM' : 'BASIC'}
                                </span>
                                <span className={styles.subscriptionText}>Subscription</span>
                            </div>

                            <div className={styles.daysLeftRow}>
                                <span className={styles.daysLeftText}>{daysLeft} days left</span>
                                <span className={styles.endingDateText}>Ending on {endLabel}</span>
                            </div>

                            <div className={styles.progressBarBackground}>
                                <div
                                    className={styles.progressBarFill}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Basic Plan Card */}
                    <div className={styles.basicCard}>
                        {/* Grey overlay if basic is active */}
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
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className={styles.cancelBtn}
                                >
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

                {/* RIGHT SECTION */}
                <div className={styles.rightSection}>
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
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className={styles.cancelBtn}
                                >
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
                </div>
            </div>
        </div>
    );
}