import styles from './eventsPage.module.css';
import Header from '../../components/pagelayout/header/header';
import SideBarNav from '../../components/pagelayout/sidebarnav/sideBarNav';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import VerifiedBadge from '../../Assets/icons/verified-mark.png';

import { createPortal } from 'react-dom';
export default function EventsPage() {
    const API = "http://localhost:8000";
    const [user, setUser] = useState(null);
    const [theme, setTheme] = useState("dark");
    const toggleTheme = () => setTheme(prev => prev === "light" ? "dark" : "light");
    const [events, setEvents] = useState([]);
    const [recommendedEvents, setRecommendedEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [reminders, setReminders] = useState({});
    const [popupEvent, setPopupEvent] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();
    const [highlightId, setHighlightId] = useState(location.state?.highlightId || null);
    useEffect(() => {
        if (highlightId && events.length > 0) {
            const el = document.getElementById(`event-${highlightId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add(styles.highlighted);
                setTimeout(() => {
                    el.classList.remove(styles.highlighted);
                    setHighlightId(null);
                }, 2000);
            }
        }
    }, [highlightId, events]);

    const handleReminder = async (eventId) => {
        const token = localStorage.getItem("access");
        const isSet = reminders[eventId];
        setReminders(prev => ({ ...prev, [eventId]: !isSet }));

        try {
            const res = await fetch(`${API}/api/events/${eventId}/remind/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                // Revert on fail
                setReminders(prev => ({ ...prev, [eventId]: isSet }));
            }
        } catch {
            setReminders(prev => ({ ...prev, [eventId]: isSet }));
        }
    };
    useEffect(() => {
        const fetchData = async () => {
            const token = localStorage.getItem("access");
            const headers = {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json"
            };

            try {

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
                        pageId: event.page_id,
                        orgName: event.organization_name,
                        avatar: event.avatar
                            ? (event.avatar.startsWith("http") ? event.avatar : `${API}${event.avatar}`)
                            : "/default-avatar.png",
                        banner: event.banner
                            ? (event.banner.startsWith("http") ? event.banner : `${API}${event.banner}`)
                            : "",
                        isFollowed: event.is_followed,
                        startDate: event.start_date,
                        isReminded: event.is_reminded,
                        endDate: event.end_date,
                        title: event.title,
                        description: event.description,
                        pageType: event.page_type,
                    }));
                    setEvents(formatted);
                    const initialReminders = {};
                    formatted.forEach(e => {
                        initialReminders[e.id] = e.isReminded || false;
                    });
                    setReminders(initialReminders);

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
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
    };
    const handleFollow = async (eventId, pageId) => {
        const token = localStorage.getItem("access");
        const event = events.find(e => e.id === eventId);
        const wasFollowed = event.isFollowed;

        setEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, isFollowed: !e.isFollowed } : e
        ));
        setRecommendedEvents(prev => prev.map(e =>
            e.id === eventId ? { ...e, isFollowed: !e.isFollowed } : e
        ));

        try {
            const res = await fetch(`${API}/api/pages/${pageId}/follow/`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                setEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, isFollowed: wasFollowed } : e
                ));
                setRecommendedEvents(prev => prev.map(e =>
                    e.id === eventId ? { ...e, isFollowed: wasFollowed } : e
                ));
            }
        } catch {
            setEvents(prev => prev.map(e =>
                e.id === eventId ? { ...e, isFollowed: wasFollowed } : e
            ));
        }
    };

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
                            <div key={event.id} id={`event-${event.id}`} className={styles.eventCard}>

                                <div className={styles.cardHeader}>
                                    <div
                                        className={styles.orgInfo}
                                        onClick={() => navigate(`/page/${event.pageId}`)}
                                        style={{ cursor: 'pointer' }}
                                    >
                                        <img src={event.avatar} alt="Logo" className={styles.avatar} />
                                        <div className={styles.orgText}>
                                            <div className={styles.orgNameRow}>
                                                <h3>{event.orgName}</h3>
                                                <img
                                                    src={VerifiedBadge}
                                                    alt="verified"
                                                    style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', marginLeft: 3 }}
                                                />
                                            </div>
                                            <p>{event.pageType}</p>
                                        </div>
                                    </div>
                                    <div className={styles.headerActions}>
                                        {/* Bell only shows when followed */}
                                        {event.isFollowed && (
                                            <button
                                                className={styles.bellBtn}
                                                onClick={() => handleReminder(event.id)}
                                                style={{
                                                    background: reminders[event.id] ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                                                    transition: "background 0.2s"
                                                }}
                                            >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill={reminders[event.id] ? "white" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                </svg>
                                            </button>
                                        )}
                                        <button
                                            className={event.isFollowed ? styles.followedBtn : styles.followBtn}
                                            onClick={() => handleFollow(event.id, event.pageId)}
                                        >
                                            {event.isFollowed ? 'Followed' : 'Follow'}
                                        </button>
                                    </div>
                                </div>

                                {event.banner && (
                                    <div className={styles.bannerContainer}>
                                        {/* No fixed height — image defines its own height */}
                                        <img
                                            src={event.banner}
                                            className={styles.bannerImg}
                                            alt="Event Banner"
                                        />
                                        <div className={styles.dateWidget}>
                                            <div className={styles.dateText}>
                                                <p>Starts {formatDate(event.startDate)}</p>
                                                <p>Ends — {formatDate(event.endDate)}</p>
                                            </div>
                                            <button
                                                className={styles.reminderBtn}
                                                onClick={() => handleReminder(event.id)}
                                                style={{
                                                    // Using reminders[event.id] ensures the UI updates immediately
                                                    background: reminders[event.id]
                                                        ? "rgba(255,255,255,0.2)" // Style for "Set"
                                                        : "#7b1fa2",               // Style for "Not Set"
                                                    transition: "background 0.2s"
                                                }}
                                            >
                                                {reminders[event.id] ? "✓ Reminder set" : "Set reminder"}
                                            </button>
                                        </div>
                                        <div className={styles.bannerOverlay} style={{ pointerEvents: "none" }}>
                                            <div className={styles.bannerContent} style={{ pointerEvents: "auto" }}>
                                                {event.title?.length > 20 ? (
                                                    <div className={styles.titleMarqueeWrapper}>
                                                        <span className={styles.titleMarquee}>{event.title}</span>
                                                    </div>
                                                ) : (
                                                    <h2>{event.title}</h2>
                                                )}
                                                <p>
                                                    {event.description?.length > 40
                                                        ? <>{event.description.substring(0, 80)}... <span className={styles.readMore} onClick={(e) => { e.stopPropagation(); setPopupEvent(event); }} style={{ cursor: "pointer" }}>read more</span></>
                                                        : event.description
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
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
                                            <div className={styles.recHeader}>
                                                <div className={styles.recOrgInfo}
                                                    onClick={() => navigate(`/profile/${rec.pageId}`)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <img src={rec.avatar} className={styles.recAvatar} alt="" />
                                                    <div className={styles.recOrgText}>
                                                        <div className={styles.recNameRow}>
                                                            <h4>{rec.orgName}</h4>
                                                            <img
                                                                src={VerifiedBadge}
                                                                alt="verified"
                                                                style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', marginLeft: 3 }}
                                                            />
                                                        </div>
                                                        <p>{rec.pageType}</p>
                                                    </div>
                                                </div>

                                                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                                                    {rec.isFollowed && (
                                                        <button
                                                            className={styles.bellBtn}
                                                            onClick={() => handleReminder(rec.id)}
                                                            style={{
                                                                background: reminders[rec.id] ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)",
                                                                transition: "background 0.2s",
                                                                width: 28,
                                                                height: 28,
                                                            }}
                                                        >
                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill={reminders[rec.id] ? "white" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                                                                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                                                            </svg>
                                                        </button>
                                                    )}
                                                    <button
                                                        className={rec.isFollowed ? styles.followedBtnSmall : styles.followBtnSmall}
                                                        onClick={() => handleFollow(rec.id, rec.pageId)}
                                                    >
                                                        {rec.isFollowed ? 'Followed' : 'Follow'}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className={styles.recBody}>
                                                <div style={{ overflow: "hidden", width: "100%" }}>
                                                    {rec.title?.length > 15 ? (
                                                        <div className={styles.titleMarqueeWrapper}>
                                                            <span style={{
                                                                display: "inline-block",
                                                                whiteSpace: "nowrap",
                                                                animation: "marquee 8s linear infinite",
                                                                color: "white",
                                                                fontSize: "1.1rem",
                                                                fontWeight: 700
                                                            }}>{rec.title}</span>
                                                        </div>
                                                    ) : (
                                                        <h5>{rec.title}</h5>
                                                    )}
                                                    <p>
                                                        {rec.description?.length > 30
                                                            ? <>{rec.description.substring(0, 60)}... <span className={styles.readMoreSmall} onClick={(e) => { e.stopPropagation(); setPopupEvent(rec); }} style={{ cursor: "pointer" }}>read more</span></>
                                                            : rec.description
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {index !== recommendedEvents.length - 1 && <div className={styles.separator} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {popupEvent && createPortal(
                <div
                    style={{
                        position: "fixed", inset: 0, zIndex: 9999,
                        background: "rgba(0,0,0,0.6)", display: "flex",
                        alignItems: "center", justifyContent: "center"
                    }}
                    onClick={() => setPopupEvent(null)}
                >
                    <div
                        style={{
                            background: "#2a2a2a", borderRadius: 20, padding: 28,
                            maxWidth: 480, width: "90%", position: "relative",
                            border: "1px solid rgba(255,255,255,0.08)"
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPopupEvent(null)}
                            style={{
                                position: "absolute", top: 14, right: 14,
                                background: "none", border: "none", color: "white",
                                fontSize: "1.1rem", cursor: "pointer"
                            }}
                        >✕</button>
                        <h3 style={{ color: "white", margin: "0 0 12px" }}>{popupEvent.title}</h3>
                        <p style={{ color: "rgba(255,255,255,0.7)", lineHeight: 1.6, margin: 0 }}>
                            {popupEvent.description}
                        </p>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}