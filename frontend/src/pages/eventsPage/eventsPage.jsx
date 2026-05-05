import styles from './eventsPage.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState, useEffect } from 'react';

export default function EventsPage() {
    const API = "http://localhost:8000";
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState("dark");
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");
    const [events, setEvents] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            try {
                // Using Promise.all and the same /api/auth/me/ endpoint
                const [eventsRes, userRes] = await Promise.all([
                    fetch(`${API}/api/events/`, { headers }),
                    fetch(`${API}/api/auth/me/`, { headers })
                ]);

                // Handle User Data (Same logic as Universities)
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setUser(userData);
                } else {
                    console.warn("User profile could not be fetched.");
                }

                // Handle Events Data
                if (eventsRes.ok) {
                    const data = await eventsRes.json();
                    const formatted = data.map(event => ({
                        id: event.id,
                        orgName: event.organization_name,
                        avatar: event.avatar
                            ? (event.avatar.startsWith("http") ? event.avatar : `${API}${event.avatar}`)
                            : "/default-avatar.png",
                        banner: event.banner
                            ? (event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`)
                            : "",
                        isFollowed: event.is_followed,
                        startDate: event.start_date,
                        endDate: event.end_date,
                        title: event.title,
                        description: event.description
                    }));
                    setEvents(formatted);

                    // Logic for recommended (if separate, otherwise slice from events)
                    setRecommendedEvents(formatted.slice(0, 3));
                }

            } catch (err) {
                console.error("Network or parsing error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    return (
        <div className={styles.darkContainer}>
            <div className={`${styles.header} ${styles.page}`}>
                <Header theme={theme} toggleTheme={toggleTheme} user={user} />
            </div>
            <div className={`${styles.content} ${styles.page}`}>
                <SideBarNav />
                <div className={styles.mainContent}>
                    <h1 className={styles.title}>
                        Looking for - <br /> <span className={styles.highlight}>EVENTS</span> to participate in?
                    </h1>

                    <div className={styles.eventsContainer}>
                        {events.map((event) => (
                            <div key={event.id} className={styles.eventCard}>

                                <div className={styles.cardHeader}>
                                    <div className={styles.orgInfo}>
                                        <img src={event.avatar} alt="Logo" className={styles.avatar} />
                                        <div className={styles.orgText}>
                                            <div className={styles.orgNameRow}>
                                                <h3>{event.orgName}</h3>
                                                <span className={styles.verifyBadge}>✓</span>
                                            </div>
                                            <p>consectetuer adipiscing elit, sed diam nonummy nibh!</p>
                                        </div>
                                    </div>
                                    <div className={styles.headerActions}>
                                        <button className={styles.bellBtn}>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
                                        </button>
                                        <button className={event.isFollowed ? styles.followedBtn : styles.followBtn}>
                                            {event.isFollowed ? 'Followed' : 'Follow'}
                                        </button>
                                    </div>
                                </div>

                                {/* BOTTOM SECTION: Large Image with Overlays */}
                                <div className={styles.bannerContainer}>
                                    <img src={event.banner} className={styles.bannerImg} alt="Event Background" />

                                    {/* Date Widget (Top Right) */}
                                    <div className={styles.dateWidget}>
                                        <div className={styles.dateText}>
                                            <p>Starts {event.startDate}</p>
                                            <p>Ends - {event.endDate}</p>
                                        </div>
                                        <button className={styles.reminderBtn}>Set reminder</button>
                                    </div>

                                    {/* Text Overlay (Bottom) */}
                                    <div className={styles.bannerOverlay}>
                                        <div className={styles.bannerContent}>
                                            <h2>Lorem ipsum</h2>
                                            <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet</p>
                                        </div>
                                        <span className={styles.readMore}>read more</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.rightSection}>
                    <div className={styles.pill}>RECOMMENDED</div>
                    <div className={styles.rightCard}>
                        <div className={styles.rightList}>
                            {recommendedEvents.map((rec, index) => (
                                <div key={rec.id} className={styles.recItemWrapper}>
                                    <div className={styles.recCard}>
                                        <img src={rec.banner} className={styles.recBanner} alt="" />
                                        <div className={styles.recOverlay}>
                                            {/* Header: Org Info + Follow */}
                                            <div className={styles.recHeader}>
                                                <div className={styles.recOrgInfo}>
                                                    <img src={rec.avatar} className={styles.recAvatar} alt="" />
                                                    <div className={styles.recOrgText}>
                                                        <div className={styles.recNameRow}>
                                                            <h4>{rec.orgName}</h4>
                                                            <span className={styles.verifyBadgeSmall}>✓</span>
                                                        </div>
                                                        <p>consectetuer adipiscing elit...</p>
                                                    </div>
                                                </div>
                                                <button className={rec.isFollowed ? styles.followedBtnSmall : styles.followBtnSmall}>
                                                    {rec.isFollowed ? 'Followed' : 'Follow'}
                                                </button>
                                            </div>

                                            {/* Body: Title + Read More */}
                                            <div className={styles.recBody}>
                                                <div>
                                                    <h5>Lorem ipsum</h5>
                                                    <p>Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh</p>
                                                </div>
                                                <span className={styles.readMoreSmall}>read more</span>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Only show separator if it's not the last item */}
                                    {index !== recommendedEvents.length - 1 && <div className={styles.separator} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}